import React, { useState, useEffect } from "react";
import { X, Check } from "lucide-react";
import { Story, StoryGenre, StoryStatus } from "../../types/story";
import { storyApi } from "../../api";
import { useToast } from "../common/Toast";

const AVAILABLE_GENRES: StoryGenre[] = [
  "Tiên Hiệp",
  "Kiếm Hiệp",
  "Huyền Huyễn",
  "Đô Thị",
  "Khoa Huyễn",
  "Võng Du",
  "Trinh Thám",
  "Ngôn Tình",
  "Lịch Sử",
  "Hài Hước",
  "Hệ Thống",
  "Dị Giới",
];

const PRESET_COVERS = [
  "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80",
];

interface AdminStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  storyToEdit?: Story | null;
  onSuccess: () => void;
}

export const AdminStoryModal: React.FC<AdminStoryModalProps> = ({
  isOpen,
  onClose,
  storyToEdit,
  onSuccess,
}) => {
  const toast = useToast();
  const isEditing = !!storyToEdit;

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [coverImage, setCoverImage] = useState(PRESET_COVERS[0]);
  const [genres, setGenres] = useState<StoryGenre[]>(["Huyền Huyễn"]);
  const [status, setStatus] = useState<StoryStatus>("Đang ra");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [hot, setHot] = useState(false);
  const [featured, setFeatured] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (storyToEdit) {
      setTitle(storyToEdit.title);
      setAuthor(storyToEdit.author);
      setCoverImage(storyToEdit.coverImage);
      setGenres(storyToEdit.genres.filter((g) => g !== "Tất cả") as StoryGenre[]);
      setStatus(storyToEdit.status);
      setDescription(storyToEdit.description);
      setIsActive(storyToEdit.isActive !== false);
      setHot(!!storyToEdit.hot);
      setFeatured(!!storyToEdit.featured);
    } else {
      setTitle("");
      setAuthor("");
      setCoverImage(PRESET_COVERS[0]);
      setGenres(["Huyền Huyễn"]);
      setStatus("Đang ra");
      setDescription("");
      setIsActive(true);
      setHot(false);
      setFeatured(false);
    }
  }, [storyToEdit, isOpen]);

  if (!isOpen) return null;

  const toggleGenre = (genre: StoryGenre) => {
    setGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Vui lòng nhập tên truyện");
      return;
    }
    if (genres.length === 0) {
      toast.error("Vui lòng chọn ít nhất một thể loại");
      return;
    }

    setLoading(true);

    if (isEditing && storyToEdit) {
      const res = await storyApi.updateStory(storyToEdit.id, {
        title,
        author,
        coverImage,
        genres,
        status,
        description,
        isActive,
        hot,
        featured,
      });

      setLoading(false);
      if (res.success) {
        toast.success("Đã cập nhật truyện thành công!");
        onSuccess();
        onClose();
      } else {
        toast.error(res.error || "Có lỗi xảy ra khi cập nhật");
      }
    } else {
      const res = await storyApi.createStory({
        title,
        author: author || "Chưa rõ",
        coverImage,
        genres,
        status,
        description,
        isActive,
        hot,
        featured,
      });

      setLoading(false);
      if (res.success) {
        toast.success("Tạo truyện mới thành công!");
        onSuccess();
        onClose();
      } else {
        toast.error(res.error || "Có lỗi xảy ra khi tạo truyện");
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-150 my-8">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>{isEditing ? "Chỉnh sửa thông tin truyện" : "Tạo truyện mới"}</span>
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Title & Author */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Tên truyện <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ví dụ: Phàm Nhân Tu Tiên..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Tác giả
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Ví dụ: Vong Ngữ..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
              />
            </div>
          </div>

          {/* Cover Image & Presets */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Ảnh bìa truyện (URL hoặc chọn mẫu có sẵn)
            </label>
            <div className="flex gap-3 items-center">
              <input
                type="text"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="https://..."
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
              />
              <img
                src={coverImage}
                alt="Preview"
                className="w-10 h-13 object-cover rounded-lg border border-slate-200 dark:border-slate-700 flex-shrink-0 bg-slate-100"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = PRESET_COVERS[0];
                }}
              />
            </div>

            {/* Presets Grid */}
            <div className="flex gap-2 overflow-x-auto py-2 mt-1.5">
              {PRESET_COVERS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCoverImage(preset)}
                  className={`w-12 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${
                    coverImage === preset
                      ? "border-amber-500 scale-105 shadow-md"
                      : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={preset} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Genres (Multi Select) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Thể loại truyện (Chọn một hoặc nhiều) <span className="text-rose-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_GENRES.map((g) => {
                const selected = genres.includes(g);
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => toggleGenre(g)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      selected
                        ? "bg-amber-500 text-white shadow-sm"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    {selected && <Check className="w-3 h-3" />}
                    <span>{g}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status & Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Trạng thái tiến độ
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as StoryStatus)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
              >
                <option value="Đang ra">Đang ra</option>
                <option value="Hoàn thành">Hoàn thành</option>
                <option value="Tạm dừng">Tạm dừng</option>
              </select>
            </div>

            {/* Active / Inactive Switch */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Hiển thị trên Web Đọc (Active)
              </label>
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`w-12 h-6.5 rounded-full transition-colors relative p-0.5 ${
                    isActive ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"
                  }`}
                >
                  <div
                    className={`w-5.5 h-5.5 rounded-full bg-white shadow-md transform transition-transform ${
                      isActive ? "translate-x-5.5" : "translate-x-0"
                    }`}
                  />
                </button>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {isActive ? "🟢 Đang hiển thị (Active)" : "⚪ Tạm ẩn khỏi User Web (Inactive)"}
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Giới thiệu / Tóm tắt nội dung truyện
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nhập tóm tắt bối cảnh, nhân vật chính, điểm lôi cuốn..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all leading-relaxed"
            />
          </div>

          {/* Badges Toggle */}
          <div className="flex items-center gap-4 pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={hot}
                onChange={(e) => setHot(e.target.checked)}
                className="rounded text-amber-500 focus:ring-amber-500 w-4 h-4"
              />
              <span>Gắn huy hiệu HOT 🔥</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="rounded text-amber-500 focus:ring-amber-500 w-4 h-4"
              />
              <span>Nổi bật (Featured) ⭐</span>
            </label>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Huỷ bỏ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 active:scale-95 text-white transition-all shadow-md shadow-amber-500/20 disabled:opacity-50"
            >
              {loading ? "Đang xử lý..." : isEditing ? "Lưu thay đổi" : "Tạo truyện"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
