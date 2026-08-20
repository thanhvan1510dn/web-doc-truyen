import React, { useState, useMemo } from 'react';
import { Story } from '../types/story';
import { Search, BookOpen, ChevronRight, X } from 'lucide-react';

interface HomeViewProps {
  stories: Story[];
  onSelectStory: (storyId: string) => void;
  onReadDirect: (storyId: string, chapterId: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  stories,
  onSelectStory,
  onReadDirect,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredStories = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return stories;
    return stories.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.author.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q)
    );
  }, [stories, searchQuery]);

  return (
    <div className="max-w-5xl lg:max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Minimalist Search Box */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm truyện hoặc tác giả..."
            className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Story Count */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-slate-400 px-1">
          <span>Danh sách truyện ({filteredStories.length})</span>
          {searchQuery && <span>Kết quả cho "{searchQuery}"</span>}
        </div>

        {/* Simple Vertical List of Stories */}
        {stories.length === 0 ? (
          <div className="py-20 text-center text-gray-400 dark:text-slate-500 bg-white dark:bg-slate-800/40 rounded-2xl border border-gray-100 dark:border-slate-800 p-8 space-y-2">
            <BookOpen className="w-12 h-12 mx-auto text-gray-300 dark:text-slate-600 opacity-50 mb-2" />
            <h3 className="font-bold text-base text-gray-700 dark:text-slate-300">
              Hệ thống trống (Fresh System)
            </h3>
            <p className="text-xs text-gray-400 dark:text-slate-500 max-w-md mx-auto leading-relaxed">
              Toàn bộ dữ liệu demo đã được xóa sạch. Hệ thống sẵn sàng để bạn thêm truyện mới.
            </p>
          </div>
        ) : filteredStories.length === 0 ? (
          <div className="py-16 text-center text-gray-400 dark:text-slate-500 bg-white dark:bg-slate-800/40 rounded-2xl border border-gray-100 dark:border-slate-800 p-6">
            <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Không tìm thấy truyện nào khớp với "{searchQuery}"</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-slate-800 bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
            {filteredStories.map((story) => {
              const firstChapter = story.volumes.flatMap((v) => v.chapters).find((c) => c.isActive !== false) || story.volumes[0]?.chapters[0];

              return (
                <div
                  key={story.id}
                  onClick={() => onSelectStory(story.id)}
                  className="p-4 sm:p-5 hover:bg-zinc-100/70 dark:hover:bg-slate-700/40 transition-colors cursor-pointer flex gap-4 items-start group"
                >
                  {/* Cover Thumbnail */}
                  <img
                    src={story.coverImage}
                    alt={story.title}
                    className="w-16 sm:w-20 aspect-[3/4] object-cover rounded-lg shadow-sm flex-shrink-0 bg-gray-100 dark:bg-slate-700"
                    loading="lazy"
                  />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-base sm:text-lg text-gray-900 dark:text-slate-100 group-hover:opacity-75 transition-opacity">
                        {story.title}
                      </h3>
                    </div>

                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                      Tác giả: <span className="text-gray-700 dark:text-slate-300 font-medium">{story.author}</span>
                    </p>

                    <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-300 line-clamp-2 leading-relaxed mt-2">
                      {story.description}
                    </p>

                    {/* Actions */}
                    <div className="flex items-center gap-3 mt-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectStory(story.id);
                        }}
                        className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:underline flex items-center gap-1"
                      >
                        <span>Mục lục</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>

                      {firstChapter && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onReadDirect(story.id, firstChapter.id);
                          }}
                          className="text-xs px-2.5 py-1 rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold hover:bg-black dark:hover:bg-white transition-colors shadow-xs"
                        >
                          Đọc từ đầu
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
    </div>
  );
};
