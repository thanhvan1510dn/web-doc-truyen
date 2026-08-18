import React, { useState, useEffect } from "react";
import { 
  ArrowLeft, Upload, Edit, Trash2, Layers, Eye, X, FileUp, 
  BookOpen, ChevronDown, ChevronUp, ExternalLink, AlertTriangle, Info
} from "lucide-react";
import { Chapter, Story } from "../../types/story";
import { storyApi } from "../../api";
import { useToast } from "../common/Toast";
import { AdminPDFUploadStudio } from "./AdminPDFUploadStudio";
import { AdminChapterUploadView } from "./AdminChapterUploadView";
import { AdminStoryModal } from "./AdminStoryModal";

interface AdminStoryDetailViewProps {
  storyId: string;
  initialTab?: "chapters" | "pdf-upload" | "manual-upload";
  onBack: () => void;
  onReadChapterOnWeb?: (storyId: string, chapterId: string) => void;
}

export const AdminStoryDetailView: React.FC<AdminStoryDetailViewProps> = ({
  storyId,
  initialTab = "chapters",
  onBack,
  onReadChapterOnWeb,
}) => {
  const toast = useToast();
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<"chapters" | "pdf-upload" | "manual-upload" | "info">(initialTab);
  const [collapsedVolIds, setCollapsedVolIds] = useState<Record<string, boolean>>({});

  // Edit Story Modal state
  const [isEditStoryModalOpen, setIsEditStoryModalOpen] = useState(false);

  // Chapter Preview Modal
  const [previewChapter, setPreviewChapter] = useState<Chapter | null>(null);

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

  const toggleVolCollapse = (volId: string) => {
    setCollapsedVolIds((prev) => ({
      ...prev,
      [volId]: !prev[volId],
    }));
  };

  const handleToggleChapterStatus = async (chapter: Chapter) => {
    const res = await storyApi.toggleChapterStatus(storyId, chapter.id);
    if (res.success) {
      toast.success(
        res.data.isActive
          ? "Đã kích hoạt hiển thị " + chapter.title
          : "Đã tạm ẩn " + chapter.title
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
      toast.success("Đã xoá " + deleteChapterTarget.title);
      setDeleteChapterTarget(null);
      loadStory();
    } else {
      toast.error(res.error || "Không thể xoá chương");
    }
  };

  if (loading || !story) {
    return (
      <div className="py-20 text-center text-zinc-400">
        <p className="text-sm">Đang tải thông tin truyện...</p>
      </div>
    );
  }

  const totalChaptersCount = story.volumes.reduce((acc, v) => acc + v.chapters.length, 0);

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh sách truyện</span>
        </button>

        {/* Action Tabs Navigation */}
        <div className="flex items-center p-1 rounded-xl bg-zinc-100 border border-zinc-200 text-xs font-semibold self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveSubTab("chapters")}
            className={"px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 " + (
              activeSubTab === "chapters"
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-900"
            )}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Mục lục & Chương ({story.volumes.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("info")}
            className={"px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 " + (
              activeSubTab === "info"
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-900"
            )}
          >
            <Info className="w-3.5 h-3.5" />
            <span>Thông tin truyện</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("pdf-upload")}
            className={"px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 " + (
              activeSubTab === "pdf-upload"
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-900"
            )}
          >
            <FileUp className="w-3.5 h-3.5" />
            <span>Tự động tách file</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("manual-upload")}
            className={"px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 " + (
              activeSubTab === "manual-upload"
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-900"
            )}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Đăng chương</span>
          </button>
        </div>
      </div>

      {/* Story Summary Card */}
      <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-sm flex flex-col sm:flex-row gap-5 items-start">
        <img
          src={story.coverImage}
          alt={story.title}
          className="w-20 h-28 object-cover rounded-xl shadow-sm bg-zinc-100 flex-shrink-0"
        />
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-zinc-900">
                {story.title}
              </h2>
              {story.hot && (
                <span className="px-2 py-0.5 rounded-md bg-zinc-900 text-white text-[10px] font-bold">
                  HOT
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsEditStoryModalOpen(true)}
              className="px-3 py-1 rounded-lg border border-zinc-200 hover:bg-zinc-50 text-xs font-semibold text-zinc-700 flex items-center gap-1 shadow-sm"
            >
              <Edit className="w-3.5 h-3.5 text-zinc-500" />
              <span>Sửa thông tin</span>
            </button>
          </div>

          {story.hanVietTitle && (
            <p className="text-xs text-zinc-500">
              Tên Hán Việt: <span className="text-zinc-700 italic">{story.hanVietTitle}</span>
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1 text-xs text-zinc-600">
            <p>Tác giả: <span className="font-semibold text-zinc-900">{story.author}</span></p>
            {story.originalStatus && <p>Bản gốc: <span className="font-medium text-zinc-900">{story.originalStatus}</span></p>}
            {story.editStatus && <p>Bản edit: <span className="font-medium text-zinc-900">{story.editStatus}</span></p>}
            {story.editorBeta && <p className="col-span-full">Editor + Beta: <span className="font-medium text-zinc-900">{story.editorBeta}</span></p>}
          </div>

          <div className="flex flex-wrap gap-1 pt-1">
            {story.genres.map((g) => (
              <span key={g} className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 text-[11px] font-medium">
                {g}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Content Area Based on Active SubTab */}
      {activeSubTab === "info" && (
        <div className="p-6 rounded-2xl bg-white border border-zinc-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <h3 className="font-bold text-sm text-zinc-900">Chi tiết Thông tin Tác phẩm & Văn án</h3>
            <button
              type="button"
              onClick={() => setIsEditStoryModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold shadow-sm"
            >
              Chỉnh sửa thông tin
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-100 space-y-1">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase">Tên Hán Việt</span>
              <p className="font-medium text-zinc-800">{story.hanVietTitle || "Chưa cập nhật"}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-100 space-y-1">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase">Người làm bìa (Designer)</span>
              <p className="font-medium text-zinc-800">{story.coverCredit || "Chưa rõ"}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-100 space-y-1">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase">Editor + Beta</span>
              <p className="font-medium text-zinc-800">{story.editorBeta || "Chưa cập nhật"}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-100 space-y-1">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase">Nguồn convert</span>
              <p className="font-medium text-zinc-800">
                {story.convertSource || "Chưa có"} {story.convertLink && (
                  <a href={story.convertLink} target="_blank" rel="noreferrer" className="text-zinc-500 underline ml-1 hover:text-zinc-900">
                    (Mở link)
                  </a>
                )}
              </p>
            </div>
          </div>

          {/* Van an */}
          <div className="space-y-1.5 pt-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-500">Văn án tác phẩm</h4>
            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-100 text-xs font-serif leading-relaxed text-zinc-800 whitespace-pre-wrap">
              {story.description || "Chưa có văn án."}
            </div>
          </div>

          {/* Warning */}
          {story.warning && (
            <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/60 text-xs text-amber-900 space-y-1">
              <span className="font-bold uppercase tracking-wider text-[11px] text-amber-800">Warning (Cảnh báo trước khi đọc):</span>
              <p className="leading-relaxed">{story.warning}</p>
            </div>
          )}
        </div>
      )}

      {activeSubTab === "pdf-upload" && (
        <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-sm">
          <AdminPDFUploadStudio
            storyId={story.id}
            onSuccess={() => {
              loadStory();
              setActiveSubTab("chapters");
            }}
          />
        </div>
      )}

      {activeSubTab === "manual-upload" && (
        <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-sm">
          <AdminChapterUploadView
            initialStoryId={story.id}
            onBack={() => setActiveSubTab("chapters")}
            onSuccess={() => {
              loadStory();
              setActiveSubTab("chapters");
            }}
          />
        </div>
      )}

      {activeSubTab === "chapters" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-zinc-900">
              Cấu trúc Mục lục & Danh sách Chương
            </h3>
            <span className="text-xs text-zinc-500 font-medium">
              Tổng cộng: {story.volumes.length} mục lục / {totalChaptersCount} chương
            </span>
          </div>

          {story.volumes.length === 0 ? (
            <div className="p-12 rounded-2xl bg-white border border-zinc-200 text-center space-y-3 shadow-sm">
              <BookOpen className="w-10 h-10 text-zinc-300 mx-auto" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-zinc-700">Chưa có chương nào trong truyện này</p>
                <p className="text-xs text-zinc-400">Bạn có thể tải file PDF/Word lên để hệ thống tự động bóc tách hoặc đăng thủ công.</p>
              </div>
              <div className="flex justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveSubTab("pdf-upload")}
                  className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold shadow-sm transition-all"
                >
                  Tự động tách file
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSubTab("manual-upload")}
                  className="px-3.5 py-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-semibold shadow-sm transition-all"
                >
                  Đăng chương thủ công
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {story.volumes.map((volume, vIdx) => {
                const isCollapsed = !!collapsedVolIds[volume.id];

                return (
                  <div
                    key={volume.id || vIdx}
                    className="rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-sm"
                  >
                    {/* Volume Header */}
                    <div
                      onClick={() => toggleVolCollapse(volume.id)}
                      className="p-3.5 bg-zinc-50 flex items-center justify-between cursor-pointer select-none border-b border-zinc-100 hover:bg-zinc-100/70 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <h4 className="font-bold text-xs sm:text-sm text-zinc-900 truncate">
                          {volume.title || `Mục lục ${vIdx + 1}`}
                        </h4>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-mono text-zinc-500">
                        <span>{volume.chapters.length} chương</span>
                        {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                      </div>
                    </div>

                    {/* Chapters List */}
                    {!isCollapsed && (
                      <div className="divide-y divide-zinc-100 text-xs">
                        {volume.chapters.map((chapter) => {
                          const isChapActive = chapter.isActive !== false;

                          return (
                            <div
                              key={chapter.id}
                              className="p-3 px-4 flex items-center justify-between gap-3 hover:bg-zinc-50 transition-colors group"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-zinc-400 font-mono font-medium text-[11px] flex-shrink-0">
                                  #{chapter.number}
                                </span>
                                <span className="font-normal text-zinc-800 truncate">
                                  {chapter.title}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <span className="text-[11px] text-zinc-400 font-mono mr-2 hidden sm:inline">
                                  {chapter.wordCount || 0} từ
                                </span>

                                {/* Status Toggle */}
                                <button
                                  type="button"
                                  onClick={() => handleToggleChapterStatus(chapter)}
                                  className={"px-2 py-0.5 rounded text-[10px] font-semibold transition-colors " + (
                                    isChapActive
                                      ? "bg-emerald-50 text-emerald-700"
                                      : "bg-zinc-100 text-zinc-500"
                                  )}
                                  title="Bật / Tắt hiển thị chương này"
                                >
                                  {isChapActive ? "Hiện" : "Ẩn"}
                                </button>

                                {/* Preview Chapter Modal */}
                                <button
                                  type="button"
                                  onClick={() => setPreviewChapter(chapter)}
                                  className="p-1 rounded text-zinc-400 hover:text-zinc-900"
                                  title="Xem nội dung chương"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>

                                {/* Read on User Web */}
                                {onReadChapterOnWeb && (
                                  <button
                                    type="button"
                                    onClick={() => onReadChapterOnWeb(story.id, chapter.id)}
                                    className="p-1 rounded text-zinc-400 hover:text-zinc-900"
                                    title="Mở đọc trên Web"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                {/* Edit Chapter */}
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditChapter(chapter)}
                                  className="p-1 rounded text-zinc-400 hover:text-zinc-900"
                                  title="Sửa nội dung"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>

                                {/* Delete Chapter */}
                                <button
                                  type="button"
                                  onClick={() => setDeleteChapterTarget(chapter)}
                                  className="p-1 rounded text-rose-400 hover:text-rose-600"
                                  title="Xoá chương"
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
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Chapter Content Preview Modal */}
      {previewChapter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-zinc-200 p-5 w-full max-w-2xl space-y-3 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <h4 className="font-bold text-sm text-zinc-900">{previewChapter.title}</h4>
              <button
                type="button"
                onClick={() => setPreviewChapter(null)}
                className="p-1 text-zinc-400 hover:text-zinc-900 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto font-serif text-xs leading-relaxed whitespace-pre-wrap text-zinc-700 p-2 bg-zinc-50 rounded-xl">
              {previewChapter.content}
            </div>
          </div>
        </div>
      )}

      {/* Edit Story Modal */}
      {isEditStoryModalOpen && (
        <AdminStoryModal
          isOpen={isEditStoryModalOpen}
          storyToEdit={story}
          onClose={() => setIsEditStoryModalOpen(false)}
          onSuccess={() => {
            setIsEditStoryModalOpen(false);
            loadStory();
          }}
        />
      )}

      {/* Edit Chapter Modal */}
      {editingChapter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 w-full max-w-xl space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <h4 className="font-bold text-sm text-zinc-900">Sửa Chương: {editingChapter.title}</h4>
              <button
                type="button"
                onClick={() => setEditingChapter(null)}
                className="p-1 text-zinc-400 hover:text-zinc-900 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveChapter} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Tiêu đề chương
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-zinc-50 text-xs font-medium text-zinc-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Số thứ tự chương
                </label>
                <input
                  type="number"
                  value={editNumber}
                  onChange={(e) => setEditNumber(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-zinc-50 text-xs font-medium text-zinc-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Nội dung chương
                </label>
                <textarea
                  rows={8}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-zinc-50 text-xs font-serif leading-relaxed text-zinc-900"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setEditingChapter(null)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-zinc-600 hover:bg-zinc-100"
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  disabled={savingChapter}
                  className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold shadow-sm"
                >
                  {savingChapter ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteChapterTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 w-full max-w-md space-y-4 shadow-xl">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-5 h-5" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-sm font-bold text-zinc-900">
                Xác nhận xoá chương?
              </h3>
              <p className="text-xs text-zinc-500">
                Bạn có chắc muốn xoá chương <strong>"{deleteChapterTarget.title}"</strong>?
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteChapterTarget(null)}
                className="flex-1 py-2 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                Huỷ bỏ
              </button>
              <button
                type="button"
                onClick={handleDeleteChapter}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm"
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
