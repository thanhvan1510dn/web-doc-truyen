import React from 'react';
import { ArrowLeft, BookOpen, Settings } from 'lucide-react';
import { Story, ReaderSettings } from '../../types/story';

interface ReaderHeaderProps {
  story: Story;
  onBackToStory: () => void;
  onOpenTOC: () => void;
  onOpenSettings: () => void;
  settings: ReaderSettings;
}

export const ReaderHeader: React.FC<ReaderHeaderProps> = ({
  story,
  onBackToStory,
  onOpenTOC,
  onOpenSettings,
  settings,
}) => {
  const getHeaderThemeClasses = () => {
    switch (settings.theme) {
      case 'dark':
        return 'bg-[#0f172a]/90 border-slate-800/80 text-[#e2e8f0]';
      case 'sepia':
        return 'bg-[#f4ecdc]/90 border-[#e5dcbe] text-[#3d2f21]';
      case 'midnight':
        return 'bg-[#060911]/90 border-slate-900 text-[#cbd5e1]';
      default:
        return 'bg-[#fdfbf7]/90 border-gray-200/80 text-[#1e293b]';
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
            className="text-xs sm:text-sm font-bold cursor-pointer hover:underline truncate opacity-90 hover:opacity-100"
            title={story.title}
          >
            {story.title}
          </div>
        </div>

        {/* Right: TOC & Settings */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {/* Table of Contents button */}
          <button
            onClick={onOpenTOC}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-xs font-semibold"
            title="Mục lục các chương"
          >
            <BookOpen className="w-3.5 h-3.5 opacity-75" />
            <span>Mục Lục</span>
          </button>

          {/* Reader Settings Modal Trigger */}
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-xs font-semibold"
            title="Cài đặt cỡ chữ & giao diện"
          >
            <Settings className="w-3.5 h-3.5 opacity-75" />
            <span>Cỡ Chữ</span>
          </button>
        </div>
      </div>
    </header>
  );
};
