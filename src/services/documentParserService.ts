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

    onProgress?.(25, "PDF gồm " + numPages + " trang. Đang đọc Document Tabs / Bookmarks...");

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

      const percent = Math.round(25 + (pageNum / numPages) * 55);
      onProgress?.(percent, "Đang trích xuất trang " + pageNum + "/" + numPages + "...");
    }

    onProgress?.(85, "Đang phân tích cấu trúc Tabs tài liệu...");

    let volumes: ParsedVolume[] = [];

    if (outline && outline.length > 0) {
      const resolvedOutline = await this.resolveOutlineDestinations(pdfDoc, outline, pageTexts);
      volumes = this.parseFromPDFBookmarks(resolvedOutline, pageTexts, numPages);
    }

    if (volumes.length === 0 || volumes.every((v) => v.chapters.length === 0)) {
      volumes = this.parseStructuredText(pageTexts.join("\n\n"));
    }

    return this.finalizeResult("pdf", file.name, volumes, onProgress);
  }

  private async parseDOCX(
    file: File,
    onProgress?: (progress: number, status: string) => void
  ): Promise<DocumentParseResult> {
    onProgress?.(20, "Đang đọc tệp DOCX...");
    const arrayBuffer = await file.arrayBuffer();

    onProgress?.(50, "Đang trích xuất cấu trúc văn bản...");
    const options = {
      styleMap: [
        "p[style-name='Heading 1'] => h1:fresh",
        "p[style-name='heading 1'] => h1:fresh",
        "p[style-name='Heading 2'] => h2:fresh",
        "p[style-name='heading 2'] => h2:fresh",
        "p[style-name='Heading 3'] => h3:fresh",
        "p[style-name='heading 3'] => h3:fresh",
        "p[style-name='Title'] => h1:fresh",
        "p[style-name='title'] => h1:fresh",
      ]
    };
    const htmlResult = await mammoth.convertToHtml({ arrayBuffer }, options);
    const html = htmlResult.value || "";

    onProgress?.(80, "Đang ánh xạ Headings thành Mục lục & Chương...");
    let volumes = this.parseFromWordHtml(html);

    if (volumes.length === 0 || volumes.every((v) => v.chapters.length === 0)) {
      const rawText = await mammoth.extractRawText({ arrayBuffer });
      volumes = this.parseStructuredText(rawText.value || "");
    }

    return this.finalizeResult("docx", file.name, volumes, onProgress);
  }

  private async parseTXT(
    file: File,
    onProgress?: (progress: number, status: string) => void
  ): Promise<DocumentParseResult> {
    onProgress?.(20, "Đang đọc tệp TXT...");
    const fullText = await file.text();

    onProgress?.(70, "Đang phân tích cấu trúc Mục lục & Chương...");
    const volumes = this.parseStructuredText(fullText);

    return this.finalizeResult("txt", file.name, volumes, onProgress);
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

        volumes.push({
          number: pIdx + 1,
          title: parentTitle,
          chapters,
        });
      });
    } else {
      let currentVolume: ParsedVolume | null = null;
      let volIndex = 0;

      for (let i = 0; i < outline.length; i++) {
        const item = outline[i];
        const isChap = isChapter(item.title);

        if (!isChap) {
          if (currentVolume && currentVolume.chapters.length > 0) {
            volumes.push(currentVolume);
          }

          volIndex++;
          currentVolume = {
            number: volIndex,
            title: item.title.trim(),
            chapters: [],
          };
        } else {
          if (!currentVolume) {
            volIndex++;
            currentVolume = {
              number: volIndex,
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

    return volumes;
  }

  private parseFromWordHtml(html: string): ParsedVolume[] {
    const volumes: ParsedVolume[] = [];
    const h1Regex = /<h1[^>]*>([\s\S]*?)<\/h1>/gi;
    const h1Matches = [...html.matchAll(h1Regex)];

    if (h1Matches.length > 0) {
      for (let i = 0; i < h1Matches.length; i++) {
        const match = h1Matches[i];
        const nextMatch = h1Matches[i + 1];
        const startIndex = (match.index || 0) + match[0].length;
        const endIndex = nextMatch ? nextMatch.index : html.length;

        const volTitle = match[1].replace(/<[^>]+>/g, "").trim();
        const sectionHtml = html.slice(startIndex, endIndex);

        const chapters = this.extractChaptersFromHtml(sectionHtml);

        volumes.push({
          number: i + 1,
          title: volTitle || ("Mục lục " + (i + 1)),
          chapters,
        });
      }
    } else {
      const chapters = this.extractChaptersFromHtml(html);
      volumes.push({
        number: 1,
        title: "Mục lục 1",
        chapters,
      });
    }

    return volumes;
  }

  private extractChaptersFromHtml(html: string): ParsedChapter[] {
    const chapters: ParsedChapter[] = [];
    const chapHeadingRegex = /(?:<h2[^>]*>([\s\S]*?)<\/h2>|<p[^>]*>[ \t]*(?:Chương|Chuong|Chapter)[ \t]+(\d+)[^<]*<\/p>)/gi;
    const matches = [...html.matchAll(chapHeadingRegex)];

    const cleanText = (str: string) => str.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim();

    if (matches.length === 0) {
      const raw = cleanText(html);
      return this.splitChaptersStrict(raw);
    }

    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const nextMatch = matches[i + 1];
      const startIndex = (match.index || 0) + match[0].length;
      const endIndex = nextMatch ? nextMatch.index : html.length;

      const titleRaw = cleanText(match[0]);
      const contentRaw = cleanText(html.slice(startIndex, endIndex));
      const chapNumMatch = titleRaw.match(/(?:chương|chuong|chapter)\s*(\d+)/i);
      const chapNum = chapNumMatch ? parseInt(chapNumMatch[1], 10) : i + 1;

      chapters.push({
        number: chapNum,
        title: titleRaw,
        content: contentRaw,
        wordCount: contentRaw.split(/\s+/).filter(Boolean).length,
      });
    }

    return chapters;
  }

  private parseStructuredText(fullText: string): ParsedVolume[] {
    const volumes: ParsedVolume[] = [];
    const parentSectionRegex = /(?:^|\n)[ \t]*(?:#[ \t]+|【[ \t]*|===[ \t]*|\([ \t]*\d+[ \t]*[-–—][ \t]*\d+[ \t]*\)|(?:Mục lục|Muc luc|Quyển|Quyen|Tập|Tap|Phần|Phan|Hồi|Hoi|Arc|Vị [Dd]iện)[ \t]+\d+[:\-\._\s]?)[^\r\n]{0,80}(?:】|===|\n|$)/gi;

    const matches = [...fullText.matchAll(parentSectionRegex)];

    if (matches.length > 1) {
      for (let i = 0; i < matches.length; i++) {
        const match = matches[i];
        const nextMatch = matches[i + 1];
        const startIndex = (match.index || 0) + match[0].length;
        const endIndex = nextMatch ? nextMatch.index : fullText.length;

        const volTitle = match[0].replace(/^[\r\n#【=—\-\s]+|[\r\n】=—\-\s]+$/g, "").trim();
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
        title: "Mục lục 1",
        chapters,
      });
    }

    return volumes;
  }

  private splitChaptersStrict(text: string): ParsedChapter[] {
    const chapters: ParsedChapter[] = [];
    const chapterHeadingRegex = /(?:^|\n)[ \t]*(?:##[ \t]+|(?:Chương|Chuong|Chapter|Tiết|Tiet)[ \t]+(\d+)(?:[ \t]*[:\-\._][ \t]*([^\r\n]{1,80}))?)[ \t]*(?:\n|$)/gi;

    const matches = [...text.matchAll(chapterHeadingRegex)];

    if (matches.length === 0) {
      const words = text.split(/\s+/).filter(Boolean);
      const chunkSize = 2500;
      const numChunks = Math.max(1, Math.ceil(words.length / chunkSize));

      for (let i = 0; i < numChunks; i++) {
        const chunkWords = words.slice(i * chunkSize, (i + 1) * chunkSize);
        chapters.push({
          number: i + 1,
          title: "Chương " + (i + 1),
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

      const chapNumber = parseInt(match[1], 10) || (i + 1);
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
