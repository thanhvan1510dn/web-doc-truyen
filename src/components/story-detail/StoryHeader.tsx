import React from 'react';
import { Play, Clock, ArrowLeft } from 'lucide-react';
import { Story } from '../../types/story';
import { getTotalChapters } from '../../utils/format';

interface StoryHeaderProps {
  story: Story;
  onBack: () => void;
  onStartReading: (chapterId: string) => void;
}

export const StoryHeader: React.FC<StoryHeaderProps> = ({
  story,
  onBack,
  onStartReading,
}) => {
  const totalChapters = getTotalChapters(story);
  const firstChapter = story.volumes[0]?.chapters[0];
  const latestVolume = story.volumes[story.volumes.length - 1];
  const latestChapter = latestVolume ? latestVolume.chapters[latestVolume.chapters.length - 1] : null;

  return (
    <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-5 sm:p-6 border border-gray-200/80 dark:border-slate-800 shadow-sm transition-colors space-y-4">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-semibold hover:underline"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Về danh sách truyện</span>
      </button>

      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start">
        {/* Cover */}
        <img
          src={story.coverImage}
          alt={story.title}
          className="w-24 sm:w-28 aspect-[3/4] object-cover rounded-xl shadow-md flex-shrink-0 bg-gray-100 dark:bg-slate-700"
        />

        {/* Info */}
        <div className="flex-1 min-w-0 space-y-2">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-slate-100">
            {story.title}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400">
            Tác giả: <strong className="text-gray-800 dark:text-slate-200">{story.author}</strong> • {story.volumes.length} quyển • {totalChapters} chương
          </p>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-300 leading-relaxed pt-1">
            {story.description}
          </p>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            {firstChapter && (
              <button
                onClick={() => onStartReading(firstChapter.id)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Đọc từ đầu</span>
              </button>
            )}

            {latestChapter && (
              <button
                onClick={() => onStartReading(latestChapter.id)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 font-medium text-xs transition-colors"
              >
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>Chương mới nhất ({latestChapter.title})</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
