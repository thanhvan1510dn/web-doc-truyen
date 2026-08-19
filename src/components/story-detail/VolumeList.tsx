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

    const sortedChapters = [...filteredChapters].sort((a, b) =>
      sortAsc ? a.number - b.number : b.number - a.number
    );

    return {
      ...volume,
      filteredChapters: sortedChapters,
    };
  });

  const totalFilteredCount = processedVolumes.reduce(
    (acc, v) => acc + v.filteredChapters.length,
    0
  );

  return (
    <div className="bg-white dark:bg-slate-800/90 rounded-3xl p-6 sm:p-8 border border-gray-200/80 dark:border-slate-800 shadow-sm transition-colors space-y-5">
      {/* Header with Title, Search & Order */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-amber-500" />
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
              className="w-full pl-8 pr-7 py-2 text-xs sm:text-sm rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/60 text-gray-900 dark:text-slate-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
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

          {/* Sort order button */}
          <button
            onClick={() => setSortAsc(!sortAsc)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 text-xs sm:text-sm text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            title="Đổi thứ tự sắp xếp"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">{sortAsc ? 'Cũ trước' : 'Mới trước'}</span>
          </button>
        </div>
      </div>

      {/* Grouped by Volumes */}
      <div className="space-y-3 pt-1">
        {totalFilteredCount === 0 ? (
          <div className="py-8 text-center text-xs sm:text-sm text-gray-400 dark:text-slate-500">
            Không tìm thấy chương nào phù hợp với từ khóa
          </div>
        ) : (
          processedVolumes.map((volume) => {
            if (searchChapterQuery && volume.filteredChapters.length === 0) {
              return null;
            }

            const isExpanded = !!searchChapterQuery || !!expandedVolumeIds[volume.id];

            return (
              <div 
                key={volume.id}
                className="rounded-2xl border border-gray-200/80 dark:border-slate-700/70 overflow-hidden bg-white dark:bg-slate-800/40"
              >
                {/* Volume Header Banner */}
                <div
                  onClick={() => toggleVolume(volume.id)}
                  className="flex items-center justify-between p-4 bg-amber-500/10 dark:bg-amber-500/15 cursor-pointer hover:bg-amber-500/20 transition-colors select-none gap-3"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="font-bold text-sm sm:text-base text-amber-800 dark:text-amber-300 leading-snug">
                      {volume.title || `Mục lục ${volume.number}`}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="w-6 h-6 rounded-md bg-amber-500/20 text-amber-800 dark:text-amber-300 flex items-center justify-center font-bold text-xs">
                      {isExpanded ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                </div>

                {/* Chapter List */}
                {isExpanded && (
                  <div className="divide-y divide-gray-100 dark:divide-slate-800/80 bg-gray-50/40 dark:bg-slate-900/20">
                    {volume.filteredChapters.map((chapter) => (
                      <div
                        key={chapter.id}
                        onClick={() => onSelectChapter(chapter.id)}
                        className="flex items-center justify-between px-5 py-3 hover:bg-amber-50/60 dark:hover:bg-slate-700/60 transition-colors cursor-pointer group text-xs sm:text-sm text-gray-800 dark:text-slate-200"
                      >
                        <span className="group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors font-medium">
                          {chapter.title}
                        </span>
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
