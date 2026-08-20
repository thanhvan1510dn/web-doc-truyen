import React from 'react';
import { ChevronLeft, ChevronRight, Layers } from 'lucide-react';
import { Story, Chapter, ReaderSettings } from '../../types/story';

interface ReaderBottomBarProps {
  story: Story;
  chapter: Chapter;
  hasPrev: boolean;
  hasNext: boolean;
  onPrevChapter: () => void;
  onNextChapter: () => void;
  onSelectChapter: (chapterId: string) => void;
  settings: ReaderSettings;
}

export const MobileReaderBar: React.FC<ReaderBottomBarProps> = ({
  story,
  chapter,
  hasPrev,
  hasNext,
  onPrevChapter,
  onNextChapter,
  onSelectChapter,
  settings,
}) => {
  // Collect all chapters for quick jump dropdown
  const allChapters = story.volumes.flatMap((v) =>
    v.chapters.map((c) => ({
      id: c.id,
      number: c.number,
      title: c.title,
    }))
  );

  const getBarClasses = () => {
    switch (settings.theme) {
      case 'dark':
        return 'bg-[#0f172a]/95 border-slate-800 text-[#e2e8f0]';
      case 'sepia':
        return 'bg-[#f4ecdc]/95 border-[#e5dcbe] text-[#3d2f21]';
      case 'midnight':
        return 'bg-[#060911]/95 border-slate-900 text-[#cbd5e1]';
      default:
        return 'bg-[#fdfbf7]/95 border-gray-200 text-[#1e293b]';
    }
  };

  const getDisplayChapterTitle = (num: number, rawTitle?: string) => {
    if (!rawTitle || !rawTitle.trim()) return `Chương ${num}`;
    const t = rawTitle.trim();
    if (/^(?:chương|chuong|chap|c)\s*\d+/i.test(t)) {
      return t;
    }
    return `Chương ${num}: ${t}`;
  };

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-30 border-t backdrop-blur-md shadow-lg transition-colors ${getBarClasses()}`}>
      <div className="max-w-4xl mx-auto px-2.5 sm:px-6 h-14 flex items-center justify-between gap-1.5 sm:gap-2 flex-nowrap w-full">
        {/* Prev Chapter Button */}
        <button
          onClick={onPrevChapter}
          disabled={!hasPrev}
          className={`flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex-shrink-0 whitespace-nowrap transition-all ${
            hasPrev
              ? 'hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 text-amber-600 dark:text-amber-400'
              : 'opacity-30 cursor-not-allowed text-gray-400'
          }`}
          title="Chương trước (Phím ←)"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="hidden sm:inline">Chương trước</span>
          <span className="sm:hidden">Trước</span>
        </button>

        {/* Quick Chapter Selector Dropdown (Middle, Flexible Width) */}
        <div className="relative flex-1 min-w-0 max-w-[220px] sm:max-w-sm mx-1">
          <select
            value={chapter.id}
            onChange={(e) => onSelectChapter(e.target.value)}
            aria-label="Chọn chương nhanh"
            className="appearance-none w-full pl-3 pr-8 py-2 rounded-xl border border-black/10 dark:border-white/15 bg-black/5 dark:bg-white/10 font-bold text-xs sm:text-sm text-center truncate cursor-pointer focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-sm"
          >
            {allChapters.map((c) => (
              <option key={c.id} value={c.id} className="bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100">
                {getDisplayChapterTitle(c.number, c.title)}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
            <Layers className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Next Chapter Button */}
        <button
          onClick={onNextChapter}
          disabled={!hasNext}
          className={`flex items-center justify-center gap-1 sm:gap-1.5 px-3 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold flex-shrink-0 whitespace-nowrap shadow-sm transition-all ${
            hasNext
              ? 'bg-amber-500 hover:bg-amber-600 active:scale-95 text-white shadow-amber-500/20'
              : 'opacity-30 cursor-not-allowed bg-gray-200 dark:bg-slate-800 text-gray-400'
          }`}
          title="Chương sau (Phím →)"
        >
          <span className="hidden sm:inline">Chương sau</span>
          <span className="sm:hidden">Sau</span>
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
    </div>
  );
};
