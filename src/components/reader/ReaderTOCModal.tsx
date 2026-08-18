import React, { useState } from 'react';
import { X, Search, BookOpen, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';
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
  const [collapsedVolumes, setCollapsedVolumes] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  const toggleVolume = (volumeId: string) => {
    setCollapsedVolumes((prev) => ({
      ...prev,
      [volumeId]: !prev[volumeId],
    }));
  };

  const normalizedQuery = searchQuery.toLowerCase().trim();

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl border-l border-gray-200 dark:border-slate-800 flex flex-col z-10 animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-500" />
            <div>
              <h3 className="font-bold text-base text-gray-900 dark:text-slate-100">
                Mục Lục Chương
              </h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 truncate max-w-[220px]">
                {story.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chapter Search Input */}
        <div className="p-3 border-b border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm chương (ví dụ: Chương 1, Dã Lang...)"
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>
        </div>

        {/* Volume & Chapter List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
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

            const isCollapsed = !normalizedQuery && !!collapsedVolumes[volume.id];

            return (
              <div 
                key={volume.id}
                className="rounded-2xl border border-gray-200/80 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-800/40"
              >
                {/* Volume Header Banner */}
                <div
                  onClick={() => toggleVolume(volume.id)}
                  className="flex items-center justify-between p-3 bg-amber-500/10 dark:bg-amber-500/15 cursor-pointer hover:bg-amber-500/20 transition-colors select-none"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-500 text-white">
                      Q.{volume.number}
                    </span>
                    <span className="font-bold text-xs sm:text-sm text-gray-900 dark:text-slate-100">
                      {volume.title}
                    </span>
                  </div>
                  <button className="text-gray-400">
                    {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  </button>
                </div>

                {/* Chapter items */}
                {!isCollapsed && (
                  <div className="divide-y divide-gray-100 dark:divide-slate-800">
                    {filteredChapters.map((chapter) => {
                      const isCurrent = currentChapterId === chapter.id;

                      return (
                        <div
                          key={chapter.id}
                          onClick={() => {
                            onSelectChapter(chapter.id);
                            onClose();
                          }}
                          className={`flex items-center justify-between px-3.5 py-3 transition-colors cursor-pointer text-xs ${
                            isCurrent
                              ? 'bg-amber-500/20 font-bold text-amber-900 dark:text-amber-300'
                              : 'hover:bg-gray-50 dark:hover:bg-slate-800/80 text-gray-700 dark:text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate pr-2">
                            {isCurrent ? (
                              <CheckCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                            ) : (
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-slate-600 flex-shrink-0" />
                            )}
                            <span className="truncate">{chapter.title}</span>
                          </div>

                          <span className="text-[10px] text-gray-400 flex-shrink-0">
                            {chapter.wordCount.toLocaleString()} chữ
                          </span>
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
