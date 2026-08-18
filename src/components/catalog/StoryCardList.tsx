import React from 'react';
import { Star, Eye, Bookmark, BookOpen, Layers, Clock, ArrowRight } from 'lucide-react';
import { Story } from '../../types/story';
import { formatNumber, getTotalChapters } from '../../utils/format';

interface StoryCardListProps {
  story: Story;
  onSelectStory: (storyId: string) => void;
  isBookmarked: boolean;
  onToggleBookmark: (storyId: string, e: React.MouseEvent) => void;
}

export const StoryCardList: React.FC<StoryCardListProps> = ({
  story,
  onSelectStory,
  isBookmarked,
  onToggleBookmark,
}) => {
  const totalChapters = getTotalChapters(story);
  const latestVolume = story.volumes[story.volumes.length - 1];
  const latestChapter = latestVolume ? latestVolume.chapters[latestVolume.chapters.length - 1] : null;

  return (
    <div 
      onClick={() => onSelectStory(story.id)}
      className="group bg-white dark:bg-slate-800/90 rounded-2xl p-4 border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-amber-500/30 transition-all duration-300 cursor-pointer flex flex-col sm:flex-row gap-4"
    >
      {/* Cover Image Thumbnail */}
      <div className="relative w-full sm:w-36 md:w-44 h-48 sm:h-auto aspect-[3/4] sm:aspect-auto flex-shrink-0 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-700">
        <img
          src={story.coverImage}
          alt={story.title}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        {/* Hot badge */}
        {story.hot && (
          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white shadow-sm">
            HOT
          </span>
        )}
      </div>

      {/* Main Info */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          {/* Header row: Status, Genres & Bookmark */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold text-white ${
                story.status === 'Hoàn thành' ? 'bg-emerald-600' : 'bg-amber-600'
              }`}>
                {story.status}
              </span>
              {story.genres.map((genre) => (
                <span
                  key={genre}
                  className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40"
                >
                  {genre}
                </span>
              ))}
            </div>

            <button
              onClick={(e) => onToggleBookmark(story.id, e)}
              className={`p-2 rounded-full transition-colors ${
                isBookmarked
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-300 hover:text-amber-600'
              }`}
              title={isBookmarked ? 'Bỏ lưu truyện' : 'Lưu vào tủ sách'}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* Title */}
          <h3 className="font-bold text-lg text-gray-900 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors mb-1">
            {story.title}
          </h3>

          {/* Author & Stats Row */}
          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-slate-400 mb-3 flex-wrap">
            <span>
              Tác giả: <strong className="text-gray-700 dark:text-slate-200 font-semibold">{story.author}</strong>
            </span>
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <strong className="text-amber-600 dark:text-amber-400">{story.rating.toFixed(1)}</strong>
              <span>({story.ratingCount.toLocaleString()})</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              <span>{formatNumber(story.views)} lượt xem</span>
            </div>
            <div className="flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" />
              <span>{story.volumes.length} quyển</span>
            </div>
            <div className="flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" />
              <span>{totalChapters} chương</span>
            </div>
          </div>

          {/* Story Description */}
          <p className="text-sm text-gray-600 dark:text-slate-300 line-clamp-2 leading-relaxed mb-4">
            {story.description}
          </p>
        </div>

        {/* Bottom section: Latest Chapter & Read Action */}
        <div className="pt-3 border-t border-gray-100 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          {latestChapter ? (
            <div className="flex items-center gap-2 text-gray-500 dark:text-slate-400 truncate">
              <Clock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
              <span className="truncate">
                Chương mới nhất: <span className="font-medium text-gray-800 dark:text-slate-200">{latestChapter.title}</span> ({latestVolume?.title})
              </span>
            </div>
          ) : <div />}

          <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold group-hover:translate-x-1 transition-transform flex-shrink-0">
            <span>Đọc truyện</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
};
