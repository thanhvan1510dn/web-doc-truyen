import * as pdfjsLib from "pdfjs-dist";

// Configure worker for in-browser PDF parsing
if (typeof window !== "undefined" && "Worker" in window) {
  // Use unpkg or cdnjs worker compatible with 3.11.174
  pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
}

export interface ParsedChapter {
  number: number;
  title: string;
  content: string;
  wordCount: number;
  pageStart?: number;
}

export interface ParsedVolume {
  number: number;
  title: string;
  chapters: ParsedChapter[];
}

export interface PDFParseResult {
  detectedTitle?: string;
  totalVolumes: number;
  totalChapters: number;
  totalWords: number;
  volumes: ParsedVolume[];
}

export class PDFParserService {
  /**
   * Parse uploaded PDF file: Extract bookmarks/tabs hierarchy (Vị Diện & Chương)
   */
  public async parsePDFFile(
    file: File,
    onProgress?: (progress: number, status: string) => void
  ): Promise<PDFParseResult> {
    onProgress?.(5, "Đang đọc tệp PDF...");
    const arrayBuffer = await file.arrayBuffer();

    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      cMapUrl: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/",
      cMapPacked: true,
    });

    const pdfDoc = await loadingTask.promise;
    const numPages = pdfDoc.numPages;

    onProgress?.(15, `PDF gồm ${numPages} trang. Đang trích xuất mục lục (Tabs/Bookmarks)...`);

    // 1. Try to extract PDF Outline / Bookmark Tree
    let outline: any[] | null = null;
    try {
      outline = await pdfDoc.getOutline();
    } catch (err) {
      console.warn("Could not extract PDF outline:", err);
    }

    // 2. Extract full text from all pages
    const pageTexts: string[] = [];
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      const text = textContent.items
        .map((item: any) => item.str || "")
        .join(" ");
      pageTexts.push(text);

      const percent = Math.round(15 + (pageNum / numPages) * 45);
      onProgress?.(percent, `Đang xử lý nội dung trang ${pageNum}/${numPages}...`);
    }

    onProgress?.(65, "Đang phân tích cấu trúc Vị Diện và Chương...");

    let volumes: ParsedVolume[] = [];

    if (outline && outline.length > 0) {
      // Resolve page index for each outline item
      const resolvedOutline = await this.resolveOutlineDestinations(pdfDoc, outline);
      volumes = this.parseFromOutlineTree(resolvedOutline, pageTexts, numPages);
    }

    // Fallback: If outline is empty or failed to detect volumes, use intelligent text regex parser
    if (volumes.length === 0 || volumes.every((v) => v.chapters.length === 0)) {
      onProgress?.(75, "Phân tích cấu trúc phân đoạn văn bản thông minh...");
      volumes = this.parseFromFullText(pageTexts);
    }

    // Post-process: clean content, count words, ensure chapter numbering
    let globalChapIndex = 1;
    let totalWords = 0;
    let totalChapters = 0;

    volumes.forEach((vol, vIdx) => {
      vol.number = vIdx + 1;
      vol.chapters.forEach((chap) => {
        chap.number = globalChapIndex++;
        chap.wordCount = chap.content.trim().split(/\s+/).filter(Boolean).length;
        totalWords += chap.wordCount;
        totalChapters++;
      });
    });

    onProgress?.(100, "Hoàn tất bóc tách dữ liệu PDF!");

    const detectedTitle = file.name.replace(/\.pdf$/i, "").replace(/[-_]/g, " ");

    return {
      detectedTitle,
      totalVolumes: volumes.length,
      totalChapters,
      totalWords,
      volumes,
    };
  }

  /**
   * Resolve destinations for outline tree to get 0-indexed page numbers
   */
  private async resolveOutlineDestinations(pdfDoc: any, outlineItems: any[]): Promise<any[]> {
    const results: any[] = [];

    for (const item of outlineItems) {
      let pageIndex = -1;
      try {
        let dest = item.dest;
        if (typeof dest === "string") {
          dest = await pdfDoc.getDestination(dest);
        }
        if (Array.isArray(dest) && dest[0]) {
          pageIndex = await pdfDoc.getPageIndex(dest[0]);
        }
      } catch (e) {
        console.warn("Error resolving dest for item", item.title, e);
      }

      const children = item.items && item.items.length > 0
        ? await this.resolveOutlineDestinations(pdfDoc, item.items)
        : [];

      results.push({
        title: item.title,
        pageIndex,
        items: children,
      });
    }

    return results;
  }

  /**
   * Parse PDF Outline Tree where:
   * - Top level items = Diễn biến các Vị Diện (Volumes)
   * - Child items (or sub-items) = Các Chương nhỏ (Chapters)
   */
  private parseFromOutlineTree(
    outline: any[],
    pageTexts: string[],
    numPages: number
  ): ParsedVolume[] {
    const volumes: ParsedVolume[] = [];

    // Check if top level items have nested children
    const hasNestedChildren = outline.some((item) => item.items && item.items.length > 0);

    if (hasNestedChildren) {
      outline.forEach((volItem, vIdx) => {
        const volTitle = volItem.title || `Vị Diện ${vIdx + 1}`;
        const chapters: ParsedChapter[] = [];

        if (volItem.items && volItem.items.length > 0) {
          volItem.items.forEach((chapItem: any, cIdx: number) => {
            const startPage = chapItem.pageIndex >= 0 ? chapItem.pageIndex : 0;
            // Next chapter in this volume or next volume start page
            let endPage = numPages - 1;
            if (cIdx < volItem.items.length - 1 && volItem.items[cIdx + 1].pageIndex >= 0) {
              endPage = volItem.items[cIdx + 1].pageIndex;
            } else if (vIdx < outline.length - 1 && outline[vIdx + 1].pageIndex >= 0) {
              endPage = outline[vIdx + 1].pageIndex;
            }

            const chapterContent = this.extractTextBetweenPages(pageTexts, startPage, endPage);

            chapters.push({
              number: cIdx + 1,
              title: chapItem.title || `Chương ${cIdx + 1}`,
              content: chapterContent,
              wordCount: 0,
              pageStart: startPage + 1,
            });
          });
        }

        volumes.push({
          number: vIdx + 1,
          title: volTitle,
          chapters,
        });
      });
    } else {
      // Flat outline list: group items starting with "Vị Diện / Quyển / Tập / Arc" as parent volumes
      let currentVol: ParsedVolume = {
        number: 1,
        title: "Vị Diện 1: Khởi Đầu",
        chapters: [],
      };

      const volumeKeywords = /^(?:Vị Diện|Vi Dien|Quyển|Quyen|Tập|Tap|Phần|Phan|Arc|Thế Giới|The Gioi|Cõi)/i;

      outline.forEach((item, idx) => {
        const isVolumeHeading = volumeKeywords.test(item.title);

        if (isVolumeHeading) {
          if (currentVol.chapters.length > 0) {
            volumes.push(currentVol);
          }
          currentVol = {
            number: volumes.length + 1,
            title: item.title,
            chapters: [],
          };
        } else {
          // Chapter item
          const startPage = item.pageIndex >= 0 ? item.pageIndex : 0;
          let endPage = numPages - 1;
          if (idx < outline.length - 1 && outline[idx + 1].pageIndex >= 0) {
            endPage = outline[idx + 1].pageIndex;
          }

          const chapterContent = this.extractTextBetweenPages(pageTexts, startPage, endPage);

          currentVol.chapters.push({
            number: currentVol.chapters.length + 1,
            title: item.title,
            content: chapterContent,
            wordCount: 0,
            pageStart: startPage + 1,
          });
        }
      });

      if (currentVol.chapters.length > 0 || volumes.length === 0) {
        volumes.push(currentVol);
      }
    }

    return volumes;
  }

  /**
   * Extract text between start and end pages
   */
  private extractTextBetweenPages(
    pageTexts: string[],
    startPage: number,
    endPage: number
  ): string {
    const chunks: string[] = [];
    const validStart = Math.max(0, startPage);
    const validEnd = Math.min(pageTexts.length - 1, endPage);

    for (let p = validStart; p <= validEnd; p++) {
      if (pageTexts[p]) {
        chunks.push(pageTexts[p]);
      }
    }

    let text = chunks.join("\n\n").trim();

    // Remove page numbers (e.g. "Trang 1 / 100", standalone numbers at bottom)
    text = text.replace(/\bTrang\s+\d+(?:\s*\/\s*\d+)?\b/gi, "");
    text = text.replace(/^\s*\d+\s*$/gm, "");

    // Format paragraphs
    text = text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .join("\n\n");

    return text;
  }

  /**
   * Fallback: Parse whole PDF text using smart regex splitting
   */
  private parseFromFullText(pageTexts: string[]): ParsedVolume[] {
    const fullText = pageTexts.join("\n\n");
    const volumes: ParsedVolume[] = [];

    // Check if there are major volume / realm headings
    const volumeRegex = /(?:^|\n{2,})(Vị Diện|Vi Dien|Quyển|Quyen|Tập|Tap|Phần|Phan|Arc|Thế Giới)\s+([0-9IVXLCDM]+|[A-ZÀ-Ỵa-zà-ỹ\s]+)(?:[:\-\.]\s*([^\n\r]+))?/gi;
    

    const volumeMatches = [...fullText.matchAll(volumeRegex)];

    if (volumeMatches.length > 1) {
      for (let i = 0; i < volumeMatches.length; i++) {
        const match = volumeMatches[i];
        const nextMatch = volumeMatches[i + 1];
        const startIndex = match.index || 0;
        const endIndex = nextMatch ? nextMatch.index : fullText.length;

        const volTitle = match[0].trim();
        const volText = fullText.slice(startIndex, endIndex);

        const chapters = this.splitChaptersFromText(volText);

        volumes.push({
          number: i + 1,
          title: volTitle,
          chapters,
        });
      }
    } else {
      // Single Volume with chapters
      const chapters = this.splitChaptersFromText(fullText);
      volumes.push({
        number: 1,
        title: "Vị Diện 1: Toàn Bộ Diễn Biến",
        chapters,
      });
    }

    return volumes;
  }

  /**
   * Split chapter segments from volume text
   */
  private splitChaptersFromText(text: string): ParsedChapter[] {
    const chapters: ParsedChapter[] = [];
    const chapterRegex = /(?:^|\n{2,})((?:Chương|Chuong|Hồi|Hoi|Tiết|Tiet|Chapter)\s+(\d+)(?:[:\-\.]\s*([^\n\r]+))?)/gi;
    const matches = [...text.matchAll(chapterRegex)];

    if (matches.length === 0) {
      // If no chapter headings found, chunk into 2500-word chapters
      const words = text.split(/\s+/).filter(Boolean);
      const chunkSize = 2500;
      const numChunks = Math.max(1, Math.ceil(words.length / chunkSize));

      for (let i = 0; i < numChunks; i++) {
        const chunkWords = words.slice(i * chunkSize, (i + 1) * chunkSize);
        chapters.push({
          number: i + 1,
          title: `Chương ${i + 1}`,
          content: chunkWords.join(" "),
          wordCount: chunkWords.length,
        });
      }
      return chapters;
    }

    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const nextMatch = matches[i + 1];
      const startIndex = (match.index || 0) + match[0].length;
      const endIndex = nextMatch ? nextMatch.index : text.length;

      const chapNumber = parseInt(match[2], 10) || i + 1;
      const chapTitle = match[1].trim();
      const chapContent = text.slice(startIndex, endIndex).trim();

      chapters.push({
        number: chapNumber,
        title: chapTitle,
        content: chapContent,
        wordCount: 0,
      });
    }

    return chapters;
  }
}

export const pdfParserService = new PDFParserService();
