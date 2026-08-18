import React from 'react';
import { Star, Eye, Bookmark, BookOpen } from 'lucide-react';
import { Story } from '../../types/story';
import { formatNumber, getTotalChapters } from '../../utils/format';

interface StoryCardGridProps {
  story: Story;
  onSelectStory: (storyId: string) => void;
  isBookmarked: boolean;
  onToggleBookmark: (storyId: string, e: React.MouseEvent) => void;
}

export const StoryCardGrid: React.FC<StoryCardGridProps> = ({
  story,
  onSelectStory,
  isBookmarked,
  onToggleBookmark,
}) => {
  const totalChapters = getTotalChapters(story);

  return (
    <div 
      onClick={() => onSelectStory(story.id)}
      className="group relative bg-white dark:bg-slate-800/90 rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col"
    >
      {/* Cover Image Container */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-100 dark:bg-slate-700">
        <img
          src={story.coverImage}
          alt={story.title}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
          <div className="flex gap-1.5 flex-wrap">
            {story.hot && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500 text-white shadow-sm">
                HOT
              </span>
            )}
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold text-white shadow-sm ${
              story.status === 'Hoàn thành' ? 'bg-emerald-600' : 'bg-amber-600'
            }`}>
              {story.status}
            </span>
          </div>

          <button
            onClick={(e) => onToggleBookmark(story.id, e)}
            className={`pointer-events-auto p-2 rounded-full backdrop-blur-md transition-colors ${
              isBookmarked
                ? 'bg-amber-500 text-white shadow-md'
                : 'bg-black/40 text-white/80 hover:bg-black/60 hover:text-white'
            }`}
            title={isBookmarked ? 'Bỏ lưu truyện' : 'Lưu vào tủ sách'}
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Bottom Overlay Info inside Cover */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-xs text-white/90">
          <div className="flex items-center gap-1 bg-black/50 backdrop-blur-md px-2 py-0.5 rounded-full">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span className="font-bold text-amber-300">{story.rating.toFixed(1)}</span>
          </div>
          <div className="flex items-center gap-1 bg-black/50 backdrop-blur-md px-2 py-0.5 rounded-full">
            <BookOpen className="w-3.5 h-3.5" />
            <span>{totalChapters} chương</span>
          </div>
        </div>
      </div>

      {/* Card Content Details */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Genre tags */}
          <div className="flex flex-wrap gap-1.5 mb-1.5">
            {story.genres.slice(0, 2).map((genre) => (
              <span
                key={genre}
                className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40"
              >
                {genre}
              </span>
            ))}
          </div>

          {/* Title */}
          <h3 className="font-bold text-base text-gray-900 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-1 mb-1">
            {story.title}
          </h3>

          {/* Author */}
          <p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-1 mb-2">
            Tác giả: <span className="font-medium text-gray-700 dark:text-slate-300">{story.author}</span>
          </p>
        </div>

        {/* Card Footer: Views */}
        <div className="pt-2 border-t border-gray-100 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-gray-500 dark:text-slate-400">
          <div className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            <span>{formatNumber(story.views)} lượt xem</span>
          </div>
          <span>{story.volumes.length} quyển</span>
        </div>
      </div>
    </div>
  );
};
