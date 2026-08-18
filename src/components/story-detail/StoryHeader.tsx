import React from "react";
import { Play, Clock, ArrowLeft, ExternalLink, AlertTriangle } from "lucide-react";
import { Story } from "../../types/story";
import { getTotalChapters } from "../../utils/format";

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
    <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-5 sm:p-7 border border-gray-200/80 dark:border-slate-800 shadow-sm transition-colors space-y-5">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-semibold hover:underline"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Về danh sách truyện</span>
      </button>

      <div className="flex flex-col sm:flex-row gap-5 sm:gap-7 items-start">
        {/* Cover */}
        <div className="flex-shrink-0 space-y-1.5 mx-auto sm:mx-0">
          <img
            src={story.coverImage}
            alt={story.title}
            className="w-32 sm:w-36 aspect-[3/4] object-cover rounded-xl shadow-md bg-gray-100 dark:bg-slate-700"
          />
          {story.coverCredit && (
            <p className="text-[11px] text-gray-500 dark:text-slate-400 text-center max-w-[144px]">
              Bìa: {story.coverCredit}
            </p>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 space-y-2.5">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-slate-100">
            {story.title}
          </h1>

          {story.hanVietTitle && (
            <p className="text-xs text-gray-600 dark:text-slate-400">
              <strong>Tên Hán Việt:</strong> <span className="italic">{story.hanVietTitle}</span>
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-gray-600 dark:text-slate-300">
            <p>
              <strong>Tác giả:</strong> <span className="text-gray-900 dark:text-slate-100 font-medium">{story.author}</span>
            </p>
            {story.originalStatus && (
              <p>
                <strong>Tình trạng bản gốc:</strong> {story.originalStatus}
              </p>
            )}
            {story.editStatus && (
              <p>
                <strong>Tình trạng bản edit:</strong> {story.editStatus}
              </p>
            )}
            <p>
              <strong>Quy mô:</strong> {story.volumes.length} mục lục • {totalChapters} chương
            </p>
            {story.editorBeta && (
              <p className="col-span-full">
                <strong>Editor + Beta:</strong> {story.editorBeta}
              </p>
            )}
            {story.convertSource && (
              <p className="col-span-full">
                <strong>Nguồn convert:</strong> {story.convertSource}{" "}
                {story.convertLink && (
                  <a
                    href={story.convertLink}
                    target="_blank"
                    rel="noreferrer"
                    className="text-amber-600 dark:text-amber-400 underline inline-flex items-center gap-0.5 ml-1"
                  >
                    <span>Link bản convert</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </p>
            )}
          </div>

          {/* Genres / Tags */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {story.genres.map((g) => (
              <span
                key={g}
                className="px-2 py-0.5 rounded-md bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[11px] font-medium"
              >
                {g}
              </span>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            {firstChapter && (
              <button
                onClick={() => onStartReading(firstChapter.id)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-98 text-white font-bold text-xs shadow-sm transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Đọc từ đầu</span>
              </button>
            )}

            {latestChapter && (
              <button
                onClick={() => onStartReading(latestChapter.id)}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 font-medium text-xs transition-colors"
              >
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>Mục lục mới nhất</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Văn án (Description) */}
      {story.description && (
        <div className="pt-4 border-t border-gray-100 dark:border-slate-700/60 space-y-2">
          <h3 className="font-bold text-xs uppercase tracking-wider text-gray-500 dark:text-slate-400">
            Văn án tác phẩm
          </h3>
          <div className="text-xs sm:text-sm font-serif leading-relaxed text-gray-700 dark:text-slate-300 whitespace-pre-wrap">
            {story.description}
          </div>
        </div>
      )}

      {/* Warning */}
      {story.warning && (
        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-900 dark:text-amber-200 space-y-1">
          <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px] text-amber-800 dark:text-amber-300">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Warning (Lưu ý độc giả):</span>
          </div>
          <p className="leading-relaxed">{story.warning}</p>
        </div>
      )}
    </div>
  );
};
