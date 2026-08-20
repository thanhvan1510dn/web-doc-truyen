import React from 'react';
import { Bookmark, Trash2 } from 'lucide-react';
import { Story } from '../types/story';
import { StoryCardGrid } from '../components/catalog/StoryCardGrid';

interface BookmarksViewProps {
  stories: Story[];
  bookmarks: string[];
  onSelectStory: (storyId: string) => void;
  onToggleBookmark: (storyId: string) => void;
  onClearAllBookmarks: () => void;
}

export const BookmarksView: React.FC<BookmarksViewProps> = ({
  stories,
  bookmarks,
  onSelectStory,
  onToggleBookmark,
  onClearAllBookmarks,
}) => {
  const bookmarkedStories = stories.filter((s) => bookmarks.includes(s.id));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-sm">
            <Bookmark className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
              Tủ Sách Yêu Thích
            </h1>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
              Những bộ truyện bạn đã đánh dấu để theo dõi
            </p>
          </div>
        </div>

        {bookmarkedStories.length > 0 && (
          <button
            onClick={onClearAllBookmarks}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Xóa tất cả</span>
          </button>
        )}
      </div>

      {/* Bookmarked list */}
      {bookmarkedStories.length === 0 ? (
        <div className="py-24 text-center bg-white dark:bg-slate-800/60 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm">
          <Bookmark className="w-12 h-12 mx-auto text-gray-300 dark:text-slate-600 mb-3" />
          <h3 className="text-lg font-bold text-gray-700 dark:text-slate-300">
            Tủ sách của bạn đang trống
          </h3>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-1 mb-6 max-w-sm mx-auto">
            Hãy khám phá các tác phẩm đặc sắc và nhấn vào biểu tượng Bookmark để lưu vào danh sách đọc riêng của bạn.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
          {bookmarkedStories.map((story) => (
            <StoryCardGrid
              key={story.id}
              story={story}
              onSelectStory={onSelectStory}
              isBookmarked={true}
              onToggleBookmark={(id, e) => {
                e.stopPropagation();
                onToggleBookmark(id);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};
