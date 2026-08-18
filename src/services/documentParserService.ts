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
   * 1. PDF Parser: STRICTLY uses PDF Bookmarks / Document Tabs
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

    onProgress?.(20, `PDF có ${numPages} trang. Đang đọc Document Tabs / Bookmarks...`);

    let outline: any[] | null = null;
    try {
      outline = await pdfDoc.getOutline();
    } catch (err) {
      console.warn("Could not extract PDF outline:", err);
    }

    // Extract page texts
    const pageTexts: string[] = [];
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      const text = textContent.items.map((item: any) => item.str || "").join(" ");
      pageTexts.push(text);

      const percent = Math.round(20 + (pageNum / numPages) * 60);
      onProgress?.(percent, `Đang trích xuất trang ${pageNum}/${numPages}...`);
    }

    onProgress?.(85, "Đang ánh xạ Tabs tài liệu thành Vị Diện và Chương...");

    let volumes: ParsedVolume[] = [];

    if (outline && outline.length > 0) {
      // PDF có sẵn Bookmark / Tab: Dùng 100% Bookmark, KHÔNG dùng regex quét bừa vào nội dung
      const resolvedOutline = await this.resolveOutlineDestinations(pdfDoc, outline);
      volumes = this.parseFromPDFBookmarks(resolvedOutline, pageTexts, numPages);
    }

    // Nếu file PDF hoàn toàn không có Bookmark, mới dùng bộ quét cấu trúc dòng tiêu đề nghiêm ngặt
    if (volumes.length === 0 || volumes.every((v) => v.chapters.length === 0)) {
      volumes = this.parseStrictDocumentText(pageTexts.join("\n\n"));
    }

    return this.finalizeResult("pdf", file.name, volumes, onProgress);
  }

  /**
   * 2. DOCX Parser
   */
  private async parseDOCX(
    file: File,
    onProgress?: (progress: number, status: string) => void
  ): Promise<DocumentParseResult> {
    onProgress?.(20, "Đang đọc tệp DOCX...");
    const arrayBuffer = await file.arrayBuffer();

    onProgress?.(50, "Đang trích xuất nội dung...");
    const result = await mammoth.extractRawText({ arrayBuffer });
    const fullText = result.value || "";

    onProgress?.(80, "Đang phân tích cấu trúc Vị Diện & Chương...");
    const volumes = this.parseStrictDocumentText(fullText);

    return this.finalizeResult("docx", file.name, volumes, onProgress);
  }

  /**
   * 3. TXT Parser
   */
  private async parseTXT(
    file: File,
    onProgress?: (progress: number, status: string) => void
  ): Promise<DocumentParseResult> {
    onProgress?.(20, "Đang đọc tệp văn bản TXT...");
    const fullText = await file.text();

    onProgress?.(70, "Đang phân tích cấu trúc Vị Diện & Chương...");
    const volumes = this.parseStrictDocumentText(fullText);

    return this.finalizeResult("txt", file.name, volumes, onProgress);
  }

  /**
   * Resolve outline destination page indexes
   */
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
        title: (item.title || "").trim(),
        pageIndex,
        items: children,
      });
    }
    return results;
  }

  /**
   * Parse PDF Bookmarks:
   * - Level 1 Bookmarks = Tên Vị Diện / Hồi truyện
   * - Level 2 Bookmarks (hoặc child items) = Các Chương nhỏ
   * - Nếu là danh sách phẳng (Flat list): Gom các bookmark bắt đầu bằng "Chương..." vào Vị Diện đứng trước nó.
   */
  private parseFromPDFBookmarks(
    outline: any[],
    pageTexts: string[],
    numPages: number
  ): ParsedVolume[] {
    const volumes: ParsedVolume[] = [];

    // Helper kiểm tra xem 1 tiêu đề có phải là Chương không
    const isChapterTitle = (title: string): boolean => {
      const t = title.trim().toLowerCase();
      return /^(?:chương|chuong|hồi|hoi|tiết|tiet|chapter|cd+|qd+cd+)/i.test(t);
    };

    const extractChapNumber = (title: string, fallback: number): number => {
      const match = title.match(/(?:chương|chuong|chapter|c|hồi|tiết)s*(d+)/i) || title.match(/(d+)/);
      return match ? parseInt(match[1], 10) : fallback;
    };

    const hasNestedChildren = outline.some((item) => item.items && item.items.length > 0);

    if (hasNestedChildren) {
      // Bookmark dạng cây phân cấp 2 cấp
      // Flatten all chapter targets across all volumes to know exact page boundaries
      const allBookmarksFlat: { volIdx: number; chapIdx: number; title: string; pageIndex: number }[] = [];

      outline.forEach((volItem, vIdx) => {
        if (volItem.items && volItem.items.length > 0) {
          volItem.items.forEach((chapItem: any, cIdx: number) => {
            allBookmarksFlat.push({
              volIdx: vIdx,
              chapIdx: cIdx,
              title: chapItem.title,
              pageIndex: chapItem.pageIndex >= 0 ? chapItem.pageIndex : 0,
            });
          });
        }
      });

      outline.forEach((volItem, vIdx) => {
        const volTitle = (volItem.title || "").trim() || `Vị Diện ${vIdx + 1}`;
        const chapters: ParsedChapter[] = [];

        if (volItem.items && volItem.items.length > 0) {
          volItem.items.forEach((chapItem: any, cIdx: number) => {
            // Find current item in flattened list
            const flatIdx = allBookmarksFlat.findIndex(
              (b) => b.volIdx === vIdx && b.chapIdx === cIdx
            );

            const startPage = chapItem.pageIndex >= 0 ? chapItem.pageIndex : 0;
            let endPage = numPages - 1;

            if (flatIdx >= 0 && flatIdx < allBookmarksFlat.length - 1) {
              const nextBookmark = allBookmarksFlat[flatIdx + 1];
              endPage = nextBookmark.pageIndex >= 0 ? nextBookmark.pageIndex : numPages - 1;
            }

            const chapterContent = this.extractTextBetweenPages(
              pageTexts,
              startPage,
              endPage,
              chapItem.title,
              flatIdx < allBookmarksFlat.length - 1 ? allBookmarksFlat[flatIdx + 1].title : undefined
            );

            const chapNumber = extractChapNumber(chapItem.title, cIdx + 1);

            chapters.push({
              number: chapNumber,
              title: (chapItem.title || "").trim() || `Chương ${chapNumber}`,
              content: chapterContent,
              wordCount: chapterContent.split(/\s+/).filter(Boolean).length,
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
      // Bookmark dạng phẳng (Flat Bookmark list)
      // Các item không phải là "Chương..." là Vị Diện / Hồi truyện
      let currentVol: ParsedVolume = {
        number: 1,
        title: "Vị Diện / Hồi 1",
        chapters: [],
      };

      for (let i = 0; i < outline.length; i++) {
        const item = outline[i];
        const isChap = isChapterTitle(item.title);

        if (!isChap) {
          // Đây là Tab Vị Diện / Hồi truyện!
          if (currentVol.chapters.length > 0) {
            volumes.push(currentVol);
          }
          currentVol = {
            number: volumes.length + 1,
            title: item.title.trim(),
            chapters: [],
          };
        } else {
          // Đây là Tab Chương nhỏ
          const startPage = item.pageIndex >= 0 ? item.pageIndex : 0;
          let endPage = numPages - 1;

          // Next item in outline
          if (i < outline.length - 1 && outline[i + 1].pageIndex >= 0) {
            endPage = outline[i + 1].pageIndex;
          }

          const chapterContent = this.extractTextBetweenPages(
            pageTexts,
            startPage,
            endPage,
            item.title,
            i < outline.length - 1 ? outline[i + 1].title : undefined
          );

          const chapNumber = extractChapNumber(item.title, currentVol.chapters.length + 1);

          currentVol.chapters.push({
            number: chapNumber,
            title: item.title.trim(),
            content: chapterContent,
            wordCount: chapterContent.split(/\s+/).filter(Boolean).length,
            pageStart: startPage + 1,
          });
        }
      }

      if (currentVol.chapters.length > 0 || volumes.length === 0) {
        volumes.push(currentVol);
      }
    }

    return volumes;
  }

  /**
   * Trích xuất văn bản giữa các trang có lọc tiêu đề bắt đầu và kết thúc
   */
  private extractTextBetweenPages(
    pageTexts: string[],
    startPage: number,
    endPage: number,
    currentHeading?: string,
    nextHeading?: string
  ): string {
    const chunks: string[] = [];
    const validStart = Math.max(0, startPage);
    const validEnd = Math.min(pageTexts.length - 1, Math.max(validStart, endPage));

    for (let p = validStart; p <= validEnd; p++) {
      if (pageTexts[p]) chunks.push(pageTexts[p]);
    }

    let text = chunks.join("\n\n").trim();

    if (currentHeading && text.includes(currentHeading)) {
      const startIdx = text.indexOf(currentHeading);
      if (startIdx >= 0) {
        text = text.substring(startIdx).trim();
      }
    }

    if (nextHeading && text.includes(nextHeading)) {
      const idx = text.indexOf(nextHeading);
      if (idx > 0) {
        text = text.substring(0, idx).trim();
      }
    }

    // Làm sạch số trang và khoảng trắng thừa
    text = text.replace(/\bTrang\s+\d+(?:\s*\/\s*\d+)?\b/gi, "");
    text = text.replace(/^\s*\d+\s*$/gm, "");

    return text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .join("\n\n");
  }

  /**
   * Parse Structured Text NGHIÊM NGẶT (khi không có PDF bookmark):
   * Chỉ nhận dòng ngắn làm Vị Diện, TUYỆT ĐỐI KHÔNG match câu văn bản như "Thế giới này...", "Phần thưởng..."
   */
  private parseStrictDocumentText(fullText: string): ParsedVolume[] {
    const volumes: ParsedVolume[] = [];

    // Regex nghiêm ngặt cho dòng tiêu đề Vị Diện / Hồi:
    // Phải là một dòng riêng biệt, độ dài <= 60 ký tự, bắt đầu bằng Vị Diện / Hồi / Quyển / Tập / Arc hoặc #
    // TUYỆT ĐỐI loại trừ các từ như "Phần thưởng", "Phần quà", "Thế giới này", "Thế giới đó"
    const volumeHeadingRegex = /(?:^|\n)[ \t]*(?:#[ \t]+|(?:Vị [Dd]iện|Vi [Dd]ien|Hồi|Hoi|Quyển|Quyen|Tập|Tap|Arc)[ \t]+([0-9IVXLCDM]+|[A-Za-zÀ-ỹ0-9\s\-_:]{1,50}))[ \t]*(?:\n|$)/gi;

    const volumeMatches = [...fullText.matchAll(volumeHeadingRegex)];

    if (volumeMatches.length > 1) {
      for (let i = 0; i < volumeMatches.length; i++) {
        const match = volumeMatches[i];
        const nextMatch = volumeMatches[i + 1];
        const startIndex = (match.index || 0) + match[0].length;
        const endIndex = nextMatch ? nextMatch.index : fullText.length;

        const volTitle = match[0].replace(/^[\r\n#\s]+|[\r\n\s]+$/g, "").trim();
        const volText = fullText.slice(startIndex, endIndex);

        const chapters = this.splitChaptersStrict(volText);

        volumes.push({
          number: i + 1,
          title: volTitle,
          chapters,
        });
      }
    } else {
      const chapters = this.splitChaptersStrict(fullText);
      volumes.push({
        number: 1,
        title: "Vị Diện / Hồi 1",
        chapters,
      });
    }

    return volumes;
  }

  /**
   * Split chapters strictly by chapter headings
   */
  private splitChaptersStrict(text: string): ParsedChapter[] {
    const chapters: ParsedChapter[] = [];

    // Dòng bắt đầu bằng Chương / Hồi / Tiết / Chapter + số chương (độ dài dòng <= 80 ký tự)
    const chapterHeadingRegex = /(?:^|\n)[ \t]*(?:##[ \t]+|(?:Chương|Chuong|Hồi|Hoi|Tiết|Tiet|Chapter)[ \t]+(\d+)(?:[ \t]*[:\-\._][ \t]*([^\r\n]{1,80}))?)[ \t]*(?:\n|$)/gi;

    const matches = [...text.matchAll(chapterHeadingRegex)];

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

      const chapNumber = parseInt(match[1], 10) || i + 1;
      const chapTitle = match[0].replace(/^[\r\n#\s]+|[\r\n\s]+$/g, "").trim();
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
   * Finalize and calculate numbers
   */
  private finalizeResult(
    fileType: "pdf" | "docx" | "txt",
    fileName: string,
    volumes: ParsedVolume[],
    onProgress?: (progress: number, status: string) => void
  ): DocumentParseResult {
    let totalWords = 0;
    let totalChapters = 0;

    volumes.forEach((vol, vIdx) => {
      vol.number = vIdx + 1;
      vol.chapters.forEach((chap) => {
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
}

export const documentParserService = new DocumentParserService();
export const pdfParserService = documentParserService;
export type PDFParseResult = DocumentParseResult;
