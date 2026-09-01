import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";

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
   * 1. PDF Parser
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

    onProgress?.(25, "PDF gồm " + numPages + " trang. Đang trích xuất văn bản...");

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

      let pageLines = "";
      let lastY: number | null = null;

      for (const item of textContent.items as any[]) {
        const str = item.str || "";
        if (!str && !item.hasEOL) continue;

        const currentY = item.transform ? item.transform[5] : null;

        if (lastY !== null && currentY !== null && Math.abs(currentY - lastY) > 4) {
          // Line break in PDF
          if (Math.abs(currentY - lastY) > 16) {
            pageLines += "\n\n" + str;
          } else {
            pageLines += "\n" + str;
          }
        } else if (item.hasEOL) {
          pageLines += str + "\n";
        } else {
          pageLines += (pageLines.endsWith("\n") || pageLines === "" ? "" : " ") + str;
        }

        if (currentY !== null) {
          lastY = currentY;
        }
      }

      pageTexts.push(pageLines);

      const percent = Math.round(25 + (pageNum / numPages) * 55);
      onProgress?.(percent, "Đang trích xuất trang " + pageNum + "/" + numPages + "...");
    }

    onProgress?.(85, "Đang phân tích cấu trúc Tabs tài liệu...");

    let volumes: ParsedVolume[] = [];

    if (outline && outline.length > 0) {
      const resolvedOutline = await this.resolveOutlineDestinations(pdfDoc, outline, pageTexts);
      volumes = this.parseFromPDFBookmarks(resolvedOutline, pageTexts, numPages);
    }

    if (volumes.length === 0 || (volumes.length === 1 && volumes[0].chapters.length > 50)) {
      const parsedFromText = this.parseDocumentLines(pageTexts.join("\n"));
      if (parsedFromText.length > 1) {
        volumes = parsedFromText;
      }
    }

    if (volumes.length === 0 || volumes.every((v) => v.chapters.length === 0)) {
      volumes = this.parseDocumentLines(pageTexts.join("\n"));
    }

    return this.finalizeResult("pdf", file.name, volumes, onProgress);
  }

  /**
   * 2. DOCX Parser (Word & Google Docs exported DOCX)
   */
  private async parseDOCX(
    file: File,
    onProgress?: (progress: number, status: string) => void
  ): Promise<DocumentParseResult> {
    onProgress?.(20, "Đang đọc tệp Word DOCX...");
    const arrayBuffer = await file.arrayBuffer();

    onProgress?.(50, "Đang trích xuất nội dung và Document Tabs...");
    const rawResult = await mammoth.extractRawText({ arrayBuffer });
    const fullText = rawResult.value || "";

    onProgress?.(80, "Đang ánh xạ Tabs lớn thành Mục lục & Tabs nhỏ thành Chương...");
    let volumes = this.parseDocumentLines(fullText);

    if (volumes.length === 0 || volumes.every((v) => v.chapters.length === 0)) {
      const htmlResult = await mammoth.convertToHtml({ arrayBuffer });
      const plainText = (htmlResult.value || "").replace(/<[^>]+>/g, "\n");
      volumes = this.parseDocumentLines(plainText);
    }

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

    onProgress?.(70, "Đang phân tích cấu trúc Mục lục & Chương...");
    const volumes = this.parseDocumentLines(fullText);

    return this.finalizeResult("txt", file.name, volumes, onProgress);
  }

  /**
   * Universal Line-by-Line Document Parser
   */
  public parseDocumentLines(rawText: string): ParsedVolume[] {
    const rawLines = rawText.split(/\r?\n/);
    const volumes: ParsedVolume[] = [];

    let currentVolume: ParsedVolume | null = null;
    let currentChapter: ParsedChapter | null = null;
    let currentChapterLines: string[] = [];

    const flushChapter = () => {
      if (currentChapter) {
        currentChapter.content = currentChapterLines.join("\n").trim();
        currentChapter.wordCount = currentChapter.content.split(/\s+/).filter(Boolean).length;
        if (currentVolume) {
          currentVolume.chapters.push(currentChapter);
        }
        currentChapter = null;
        currentChapterLines = [];
      }
    };

    const normalizeLine = (str: string) => {
      return str
        .normalize("NFKC")
        .replace(/[\u00A0\u1680\u180e\u2000-\u200b\u202f\u205f\u3000\ufeff]/g, " ")
        .trim();
    };

    const isMajorTab = (line: string): string | null => {
      const trimmed = normalizeLine(line);
      if (!trimmed || trimmed.length > 120) return null;

      // Strip leading emojis, checkmarks, symbols (e.g. ✅, ✔️, ☑️, 🌸, 👑, ⭐, 📌, 🔹, 🔸, etc.)
      // and bracketed indicators like [✅], [v], (v), [x]
      const cleaned = trimmed
        .replace(/^[\s\p{Emoji}\p{Extended_Pictographic}✔️☑️✅✓•*~_\-]{1,15}\s*/u, "")
        .replace(/^[【\[\(]\s*[✔️☑️✅✓vxX\-*•]\s*[】\]\)]\s*/u, "")
        .trim();

      const targetStr = cleaned.length > 0 ? cleaned : trimmed;

      // 1. Chapter Range: (2904-2934), [2904-2934], 【2904-2934】 with optional title
      const rangeMatch = targetStr.match(/^(?:[\(\[【]\s*)?(\d{1,5})\s*[-–—~至到]\s*(\d{1,5})(?:\s*[\)\]】])?(?:\s*[:\-\._]?\s*(.*))?$/i);
      if (rangeMatch) {
        const from = parseInt(rangeMatch[1], 10);
        const to = parseInt(rangeMatch[2], 10);
        if (to >= from && to - from <= 800) {
          const extra = rangeMatch[3] ? " " + rangeMatch[3].trim() : "";
          return `(${from}-${to})${extra}`;
        }
      }

      // 2. Keyword Volume / Vị diện / Thế giới / Quyển / Mục lục / Tập / Phần / Arc / Vol (MUST have number or roman numeral)
      const keywordMatch = targetStr.match(/^(?:Vị\s*diện|Vi\s*dien|Thế\s*giới|The\s*gioi|Quyển|Quyen|Mục\s*lục|Muc\s*luc|Tập|Tap|Phần|Phan|Arc|Vol(?:ume)?\.?)\s+(\d+|[IVXLCDM]+)(?:[:\-\._\s]+(.*))?$/i);
      if (keywordMatch) {
        return targetStr;
      }

      // 3. Bracketed Volume: 【Quyển 1: ...】 or [Mục lục 2: ...] or 【Vị diện 1: ...】
      const bracketMatch = targetStr.match(/^[【\[]\s*(?:Vị\s*diện|Thế\s*giới|Quyển|Quyen|Mục\s*lục|Muc\s*luc|Tập|Tap|Phần|Phan|Vol)\s*(\d+|[IVXLCDM]+)?(?:[:\-\._\s]+(.*))?[】\]]$/i);
      if (bracketMatch) {
        return targetStr.replace(/^[【\[]/, "").replace(/[】\]]$/, "").trim();
      }

      return null;
    };

    const isChapterHeading = (line: string): { number: number; title: string } | null => {
      const trimmed = normalizeLine(line);
      if (!trimmed || trimmed.length > 200) return null;

      // Clean leading emojis, checkmarks, symbols (e.g. ✅, ✔️, ☑️, 🌸, 👑, ⭐, 📌, etc.)
      const cleaned = trimmed
        .replace(/^[\s\p{Emoji}\p{Extended_Pictographic}✔️☑️✅✓•*~_\-]{1,15}\s*/u, "")
        .replace(/^[【\[\(]\s*[✔️☑️✅✓vxX\-*•]\s*[】\]\)]\s*/u, "")
        .trim();

      const targetStr = cleaned.length > 0 ? cleaned : trimmed;

      // Pattern 1: Explicit chapter keyword (Chương / Chuong / Chapter / Chap / Hồi / Tiết / C / C\d+)
      const explicitMatch = targetStr.match(
        /^(?:#+\s+)?(?:Chương|Chuong|Chapter|Chap|Hồi|Hoi|Tiết|Tiet|Phần|Phan|C|Quyển\s*\d+\s*[-–:]\s*Chương)\s*(\d+)(?:[\s:\-\._【\(\[|\/]+(.*))?$/i
      );
      if (explicitMatch) {
        const num = parseInt(explicitMatch[1], 10);
        return {
          number: num,
          title: targetStr.replace(/^#+\s+/, "").trim(),
        };
      }

      // Pattern 2: Bracketed chapters like 【Chương 2376: ...】 or [Chương 2376] or (Chương 2376)
      const bracketMatch = targetStr.match(
        /^[【\[\(]\s*(?:Chương|Chuong|Chapter|Chap|Hồi|Hoi|Tiết|Tiet|Phần|Phan|C)\s*(\d+)(?:[\s:\-\._|]+(.*))?[】\]\)]/i
      );
      if (bracketMatch) {
        const num = parseInt(bracketMatch[1], 10);
        return {
          number: num,
          title: targetStr.trim(),
        };
      }

      // Pattern 3: Numbered chapter headings like "2376. Tiêu đề" or "2376: Tiêu đề" or "2376 - Tiêu đề"
      // (Strictly avoid dialogue lines starting or ending with quotes)
      if (!/^["'“«「『]/.test(targetStr) && !/["'”»」』]$/.test(targetStr)) {
        const numMatch = targetStr.match(/^(\d{1,5})[ \t]*[:\-\._\)\/][ \t]+([^\d"“'«\.\?].+)$/);
        if (
          numMatch &&
          targetStr.length < 90 &&
          !targetStr.includes("http") &&
          !targetStr.includes('"') &&
          !targetStr.includes('“') &&
          !targetStr.includes('”') &&
          !targetStr.includes('...') &&
          !targetStr.includes('…')
        ) {
          const num = parseInt(numMatch[1], 10);
          return {
            number: num,
            title: `Chương ${num}: ${numMatch[2].trim()}`,
          };
        }
      }

      return null;
    };

    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i];
      const majorTabTitle = isMajorTab(line);
      const chapInfo = isChapterHeading(line);

      if (majorTabTitle) {
        flushChapter();
        currentVolume = {
          number: volumes.length + 1,
          title: majorTabTitle,
          chapters: [],
        };
        volumes.push(currentVolume);
      } else if (chapInfo) {
        flushChapter();
        if (!currentVolume) {
          currentVolume = {
            number: volumes.length + 1,
            title: "Mục lục 1",
            chapters: [],
          };
          volumes.push(currentVolume);
        }
        currentChapter = {
          number: chapInfo.number,
          title: chapInfo.title,
          content: "",
          wordCount: 0,
        };
        currentChapterLines = [];
      } else {
        if (currentChapter) {
          currentChapterLines.push(line);
        }
      }
    }

    flushChapter();

    let validVolumes = volumes.filter((v) => v.chapters.length > 0);

    // Fallback: If no chapters detected by headings, but text exists, split by paragraphs or chunk into chapters
    if (validVolumes.length === 0 && rawText.trim().length > 0) {
      const paragraphs = rawText.split(/\r?\n\s*\r?\n+/).map((p) => p.trim()).filter(Boolean);
      const fallbackChapters: ParsedChapter[] = [];
      let currentChunk: string[] = [];
      let currentWordCount = 0;
      let chapNum = 1;

      for (const p of paragraphs) {
        const words = p.split(/\s+/).filter(Boolean).length;
        currentChunk.push(p);
        currentWordCount += words;

        if (currentWordCount >= 2000) {
          fallbackChapters.push({
            number: chapNum,
            title: `Chương ${chapNum}`,
            content: currentChunk.join("\n\n"),
            wordCount: currentWordCount,
          });
          chapNum++;
          currentChunk = [];
          currentWordCount = 0;
        }
      }

      if (currentChunk.length > 0) {
        fallbackChapters.push({
          number: chapNum,
          title: `Chương ${chapNum}`,
          content: currentChunk.join("\n\n"),
          wordCount: currentWordCount,
        });
      }

      if (fallbackChapters.length > 0) {
        validVolumes = [
          {
            number: 1,
            title: "Mục lục 1",
            chapters: fallbackChapters,
          },
        ];
      }
    }

    validVolumes.forEach((v, idx) => {
      v.number = idx + 1;
    });

    return validVolumes;
  }

  private async resolveOutlineDestinations(
    pdfDoc: any, 
    outlineItems: any[], 
    pageTexts: string[]
  ): Promise<any[]> {
    const results: any[] = [];
    
    for (const item of outlineItems) {
      let pageIndex = -1;
      const title = (item.title || "").trim();

      if (item.dest) {
        try {
          let dest = item.dest;
          if (typeof dest === "string") dest = await pdfDoc.getDestination(dest);
          if (Array.isArray(dest) && dest[0]) pageIndex = await pdfDoc.getPageIndex(dest[0]);
        } catch (e) {
          // ignore
        }
      }

      if (pageIndex < 0 && title.length > 3) {
        const found = pageTexts.findIndex((pText) => pText.includes(title));
        if (found >= 0) pageIndex = found;
      }

      const children = item.items && item.items.length > 0
        ? await this.resolveOutlineDestinations(pdfDoc, item.items, pageTexts)
        : [];

      results.push({
        title,
        pageIndex,
        items: children,
      });
    }

    return results;
  }

  private parseFromPDFBookmarks(
    outline: any[],
    pageTexts: string[],
    numPages: number
  ): ParsedVolume[] {
    const volumes: ParsedVolume[] = [];

    const isChapter = (title: string): boolean => {
      const t = title.trim().toLowerCase();
      return /^(?:chương|chuong|chapter|tiết|tiet|c\d+|q\d+c\d+)\b/i.test(t);
    };

    const extractChapNumber = (title: string, fallback: number): number => {
      const match = title.match(/(?:chương|chuong|chapter|c|tiết)\s*(\d+)/i) || title.match(/\b(\d+)\b/);
      return match ? parseInt(match[1], 10) : fallback;
    };

    const hasNestedChildren = outline.some((item) => item.items && item.items.length > 0);

    if (hasNestedChildren) {
      outline.forEach((parentItem, pIdx) => {
        const parentTitle = (parentItem.title || "").trim() || ("Mục lục " + (pIdx + 1));
        const chapters: ParsedChapter[] = [];

        if (parentItem.items && parentItem.items.length > 0) {
          parentItem.items.forEach((childItem: any, cIdx: number) => {
            const startPage = childItem.pageIndex >= 0 ? childItem.pageIndex : (parentItem.pageIndex >= 0 ? parentItem.pageIndex : 0);
            let endPage = numPages - 1;

            if (cIdx < parentItem.items.length - 1 && parentItem.items[cIdx + 1].pageIndex >= 0) {
              endPage = parentItem.items[cIdx + 1].pageIndex;
            } else if (pIdx < outline.length - 1 && outline[pIdx + 1].pageIndex >= 0) {
              endPage = outline[pIdx + 1].pageIndex;
            }

            const chapterContent = this.extractTextBetweenPages(
              pageTexts,
              startPage,
              endPage,
              childItem.title,
              cIdx < parentItem.items.length - 1 ? parentItem.items[cIdx + 1].title : undefined
            );

            const chapNumber = extractChapNumber(childItem.title, cIdx + 1);

            chapters.push({
              number: chapNumber,
              title: (childItem.title || "").trim() || ("Chương " + chapNumber),
              content: chapterContent,
              wordCount: chapterContent.split(/\s+/).filter(Boolean).length,
              pageStart: startPage + 1,
            });
          });
        }

        if (chapters.length > 0) {
          volumes.push({
            number: volumes.length + 1,
            title: parentTitle,
            chapters,
          });
        }
      });
    } else {
      let currentVolume: ParsedVolume | null = null;

      for (let i = 0; i < outline.length; i++) {
        const item = outline[i];
        const isChap = isChapter(item.title);

        if (!isChap) {
          if (currentVolume && currentVolume.chapters.length > 0) {
            volumes.push(currentVolume);
          }

          currentVolume = {
            number: volumes.length + 1,
            title: item.title.trim(),
            chapters: [],
          };
        } else {
          if (!currentVolume) {
            currentVolume = {
              number: volumes.length + 1,
              title: "Mục lục 1",
              chapters: [],
            };
          }

          const startPage = item.pageIndex >= 0 ? item.pageIndex : 0;
          let endPage = numPages - 1;

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

          const chapNumber = extractChapNumber(item.title, currentVolume.chapters.length + 1);

          currentVolume.chapters.push({
            number: chapNumber,
            title: item.title.trim(),
            content: chapterContent,
            wordCount: chapterContent.split(/\s+/).filter(Boolean).length,
            pageStart: startPage + 1,
          });
        }
      }

      if (currentVolume && currentVolume.chapters.length > 0) {
        volumes.push(currentVolume);
      }
    }

    volumes.forEach((v, idx) => {
      v.number = idx + 1;
    });

    return volumes;
  }

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
      if (startIdx >= 0) text = text.substring(startIdx).trim();
    }

    if (nextHeading && text.includes(nextHeading)) {
      const idx = text.indexOf(nextHeading);
      if (idx > 0) text = text.substring(0, idx).trim();
    }

    text = text.replace(/\bTrang\s+\d+(?:\s*\/\s*\d+)?\b/gi, "");
    text = text.replace(/^\s*\d+\s*$/gm, "");

    return text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .join("\n\n");
  }

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
