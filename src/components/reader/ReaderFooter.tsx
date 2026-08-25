import React from 'react';
import { ChevronLeft, ChevronRight, Layers } from 'lucide-react';
import { Story, Chapter, ReaderSettings } from '../../types/story';

interface ReaderFooterProps {
  story: Story;
  chapter: Chapter;
  hasPrev: boolean;
  hasNext: boolean;
  onPrevChapter: () => void;
  onNextChapter: () => void;
  onBackToStory: () => void;
  onSelectChapter: (chapterId: string) => void;
  onOpenTOC: () => void;
  settings: ReaderSettings;
}

export const ReaderFooter: React.FC<ReaderFooterProps> = ({
  story,
  chapter,
  hasPrev,
  hasNext,
  onPrevChapter,
  onNextChapter,
  onSelectChapter,
  settings,
}) => {
  // Collect all chapters flat
  const allChapters = story.volumes.flatMap((v) =>
    v.chapters.map((c) => ({
      id: c.id,
      number: c.number,
      title: c.title,
      volumeTitle: v.title,
    }))
  );

  const getFooterThemeClasses = () => {
    switch (settings.theme) {
      case 'dark':
        return 'bg-[#0f172a] border-slate-800 text-[#e2e8f0]';
      case 'sepia':
        return 'bg-[#f4ecdc] border-[#e5dcbe] text-[#3d2f21]';
      case 'midnight':
        return 'bg-[#060911] border-slate-900 text-[#cbd5e1]';
      default:
        return 'bg-[#fdfbf7] border-gray-200 text-[#1e293b]';
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
    <footer className={`py-6 sm:py-8 border-t transition-colors ${getFooterThemeClasses()}`}>
      <div className="max-w-3xl mx-auto px-3 sm:px-6">
        {/* Single Row Chapter Switcher */}
        <div className="flex items-center justify-between gap-2 w-full flex-nowrap">
          <button
            onClick={onPrevChapter}
            disabled={!hasPrev}
            className={`flex items-center justify-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-2 rounded-xl border text-xs sm:text-sm font-semibold flex-shrink-0 whitespace-nowrap transition-all ${
              hasPrev
                ? 'border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 active:scale-95 shadow-sm cursor-pointer'
                : 'border-zinc-200 dark:border-zinc-800/60 bg-zinc-100/60 dark:bg-zinc-800/40 text-zinc-400 dark:text-zinc-600 opacity-40 cursor-not-allowed pointer-events-none'
            }`}
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Chương Trước</span>
            <span className="sm:hidden">Trước</span>
          </button>

          {/* Quick Chapter Select Dropdown (Middle, Flexible Width) */}
          <div className="relative flex-1 min-w-0 max-w-[240px] sm:max-w-sm mx-1">
            <select
              value={chapter.id}
              onChange={(e) => onSelectChapter(e.target.value)}
              aria-label="Chọn chương nhanh"
              className="appearance-none w-full pl-3 pr-8 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-bold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400 text-center truncate cursor-pointer shadow-sm"
            >
              {allChapters.map((c) => (
                <option key={c.id} value={c.id} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
                  {getDisplayChapterTitle(c.number, c.title)}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-zinc-500">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>

          <button
            onClick={onNextChapter}
            disabled={!hasNext}
            className={`flex items-center justify-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-2 rounded-xl border text-xs sm:text-sm font-semibold flex-shrink-0 whitespace-nowrap transition-all ${
              hasNext
                ? 'border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 active:scale-95 shadow-sm cursor-pointer'
                : 'border-zinc-200 dark:border-zinc-800/60 bg-zinc-100/60 dark:bg-zinc-800/40 text-zinc-400 dark:text-zinc-600 opacity-40 cursor-not-allowed pointer-events-none'
            }`}
          >
            <span className="hidden sm:inline">Chương Sau</span>
            <span className="sm:hidden">Sau</span>
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
    </footer>
  );
};
