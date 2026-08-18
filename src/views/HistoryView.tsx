import React from 'react';
import { History, Play, Trash2 } from 'lucide-react';
import { Story, ReadingProgress } from '../types/story';

interface HistoryViewProps {
  stories: Story[];
  readingHistory: Record<string, ReadingProgress>;
  onSelectStory: (storyId: string) => void;
  onReadChapter: (storyId: string, chapterId: string) => void;
  onClearHistory: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  stories,
  readingHistory,
  onSelectStory,
  onReadChapter,
  onClearHistory,
}) => {
  const historyEntries = Object.values(readingHistory).sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-slate-500/10 text-slate-600 dark:text-slate-300">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
              Lịch Sử Đọc Truyện
            </h1>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
              Ghi nhớ chính xác vị trí và chương truyện bạn đang đọc dở
            </p>
          </div>
        </div>

        {historyEntries.length > 0 && (
          <button
            onClick={onClearHistory}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Xóa lịch sử</span>
          </button>
        )}
      </div>

      {/* History item cards */}
      {historyEntries.length === 0 ? (
        <div className="py-24 text-center bg-white dark:bg-slate-800/60 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm">
          <History className="w-12 h-12 mx-auto text-gray-300 dark:text-slate-600 mb-3" />
          <h3 className="text-lg font-bold text-gray-700 dark:text-slate-300">
            Chưa có lịch sử đọc truyện
          </h3>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
            Khi bạn bắt đầu đọc bất kỳ chương truyện nào, hệ thống sẽ tự động lưu lại tiến trình đọc tại đây để bạn có thể tiếp tục bất cứ lúc nào.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {historyEntries.map((item) => {
            const story = stories.find((s) => s.id === item.storyId);
            if (!story) return null;

            const timeStr = new Date(item.updatedAt).toLocaleDateString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
              day: '2-digit',
              month: '2-digit',
            });

            return (
              <div
                key={item.storyId}
                className="bg-white dark:bg-slate-800/90 rounded-2xl p-4 border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all flex gap-4 items-center group"
              >
                <img
                  src={story.coverImage}
                  alt={story.title}
                  onClick={() => onSelectStory(story.id)}
                  className="w-20 h-28 object-cover rounded-xl shadow-md flex-shrink-0 cursor-pointer group-hover:scale-102 transition-transform"
                />

                <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-1">
                  <div>
                    <h3 
                      onClick={() => onSelectStory(story.id)}
                      className="font-bold text-base text-gray-900 dark:text-slate-100 hover:text-amber-600 truncate cursor-pointer"
                    >
                      {story.title}
                    </h3>
                    <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold truncate mt-1">
                      Đang đọc: {item.chapterTitle}
                    </p>
                    <p className="text-[11px] text-gray-400 dark:text-slate-400 truncate mt-0.5">
                      {item.volumeTitle}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-slate-700/60 text-[11px] text-gray-400">
                    <span>{timeStr}</span>
                    <button
                      onClick={() => onReadChapter(story.id, item.chapterId)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm transition-all"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Đọc tiếp</span>
                    </button>
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
