import React, { useState, useEffect, useMemo } from "react";
import { 
  Upload, Eye, Plus, Sparkles, BookOpen, 
  Layers, ArrowLeft, AlignLeft
} from "lucide-react";
import { Story } from "../../types/story";
import { storyApi } from "../../api";
import { useToast } from "../common/Toast";

interface AdminChapterUploadViewProps {
  initialStoryId?: string;
  onBack?: () => void;
  onSuccess?: (storyId: string) => void;
}

export const AdminChapterUploadView: React.FC<AdminChapterUploadViewProps> = ({
  initialStoryId,
  onBack,
  onSuccess,
}) => {
  const toast = useToast();
  const [stories, setStories] = useState<Story[]>([]);
  const [selectedStoryId, setSelectedStoryId] = useState<string>(initialStoryId || "");
  const [selectedVolumeId, setSelectedVolumeId] = useState<string>("");
  const [newVolumeTitle, setNewVolumeTitle] = useState("");
  const [showAddVolume, setShowAddVolume] = useState(false);

  const [title, setTitle] = useState("");
  const [chapterNumber, setChapterNumber] = useState<number>(1);
  const [content, setContent] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [previewMode, setPreviewMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Load all stories
  const loadStories = async () => {
    const res = await storyApi.getStories({ includeInactive: true });
    if (res.success) {
      setStories(res.data);
      if (!selectedStoryId && res.data.length > 0) {
        setSelectedStoryId(res.data[0].id);
      }
    }
  };

  useEffect(() => {
    loadStories();
  }, []);

  // Current story object
  const currentStory = useMemo(() => {
    return stories.find((s) => s.id === selectedStoryId) || stories[0];
  }, [stories, selectedStoryId]);

  // Set default volume and next chapter number whenever currentStory changes
  useEffect(() => {
    if (currentStory) {
      if (currentStory.volumes.length > 0) {
        setSelectedVolumeId(currentStory.volumes[0].id);
      }

      // Calculate next chapter number
      const totalChapters = currentStory.volumes.reduce(
        (acc, v) => acc + v.chapters.length,
        0
      );
      const nextNum = totalChapters + 1;
      setChapterNumber(nextNum);
      if (!title) {
        setTitle(`Chương ${nextNum}`);
      }
    }
  }, [currentStory]);

  const wordCount = useMemo(() => {
    if (!content.trim()) return 0;
    return content.trim().split(/\s+/).filter(Boolean).length;
  }, [content]);

  // Quick text formatting helpers
  const handleInsertDivider = () => {
    setContent((prev) => prev + "\n\n* * *\n\n");
  };

  const handleFormatParagraphs = () => {
    const formatted = content
      .split("\n")
      .map((p) => p.trim())
      .filter(Boolean)
      .join("\n\n");
    setContent(formatted);
    toast.info("Đã chuẩn hoá khoảng cách các đoạn văn");
  };

  const handleInsertSample = () => {
    const sample = `Ánh bình minh vừa ló dạng sau rặng núi xa, những tia nắng vàng óng ả xuyên qua kẽ lá rọi xuống mặt đất còn đọng sương đêm.

Hàn Lập hít một hơi thật sâu, cảm nhận luồng linh khí thanh thuần tràn ngập trong lồng ngực. Sau ba năm khổ tu tại động phủ, bình cảnh Trúc Cơ trung kỳ rốt cuộc cũng có dấu hiệu buông lỏng.

"Cơ duyên đã đến, không thể bỏ lỡ thời khắc này!" - Hàn Lập lẩm bẩm trong miệng, hai tay nhanh chóng kết ấn.

Chiếc bình nhỏ màu xanh lục bảo trong đan điền khẽ rung lên, một giọt chất lỏng xanh biếc lấp lánh như ngọc từ từ bay ra, hóa thành luồng sương mù bao bọc lấy toàn thân hắn.`;
    setContent(sample);
    if (!title || title.startsWith("Chương")) {
      setTitle(`Chương ${chapterNumber}: Đột Phá Bình Cảnh`);
    }
  };

  const handleCreateNewVolume = async () => {
    if (!newVolumeTitle.trim()) {
      toast.error("Vui lòng nhập tên quyển mới");
      return;
    }
    if (!currentStory) return;

    const res = await storyApi.addVolume(currentStory.id, newVolumeTitle.trim());
    if (res.success) {
      toast.success(`Đã tạo ${res.data.title}`);
      setNewVolumeTitle("");
      setShowAddVolume(false);
      // Reload story
      await loadStories();
      setSelectedVolumeId(res.data.id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStoryId) {
      toast.error("Vui lòng chọn truyện");
      return;
    }
    if (!content.trim()) {
      toast.error("Vui lòng nhập nội dung chương");
      return;
    }

    setSubmitting(true);
    const res = await storyApi.createChapter({
      storyId: selectedStoryId,
      volumeId: selectedVolumeId,
      title: title.trim() || `Chương ${chapterNumber}`,
      number: chapterNumber,
      content,
      isActive,
    });

    setSubmitting(false);

    if (res.success) {
      toast.success(
        isActive
          ? "Đã đăng chương mới thành công lên Web Đọc!"
          : "Đã lưu nháp chương thành công (Inactive)"
      );

      // Reset form for next chapter
      setContent("");
      const nextNum = chapterNumber + 1;
      setChapterNumber(nextNum);
      setTitle(`Chương ${nextNum}`);

      if (onSuccess) {
        onSuccess(selectedStoryId);
      }
    } else {
      toast.error(res.error || "Không thể đăng chương");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-white dark:bg-zinc-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-300 dark:border-zinc-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Upload className="w-6 h-6 text-zinc-900 dark:text-white" />
              <span>Đăng tải chương mới (Up Chương)</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Soạn thảo và phát hành chương truyện mới kết nối trực tiếp đến giao diện độc giả.
            </p>
          </div>
        </div>

        {/* Live Preview Mode Switch */}
        <button
          type="button"
          onClick={() => setPreviewMode(!previewMode)}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
            previewMode
              ? "bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-900 text-white text-white"
              : "bg-white dark:bg-zinc-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-300 dark:border-zinc-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100"
          }`}
        >
          <Eye className="w-4 h-4" />
          <span>{previewMode ? "Quay lại soạn thảo" : "Xem trước độc giả"}</span>
        </button>
      </div>

      {previewMode ? (
        /* Live Reader Preview Box */
        <div className="p-6 sm:p-10 rounded-3xl bg-white dark:bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-200 dark:border-zinc-800 shadow-lg max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
          <div className="text-center pb-6 border-b border-slate-100 dark:border-zinc-200 dark:border-zinc-800">
            <span className="text-xs font-bold text-amber-600 uppercase tracking-widest">
              {currentStory?.title}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
              {title || `Chương ${chapterNumber}`}
            </h1>
            <p className="text-xs text-slate-400 mt-2 font-mono">
              {wordCount} chữ • Bản xem trước quản trị
            </p>
          </div>

          <div className="text-base sm:text-lg leading-relaxed text-slate-800 dark:text-slate-200 font-serif whitespace-pre-wrap space-y-4">
            {content ? content : <p className="text-slate-400 italic">Chưa có nội dung văn bản...</p>}
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-zinc-200 dark:border-zinc-800 flex justify-center">
            <button
              onClick={() => setPreviewMode(false)}
              className="px-6 py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-100 dark:bg-zinc-800 font-bold text-xs hover:bg-slate-200 text-slate-700 dark:text-slate-200"
            >
              ← Trở về chỉnh sửa
            </button>
          </div>
        </div>
      ) : (
        /* Upload & Editor Form */
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Column: Content Editor (2 cols) */}
          <div className="lg:col-span-2 space-y-5">
            {/* Chapter Title & Number */}
            <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Số thứ tự chương
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={chapterNumber}
                    onChange={(e) => setChapterNumber(parseInt(e.target.value) || 1)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-100 dark:bg-zinc-800 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-mono"
                    required
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Tiêu đề chương <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ví dụ: Chương 10: Cơ duyên đột phá..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-100 dark:bg-zinc-800 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Text Formatting Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-zinc-200 dark:border-zinc-800 text-xs">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleFormatParagraphs}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-zinc-100 dark:bg-zinc-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1 transition-colors"
                    title="Tự động giãn dòng các đoạn văn"
                  >
                    <AlignLeft className="w-3.5 h-3.5" />
                    <span>Chuẩn hoá đoạn</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleInsertDivider}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-zinc-100 dark:bg-zinc-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold transition-colors"
                  >
                    + Dấu phân cách (* * *)
                  </button>

                  <button
                    type="button"
                    onClick={handleInsertSample}
                    className="px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-amber-600 dark:text-zinc-700 dark:text-zinc-300 hover:bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-900 text-white/20 font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Chèn mẫu nhanh</span>
                  </button>
                </div>

                <span className="font-mono text-slate-500 font-medium">
                  {wordCount.toLocaleString()} từ
                </span>
              </div>

              {/* Content Textarea */}
              <div>
                <textarea
                  rows={14}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Dán hoặc soạn thảo toàn bộ nội dung chương truyện tại đây..."
                  className="w-full p-4 rounded-xl border border-slate-200 dark:border-zinc-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-100 dark:bg-zinc-800/60 text-slate-900 dark:text-white text-sm font-sans leading-relaxed placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all resize-y min-h-[320px]"
                  required
                />
              </div>
            </div>
          </div>

          {/* Side Column: Target Story, Volume, Publish Settings (1 col) */}
          <div className="space-y-5">
            {/* Story Picker */}
            <div className="p-5 rounded-2xl bg-white dark:bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-zinc-900 dark:text-white" />
                <span>Chọn truyện phát hành</span>
              </h3>

              <div>
                <select
                  value={selectedStoryId}
                  onChange={(e) => setSelectedStoryId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-100 dark:bg-zinc-800 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                >
                  {stories.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title} ({s.author})
                    </option>
                  ))}
                </select>
              </div>

              {currentStory && (
                <div className="flex gap-3 p-3 rounded-xl bg-slate-50 dark:bg-zinc-100 dark:bg-zinc-800/60 border border-slate-100 dark:border-zinc-200 dark:border-zinc-800 items-center">
                  <img
                    src={currentStory.coverImage}
                    alt=""
                    className="w-12 h-16 object-cover rounded-lg shadow-sm flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-xs text-slate-900 dark:text-white truncate">
                      {currentStory.title}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {currentStory.volumes.length} quyển •{" "}
                      {currentStory.volumes.reduce((acc, v) => acc + v.chapters.length, 0)} chương hiện có
                    </p>
                    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-1.5 ${
                      currentStory.isActive !== false
                        ? "bg-emerald-500/10 text-emerald-600"
                        : "bg-zinc-100 dark:bg-zinc-800 text-amber-600"
                    }`}>
                      {currentStory.isActive !== false ? "Đang hiện" : "Tạm ẩn"}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Volume Picker & Quick Add */}
            <div className="p-5 rounded-2xl bg-white dark:bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-zinc-900 dark:text-white" />
                  <span>Quyển / Tập</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddVolume(!showAddVolume)}
                  className="text-xs font-bold text-amber-600 dark:text-zinc-700 dark:text-zinc-300 hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tạo quyển mới</span>
                </button>
              </div>

              {showAddVolume ? (
                <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-amber-500/20 space-y-2">
                  <input
                    type="text"
                    value={newVolumeTitle}
                    onChange={(e) => setNewVolumeTitle(e.target.value)}
                    placeholder="Ví dụ: Quyển 2: Loạn Thế Tương Phùng..."
                    className="w-full px-3 py-2 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-zinc-100 dark:bg-zinc-800 text-xs font-medium focus:outline-none"
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setShowAddVolume(false)}
                      className="px-2.5 py-1 text-[11px] font-bold text-slate-600"
                    >
                      Huỷ
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateNewVolume}
                      className="px-3 py-1 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-900 text-white text-white rounded-lg text-[11px] font-bold shadow-sm"
                    >
                      Lưu quyển
                    </button>
                  </div>
                </div>
              ) : (
                <select
                  value={selectedVolumeId}
                  onChange={(e) => setSelectedVolumeId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-100 dark:bg-zinc-800 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                >
                  {currentStory?.volumes.map((vol) => (
                    <option key={vol.id} value={vol.id}>
                      {vol.title} ({vol.chapters.length} chương)
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Publishing Settings & Actions */}
            <div className="p-5 rounded-2xl bg-white dark:bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Trạng thái phát hành
              </h3>

              <div className="flex items-center gap-3">
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
                  {isActive ? "🟢 Xuất bản ngay (Active)" : "⚪ Lưu nháp ẩn (Inactive)"}
                </span>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-900 text-white hover:bg-amber-600 active:scale-98 text-white font-bold text-sm shadow-md shadow-amber-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Upload className={`w-4 h-4 ${submitting ? "animate-bounce" : ""}`} />
                <span>{submitting ? "Đang đăng chương..." : "Đăng chương ngay"}</span>
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
