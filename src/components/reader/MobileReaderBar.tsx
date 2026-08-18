import React from 'react';
import { ChevronLeft, ChevronRight, BookOpen, Settings } from 'lucide-react';
import { ReaderSettings } from '../../types/story';

interface MobileReaderBarProps {
  hasPrev: boolean;
  hasNext: boolean;
  onPrevChapter: () => void;
  onNextChapter: () => void;
  onOpenTOC: () => void;
  onOpenSettings: () => void;
  chapterNumber: number;
  settings: ReaderSettings;
}

export const MobileReaderBar: React.FC<MobileReaderBarProps> = ({
  hasPrev,
  hasNext,
  onPrevChapter,
  onNextChapter,
  onOpenTOC,
  onOpenSettings,
  chapterNumber,
  settings,
}) => {
  const getBarClasses = () => {
    switch (settings.theme) {
      case 'dark':
        return 'bg-slate-900/95 border-slate-800 text-slate-100 shadow-slate-950/50';
      case 'sepia':
        return 'bg-[#ebdcb3]/95 border-[#d4c393] text-[#4a3828] shadow-[#4a3828]/20';
      case 'midnight':
        return 'bg-[#0a0f1d]/95 border-slate-800 text-slate-100 shadow-black/60';
      default:
        return 'bg-white/95 border-gray-200 text-gray-800 shadow-gray-400/20';
    }
  };

  return (
    <div className="fixed bottom-3 left-3 right-3 z-40 sm:hidden">
      <div className={`flex items-center justify-between px-3 py-2 rounded-2xl border backdrop-blur-md shadow-xl ${getBarClasses()}`}>
        {/* Prev Chapter */}
        <button
          onClick={onPrevChapter}
          disabled={!hasPrev}
          className={`flex items-center gap-1 p-2 rounded-xl text-xs font-semibold ${
            hasPrev ? 'hover:bg-black/5 dark:hover:bg-white/10 active:scale-95' : 'opacity-30'
          }`}
          title="Chương trước"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Trước</span>
        </button>

        {/* TOC Button */}
        <button
          onClick={onOpenTOC}
          className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-[11px] font-semibold hover:bg-black/5 dark:hover:bg-white/10"
        >
          <BookOpen className="w-4 h-4 text-amber-500" />
          <span>Mục lục</span>
        </button>

        {/* Chapter Badge */}
        <span className="text-xs font-bold px-2 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
          Ch. {chapterNumber}
        </span>

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-[11px] font-semibold hover:bg-black/5 dark:hover:bg-white/10"
        >
          <Settings className="w-4 h-4 text-amber-500" />
          <span>Cài đặt</span>
        </button>

        {/* Next Chapter */}
        <button
          onClick={onNextChapter}
          disabled={!hasNext}
          className={`flex items-center gap-1 p-2 rounded-xl text-xs font-semibold ${
            hasNext ? 'text-amber-600 dark:text-amber-400 font-bold active:scale-95' : 'opacity-30'
          }`}
          title="Chương sau"
        >
          <span>Sau</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
