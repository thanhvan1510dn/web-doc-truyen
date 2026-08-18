import React, { useState, useEffect, useRef } from "react";
import { 
  FileUp, CheckCircle2, Sparkles, RefreshCw, 
  ChevronDown, ChevronUp, Eye, ArrowRight, X, Edit3, Check
} from "lucide-react";
import { storyApi } from "../../api";
import { Story, StoryGenre } from "../../types/story";
import { documentParserService, DocumentParseResult } from "../../services/documentParserService";
import { useToast } from "../common/Toast";

interface AdminPDFUploadStudioProps {
  onSuccess?: (storyId: string) => void;
}

export const AdminPDFUploadStudio: React.FC<AdminPDFUploadStudioProps> = ({ onSuccess }) => {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stories, setStories] = useState<Story[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseProgress, setParseProgress] = useState(0);
  const [parseStatus, setParseStatus] = useState("");
  const [parseResult, setParseResult] = useState<DocumentParseResult | null>(null);

  // Target Mode: "new" | "existing"
  const [targetMode, setTargetMode] = useState<"new" | "existing">("new");
  const [selectedStoryId, setSelectedStoryId] = useState<string>("");
  const [replaceExisting, setReplaceExisting] = useState(true);

  // New Story Form
  const [newStoryTitle, setNewStoryTitle] = useState("");
  const [newStoryAuthor, setNewStoryAuthor] = useState("");
  const [newStoryGenre, setNewStoryGenre] = useState<StoryGenre>("Huyền Huyễn");
  const [newStoryCover, setNewStoryCover] = useState(
    "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80"
  );
  const [newStoryDesc, setNewStoryDesc] = useState("");

  const [previewChapter, setPreviewChapter] = useState<{ title: string; content: string; wordCount: number } | null>(null);
  const [collapsedVolIds, setCollapsedVolIds] = useState<Record<number, boolean>>({});
  const [editingVolNumber, setEditingVolNumber] = useState<number | null>(null);
  const [editingVolTitle, setEditingVolTitle] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  const loadStories = async () => {
    const res = await storyApi.getStories({ includeInactive: true });
    if (res.success) {
      setStories(res.data);
      if (res.data.length > 0 && !selectedStoryId) {
        setSelectedStoryId(res.data[0].id);
      }
    }
  };

  useEffect(() => {
    loadStories();
  }, []);

  const handleFileChange = async (file: File) => {
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "docx", "txt"].includes(ext || "")) {
      toast.error("Chỉ hỗ trợ file .PDF, .DOCX hoặc .TXT");
      return;
    }

    setSelectedFile(file);
    setIsParsing(true);
    setParseProgress(0);
    setParseStatus("Bắt đầu xử lý...");

    try {
      const result = await documentParserService.parseFile(file, (progress: number, status: string) => {
        setParseProgress(progress);
        setParseStatus(status);
      });

      setParseResult(result);
      if (result.detectedTitle) {
        setNewStoryTitle(result.detectedTitle);
        setNewStoryDesc(`Tác phẩm gồm ${result.totalVolumes} Vị Diện / Hồi truyện trích xuất từ ${file.name}`);
      }

      toast.success(`Đã nhận diện: ${result.totalVolumes} Vị Diện / Hồi & ${result.totalChapters} chương từ các Tab!`);
    } catch (err: any) {
      toast.error(err.message || "Không thể đọc tệp");
    } finally {
      setIsParsing(false);
    }
  };

  const toggleVolumeCollapse = (volNumber: number) => {
    setCollapsedVolIds((prev) => ({
      ...prev,
      [volNumber]: !prev[volNumber],
    }));
  };

  const handleSaveVolTitle = (volNumber: number) => {
    if (!parseResult || !editingVolTitle.trim()) {
      setEditingVolNumber(null);
      return;
    }

    const updatedVolumes = parseResult.volumes.map((v) =>
      v.number === volNumber ? { ...v, title: editingVolTitle.trim() } : v
    );

    setParseResult({
      ...parseResult,
      volumes: updatedVolumes,
    });
    setEditingVolNumber(null);
    toast.success("Đã cập nhật tên Vị Diện / Hồi!");
  };

  const handleConfirmImport = async () => {
    if (!parseResult || parseResult.volumes.length === 0) {
      toast.error("Chưa có dữ liệu chương");
      return;
    }

    setIsSaving(true);

    try {
      if (targetMode === "new") {
        if (!newStoryTitle.trim()) {
          toast.error("Vui lòng nhập tên truyện");
          setIsSaving(false);
          return;
        }

        const res = await storyApi.importAsNewStory(
          {
            title: newStoryTitle.trim(),
            author: newStoryAuthor.trim() || "Chưa rõ",
            coverImage: newStoryCover,
            genres: [newStoryGenre],
            status: "Đang ra",
            description: newStoryDesc.trim() || `Tác phẩm gồm ${parseResult.totalVolumes} Vị Diện / Hồi truyện.`,
            isActive: true,
          },
          parseResult.volumes
        );

        if (res.success) {
          toast.success(`Đã tạo truyện "${res.data.title}" thành công!`);
          if (onSuccess) onSuccess(res.data.id);
        } else {
          toast.error(res.error || "Không thể nhập truyện");
        }
      } else {
        if (!selectedStoryId) {
          toast.error("Vui lòng chọn truyện đích");
          setIsSaving(false);
          return;
        }

        const res = await storyApi.importParsedVolumes(
          selectedStoryId,
          parseResult.volumes,
          replaceExisting
        );

        if (res.success) {
          toast.success("Đã nạp nội dung vào truyện thành công!");
          if (onSuccess) onSuccess(selectedStoryId);
        } else {
          toast.error(res.error || "Không thể nhập dữ liệu");
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Có lỗi xảy ra khi lưu");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <span>Tự Động Bóc Tách File (PDF, Word DOCX, TXT)</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Tên của các <strong>Document Tabs</strong> được nhận diện trực tiếp thành tên của <strong>Vị Diện / Hồi truyện</strong>, tab con là các <strong>Chương nhỏ</strong>.
        </p>
      </div>

      {/* Upload Zone */}
      {!parseResult && (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
              handleFileChange(e.dataTransfer.files[0]);
            }
          }}
          className={`p-8 sm:p-12 rounded-3xl border-2 border-dashed text-center cursor-pointer transition-all ${
            isParsing
              ? "border-amber-500 bg-amber-500/5"
              : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-amber-500 shadow-sm"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileChange(e.target.files[0]);
              }
            }}
          />

          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-3.5">
            {isParsing ? (
              <RefreshCw className="w-7 h-7 animate-spin text-amber-500" />
            ) : (
              <FileUp className="w-7 h-7" />
            )}
          </div>

          <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
            {isParsing ? "Đang đọc các Tabs tài liệu..." : "Kéo thả hoặc bấm để chọn tệp"}
          </h3>

          {/* Formats Badges */}
          <div className="flex justify-center gap-2 mt-2.5">
            <span className="px-2.5 py-1 rounded-lg bg-red-500/10 text-red-500 text-[11px] font-bold">
              PDF (Tabs / Bookmarks)
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-500 text-[11px] font-bold">
              DOCX (Word)
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 text-[11px] font-bold">
              TXT (Văn bản)
            </span>
          </div>

          {isParsing && (
            <div className="mt-5 max-w-sm mx-auto space-y-1.5">
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${parseProgress}%` }}
                />
              </div>
              <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 font-mono">
                {parseProgress}% • {parseStatus}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Parse Result and Import Settings */}
      {parseResult && (
        <div className="space-y-5 animate-in fade-in duration-150">
          {/* Result Banner */}
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-amber-500 flex-shrink-0" />
              <div>
                <h4 className="font-black text-sm text-slate-900 dark:text-white">
                  Đã bóc tách: <span className="text-amber-600">{selectedFile?.name}</span>
                </h4>
                <div className="flex flex-wrap gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 mt-0.5">
                  <span className="text-amber-600 font-bold">🏛️ {parseResult.totalVolumes} Vị Diện / Hồi</span>
                  <span>•</span>
                  <span className="text-indigo-600 dark:text-indigo-400">📄 {parseResult.totalChapters} Chương</span>
                  <span>•</span>
                  <span className="text-slate-400 font-mono">🔤 {parseResult.totalWords.toLocaleString()} chữ</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setParseResult(null);
                setSelectedFile(null);
              }}
              className="text-xs font-bold text-slate-500 hover:text-rose-500 flex items-center gap-1 self-start sm:self-auto"
            >
              <X className="w-3.5 h-3.5" />
              <span>Đổi file khác</span>
            </button>
          </div>

          {/* Import Settings Form */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 w-fit text-xs font-bold">
              <button
                type="button"
                onClick={() => setTargetMode("new")}
                className={`px-3.5 py-1.5 rounded-lg transition-all ${
                  targetMode === "new"
                    ? "bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                Tạo truyện mới
              </button>
              <button
                type="button"
                onClick={() => setTargetMode("existing")}
                className={`px-3.5 py-1.5 rounded-lg transition-all ${
                  targetMode === "existing"
                    ? "bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                Nạp vào truyện có sẵn ({stories.length})
              </button>
            </div>

            {targetMode === "new" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tên truyện
                  </label>
                  <input
                    type="text"
                    value={newStoryTitle}
                    onChange={(e) => setNewStoryTitle(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tác giả
                  </label>
                  <input
                    type="text"
                    value={newStoryAuthor}
                    onChange={(e) => setNewStoryAuthor(e.target.value)}
                    placeholder="Chưa rõ"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Thể loại
                  </label>
                  <select
                    value={newStoryGenre}
                    onChange={(e) => setNewStoryGenre(e.target.value as StoryGenre)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                  >
                    <option value="Huyền Huyễn">Huyền Huyễn</option>
                    <option value="Tiên Hiệp">Tiên Hiệp</option>
                    <option value="Khoa Huyễn">Khoa Huyễn</option>
                    <option value="Đô Thị">Đô Thị</option>
                    <option value="Dị Giới">Dị Giới</option>
                    <option value="Hệ Thống">Hệ Thống</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Ảnh bìa (URL)
                  </label>
                  <input
                    type="text"
                    value={newStoryCover}
                    onChange={(e) => setNewStoryCover(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <select
                  value={selectedStoryId}
                  onChange={(e) => setSelectedStoryId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                >
                  {stories.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title} ({s.volumes.length} quyển/vị diện)
                    </option>
                  ))}
                </select>

                <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={replaceExisting}
                    onChange={(e) => setReplaceExisting(e.target.checked)}
                    className="rounded text-amber-500 w-4 h-4"
                  />
                  <span>Ghi đè toàn bộ các quyển cũ của truyện này</span>
                </label>
              </div>
            )}
          </div>

          {/* Volumes & Chapters Tree with Exact Tab Names & Inline Rename */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                Danh sách Vị Diện / Hồi truyện từ Tabs ({parseResult.volumes.length} Vị Diện)
              </h4>
              <span className="text-[11px] text-slate-400">
                (Click vào icon bút để sửa lại tên tab nếu muốn)
              </span>
            </div>

            <div className="space-y-2.5">
              {parseResult.volumes.map((volume) => {
                const isCollapsed = !!collapsedVolIds[volume.number];
                const isEditingThis = editingVolNumber === volume.number;

                return (
                  <div
                    key={volume.number}
                    className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm"
                  >
                    <div className="p-3.5 bg-amber-500/10 dark:bg-amber-500/15 flex items-center justify-between select-none text-xs">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                        <span className="w-6 h-6 rounded-lg bg-amber-500 text-white font-black flex items-center justify-center font-mono flex-shrink-0">
                          {volume.number}
                        </span>

                        {isEditingThis ? (
                          <div className="flex items-center gap-1.5 flex-1 max-w-md" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="text"
                              value={editingVolTitle}
                              onChange={(e) => setEditingVolTitle(e.target.value)}
                              className="px-2.5 py-1 rounded-lg border border-amber-500 bg-white dark:bg-slate-800 text-xs font-bold w-full"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveVolTitle(volume.number)}
                              className="p-1.5 rounded-lg bg-amber-500 text-white hover:bg-amber-600"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingVolNumber(null)}
                              className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 min-w-0">
                            <span 
                              onClick={() => toggleVolumeCollapse(volume.number)}
                              className="font-bold text-slate-900 dark:text-white text-sm truncate cursor-pointer hover:text-amber-600"
                            >
                              {volume.title}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingVolNumber(volume.number);
                                setEditingVolTitle(volume.title);
                              }}
                              className="p-1 text-slate-400 hover:text-amber-600 rounded"
                              title="Sửa tên Vị Diện này"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      <div 
                        onClick={() => toggleVolumeCollapse(volume.number)}
                        className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-300 font-mono cursor-pointer"
                      >
                        <span>{volume.chapters.length} chương</span>
                        {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                      </div>
                    </div>

                    {!isCollapsed && (
                      <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                        {volume.chapters.map((chapter) => (
                          <div
                            key={chapter.number}
                            className="p-2.5 px-4 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span className="text-slate-400 font-mono font-bold text-[11px]">
                                #{chapter.number}
                              </span>
                              <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                                {chapter.title}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-[11px] text-slate-400 font-mono">
                                {chapter.wordCount.toLocaleString()} từ
                              </span>
                              <button
                                type="button"
                                onClick={() => setPreviewChapter(chapter)}
                                className="p-1 rounded text-slate-400 hover:text-amber-500"
                                title="Xem nội dung"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action CTA */}
          <div className="pt-2">
            <button
              onClick={handleConfirmImport}
              disabled={isSaving}
              className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-98 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{isSaving ? "Đang lưu..." : `Xác nhận nạp ${parseResult.totalVolumes} Vị Diện & ${parseResult.totalChapters} Chương` }</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Chapter Preview Modal */}
      {previewChapter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 w-full max-w-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h4 className="font-bold text-sm">{previewChapter.title}</h4>
              <button onClick={() => setPreviewChapter(null)} className="p-1 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto font-serif text-xs leading-relaxed whitespace-pre-wrap text-slate-700 dark:text-slate-300">
              {previewChapter.content}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
