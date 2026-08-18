import React, { useState, useEffect, useRef } from "react";
import { X, Upload, Image } from "lucide-react";
import { Story, StoryStatus } from "../../types/story";
import { storyApi } from "../../api";
import { useToast } from "../common/Toast";

const COMMON_GENRES = [
  "Nguyên sang", "Ngôn tình", "Vô cp", "Cổ đại", "Hiện đại", "HE", "Tình cảm", 
  "Khoa học viễn tưởng", "Huyền huyễn", "Hệ thống", "Xuyên nhanh", "Nữ phụ", 
  "Vô hạn lưu", "Thăng cấp lưu", "Sảng văn", "Pháo hôi", "Nữ cường", "Ngược tra", "Nghịch tập"
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEditing = !!storyToEdit;

  const [title, setTitle] = useState("");
  const [hanVietTitle, setHanVietTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [originalStatus, setOriginalStatus] = useState("Hoàn thành");
  const [editStatus, setEditStatus] = useState("Đang chạy...");
  const [status, setStatus] = useState<StoryStatus>("Đang ra");
  const [genresInput, setGenresInput] = useState("");
  const [editorBeta, setEditorBeta] = useState("");
  const [coverCredit, setCoverCredit] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [convertSource, setConvertSource] = useState("wikidich.com");
  const [convertLink, setConvertLink] = useState("");
  const [description, setDescription] = useState("");
  const [warning, setWarning] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [hot, setHot] = useState(false);
  const [featured, setFeatured] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (storyToEdit) {
      setTitle(storyToEdit.title || "");
      setHanVietTitle(storyToEdit.hanVietTitle || "");
      setAuthor(storyToEdit.author || "");
      setOriginalStatus(storyToEdit.originalStatus || "Hoàn thành");
      setEditStatus(storyToEdit.editStatus || "Đang chạy...");
      setStatus(storyToEdit.status || "Đang ra");
      setGenresInput((storyToEdit.genres || []).join(", "));
      setEditorBeta(storyToEdit.editorBeta || "");
      setCoverCredit(storyToEdit.coverCredit || "");
      setCoverImage(storyToEdit.coverImage || "");
      setConvertSource(storyToEdit.convertSource || "");
      setConvertLink(storyToEdit.convertLink || "");
      setDescription(storyToEdit.description || "");
      setWarning(storyToEdit.warning || "");
      setIsActive(storyToEdit.isActive !== false);
      setHot(!!storyToEdit.hot);
      setFeatured(!!storyToEdit.featured);
    } else {
      setTitle("");
      setHanVietTitle("");
      setAuthor("");
      setOriginalStatus("Hoàn thành");
      setEditStatus("Đang chạy...");
      setStatus("Đang ra");
      setGenresInput("Nguyên sang, Ngôn tình, Hệ thống, Xuyên nhanh, Nữ cường");
      setEditorBeta("");
      setCoverCredit("");
      setCoverImage("https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80");
      setConvertSource("wikidich.com");
      setConvertLink("");
      setDescription("");
      setWarning("");
      setIsActive(true);
      setHot(false);
      setFeatured(false);
    }
  }, [storyToEdit, isOpen]);

  if (!isOpen) return null;

  // Handle Cover Image Upload from file
  const handleCoverUpload = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn tệp hình ảnh");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setCoverImage(e.target.result as string);
        toast.success("Đã tải ảnh bìa lên thành công!");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddGenreTag = (tag: string) => {
    const currentTags = genresInput
      .split(/[,，]/)
      .map((t) => t.trim())
      .filter(Boolean);
    if (!currentTags.includes(tag)) {
      currentTags.push(tag);
      setGenresInput(currentTags.join(", "));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Vui lòng nhập tên truyện");
      return;
    }

    const parsedGenres = genresInput
      .split(/[,，]/)
      .map((t) => t.trim())
      .filter(Boolean);

    setLoading(true);

    const storyData: Partial<Story> = {
      title: title.trim(),
      hanVietTitle: hanVietTitle.trim(),
      author: author.trim() || "Chưa rõ",
      originalStatus: originalStatus.trim(),
      editStatus: editStatus.trim(),
      status,
      genres: parsedGenres.length > 0 ? parsedGenres : ["Huyền Huyễn"],
      editorBeta: editorBeta.trim(),
      coverCredit: coverCredit.trim(),
      coverImage: coverImage.trim() || "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80",
      convertSource: convertSource.trim(),
      convertLink: convertLink.trim(),
      description: description.trim() || "Chưa có văn án.",
      warning: warning.trim(),
      isActive,
      hot,
      featured,
    };

    try {
      if (isEditing && storyToEdit) {
        const res = await storyApi.updateStory(storyToEdit.id, storyData);
        if (res.success) {
          toast.success("Cập nhật thông tin truyện thành công!");
          onSuccess();
        } else {
          toast.error(res.error || "Không thể cập nhật truyện");
        }
      } else {
        const res = await storyApi.createStory({
          ...storyData,
          volumes: [],
        } as any);
        if (res.success) {
          toast.success("Tạo truyện mới thành công!");
          onSuccess();
        } else {
          toast.error(res.error || "Không thể tạo truyện");
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-3xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-zinc-900">
              {isEditing ? "Chỉnh sửa Thông tin Truyện" : "Tạo Truyện Mới"}
            </h3>
            <p className="text-xs text-zinc-500">
              Điền đầy đủ thông tin chi tiết, văn án và tải ảnh bìa lên.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Section 1: Cover Image Upload & Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Cover Upload Box */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-zinc-700">
                Bìa truyện
              </label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="group relative w-full h-56 rounded-xl border-2 border-dashed border-zinc-200 hover:border-zinc-400 bg-zinc-50 flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all shadow-sm"
              >
                {coverImage ? (
                  <>
                    <img
                      src={coverImage}
                      alt="Bìa truyện"
                      className="w-full h-full object-cover group-hover:opacity-75 transition-opacity"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity text-xs font-semibold gap-1">
                      <Upload className="w-5 h-5" />
                      <span>Đổi ảnh khác</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-3 space-y-1">
                    <Image className="w-8 h-8 text-zinc-400 mx-auto" />
                    <p className="text-xs font-semibold text-zinc-600">Bấm để tải ảnh lên</p>
                    <p className="text-[10px] text-zinc-400">PNG, JPG, WEBP</p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleCoverUpload(e.target.files[0]);
                  }
                }}
              />

              <div>
                <label className="block text-[11px] font-medium text-zinc-500 mb-0.5">
                  Người làm bìa (Designer / Nguồn bìa)
                </label>
                <input
                  type="text"
                  value={coverCredit}
                  onChange={(e) => setCoverCredit(e.target.value)}
                  placeholder="VD: Cục Bông Nho Nhỏ (Fb)"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 bg-zinc-50 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                />
              </div>
            </div>

            {/* Basic Titles & Author */}
            <div className="md:col-span-2 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Tên truyện chính <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="VD: Bút Ký Phản Công Của Nữ Phụ Pháo Hôi"
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-zinc-50 text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Tên Hán Việt
                </label>
                <input
                  type="text"
                  value={hanVietTitle}
                  onChange={(e) => setHanVietTitle(e.target.value)}
                  placeholder="VD: Khoái xuyên chi pháo hôi nữ xứng nghịch tập ký."
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-zinc-50 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Tác giả
                  </label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="VD: Ngận Thị Kiều Tình"
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-zinc-50 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Editor + Beta
                  </label>
                  <input
                    type="text"
                    value={editorBeta}
                    onChange={(e) => setEditorBeta(e.target.value)}
                    placeholder="VD: Ethyl Ether, Đậu, Fangzhen..."
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-zinc-50 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                  />
                </div>
              </div>

              {/* Status Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Tình trạng bản gốc
                  </label>
                  <input
                    type="text"
                    value={originalStatus}
                    onChange={(e) => setOriginalStatus(e.target.value)}
                    placeholder="VD: Hoàn thành"
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-zinc-50 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Tình trạng bản edit
                  </label>
                  <input
                    type="text"
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    placeholder="VD: Đang chạy... / Hoàn thành"
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-zinc-50 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Genres / Tags */}
          <div className="space-y-1.5 pt-1">
            <label className="block text-xs font-semibold text-zinc-700">
              Thể loại & Thẻ tag (Ngăn cách bằng dấu phẩy)
            </label>
            <input
              type="text"
              value={genresInput}
              onChange={(e) => setGenresInput(e.target.value)}
              placeholder="VD: Nguyên sang, ngôn tình, vô cp, cổ đại, hiện đại, HE, hệ thống, xuyên nhanh, nữ cường..."
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-zinc-50 text-xs font-medium text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
            <div className="flex flex-wrap gap-1.5 pt-1">
              {COMMON_GENRES.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleAddGenreTag(tag)}
                  className="px-2 py-0.5 rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-600 text-[11px] font-medium transition-colors"
                >
                  + {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Section 3: Convert Source & Link */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Nguồn convert
              </label>
              <input
                type="text"
                value={convertSource}
                onChange={(e) => setConvertSource(e.target.value)}
                placeholder="VD: wikidich.com"
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-zinc-50 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Link bản convert truyện
              </label>
              <input
                type="text"
                value={convertLink}
                onChange={(e) => setConvertLink(e.target.value)}
                placeholder="VD: https://wikidich.com/truyen/..."
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-zinc-50 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
            </div>
          </div>

          {/* Section 4: Văn án (Description) */}
          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-zinc-700">
                Văn án (Tóm tắt / Giới thiệu nội dung truyện)
              </label>
              <span className="text-[10px] text-amber-600 font-medium">
                Hỗ trợ gán link: https://... hoặc [Tên link](https://...)
              </span>
            </div>
            <textarea
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nhập văn án tác phẩm... Bạn có thể dán đường link https://... hoặc cú pháp [Tên link](https://...) để người đọc bấm vào."
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-xs font-serif leading-relaxed text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
          </div>

          {/* Section 5: Warning (Cảnh báo) */}
          <div className="space-y-1 pt-1">
            <label className="block text-xs font-semibold text-zinc-700">
              Cảnh báo (Warning)
            </label>
            <textarea
              rows={2}
              value={warning}
              onChange={(e) => setWarning(e.target.value)}
              placeholder="VD: Hãy suy nghĩ kĩ trước khi nhảy hố, bởi mặc dù tác giả gắn tag ngôn tình và HE..."
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-zinc-50 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
          </div>

          {/* Section 6: Status & Badges */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-zinc-100 text-xs font-semibold">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer select-none text-zinc-700">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded text-zinc-900 w-4 h-4"
                />
                <span>Hiển thị trên Web Đọc (Active)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none text-zinc-700">
                <input
                  type="checkbox"
                  checked={hot}
                  onChange={(e) => setHot(e.target.checked)}
                  className="rounded text-zinc-900 w-4 h-4"
                />
                <span>Huy hiệu HOT 🔥</span>
              </label>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-zinc-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 hover:bg-zinc-100 transition-colors"
            >
              Huỷ bỏ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
            >
              {loading ? "Đang lưu..." : isEditing ? "Lưu thay đổi" : "Tạo truyện"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
