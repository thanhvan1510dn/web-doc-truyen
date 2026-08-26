import React, { useState } from 'react';
import { Volume } from '../../types/story';
import { Search, Plus, Minus, BookOpen, ArrowUpDown, X } from 'lucide-react';

interface VolumeListProps {
  volumes: Volume[];
  onSelectChapter: (chapterId: string) => void;
}

export const VolumeList: React.FC<VolumeListProps> = ({
  volumes,
  onSelectChapter,
}) => {
  const [searchChapterQuery, setSearchChapterQuery] = useState('');
  const [sortAsc, setSortAsc] = useState(true);
  const [expandedVolumeIds, setExpandedVolumeIds] = useState<Record<string, boolean>>({});

  const toggleVolume = (volumeId: string) => {
    setExpandedVolumeIds((prev) => ({
      ...prev,
      [volumeId]: !prev[volumeId],
    }));
  };

  const normalizedQuery = searchChapterQuery.toLowerCase().trim();

  // Filter and sort chapters per volume
  const processedVolumes = volumes.map((volume) => {
    let filteredChapters = volume.chapters.filter((c) => c.isActive !== false);
    if (normalizedQuery !== '') {
      filteredChapters = filteredChapters.filter(
        (c) =>
          c.title.toLowerCase().includes(normalizedQuery) ||
          c.number.toString().includes(normalizedQuery)
      );
    }

    const sortedChapters = [...filteredChapters].sort((a, b) => {
      if (sortAsc) {
        return a.number !== b.number
          ? a.number - b.number
          : a.title.localeCompare(b.title, 'vi', { numeric: true, sensitivity: 'base' });
      } else {
        return b.number !== a.number
          ? b.number - a.number
          : b.title.localeCompare(a.title, 'vi', { numeric: true, sensitivity: 'base' });
      }
    });

    return {
      ...volume,
      filteredChapters: sortedChapters,
    };
  });

  const orderedVolumes = sortAsc ? processedVolumes : [...processedVolumes].reverse();

  const totalFilteredCount = processedVolumes.reduce(
    (acc, v) => acc + v.filteredChapters.length,
    0
  );

  return (
    <div className="bg-white dark:bg-slate-800/90 rounded-3xl p-6 sm:p-8 border border-gray-200/80 dark:border-slate-800 shadow-sm transition-colors space-y-5">
      {/* Header with Title, Search & Order */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 opacity-80" />
          <h2 className="font-bold text-base sm:text-lg text-gray-900 dark:text-slate-100">
            Mục lục
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Chapter Search Box */}
          <div className="relative flex-1 sm:w-60">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchChapterQuery}
              onChange={(e) => setSearchChapterQuery(e.target.value)}
              placeholder="Tìm tên hoặc số chương..."
              className="w-full pl-8 pr-7 py-2 text-xs sm:text-sm rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/60 text-gray-900 dark:text-slate-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
            {searchChapterQuery && (
              <button
                onClick={() => setSearchChapterQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort order button (A -> Z / Z -> A) */}
          <button
            onClick={() => setSortAsc(!sortAsc)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 text-xs sm:text-sm font-semibold text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors flex-shrink-0"
            title={`Sắp xếp: ${sortAsc ? 'A → Z (Tăng dần)' : 'Z → A (Giảm dần)'}`}
          >
            <ArrowUpDown className="w-3.5 h-3.5 opacity-70" />
            <span>{sortAsc ? 'A → Z' : 'Z → A'}</span>
          </button>
        </div>
      </div>

      {/* Grouped by Volumes - Flat Minimalist List without Card Backgrounds or Heavy Borders */}
      <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80 pt-1">
        {totalFilteredCount === 0 ? (
          <div className="py-8 text-center text-xs sm:text-sm text-zinc-400 dark:text-zinc-500">
            Không tìm thấy chương nào phù hợp với từ khóa
          </div>
        ) : (
          orderedVolumes.map((volume) => {
            if (searchChapterQuery && volume.filteredChapters.length === 0) {
              return null;
            }

            const isExpanded = !!searchChapterQuery || !!expandedVolumeIds[volume.id];

            return (
              <div key={volume.id} className="py-1">
                {/* Compact Volume Header (Borderless & Flat) */}
                <div
                  onClick={() => toggleVolume(volume.id)}
                  className="flex items-center justify-between py-2.5 px-2 rounded-lg cursor-pointer hover:bg-zinc-100/70 dark:hover:bg-zinc-800/50 transition-colors select-none group"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="font-semibold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-black dark:group-hover:text-white transition-colors truncate">
                      {volume.title || `Mục lục ${volume.number}`}
                    </span>
                    <span className="text-[11px] text-zinc-400 font-normal flex-shrink-0">
                      ({volume.filteredChapters.length})
                    </span>
                  </div>

                  <div className="flex items-center text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 transition-colors flex-shrink-0 ml-2">
                    {isExpanded ? (
                      <Minus className="w-3.5 h-3.5" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                  </div>
                </div>

                {/* Compact Chapters List */}
                {isExpanded && (
                  <div className="pl-3 sm:pl-4 py-1 space-y-0.5 border-l-2 border-zinc-200/70 dark:border-zinc-800 ml-3 my-1">
                    {volume.filteredChapters.map((chapter) => (
                      <div
                        key={chapter.id}
                        onClick={() => onSelectChapter(chapter.id)}
                        className="flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer group text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1 truncate">
                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700 flex-shrink-0" />
                          <span className="font-normal truncate">
                            {chapter.title}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
