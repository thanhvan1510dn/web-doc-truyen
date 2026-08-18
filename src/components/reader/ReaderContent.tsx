import React from 'react';
import { Story, Chapter, ReaderSettings } from '../../types/story';
import { Clock, BookOpen, Layers } from 'lucide-react';

interface ReaderContentProps {
  story: Story;
  chapter: Chapter;
  settings: ReaderSettings;
  readingProgressPercent: number;
}

export const ReaderContent: React.FC<ReaderContentProps> = ({
  story,
  chapter,
  settings,
  readingProgressPercent,
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
        return 'leading-relaxed';
      case 'normal':
        return 'leading-loose';
      case 'relaxed':
        return 'leading-[2.2]';
      case 'loose':
        return 'leading-[2.5]';
      default:
        return 'leading-loose';
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
        return 'bg-slate-900 text-slate-200';
      case 'sepia':
        return 'bg-[#f5ecd4] text-[#4a3828]';
      case 'midnight':
        return 'bg-[#0a0f1d] text-[#cbd5e1]';
      default:
        return 'bg-[#fbfbfb] text-gray-800';
    }
  };

  // Split text by paragraphs
  const paragraphs = chapter.content.split('\n\n').filter(p => p.trim() !== '');

  return (
    <div className={`min-h-[80vh] py-8 sm:py-12 transition-colors ${getThemeBackgroundClass()}`}>
      {/* Sticky Progress Bar on Top */}
      <div className="fixed top-0 left-0 right-0 h-1 z-50 bg-black/10 dark:bg-white/10">
        <div
          className="h-full bg-gradient-to-r from-amber-500 to-red-500 transition-all duration-150"
          style={{ width: `${readingProgressPercent}%` }}
        />
      </div>

      <div className={`mx-auto px-4 sm:px-6 lg:px-8 ${getReaderWidthClass()}`}>
        {/* Chapter Header */}
        <div className="text-center pb-8 mb-8 border-b border-black/10 dark:border-white/10">
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-2">
            <Layers className="w-3.5 h-3.5" />
            <span>{chapter.volumeTitle}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight mb-3">
            {chapter.title}
          </h1>

          <div className="flex items-center justify-center gap-4 text-xs opacity-70 flex-wrap">
            <span className="flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" />
              <span>{story.title}</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{chapter.wordCount.toLocaleString()} chữ</span>
            </span>
            <span>•</span>
            <span>Cập nhật: {chapter.updatedAt}</span>
          </div>
        </div>

        {/* Chapter Paragraphs Content */}
        <div 
          className={`space-y-6 ${getFontFamilyClass()} ${getLineHeightClass()}`}
          style={{
            fontSize: `${settings.fontSize}px`,
            textAlign: settings.textAlign === 'justify' ? 'justify' : 'left',
          }}
        >
          {paragraphs.map((p, index) => (
            <p 
              key={index}
              className="tracking-normal transition-all duration-100"
            >
              {p}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
};
