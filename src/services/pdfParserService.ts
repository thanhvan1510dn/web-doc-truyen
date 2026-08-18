import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";

// Configure worker for PDF parsing
if (typeof window !== "undefined" && "Worker" in window) {
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

export interface DocumentParseResult {
  fileType: "pdf" | "docx" | "txt";
  fileName: string;
  detectedTitle?: string;
  totalVolumes: number;
  totalChapters: number;
  totalWords: number;
  volumes: ParsedVolume[];
}

export class DocumentParserService {
  /**
   * Universal file parser for PDF, DOCX, and TXT
   */
  public async parseFile(
    file: File,
    onProgress?: (progress: number, status: string) => void
  ): Promise<DocumentParseResult> {
    const ext = file.name.split(".").pop()?.toLowerCase();

    if (ext === "pdf") {
      return this.parsePDF(file, onProgress);
    } else if (ext === "docx") {
      return this.parseDOCX(file, onProgress);
    } else if (ext === "txt") {
      return this.parseTXT(file, onProgress);
    } else {
      throw new Error("Chỉ hỗ trợ tệp định dạng .PDF, .DOCX, và .TXT");
    }
  }

  /**
   * 1. PDF Parser (Extracts Tabs / Outline / Bookmarks as Realm/Volume names)
   */
  private async parsePDF(
    file: File,
    onProgress?: (progress: number, status: string) => void
  ): Promise<DocumentParseResult> {
    onProgress?.(10, "Đang đọc tệp PDF...");
    const arrayBuffer = await file.arrayBuffer();

    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      cMapUrl: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/",
      cMapPacked: true,
    });

    const pdfDoc = await loadingTask.promise;
    const numPages = pdfDoc.numPages;

    onProgress?.(25, `PDF gồm ${numPages} trang. Đang trích xuất Document Tabs / Bookmarks...`);

    let outline: any[] | null = null;
    try {
      outline = await pdfDoc.getOutline();
    } catch (err) {
      console.warn("Could not extract PDF outline:", err);
    }

    const pageTexts: string[] = [];
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      const text = textContent.items.map((item: any) => item.str || "").join(" ");
      pageTexts.push(text);

      const percent = Math.round(25 + (pageNum / numPages) * 50);
      onProgress?.(percent, `Đang xử lý trang ${pageNum}/${numPages}...`);
    }

    onProgress?.(80, "Đang ánh xạ Tabs tài liệu thành Vị Diện / Hồi truyện...");

    let volumes: ParsedVolume[] = [];

    if (outline && outline.length > 0) {
      const resolvedOutline = await this.resolveOutlineDestinations(pdfDoc, outline);
      volumes = this.parseFromOutlineTree(resolvedOutline, pageTexts, numPages);
    }

    if (volumes.length === 0 || volumes.every((v) => v.chapters.length === 0)) {
      volumes = this.parseStructuredText(pageTexts.join("\n\n"));
    }

    return this.finalizeResult("pdf", file.name, volumes, onProgress);
  }

  /**
   * 2. DOCX Parser (Word documents with Headings / Tabs)
   */
  private async parseDOCX(
    file: File,
    onProgress?: (progress: number, status: string) => void
  ): Promise<DocumentParseResult> {
    onProgress?.(15, "Đang đọc tệp DOCX...");
    const arrayBuffer = await file.arrayBuffer();

    onProgress?.(45, "Đang trích xuất nội dung và tab đầu mục...");
    const result = await mammoth.extractRawText({ arrayBuffer });
    const fullText = result.value || "";

    onProgress?.(75, "Đang ánh xạ đầu mục thành Vị Diện / Hồi truyện...");
    const volumes = this.parseStructuredText(fullText);

    return this.finalizeResult("docx", file.name, volumes, onProgress);
  }

  /**
   * 3. TXT Parser (Plain text with Tabs / Markdown Headings)
   */
  private async parseTXT(
    file: File,
    onProgress?: (progress: number, status: string) => void
  ): Promise<DocumentParseResult> {
    onProgress?.(20, "Đang đọc tệp TXT...");
    const fullText = await file.text();

    onProgress?.(60, "Đang trích xuất các tab đầu mục...");
    const volumes = this.parseStructuredText(fullText);

    return this.finalizeResult("txt", file.name, volumes, onProgress);
  }

  /**
   * Parse Structured Text where:
   * - Major Heading / Tab = Tên Vị Diện / Hồi truyện (chính xác theo text trong tab)
   * - Sub Heading / Tab = Tên Chương nhỏ
   */
  private parseStructuredText(fullText: string): ParsedVolume[] {
    const volumes: ParsedVolume[] = [];

    // Volume / Realm / Arc header pattern
    const volumeRegex = /(?:^|\n{1,2})(?:#\s+|(?:Vị Diện|Vi Dien|Hồi|Hoi|Quyển|Quyen|Tập|Tap|Phần|Phan|Arc|Thế Giới|The Gioi)\s+([0-9IVXLCDM]+|[A-ZÀ-Ỵa-zà-ỹ\s]+)(?:[:\-\.]\s*([^\n\r]+))?)/gi;

    const volumeMatches = [...fullText.matchAll(volumeRegex)];

    if (volumeMatches.length > 1) {
      for (let i = 0; i < volumeMatches.length; i++) {
        const match = volumeMatches[i];
        const nextMatch = volumeMatches[i + 1];
        const startIndex = match.index || 0;
        const endIndex = nextMatch ? nextMatch.index : fullText.length;

        // Dùng chính xác tên tab/đầu mục từ tài liệu
        const volTitle = match[0].replace(/^[\r\n#\s]+/, "").trim();
        const volText = fullText.slice(startIndex, endIndex);

        const chapters = this.splitChaptersFromText(volText);

        volumes.push({
          number: i + 1,
          title: volTitle,
          chapters,
        });
      }
    } else {
      // Single Volume
      const chapters = this.splitChaptersFromText(fullText);
      volumes.push({
        number: 1,
        title: "Vị Diện / Hồi 1",
        chapters,
      });
    }

    return volumes;
  }

  /**
   * Split chapter segments
   */
  private splitChaptersFromText(text: string): ParsedChapter[] {
    const chapters: ParsedChapter[] = [];
    const chapterRegex = /(?:^|\n{1,2})(?:##\s+|(?:Chương|Chuong|Tiết|Tiet|Chapter)\s+(\d+)(?:[:\-\.]\s*([^\n\r]+))?)/gi;
    const matches = [...text.matchAll(chapterRegex)];

    if (matches.length === 0) {
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

      const chapNumber = parseInt(match[1] || match[0].replace(/\D/g, ""), 10) || i + 1;
      const chapTitle = match[0].replace(/^[\r\n#\s]+/, "").trim();
      const chapContent = text.slice(startIndex, endIndex).trim();

      chapters.push({
        number: chapNumber,
        title: chapTitle,
        content: chapContent,
        wordCount: chapContent.split(/\s+/).filter(Boolean).length,
      });
    }

    return chapters;
  }

  /**
   * Finalize and calculate totals
   */
  private finalizeResult(
    fileType: "pdf" | "docx" | "txt",
    fileName: string,
    volumes: ParsedVolume[],
    onProgress?: (progress: number, status: string) => void
  ): DocumentParseResult {
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

    onProgress?.(100, "Hoàn tất bóc tách dữ liệu!");

    const detectedTitle = fileName.replace(/\.(pdf|docx|txt)$/i, "").replace(/[-_]/g, " ");

    return {
      fileType,
      fileName,
      detectedTitle,
      totalVolumes: volumes.length,
      totalChapters,
      totalWords,
      volumes,
    };
  }

  private async resolveOutlineDestinations(pdfDoc: any, outlineItems: any[]): Promise<any[]> {
    const results: any[] = [];
    for (const item of outlineItems) {
      let pageIndex = -1;
      try {
        let dest = item.dest;
        if (typeof dest === "string") dest = await pdfDoc.getDestination(dest);
        if (Array.isArray(dest) && dest[0]) pageIndex = await pdfDoc.getPageIndex(dest[0]);
      } catch (e) {
        console.warn("Resolve dest error", e);
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
   * Map PDF document tabs directly to Realm / Volume titles
   */
  private parseFromOutlineTree(
    outline: any[],
    pageTexts: string[],
    numPages: number
  ): ParsedVolume[] {
    const volumes: ParsedVolume[] = [];
    const hasNestedChildren = outline.some((item) => item.items && item.items.length > 0);

    if (hasNestedChildren) {
      outline.forEach((volItem, vIdx) => {
        // Tên của document tab chính xác là tên của Vị Diện / Hồi truyện
        const volTitle = (volItem.title || "").trim() || `Vị Diện ${vIdx + 1}`;
        const chapters: ParsedChapter[] = [];

        if (volItem.items && volItem.items.length > 0) {
          volItem.items.forEach((chapItem: any, cIdx: number) => {
            const startPage = chapItem.pageIndex >= 0 ? chapItem.pageIndex : 0;
            let endPage = numPages - 1;
            if (cIdx < volItem.items.length - 1 && volItem.items[cIdx + 1].pageIndex >= 0) {
              endPage = volItem.items[cIdx + 1].pageIndex;
            } else if (vIdx < outline.length - 1 && outline[vIdx + 1].pageIndex >= 0) {
              endPage = outline[vIdx + 1].pageIndex;
            }

            const chapterContent = this.extractTextBetweenPages(pageTexts, startPage, endPage);
            // Tên của child tab chính xác là tên của chương nhỏ
            const chapTitle = (chapItem.title || "").trim() || `Chương ${cIdx + 1}`;

            chapters.push({
              number: cIdx + 1,
              title: chapTitle,
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
      let currentVol: ParsedVolume = {
        number: 1,
        title: "Vị Diện / Hồi 1",
        chapters: [],
      };

      const volumeKeywords = /^(?:Vị Diện|Vi Dien|Hồi|Hoi|Quyển|Quyen|Tập|Tap|Phần|Phan|Arc|Thế Giới|The Gioi|Cõi)/i;

      outline.forEach((item, idx) => {
        const isVolumeHeading = volumeKeywords.test(item.title);

        if (isVolumeHeading) {
          if (currentVol.chapters.length > 0) {
            volumes.push(currentVol);
          }
          currentVol = {
            number: volumes.length + 1,
            title: item.title.trim(), // Tên tab chính là tên vị diện/hồi truyện
            chapters: [],
          };
        } else {
          const startPage = item.pageIndex >= 0 ? item.pageIndex : 0;
          let endPage = numPages - 1;
          if (idx < outline.length - 1 && outline[idx + 1].pageIndex >= 0) {
            endPage = outline[idx + 1].pageIndex;
          }

          const chapterContent = this.extractTextBetweenPages(pageTexts, startPage, endPage);

          currentVol.chapters.push({
            number: currentVol.chapters.length + 1,
            title: item.title.trim(),
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

  private extractTextBetweenPages(
    pageTexts: string[],
    startPage: number,
    endPage: number
  ): string {
    const chunks: string[] = [];
    const validStart = Math.max(0, startPage);
    const validEnd = Math.min(pageTexts.length - 1, endPage);

    for (let p = validStart; p <= validEnd; p++) {
      if (pageTexts[p]) chunks.push(pageTexts[p]);
    }

    let text = chunks.join("\n\n").trim();
    text = text.replace(/\bTrang\s+\d+(?:\s*\/\s*\d+)?\b/gi, "");
    text = text.replace(/^\s*\d+\s*$/gm, "");

    return text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .join("\n\n");
  }
}

export const documentParserService = new DocumentParserService();
export const pdfParserService = documentParserService;
export type PDFParseResult = DocumentParseResult;
