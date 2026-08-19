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
  readingProgressPercent: number;
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
  readingProgressPercent,
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
    <footer className={`py-8 sm:py-10 border-t transition-colors ${getFooterThemeClasses()}`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-5 text-center">
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 text-xs font-semibold opacity-70">
          <span>Tiến độ đọc:</span>
          <span className="text-amber-600 dark:text-amber-400 font-bold">{readingProgressPercent}%</span>
        </div>

        {/* Chapter Switcher Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={onPrevChapter}
            disabled={!hasPrev}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl border font-bold text-sm transition-all ${
              hasPrev
                ? 'border-black/10 dark:border-white/10 bg-white/60 dark:bg-slate-800/60 hover:bg-amber-500 hover:text-white hover:border-amber-500 shadow-sm'
                : 'opacity-40 border-black/5 dark:border-white/5 cursor-not-allowed'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Chương Trước</span>
            <kbd className="hidden sm:inline text-[10px] opacity-60">←</kbd>
          </button>

          {/* Quick Chapter Select Dropdown */}
          <div className="relative">
            <select
              value={chapter.id}
              onChange={(e) => onSelectChapter(e.target.value)}
              aria-label="Chọn chương nhanh"
              className="appearance-none pl-4 pr-10 py-3 rounded-2xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-slate-800/60 font-semibold text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 text-left max-w-[200px] sm:max-w-[300px] truncate cursor-pointer shadow-sm"
            >
              {allChapters.map((c) => (
                <option key={c.id} value={c.id}>
                  {getDisplayChapterTitle(c.number, c.title)}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
              <Layers className="w-4 h-4" />
            </div>
          </div>

          <button
            onClick={onNextChapter}
            disabled={!hasNext}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl border font-bold text-sm transition-all ${
              hasNext
                ? 'border-amber-500 bg-amber-500 text-white hover:bg-amber-600 shadow-md shadow-amber-500/20'
                : 'opacity-40 border-black/5 dark:border-white/5 cursor-not-allowed'
            }`}
          >
            <span>Chương Sau</span>
            <ChevronRight className="w-5 h-5" />
            <kbd className="hidden sm:inline text-[10px] opacity-60">→</kbd>
          </button>
        </div>
      </div>
    </footer>
  );
};
