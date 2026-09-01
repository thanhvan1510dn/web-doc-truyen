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

  // Strictly preserve line breaks & paragraphs from the uploaded text
  const rawContent = (chapter.content || '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim();

  const paragraphs = rawContent.includes('\n\n')
    ? rawContent.split(/\n\n+/).map((p) => p.trim()).filter(Boolean)
    : rawContent.split(/\n+/).map((p) => p.trim()).filter(Boolean);

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
