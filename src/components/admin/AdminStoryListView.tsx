import React, { useState, useEffect, useMemo } from "react";
import { 
  Plus, Search, Edit, Trash2, Upload, BookOpen, Layers, 
  AlertTriangle, ExternalLink 
} from "lucide-react";
import { Story } from "../../types/story";
import { storyApi } from "../../api";
import { formatNumber, getTotalChapters } from "../../utils/format";
import { useToast } from "../common/Toast";
import { AdminStoryModal } from "./AdminStoryModal";

interface AdminStoryListViewProps {
  onSelectStoryForUpload?: (storyId: string) => void;
  onSelectStoryForDetails?: (storyId: string) => void;
  onPreviewOnUserWeb?: (storyId: string) => void;
}

export const AdminStoryListView: React.FC<AdminStoryListViewProps> = ({
  onSelectStoryForUpload,
  onSelectStoryForDetails,
  onPreviewOnUserWeb,
}) => {
  const toast = useToast();
  const [stories, setStories] = useState<Story[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<"all" | "active" | "inactive">("all");

  // Modals state
  const [storyModalOpen, setStoryModalOpen] = useState(false);
  const [storyToEdit, setStoryToEdit] = useState<Story | null>(null);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<Story | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadStories = async () => {
    const res = await storyApi.getStories({ includeInactive: true });
    if (res.success) {
      setStories(res.data);
    }
  };

  useEffect(() => {
    loadStories();
    const unsub = storyApi.subscribe(() => {
      loadStories();
    });
    return () => unsub();
  }, []);

  const filteredStories = useMemo(() => {
    return stories.filter((story) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        story.title.toLowerCase().includes(q) ||
        story.author.toLowerCase().includes(q);

      const matchStatus =
        selectedStatus === "all" ||
        (selectedStatus === "active" && story.isActive !== false) ||
        (selectedStatus === "inactive" && story.isActive === false);

      return matchSearch && matchStatus;
    });
  }, [stories, searchQuery, selectedStatus]);

  // Toggle active/inactive
  const handleToggleStatus = async (story: Story) => {
    const res = await storyApi.toggleStoryStatus(story.id);
    if (res.success) {
      toast.success(
        res.data.isActive
          ? `Đã kích hoạt hiển thị truyện "${story.title}"`
          : `Đã tạm ẩn truyện "${story.title}" khỏi Web Đọc`
      );
      loadStories();
    } else {
      toast.error(res.error || "Không thể đổi trạng thái");
    }
  };

  // Delete story
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    const res = await storyApi.deleteStory(deleteTarget.id);
    setDeleteLoading(false);

    if (res.success) {
      toast.success(`Đã xoá truyện "${deleteTarget.title}"`);
      setDeleteTarget(null);
      loadStories();
    } else {
      toast.error(res.error || "Không thể xoá truyện");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-zinc-900 dark:text-white" />
            <span>Quản lý Danh sách Truyện</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Tạo truyện mới, chỉnh sửa, bật/tắt hiển thị (inactive) và quản lý nội dung các chương.
          </p>
        </div>

        <button
          onClick={() => {
            setStoryToEdit(null);
            setStoryModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-900 text-white hover:bg-amber-600 active:scale-95 text-white text-xs font-bold shadow-md shadow-amber-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo truyện mới</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm truyện theo tên hoặc tác giả..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-100 dark:bg-zinc-800 text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>

          {/* Status Tabs Filter */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-zinc-100 dark:bg-zinc-800 text-xs font-bold">
            <button
              onClick={() => setSelectedStatus("all")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedStatus === "all"
                  ? "bg-white dark:bg-slate-700 text-amber-600 dark:text-zinc-700 dark:text-zinc-300 shadow-sm"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              Tất cả ({stories.length})
            </button>
            <button
              onClick={() => setSelectedStatus("active")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedStatus === "active"
                  ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              Đang hiện ({stories.filter((s) => s.isActive !== false).length})
            </button>
            <button
              onClick={() => setSelectedStatus("inactive")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedStatus === "inactive"
                  ? "bg-white dark:bg-slate-700 text-amber-600 dark:text-zinc-700 dark:text-zinc-300 shadow-sm"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              Tạm ẩn ({stories.filter((s) => s.isActive === false).length})
            </button>
          </div>
        </div>
      </div>

      {/* Stories Table */}
      <div className="bg-white dark:bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        {filteredStories.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-medium">Không tìm thấy truyện nào phù hợp</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-zinc-200 dark:border-zinc-800 bg-slate-50/75 dark:bg-zinc-100 dark:bg-zinc-800/40 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3.5 px-4 sm:px-6">Truyện</th>
                  <th className="py-3.5 px-4 hidden md:table-cell">Thể loại</th>
                  <th className="py-3.5 px-4 text-center">Số chương</th>
                  <th className="py-3.5 px-4 text-center hidden sm:table-cell">Lượt xem</th>
                  <th className="py-3.5 px-4 text-center">Trạng thái (Active)</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Tác vụ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {filteredStories.map((story) => {
                  const totalChaps = getTotalChapters(story);
                  const isStoryActive = story.isActive !== false;

                  return (
                    <tr
                      key={story.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-zinc-100 dark:bg-zinc-800/50 transition-colors group"
                    >
                      {/* Story Info */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <img
                            src={story.coverImage}
                            alt={story.title}
                            className="w-11 h-15 object-cover rounded-lg shadow-sm flex-shrink-0 bg-slate-100"
                          />
                          <div className="min-w-0 max-w-xs sm:max-w-sm">
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                                {story.title}
                              </h4>
                              {story.hot && (
                                <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 text-[10px] font-black">
                                  HOT
                                </span>
                              )}
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                              Tác giả: <span className="text-slate-700 dark:text-slate-300 font-medium">{story.author}</span>
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Genres */}
                      <td className="py-3.5 px-4 hidden md:table-cell">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {story.genres.slice(0, 2).map((g) => (
                            <span
                              key={g}
                              className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300 text-[11px] font-medium"
                            >
                              {g}
                            </span>
                          ))}
                          {story.genres.length > 2 && (
                            <span className="text-[10px] text-slate-400 self-center">
                              +{story.genres.length - 2}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Chapters Count */}
                      <td className="py-3.5 px-4 text-center font-mono font-semibold text-slate-700 dark:text-slate-300">
                        {totalChaps} chương
                      </td>

                      {/* Views */}
                      <td className="py-3.5 px-4 text-center font-mono font-semibold text-slate-700 dark:text-slate-300 hidden sm:table-cell">
                        {formatNumber(story.views)}
                      </td>

                      {/* Active / Inactive Toggle Switch */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => handleToggleStatus(story)}
                            title={isStoryActive ? "Gạt để tạm ẩn truyện khỏi User Web" : "Gạt để hiển thị truyện trên User Web"}
                            className={`w-10 h-5.5 rounded-full transition-colors relative p-0.5 ${
                              isStoryActive ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"
                            }`}
                          >
                            <div
                              className={`w-4.5 h-4.5 rounded-full bg-white shadow-md transform transition-transform ${
                                isStoryActive ? "translate-x-4.5" : "translate-x-0"
                              }`}
                            />
                          </button>
                          <span className={`text-[11px] font-bold ${
                            isStoryActive ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"
                          }`}>
                            {isStoryActive ? "Hiện" : "Ẩn"}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-1 sm:gap-1.5">
                          {/* Upload Chapter Shortcut */}
                          {onSelectStoryForUpload && (
                            <button
                              onClick={() => onSelectStoryForUpload(story.id)}
                              title="Up chương mới cho truyện này"
                              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-amber-600 dark:text-zinc-700 dark:text-zinc-300 hover:bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-900 text-white hover:text-white font-semibold transition-colors flex items-center gap-1"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Up chương</span>
                            </button>
                          )}

                          {/* Manage Chapters */}
                          {onSelectStoryForDetails && (
                            <button
                              onClick={() => onSelectStoryForDetails(story.id)}
                              title="Xem danh sách chương & quản lý"
                              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-slate-100 dark:bg-zinc-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold transition-colors flex items-center gap-1"
                            >
                              <Layers className="w-3.5 h-3.5" />
                              <span className="hidden lg:inline">Chương</span>
                            </button>
                          )}

                          {/* Edit Story */}
                          <button
                            onClick={() => {
                              setStoryToEdit(story);
                              setStoryModalOpen(true);
                            }}
                            title="Sửa thông tin truyện"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-100 dark:bg-zinc-800 transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {/* Preview on User Web */}
                          {onPreviewOnUserWeb && (
                            <button
                              onClick={() => onPreviewOnUserWeb(story.id)}
                              title="Xem truyện trên trang đọc giả"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-zinc-100 dark:bg-zinc-800 transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Delete Story */}
                          <button
                            onClick={() => setDeleteTarget(story)}
                            title="Xoá truyện"
                            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Story Modal */}
      <AdminStoryModal
        isOpen={storyModalOpen}
        onClose={() => setStoryModalOpen(false)}
        storyToEdit={storyToEdit}
        onSuccess={() => {
          loadStories();
        }}
      />

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white dark:bg-zinc-900/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 max-w-md w-full space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-black text-lg text-slate-900 dark:text-white">
                Xác nhận xoá truyện?
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Bạn có chắc chắn muốn xoá truyện <strong>"{deleteTarget.title}"</strong> cùng toàn bộ các quyển và chương truyện liên quan?
              </p>
            </div>

            <div className="pt-3 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleteLoading}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-100 dark:bg-zinc-800"
              >
                Huỷ bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteLoading}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/25 transition-all"
              >
                {deleteLoading ? "Đang xoá..." : "Xác nhận xoá"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
