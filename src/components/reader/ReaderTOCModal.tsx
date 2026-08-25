import React, { useState } from 'react';
import { X, Search, BookOpen, Plus, Minus, CheckCircle } from 'lucide-react';
import { Story } from '../../types/story';

interface ReaderTOCModalProps {
  isOpen: boolean;
  onClose: () => void;
  story: Story;
  currentChapterId: string;
  onSelectChapter: (chapterId: string) => void;
}

export const ReaderTOCModal: React.FC<ReaderTOCModalProps> = ({
  isOpen,
  onClose,
  story,
  currentChapterId,
  onSelectChapter,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedVolumes, setExpandedVolumes] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  const toggleVolume = (volumeId: string) => {
    setExpandedVolumes((prev) => ({
      ...prev,
      [volumeId]: !prev[volumeId],
    }));
  };

  const normalizedQuery = searchQuery.toLowerCase().trim();

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-full sm:max-w-xl md:max-w-2xl bg-white dark:bg-slate-900 h-full shadow-2xl border-l border-gray-200 dark:border-slate-800 flex flex-col z-10 animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 opacity-80" />
            <h3 className="font-bold text-base sm:text-lg text-gray-900 dark:text-slate-100">
              Mục Lục
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chapter Search Input */}
        <div className="p-3.5 sm:p-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm mục lục, chương..."
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
          </div>
        </div>

        {/* Volume & Chapter List (Flat Minimalist) */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 divide-y divide-zinc-100 dark:divide-zinc-800/60">
          {story.volumes.map((volume) => {
            const filteredChapters = volume.chapters.filter(
              (c) =>
                normalizedQuery === '' ||
                c.title.toLowerCase().includes(normalizedQuery) ||
                c.number.toString().includes(normalizedQuery)
            );

            if (normalizedQuery !== '' && filteredChapters.length === 0) {
              return null;
            }

            const isExpanded = normalizedQuery !== '' || !!expandedVolumes[volume.id];

            return (
              <div key={volume.id} className="py-1">
                {/* Compact Volume Header Banner */}
                <div
                  onClick={() => toggleVolume(volume.id)}
                  className="flex items-center justify-between py-2 px-2 rounded-lg cursor-pointer hover:bg-zinc-100/70 dark:hover:bg-zinc-800/50 transition-colors select-none group"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="font-semibold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-black dark:group-hover:text-white transition-colors truncate">
                      {volume.title || `Mục lục ${volume.number}`}
                    </span>
                    <span className="text-[11px] text-zinc-400 font-normal flex-shrink-0">
                      ({filteredChapters.length})
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

                {/* Chapter items */}
                {isExpanded && (
                  <div className="pl-3 sm:pl-4 py-1 space-y-0.5 border-l-2 border-zinc-200/70 dark:border-zinc-800 ml-2.5 my-1">
                    {filteredChapters.map((chapter) => {
                      const isCurrent = currentChapterId === chapter.id;

                      return (
                        <div
                          key={chapter.id}
                          onClick={() => {
                            onSelectChapter(chapter.id);
                            onClose();
                          }}
                          className={`flex items-center justify-between px-2.5 py-1.5 rounded-md transition-colors cursor-pointer text-xs ${
                            isCurrent
                              ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-bold shadow-xs'
                              : 'hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 font-normal'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate pr-2">
                            {isCurrent ? (
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600 flex-shrink-0" />
                            ) : (
                              <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600 flex-shrink-0" />
                            )}
                            <span className="truncate">{chapter.title}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
