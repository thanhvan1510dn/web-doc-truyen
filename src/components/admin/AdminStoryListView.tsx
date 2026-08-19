import React, { useState, useEffect, useMemo } from "react";
import { 
  Search, Edit, Trash2, Upload, BookOpen, Layers, 
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
          ? "Đã hiển thị truyện: " + story.title
          : "Đã tạm ẩn truyện: " + story.title
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
      toast.success("Đã xoá truyện " + deleteTarget.title);
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
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-zinc-900" />
            <span>Quản lý Danh sách Truyện</span>
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
            Tạo truyện mới, chỉnh sửa, bật/tắt hiển thị và quản lý nội dung các chương.
          </p>
        </div>

        <button
          onClick={() => {
            setStoryToEdit(null);
            setStoryModalOpen(true);
          }}
          className="flex items-center justify-center px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 active:scale-95 text-white text-xs font-semibold shadow-sm transition-all self-start sm:self-auto"
        >
          <span>Tạo truyện mới</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-3.5 rounded-2xl bg-white border border-zinc-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm truyện theo tên hoặc tác giả..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-zinc-200 bg-zinc-50 text-xs font-medium text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
          </div>

          {/* Status Tabs Filter */}
          <div className="flex items-center p-1 rounded-xl bg-zinc-100 text-xs font-semibold">
            <button
              onClick={() => setSelectedStatus("all")}
              className={"px-3 py-1.5 rounded-lg transition-all " + (
                selectedStatus === "all"
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-900"
              )}
            >
              Tất cả ({stories.length})
            </button>
            <button
              onClick={() => setSelectedStatus("active")}
              className={"px-3 py-1.5 rounded-lg transition-all " + (
                selectedStatus === "active"
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-900"
              )}
            >
              Đang hiện ({stories.filter((s) => s.isActive !== false).length})
            </button>
            <button
              onClick={() => setSelectedStatus("inactive")}
              className={"px-3 py-1.5 rounded-lg transition-all " + (
                selectedStatus === "inactive"
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-900"
              )}
            >
              Tạm ẩn ({stories.filter((s) => s.isActive === false).length})
            </button>
          </div>
        </div>
      </div>

      {/* Stories Table */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        {filteredStories.length === 0 ? (
          <div className="py-16 text-center text-zinc-400">
            <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-medium">Không tìm thấy truyện nào phù hợp</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                  <th className="py-3 px-4 sm:px-6">Truyện</th>
                  <th className="py-3 px-4 hidden md:table-cell">Thể loại</th>
                  <th className="py-3 px-4 text-center">Số chương</th>
                  <th className="py-3 px-4 text-center hidden sm:table-cell">Lượt xem</th>
                  <th className="py-3 px-4 text-center">Trạng thái</th>
                  <th className="py-3 px-4 sm:px-6 text-right">Tác vụ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-xs">
                {filteredStories.map((story) => {
                  const totalChaps = getTotalChapters(story);
                  const isStoryActive = story.isActive !== false;

                  return (
                    <tr
                      key={story.id}
                      className="hover:bg-zinc-50/80 transition-colors group"
                    >
                      {/* Story Info */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <img
                            src={story.coverImage}
                            alt={story.title}
                            className="w-10 h-14 object-cover rounded-lg shadow-sm flex-shrink-0 bg-zinc-100"
                          />
                          <div className="min-w-0 max-w-xs sm:max-w-sm">
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-semibold text-sm text-zinc-900 truncate">
                                {story.title}
                              </h4>
                              {story.hot && (
                                <span className="px-1.5 py-0.5 rounded bg-zinc-900 text-white text-[10px] font-bold">
                                  HOT
                                </span>
                              )}
                            </div>
                            <p className="text-zinc-500 mt-0.5 truncate text-xs">
                              Tác giả: <span className="text-zinc-700 font-medium">{story.author}</span>
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
                              className="px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 text-[11px] font-medium"
                            >
                              {g}
                            </span>
                          ))}
                          {story.genres.length > 2 && (
                            <span className="text-[10px] text-zinc-400 self-center">
                              +{story.genres.length - 2}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Chapters Count */}
                      <td className="py-3.5 px-4 text-center font-mono font-medium text-zinc-700">
                        {totalChaps} chương
                      </td>

                      {/* Views */}
                      <td className="py-3.5 px-4 text-center font-mono font-medium text-zinc-700 hidden sm:table-cell">
                        {formatNumber(story.views)}
                      </td>

                      {/* Active / Inactive Toggle Switch */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(story)}
                            title={isStoryActive ? "Gạt để tạm ẩn" : "Gạt để hiện"}
                            className={"w-9 h-5 rounded-full transition-colors relative p-0.5 " + (
                              isStoryActive ? "bg-zinc-900" : "bg-zinc-300"
                            )}
                          >
                            <div
                              className={"w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform " + (
                                isStoryActive ? "translate-x-4" : "translate-x-0"
                              )}
                            />
                          </button>
                          <span className={"text-[11px] font-semibold " + (
                            isStoryActive ? "text-zinc-900" : "text-zinc-400"
                          )}>
                            {isStoryActive ? "Hiện" : "Ẩn"}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Upload Chapter Shortcut */}
                          {onSelectStoryForUpload && (
                            <button
                              type="button"
                              onClick={() => onSelectStoryForUpload(story.id)}
                              title="Up chương mới"
                              className="px-2.5 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 font-semibold text-xs transition-colors flex items-center gap-1 shadow-sm"
                            >
                              <Upload className="w-3.5 h-3.5 text-zinc-500" />
                              <span className="hidden sm:inline">Up chương</span>
                            </button>
                          )}

                          {/* Manage Chapters */}
                          {onSelectStoryForDetails && (
                            <button
                              type="button"
                              onClick={() => onSelectStoryForDetails(story.id)}
                              title="Xem danh sách chương"
                              className="px-2.5 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 font-semibold text-xs transition-colors flex items-center gap-1 shadow-sm"
                            >
                              <Layers className="w-3.5 h-3.5 text-zinc-500" />
                              <span className="hidden lg:inline">Chương</span>
                            </button>
                          )}

                          {/* Edit Story */}
                          <button
                            type="button"
                            onClick={() => {
                              setStoryToEdit(story);
                              setStoryModalOpen(true);
                            }}
                            title="Sửa thông tin truyện"
                            className="p-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-600 transition-colors shadow-sm"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {/* Preview on User Web */}
                          {onPreviewOnUserWeb && (
                            <button
                              type="button"
                              onClick={() => onPreviewOnUserWeb(story.id)}
                              title="Xem trên Web đọc"
                              className="p-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-600 transition-colors shadow-sm"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Delete Story */}
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(story)}
                            title="Xoá truyện"
                            className="p-1.5 rounded-lg border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 transition-colors shadow-sm"
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

      {/* Story Create/Edit Modal */}
      {storyModalOpen && (
        <AdminStoryModal
          isOpen={storyModalOpen}
          storyToEdit={storyToEdit}
          onClose={() => setStoryModalOpen(false)}
          onSuccess={() => {
            setStoryModalOpen(false);
            loadStories();
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 w-full max-w-md space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-zinc-900">
                Xác nhận xoá truyện?
              </h3>
              <p className="text-xs text-zinc-500">
                Bạn có chắc chắn muốn xoá truyện <strong>"{deleteTarget.title}"</strong>? Toàn bộ các chương thuộc truyện sẽ bị xoá vĩnh viễn.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-all"
              >
                Huỷ bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteLoading}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
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
