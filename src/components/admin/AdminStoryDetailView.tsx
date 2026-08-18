import React, { useState, useEffect } from "react";
import { 
  ArrowLeft, Upload, Edit, Trash2, Layers, Eye, X 
} from "lucide-react";
import { Chapter, Story } from "../../types/story";
import { storyApi } from "../../api";
import { formatNumber } from "../../utils/format";
import { useToast } from "../common/Toast";

interface AdminStoryDetailViewProps {
  storyId: string;
  onBack: () => void;
  onUploadChapter: (storyId: string) => void;
  onReadChapterOnWeb: (storyId: string, chapterId: string) => void;
}

export const AdminStoryDetailView: React.FC<AdminStoryDetailViewProps> = ({
  storyId,
  onBack,
  onUploadChapter,
  onReadChapterOnWeb,
}) => {
  const toast = useToast();
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit Chapter Modal state
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editNumber, setEditNumber] = useState(1);
  const [editContent, setEditContent] = useState("");
  const [editActive, setEditActive] = useState(true);
  const [savingChapter, setSavingChapter] = useState(false);

  // Delete Chapter Target
  const [deleteChapterTarget, setDeleteChapterTarget] = useState<Chapter | null>(null);

  const loadStory = async () => {
    setLoading(true);
    const res = await storyApi.getStoryById(storyId, true);
    if (res.success && res.data) {
      setStory(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadStory();
    const unsub = storyApi.subscribe(() => {
      loadStory();
    });
    return () => unsub();
  }, [storyId]);

  const handleToggleChapterStatus = async (chapter: Chapter) => {
    const res = await storyApi.toggleChapterStatus(storyId, chapter.id);
    if (res.success) {
      toast.success(
        res.data.isActive
          ? `Đã kích hoạt hiển thị "${chapter.title}"`
          : `Đã tạm ẩn "${chapter.title}" khỏi độc giả`
      );
      loadStory();
    }
  };

  const handleOpenEditChapter = (chapter: Chapter) => {
    setEditingChapter(chapter);
    setEditTitle(chapter.title);
    setEditNumber(chapter.number);
    setEditContent(chapter.content);
    setEditActive(chapter.isActive !== false);
  };

  const handleSaveChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChapter) return;

    setSavingChapter(true);
    const res = await storyApi.updateChapter(storyId, editingChapter.id, {
      title: editTitle,
      number: editNumber,
      content: editContent,
      isActive: editActive,
    });
    setSavingChapter(false);

    if (res.success) {
      toast.success("Cập nhật chương thành công!");
      setEditingChapter(null);
      loadStory();
    } else {
      toast.error(res.error || "Không thể cập nhật chương");
    }
  };

  const handleDeleteChapter = async () => {
    if (!deleteChapterTarget) return;
    const res = await storyApi.deleteChapter(storyId, deleteChapterTarget.id);
    if (res.success) {
      toast.success(`Đã xoá "${deleteChapterTarget.title}"`);
      setDeleteChapterTarget(null);
      loadStory();
    } else {
      toast.error(res.error || "Không thể xoá chương");
    }
  };

  if (loading || !story) {
    return (
      <div className="py-20 text-center text-slate-400">
        <p className="text-sm">Đang tải thông tin truyện...</p>
      </div>
    );
  }

  const totalChaptersCount = story.volumes.reduce((acc, v) => acc + v.chapters.length, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <span>{story.title}</span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                story.isActive !== false
                  ? "bg-emerald-500/10 text-emerald-600"
                  : "bg-amber-500/10 text-amber-600"
              }`}>
                {story.isActive !== false ? "Đang hiện" : "Tạm ẩn"}
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Tác giả: {story.author} • {story.volumes.length} quyển • {totalChaptersCount} chương • {formatNumber(story.views)} lượt xem
            </p>
          </div>
        </div>

        <button
          onClick={() => onUploadChapter(story.id)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-xs font-bold shadow-md shadow-amber-500/20 transition-all self-start sm:self-auto"
        >
          <Upload className="w-4 h-4" />
          <span>Up chương mới</span>
        </button>
      </div>

      {/* Volumes & Chapters List */}
      <div className="space-y-6">
        {story.volumes.map((volume) => (
          <div
            key={volume.id}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden"
          >
            {/* Volume Header */}
            <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-500" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {volume.title}
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  ({volume.chapters.length} chương)
                </span>
              </div>
            </div>

            {/* Chapters Table */}
            {volume.chapters.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Quyển này chưa có chương nào. Hãy nhấn "Up chương mới" để thêm.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {volume.chapters.map((chapter) => {
                  const isChapActive = chapter.isActive !== false;

                  return (
                    <div
                      key={chapter.id}
                      className="p-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center font-mono flex-shrink-0">
                          {chapter.number}
                        </span>

                        <div className="min-w-0">
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                            {chapter.title}
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {chapter.wordCount.toLocaleString()} chữ • Cập nhật: {chapter.updatedAt}
                          </p>
                        </div>
                      </div>

                      {/* Right Actions */}
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {/* Active / Inactive Switch */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleChapterStatus(chapter)}
                            title={isChapActive ? "Gạt để tạm ẩn chương" : "Gạt để hiện chương"}
                            className={`w-9 h-5 rounded-full transition-colors relative p-0.5 ${
                              isChapActive ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"
                            }`}
                          >
                            <div
                              className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${
                                isChapActive ? "translate-x-4" : "translate-x-0"
                              }`}
                            />
                          </button>
                          <span className={`text-[10px] font-bold hidden sm:inline ${
                            isChapActive ? "text-emerald-600" : "text-slate-400"
                          }`}>
                            {isChapActive ? "Hiện" : "Ẩn"}
                          </span>
                        </div>

                        {/* Read on Web */}
                        <button
                          onClick={() => onReadChapterOnWeb(story.id, chapter.id)}
                          title="Đọc thử chương này trên giao diện độc giả"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit Chapter */}
                        <button
                          onClick={() => handleOpenEditChapter(chapter)}
                          title="Chỉnh sửa nội dung chương"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Chapter */}
                        <button
                          onClick={() => setDeleteChapterTarget(chapter)}
                          title="Xoá chương"
                          className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Edit Chapter Modal */}
      {editingChapter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-150 my-8">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Chỉnh sửa chương
              </h3>
              <button
                onClick={() => setEditingChapter(null)}
                className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveChapter} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Số chương
                  </label>
                  <input
                    type="number"
                    value={editNumber}
                    onChange={(e) => setEditNumber(parseInt(e.target.value) || 1)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold"
                    required
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Tiêu đề chương
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nội dung chương
                </label>
                <textarea
                  rows={12}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm leading-relaxed"
                  required
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={editActive}
                    onChange={(e) => setEditActive(e.target.checked)}
                    className="rounded text-amber-500 w-4 h-4"
                  />
                  <span>Hiển thị trên Web Đọc (Active)</span>
                </label>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingChapter(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                  >
                    Huỷ
                  </button>
                  <button
                    type="submit"
                    disabled={savingChapter}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-sm"
                  >
                    {savingChapter ? "Đang lưu..." : "Lưu thay đổi"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Chapter Modal */}
      {deleteChapterTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 max-w-md w-full space-y-4">
            <h3 className="font-black text-lg text-slate-900 dark:text-white">
              Xác nhận xoá chương?
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Bạn có chắc chắn muốn xoá vĩnh viễn <strong>"{deleteChapterTarget.title}"</strong>? Thao tác này không thể hoàn tác.
            </p>
            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setDeleteChapterTarget(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Huỷ
              </button>
              <button
                onClick={handleDeleteChapter}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white"
              >
                Xoá chương
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
