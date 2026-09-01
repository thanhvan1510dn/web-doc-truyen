import React from 'react';
import { Story, Chapter, ReaderSettings } from '../../types/story';
import { Clock } from 'lucide-react';
import { formatDate } from '../../utils/format';

interface ReaderContentProps {
  story: Story;
  chapter: Chapter;
  settings: ReaderSettings;
}

export const ReaderContent: React.FC<ReaderContentProps> = ({
  story,
  chapter,
  settings,
}) => {
  const getFontFamilyClass = () => {
    switch (settings.fontFamily) {
      case 'serif':
        return 'font-serif';
      case 'lora':
        return 'font-serif italic-none';
      case 'mono':
        return 'font-mono';
      default:
        return 'font-sans';
    }
  };

  const getLineHeightClass = () => {
    switch (settings.lineHeight) {
      case 'tight':
        return 'leading-[1.8] space-y-5';
      case 'normal':
        return 'leading-[2.1] space-y-6';
      case 'relaxed':
        return 'leading-[2.4] space-y-7';
      case 'loose':
        return 'leading-[2.7] space-y-8';
      default:
        return 'leading-[2.1] space-y-6';
    }
  };

  const getReaderWidthClass = () => {
    switch (settings.readerWidth) {
      case 'narrow':
        return 'max-w-2xl'; // ~672px
      case 'medium':
        return 'max-w-3xl'; // ~768px
      case 'wide':
        return 'max-w-5xl'; // ~1024px
      case 'full':
        return 'max-w-7xl';
      default:
        return 'max-w-3xl';
    }
  };

  const getThemeBackgroundClass = () => {
    switch (settings.theme) {
      case 'dark':
        return 'bg-[#0f172a] text-[#e2e8f0]';
      case 'sepia':
        return 'bg-[#f4ecdc] text-[#3d2f21]';
      case 'midnight':
        return 'bg-[#060911] text-[#cbd5e1]';
      default:
        return 'bg-[#fdfbf7] text-[#1e293b]';
    }
  };

  // Smart Paragraph Splitter & Formatter for Vietnamese Novel Content
  const parseStoryParagraphs = (content: string): string[] => {
    if (!content || typeof content !== 'string') return [];

    let text = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
    if (!text) return [];

    // 1. Two consecutive quotes (End of dialogue 1 and Start of dialogue 2)
    // e.g. à?""Ta -> à?"\n\n"Ta, Quân.""Có -> Quân."\n\n"Có, "Chưa có.""Vậy -> "Chưa có."\n\n"Vậy
    text = text.replace(/([”"'])\s*([“"'])/g, '$1\n\n$2');

    // 2. Break glued dialogue quotes & sentences by tracking quote context:
    const isQuote = (c: string) => c === '"' || c === '“' || c === '”' || c === "'";
    const isPunctuation = (c: string) => c === '.' || c === '!' || c === '?' || c === '…';
    const isUpper = (c: string) => /[A-ZÀ-ỸĐ]/.test(c);

    let result = '';
    let insideQuote = false;

    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      const prev = i > 0 ? text[i - 1] : '';
      const next = i < text.length - 1 ? text[i + 1] : '';

      if (isQuote(ch)) {
        if (insideQuote) {
          // Closing quote
          insideQuote = false;
          result += ch;
          // If immediately followed by uppercase letter without space, e.g. hắn."Ninh Thư or đấy?"Ninh Thư
          if (isUpper(next)) {
            result += '\n\n';
          }
        } else {
          // Opening quote
          insideQuote = true;
          // If preceded by punctuation without newline, e.g. nữa."Cái này or hắn."Chưa có
          if (isPunctuation(prev)) {
            result += '\n\n';
          }
          result += ch;
        }
      } else if (isPunctuation(ch)) {
        result += ch;
        // If outside quotes and immediately followed by uppercase letter (glued sentence without space)
        // e.g. nữa.Vì vậy or rồi.Có lẽ or lắm.Hắn
        if (!insideQuote && isUpper(next) && !isQuote(next)) {
          result += '\n\n';
        }
      } else {
        result += ch;
      }
    }

    // Split by newlines into clean paragraph blocks
    const rawParagraphs = result
      .split(/\n+/)
      .map((p) => p.trim())
      .filter(Boolean);

    const cleanParagraphs: string[] = [];
    for (let i = 0; i < rawParagraphs.length; i++) {
      const current = rawParagraphs[i];
      if (/^["'“”«»]+$/.test(current)) {
        if (cleanParagraphs.length > 0) {
          cleanParagraphs[cleanParagraphs.length - 1] += current;
        }
      } else if (cleanParagraphs.length > 0 && /^["'“”«»]+$/.test(cleanParagraphs[cleanParagraphs.length - 1])) {
        cleanParagraphs[cleanParagraphs.length - 1] += current;
      } else {
        cleanParagraphs.push(current);
      }
    }

    return cleanParagraphs.length > 0 ? cleanParagraphs : [text];
  };

  const paragraphs = parseStoryParagraphs(chapter.content);

  return (
    <div className={`min-h-[80vh] pt-6 sm:pt-10 pb-28 sm:pb-32 transition-colors ${getThemeBackgroundClass()}`}>
      <div className={`mx-auto px-4 sm:px-6 lg:px-8 ${getReaderWidthClass()}`}>
        {/* Chapter Header */}
        <div className="text-center pb-8 mb-8 border-b border-black/10 dark:border-white/10">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight mb-3">
            {chapter.title}
          </h1>

          <div className="flex items-center justify-center gap-1.5 text-xs opacity-70">
            <Clock className="w-3.5 h-3.5 opacity-60" />
            <span>Cập nhật: {formatDate(chapter.updatedAt || story.updatedAt)}</span>
          </div>
        </div>

        {/* Chapter Paragraphs Content */}
        <div 
          className={`space-y-6 sm:space-y-7 ${getFontFamilyClass()} ${getLineHeightClass()}`}
          style={{
            fontSize: `${settings.fontSize}px`,
            textAlign: settings.textAlign === 'justify' ? 'justify' : 'left',
          }}
        >
          {paragraphs.map((p, index) => (
            <p 
              key={index}
              className="whitespace-pre-line tracking-normal transition-all duration-100"
            >
              {p}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
};
