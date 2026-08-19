import React from 'react';
import { ArrowLeft, BookOpen, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { Story, Chapter, ReaderSettings } from '../../types/story';

interface ReaderHeaderProps {
  story: Story;
  chapter: Chapter;
  hasPrev: boolean;
  hasNext: boolean;
  onPrevChapter: () => void;
  onNextChapter: () => void;
  onBackToStory: () => void;
  onOpenTOC: () => void;
  onOpenSettings: () => void;
  settings: ReaderSettings;
}

export const ReaderHeader: React.FC<ReaderHeaderProps> = ({
  story,
  chapter,
  hasPrev,
  hasNext,
  onPrevChapter,
  onNextChapter,
  onBackToStory,
  onOpenTOC,
  onOpenSettings,
  settings,
}) => {
  const getHeaderThemeClasses = () => {
    switch (settings.theme) {
      case 'dark':
        return 'bg-slate-900/90 border-slate-800 text-slate-100';
      case 'sepia':
        return 'bg-[#f0e6cb]/90 border-[#dfd2af] text-[#4a3828]';
      case 'midnight':
        return 'bg-[#0a0f1d]/90 border-slate-800 text-slate-200';
      default:
        return 'bg-white/90 border-gray-200 text-gray-800';
    }
  };

  return (
    <header className={`sticky top-0 z-30 backdrop-blur-md border-b transition-colors ${getHeaderThemeClasses()}`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 h-13 sm:h-14 flex items-center justify-between gap-2">
        {/* Left: Back button & Breadcrumbs */}
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={onBackToStory}
            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors flex-shrink-0"
            title="Quay lại mục lục truyện"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div 
            onClick={onBackToStory}
            className="text-xs sm:text-sm text-amber-600 dark:text-amber-400 font-bold cursor-pointer hover:underline truncate"
            title={story.title}
          >
            {story.title}
          </div>
        </div>

        {/* Right: Quick Chapter Navigation, TOC & Settings */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {/* Chapter Prev / Next in Header (desktop) */}
          <div className="hidden sm:flex items-center rounded-lg bg-black/5 dark:bg-white/10 p-0.5 text-xs">
            <button
              onClick={onPrevChapter}
              disabled={!hasPrev}
              className={`p-1 rounded-md transition-colors ${
                hasPrev ? 'hover:bg-black/10 dark:hover:bg-white/20' : 'opacity-30 cursor-not-allowed'
              }`}
              title="Chương trước (Phím ←)"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-1.5 font-medium opacity-80">
              Ch. {chapter.number}
            </span>
            <button
              onClick={onNextChapter}
              disabled={!hasNext}
              className={`p-1 rounded-md transition-colors ${
                hasNext ? 'hover:bg-black/10 dark:hover:bg-white/20' : 'opacity-30 cursor-not-allowed'
              }`}
              title="Chương sau (Phím →)"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Table of Contents button */}
          <button
            onClick={onOpenTOC}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-xs font-semibold"
            title="Mục lục các chương"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-500" />
            <span>Mục Lục</span>
          </button>

          {/* Reader Settings Modal Trigger */}
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-xs font-semibold"
            title="Cài đặt cỡ chữ & giao diện"
          >
            <Settings className="w-3.5 h-3.5 text-amber-500" />
            <span>Cỡ Chữ</span>
          </button>
        </div>
      </div>
    </header>
  );
};
