import React, { useState, useEffect } from "react";
import { 
  Edit, Trash2, X, Plus, Minus,
  BookOpen, ExternalLink, AlertTriangle, RefreshCw,
  GripVertical, ChevronUp, ChevronDown, Check, FolderPlus
} from "lucide-react";
import { Chapter, Story, Volume } from "../../types/story";
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
  const [expandedVolIds, setExpandedVolIds] = useState<Record<string, boolean>>({});

  // Reorder & Drag Drop states for Volumes (Mục lục)
  const [draggedVolIdx, setDraggedVolIdx] = useState<number | null>(null);
  const [dragOverVolIdx, setDragOverVolIdx] = useState<number | null>(null);

  // Reorder & Drag Drop states for Chapters
  const [draggedChap, setDraggedChap] = useState<{ volId: string; chapIdx: number } | null>(null);
  const [dragOverChap, setDragOverChap] = useState<{ volId: string; chapIdx: number } | null>(null);

  // Edit / Add Volume inline
  const [editingVolId, setEditingVolId] = useState<string | null>(null);
  const [editingVolTitle, setEditingVolTitle] = useState("");
  const [isAddingVol, setIsAddingVol] = useState(false);
  const [newVolTitle, setNewVolTitle] = useState("");

  // Edit Story Modal state
  const [isEditStoryModalOpen, setIsEditStoryModalOpen] = useState(false);

  // Edit Chapter Modal state
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editNumber, setEditNumber] = useState(1);
  const [editContent, setEditContent] = useState("");
  const [editActive, setEditActive] = useState(true);
  const [savingChapter, setSavingChapter] = useState(false);
  const [isLoadingChapterContent, setIsLoadingChapterContent] = useState(false);

  const [deleteChapterTarget, setDeleteChapterTarget] = useState<Chapter | null>(null);

  // Delete Volume Target
  const [deleteVolumeTarget, setDeleteVolumeTarget] = useState<Volume | null>(null);

  const loadStory = async () => {
    setLoading(true);
    const res = await storyApi.getStoryById(storyId, true);
    if (res.success && res.data) {
      setStory({ ...res.data });
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
    setExpandedVolIds((prev) => ({
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

  const handleOpenEditChapter = async (chapter: Chapter) => {
    setEditingChapter(chapter);
    setEditTitle(chapter.title);
    setEditNumber(chapter.number);
    setEditContent(chapter.content || "");
    setEditActive(chapter.isActive !== false);

    // If chapter content is empty (e.g. lazy-loaded from subcollection), fetch full text from Cloud immediately!
    if (!chapter.content || chapter.content.trim().length === 0) {
      setIsLoadingChapterContent(true);
      try {
        const res = await storyApi.getChapter(storyId, chapter.id, true);
        if (res.success && res.data?.content) {
          setEditContent(res.data.content);
          chapter.content = res.data.content;
        }
      } catch (err) {
        console.error("Error fetching full chapter content:", err);
      } finally {
        setIsLoadingChapterContent(false);
      }
    }
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

  const handleDeleteVolume = async () => {
    if (!deleteVolumeTarget) return;
    const res = await storyApi.deleteVolume(storyId, deleteVolumeTarget.id);
    if (res.success) {
      toast.success("Đã xoá mục lục " + (deleteVolumeTarget.title || ""));
      setDeleteVolumeTarget(null);
      loadStory();
    } else {
      toast.error(res.error || "Không thể xoá mục lục");
    }
  };

  // Reorder Volume Drag & Drop handler
  const handleDropVolume = async (targetIdx: number) => {
    if (draggedVolIdx === null || draggedVolIdx === targetIdx || !story) {
      setDraggedVolIdx(null);
      setDragOverVolIdx(null);
      return;
    }
    const newVolumes = [...story.volumes];
    const [movedVol] = newVolumes.splice(draggedVolIdx, 1);
    newVolumes.splice(targetIdx, 0, movedVol);
    newVolumes.forEach((v, idx) => {
      v.number = idx + 1;
    });

    setStory({ ...story, volumes: newVolumes });
    setDraggedVolIdx(null);
    setDragOverVolIdx(null);

    const res = await storyApi.reorderVolumes(story.id, newVolumes.map((v) => v.id));
    if (res.success) {
      toast.success(`Đã đổi vị trí: ${movedVol.title || 'Mục lục'}`);
    } else {
      toast.error("Không thể lưu thứ tự mục lục");
      loadStory();
    }
  };

  // Move Volume via Up/Down buttons
  const handleMoveVolume = async (fromIdx: number, toIdx: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!story || toIdx < 0 || toIdx >= story.volumes.length || fromIdx === toIdx) return;
    const newVolumes = [...story.volumes];
    const [movedVol] = newVolumes.splice(fromIdx, 1);
    newVolumes.splice(toIdx, 0, movedVol);
    newVolumes.forEach((v, idx) => {
      v.number = idx + 1;
    });

    setStory({ ...story, volumes: newVolumes });

    const res = await storyApi.reorderVolumes(story.id, newVolumes.map((v) => v.id));
    if (res.success) {
      toast.success(`Đã di chuyển: ${movedVol.title || 'Mục lục'}`);
    } else {
      toast.error("Không thể lưu thứ tự");
      loadStory();
    }
  };

  // Reorder Chapter Drag & Drop handler
  const handleDropChapter = async (targetVolId: string, targetChapIdx: number) => {
    if (!story || !draggedChap || (draggedChap.volId === targetVolId && draggedChap.chapIdx === targetChapIdx)) {
      setDraggedChap(null);
      setDragOverChap(null);
      return;
    }
    const vol = story.volumes.find((v) => v.id === targetVolId);
    if (!vol) return;

    if (draggedChap.volId === targetVolId) {
      const newChapters = [...vol.chapters];
      const [movedChap] = newChapters.splice(draggedChap.chapIdx, 1);
      newChapters.splice(targetChapIdx, 0, movedChap);
      newChapters.forEach((c, idx) => {
        c.number = idx + 1;
      });
      vol.chapters = newChapters;
      setStory({ ...story });
      setDraggedChap(null);
      setDragOverChap(null);

      const res = await storyApi.reorderChapters(story.id, targetVolId, newChapters.map((c) => c.id));
      if (res.success) {
        toast.success(`Đã đổi thứ tự: ${movedChap.title}`);
      } else {
        loadStory();
      }
    }
  };

  // Move Chapter via Up/Down buttons
  const handleMoveChapter = async (volId: string, fromIdx: number, toIdx: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!story) return;
    const vol = story.volumes.find((v) => v.id === volId);
    if (!vol || toIdx < 0 || toIdx >= vol.chapters.length || fromIdx === toIdx) return;

    const newChapters = [...vol.chapters];
    const [movedChap] = newChapters.splice(fromIdx, 1);
    newChapters.splice(toIdx, 0, movedChap);
    newChapters.forEach((c, idx) => {
      c.number = idx + 1;
    });
    vol.chapters = newChapters;
    setStory({ ...story });

    const res = await storyApi.reorderChapters(story.id, volId, newChapters.map((c) => c.id));
    if (res.success) {
      toast.success(`Đã di chuyển: ${movedChap.title}`);
    } else {
      loadStory();
    }
  };

  // Inline rename volume
  const handleStartEditVolume = (vol: Volume, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingVolId(vol.id);
    setEditingVolTitle(vol.title || "");
  };

  const handleSaveVolumeTitle = async (volId: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!story || !editingVolTitle.trim()) {
      setEditingVolId(null);
      return;
    }
    const res = await storyApi.updateVolume(story.id, volId, editingVolTitle.trim());
    if (res.success) {
      toast.success("Đã đổi tên Mục lục thành công!");
      setEditingVolId(null);
      loadStory();
    } else {
      toast.error("Không thể đổi tên mục lục");
    }
  };

  // Add new volume
  const handleAddNewVolume = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!story || !newVolTitle.trim()) return;
    const res = await storyApi.addVolume(story.id, newVolTitle.trim());
    if (res.success) {
      toast.success(`Đã thêm Mục lục "${newVolTitle.trim()}"!`);
      setNewVolTitle("");
      setIsAddingVol(false);
      loadStory();
    } else {
      toast.error("Không thể thêm mục lục");
    }
  };

  if (loading || !story) {
    return (
      <div className="py-20 text-center text-zinc-400">
        <p className="text-sm">Đang tải thông tin truyện...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition-colors w-fit"
        >
          Quay lại danh sách truyện
        </button>

        {/* Action Tabs Navigation */}
        <div className="flex items-center p-1 rounded-xl bg-zinc-100 border border-zinc-200 text-xs font-semibold self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveSubTab("chapters")}
            className={"px-3 py-1.5 rounded-lg transition-all flex items-center justify-center " + (
              activeSubTab === "chapters"
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-900"
            )}
          >
            <span>Mục lục ({story.volumes.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("info")}
            className={"px-3 py-1.5 rounded-lg transition-all flex items-center justify-center " + (
              activeSubTab === "info"
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-900"
            )}
          >
            <span>Thông tin truyện</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("pdf-upload")}
            className={"px-3 py-1.5 rounded-lg transition-all flex items-center justify-center " + (
              activeSubTab === "pdf-upload"
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-900"
            )}
          >
            <span>Nạp file</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("manual-upload")}
            className={"px-3 py-1.5 rounded-lg transition-all flex items-center justify-center " + (
              activeSubTab === "manual-upload"
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-900"
            )}
          >
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
                  Nổi bật
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
            <div className="p-3.5 rounded-xl bg-stone-100 border border-stone-200 text-xs text-stone-800 space-y-1">
              <span className="font-bold uppercase tracking-wider text-[11px] text-stone-900">Lưu ý / Cảnh báo độc giả:</span>
              <p className="leading-relaxed">{story.warning}</p>
            </div>
          )}
        </div>
      )}

      {activeSubTab === "pdf-upload" && (
        <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-sm">
          <AdminPDFUploadStudio
            storyId={story.id}
            onSuccess={async (updatedStoryId) => {
              const res = await storyApi.getStoryById(updatedStoryId || story.id, true);
              if (res.success && res.data) {
                setStory({ ...res.data });
              } else {
                await loadStory();
              }
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1 border-b border-zinc-100">
            <div>
              <h3 className="font-bold text-base text-zinc-900">
                Mục lục tác phẩm
              </h3>
              <p className="text-xs text-zinc-500 font-medium mt-0.5">
                Kéo thả biểu tượng <b>⠿</b> hoặc bấm mũi tên <b>↑ ↓</b> để thay đổi thứ tự hiển thị.
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const allExpanded = story.volumes.every((v) => expandedVolIds[v.id]);
                  const newState: Record<string, boolean> = {};
                  story.volumes.forEach((v) => {
                    newState[v.id] = !allExpanded;
                  });
                  setExpandedVolIds(newState);
                }}
                className="px-3 py-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-semibold shadow-sm transition-all"
              >
                {story.volumes.every((v) => expandedVolIds[v.id]) ? "Thu gọn tất cả" : "Mở rộng tất cả"}
              </button>

              <button
                type="button"
                onClick={() => setIsAddingVol(true)}
                className="px-3.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-black text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>Thêm Mục lục</span>
              </button>
            </div>
          </div>

          {/* Form Thêm Mục lục mới */}
          {isAddingVol && (
            <form onSubmit={handleAddNewVolume} className="p-4 rounded-2xl border border-zinc-300 bg-zinc-50/80 space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-zinc-900 flex items-center gap-1.5">
                  <FolderPlus className="w-4 h-4 text-zinc-700" />
                  <span>Tạo Mục lục mới</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingVol(false);
                    setNewVolTitle("");
                  }}
                  className="p-1 text-zinc-400 hover:text-zinc-700 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newVolTitle}
                  onChange={(e) => setNewVolTitle(e.target.value)}
                  placeholder={`Ví dụ: Mục lục ${story.volumes.length + 1} - Phần mới...`}
                  className="flex-1 px-3.5 py-2 rounded-xl border border-zinc-300 bg-white text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                  autoFocus
                  required
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-black text-white text-xs font-bold shadow-sm flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Lưu Mục lục</span>
                </button>
              </div>
            </form>
          )}

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
                  Nạp file
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
                const isExpanded = !!expandedVolIds[volume.id];
                const isBeingDragged = draggedVolIdx === vIdx;
                const isOver = dragOverVolIdx === vIdx && draggedVolIdx !== vIdx;

                return (
                  <div
                    key={volume.id || vIdx}
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (draggedVolIdx !== null && dragOverVolIdx !== vIdx) {
                        setDragOverVolIdx(vIdx);
                      }
                    }}
                    onDragLeave={() => {
                      if (dragOverVolIdx === vIdx) {
                        setDragOverVolIdx(null);
                      }
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleDropVolume(vIdx);
                    }}
                    className={`rounded-2xl border bg-white overflow-hidden shadow-sm transition-all duration-150 ${
                      isBeingDragged
                        ? "opacity-40 border-dashed border-zinc-400 scale-[0.99]"
                        : isOver
                        ? "border-zinc-900 ring-2 ring-zinc-900/10 shadow-md translate-y-[-2px]"
                        : "border-zinc-200"
                    }`}
                  >
                    {/* Volume Header */}
                    <div
                      onClick={() => toggleVolCollapse(volume.id)}
                      className="p-3 sm:p-4 bg-zinc-50 flex items-center justify-between cursor-pointer select-none border-b border-zinc-100 hover:bg-zinc-100/70 transition-colors group/vol"
                    >
                      <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1 mr-2">
                        {/* Drag Handle */}
                        <div
                          draggable={true}
                          onDragStart={(e) => {
                            e.stopPropagation();
                            e.dataTransfer.setData("text/plain", volume.id);
                            setDraggedVolIdx(vIdx);
                          }}
                          onDragEnd={() => {
                            setDraggedVolIdx(null);
                            setDragOverVolIdx(null);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="cursor-grab active:cursor-grabbing p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200/80 transition-colors flex-shrink-0"
                          title="Kéo thả để thay đổi vị trí Mục lục"
                        >
                          <GripVertical className="w-4 h-4" />
                        </div>

                        {/* Order badge */}
                        <span className="px-2 py-0.5 rounded-md bg-zinc-200/80 text-zinc-800 text-[11px] font-bold flex-shrink-0">
                          #{vIdx + 1}
                        </span>

                        {/* Volume Title (Inline Edit support) */}
                        {editingVolId === volume.id ? (
                          <form
                            onSubmit={(e) => handleSaveVolumeTitle(volume.id, e)}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1.5 flex-1 max-w-sm"
                          >
                            <input
                              type="text"
                              value={editingVolTitle}
                              onChange={(e) => setEditingVolTitle(e.target.value)}
                              className="px-2.5 py-1 rounded-lg border border-zinc-300 bg-white text-xs font-bold text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400 w-full"
                              autoFocus
                            />
                            <button
                              type="submit"
                              className="p-1 rounded-lg bg-zinc-900 text-white hover:bg-black"
                              title="Lưu tên"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingVolId(null);
                              }}
                              className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700"
                              title="Huỷ"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </form>
                        ) : (
                          <div className="flex items-center gap-1.5 min-w-0">
                            <h4 className="font-bold text-sm sm:text-base text-zinc-900 truncate">
                              {volume.title || `Mục lục ${vIdx + 1}`}
                            </h4>
                            <span className="text-[11px] font-semibold text-zinc-400 flex-shrink-0">
                              ({volume.chapters.length} chương)
                            </span>
                            <button
                              type="button"
                              onClick={(e) => handleStartEditVolume(volume, e)}
                              className="p-1 rounded text-zinc-400 hover:text-zinc-900 opacity-0 group-hover/vol:opacity-100 transition-opacity"
                              title="Đổi tên Mục lục"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Action buttons on Volume Header */}
                      <div className="flex items-center gap-1 sm:gap-1.5 text-xs text-zinc-500 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        {/* Move Up / Down Buttons */}
                        <div className="flex items-center bg-white border border-zinc-200 rounded-lg p-0.5 shadow-2xs">
                          <button
                            type="button"
                            disabled={vIdx === 0}
                            onClick={(e) => handleMoveVolume(vIdx, vIdx - 1, e)}
                            className="p-1 rounded hover:bg-zinc-100 text-zinc-600 disabled:opacity-20 disabled:hover:bg-transparent"
                            title="Di chuyển lên trên"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={vIdx === story.volumes.length - 1}
                            onClick={(e) => handleMoveVolume(vIdx, vIdx + 1, e)}
                            className="p-1 rounded hover:bg-zinc-100 text-zinc-600 disabled:opacity-20 disabled:hover:bg-transparent"
                            title="Di chuyển xuống dưới"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Delete Volume */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteVolumeTarget(volume);
                          }}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover/vol:opacity-100 transition-opacity"
                          title="Xoá cả mục lục này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Toggle Expand */}
                        <span 
                          onClick={() => toggleVolCollapse(volume.id)}
                          className="w-7 h-7 rounded-lg bg-zinc-200/70 hover:bg-zinc-300/70 flex items-center justify-center font-bold text-xs text-zinc-700 cursor-pointer transition-colors"
                        >
                          {isExpanded ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                        </span>
                      </div>
                    </div>

                    {/* Chapters List with Drag & Drop */}
                    {isExpanded && (
                      <div className="divide-y divide-zinc-100 text-xs">
                        {volume.chapters.length === 0 ? (
                          <div className="p-6 text-center text-zinc-400 italic">
                            Chưa có chương nào trong mục lục này.
                          </div>
                        ) : (
                          volume.chapters.map((chapter, cIdx) => {
                            const isChapActive = chapter.isActive !== false;
                            const isChapBeingDragged = draggedChap?.volId === volume.id && draggedChap?.chapIdx === cIdx;
                            const isChapOver = dragOverChap?.volId === volume.id && dragOverChap?.chapIdx === cIdx && !isChapBeingDragged;

                            return (
                              <div
                                key={chapter.id || cIdx}
                                onDragOver={(e) => {
                                  e.preventDefault();
                                  if (draggedChap && (dragOverChap?.volId !== volume.id || dragOverChap?.chapIdx !== cIdx)) {
                                    setDragOverChap({ volId: volume.id, chapIdx: cIdx });
                                  }
                                }}
                                onDragLeave={() => {
                                  if (dragOverChap?.volId === volume.id && dragOverChap?.chapIdx === cIdx) {
                                    setDragOverChap(null);
                                  }
                                }}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  handleDropChapter(volume.id, cIdx);
                                }}
                                className={`p-2.5 sm:p-3 px-3 sm:px-4 flex items-center justify-between gap-2.5 transition-all duration-100 group ${
                                  isChapBeingDragged
                                    ? "opacity-30 bg-zinc-100"
                                    : isChapOver
                                    ? "bg-zinc-100 border-t-2 border-zinc-900"
                                    : "hover:bg-zinc-50"
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  {/* Chapter Drag Handle */}
                                  <div
                                    draggable={true}
                                    onDragStart={(e) => {
                                      e.stopPropagation();
                                      e.dataTransfer.setData("text/plain", chapter.id);
                                      setDraggedChap({ volId: volume.id, chapIdx: cIdx });
                                    }}
                                    onDragEnd={() => {
                                      setDraggedChap(null);
                                      setDragOverChap(null);
                                    }}
                                    className="cursor-grab active:cursor-grabbing p-1 rounded text-zinc-300 group-hover:text-zinc-600 hover:bg-zinc-200/60 transition-colors flex-shrink-0"
                                    title="Kéo thả để đổi thứ tự chương"
                                  >
                                    <GripVertical className="w-3.5 h-3.5" />
                                  </div>

                                  <span className="font-semibold text-zinc-400 text-[11px] w-6 flex-shrink-0">
                                    #{cIdx + 1}
                                  </span>

                                  <span className="font-medium text-zinc-900 truncate">
                                    {chapter.title}
                                  </span>
                                </div>

                                <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
                                  {/* Chapter Up/Down quick buttons */}
                                  <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      type="button"
                                      disabled={cIdx === 0}
                                      onClick={(e) => handleMoveChapter(volume.id, cIdx, cIdx - 1, e)}
                                      className="p-1 text-zinc-400 hover:text-zinc-900 disabled:opacity-10"
                                      title="Lên trên"
                                    >
                                      <ChevronUp className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      disabled={cIdx === volume.chapters.length - 1}
                                      onClick={(e) => handleMoveChapter(volume.id, cIdx, cIdx + 1, e)}
                                      className="p-1 text-zinc-400 hover:text-zinc-900 disabled:opacity-10"
                                      title="Xuống dưới"
                                    >
                                      <ChevronDown className="w-3.5 h-3.5" />
                                    </button>
                                  </div>

                                  {/* Status Toggle */}
                                  <button
                                    type="button"
                                    onClick={() => handleToggleChapterStatus(chapter)}
                                    className={"px-2 py-0.5 rounded text-[10px] font-bold transition-colors " + (
                                      isChapActive
                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50"
                                        : "bg-zinc-100 text-zinc-500 border border-zinc-200"
                                    )}
                                    title="Bật / Tắt hiển thị chương này"
                                  >
                                    {isChapActive ? "Hiện" : "Ẩn"}
                                  </button>

                                  {/* Read on User Web */}
                                  {onReadChapterOnWeb && (
                                    <button
                                      type="button"
                                      onClick={() => onReadChapterOnWeb(story.id, chapter.id)}
                                      className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100"
                                      title="Mở đọc trên Web"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </button>
                                  )}

                                  {/* Edit Chapter */}
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditChapter(chapter)}
                                    className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100"
                                    title="Sửa nội dung"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Delete Chapter */}
                                  <button
                                    type="button"
                                    onClick={() => setDeleteChapterTarget(chapter)}
                                    className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50"
                                    title="Xoá chương"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
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
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-zinc-700">
                    Nội dung chương
                  </label>
                  {isLoadingChapterContent && (
                    <span className="text-[11px] text-zinc-500 font-medium animate-pulse flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>Đang tải nội dung chương từ Cloud...</span>
                    </span>
                  )}
                </div>
                <textarea
                  rows={8}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder={isLoadingChapterContent ? "Đang tải dữ liệu chương..." : "Nhập hoặc chỉnh sửa nội dung chương..."}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-xs font-serif leading-relaxed text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                  disabled={isLoadingChapterContent}
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
                  disabled={savingChapter || isLoadingChapterContent}
                  className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-black text-white text-xs font-semibold shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                >
                  {savingChapter ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Chapter Confirmation Modal */}
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

      {/* Delete Volume Confirmation Modal */}
      {deleteVolumeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 w-full max-w-md space-y-4 shadow-xl">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-5 h-5" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-sm font-bold text-zinc-900">
                Xác nhận xoá toàn bộ mục lục?
              </h3>
              <p className="text-xs text-zinc-500">
                Bạn có chắc muốn xoá mục lục <strong>"{deleteVolumeTarget.title}"</strong> bao gồm <strong>{deleteVolumeTarget.chapters.length} chương</strong> thuộc mục lục này?
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteVolumeTarget(null)}
                className="flex-1 py-2 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                Huỷ bỏ
              </button>
              <button
                type="button"
                onClick={handleDeleteVolume}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm"
              >
                Xoá cả mục lục
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
