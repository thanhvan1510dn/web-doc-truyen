import React, { useState, useEffect, useRef } from "react";
import { 
  FileUp, CheckCircle2, Layers, 
  Sparkles, RefreshCw, ChevronDown, ChevronUp, Eye, 
  ArrowRight, X
} from "lucide-react";
import { storyApi } from "../../api";
import { Story, StoryGenre } from "../../types/story";
import { pdfParserService, PDFParseResult } from "../../services/pdfParserService";
import { useToast } from "../common/Toast";

interface AdminPDFUploadStudioProps {
  onSuccess?: (storyId: string) => void;
  onNavigateToStories?: () => void;
}

export const AdminPDFUploadStudio: React.FC<AdminPDFUploadStudioProps> = ({
  onSuccess,
}) => {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stories, setStories] = useState<Story[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseProgress, setParseProgress] = useState(0);
  const [parseStatus, setParseStatus] = useState("");
  const [parseResult, setParseResult] = useState<PDFParseResult | null>(null);

  // Target Mode: "existing" | "new"
  const [targetMode, setTargetMode] = useState<"existing" | "new">("new");
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

  // Preview Chapter modal
  const [previewChapter, setPreviewChapter] = useState<{ title: string; content: string; wordCount: number } | null>(null);
  const [collapsedVolIds, setCollapsedVolIds] = useState<Record<number, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Load existing stories
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
    if (!file || !file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Vui lòng chọn tệp định dạng .PDF");
      return;
    }

    setSelectedFile(file);
    setIsParsing(true);
    setParseProgress(0);
    setParseStatus("Bắt đầu xử lý...");

    try {
      const result = await pdfParserService.parsePDFFile(file, (progress, status) => {
        setParseProgress(progress);
        setParseStatus(status);
      });

      setParseResult(result);
      if (result.detectedTitle) {
        setNewStoryTitle(result.detectedTitle);
        setNewStoryDesc(`Truyện gồm ${result.totalVolumes} Vị Diện và ${result.totalChapters} chương được tự động bóc tách từ file PDF: ${file.name}`);
      }

      toast.success(
        `Đã trích xuất thành công: ${result.totalVolumes} Vị Diện và ${result.totalChapters} chương!`
      );
    } catch (err: any) {
      console.error("PDF parse error:", err);
      toast.error(err.message || "Không thể đọc cấu trúc tệp PDF");
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

  const handleConfirmImport = async () => {
    if (!parseResult || parseResult.volumes.length === 0) {
      toast.error("Chưa có dữ liệu chương để nhập");
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
            description: newStoryDesc.trim() || `Tác phẩm gồm ${parseResult.totalVolumes} Vị Diện.`,
            isActive: true,
          },
          parseResult.volumes
        );

        if (res.success) {
          toast.success(`Đã tạo truyện "${res.data.title}" với ${parseResult.totalVolumes} Vị Diện & ${parseResult.totalChapters} chương!`);
          if (onSuccess) {
            onSuccess(res.data.id);
          }
        } else {
          toast.error(res.error || "Không thể nhập truyện");
        }
      } else {
        // Import to existing story
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
          toast.success(`Đã nạp thành công ${parseResult.totalVolumes} Vị Diện & ${parseResult.totalChapters} chương vào truyện!`);
          if (onSuccess) {
            onSuccess(selectedStoryId);
          }
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
        <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
          <Sparkles className="w-6 h-6 text-amber-500" />
          <span>Tự Động Bóc Tách PDF: Vị Diện & Chương</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Hệ thống tự động nhận diện đầu mục lớn là <strong>Diễn biến các Vị Diện (Quyển)</strong>, các tab con là <strong>Các Chương nhỏ</strong> từ bookmark và mục lục PDF.
        </p>
      </div>

      {/* Upload Drag & Drop Area */}
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
          className={`p-8 sm:p-14 rounded-3xl border-2 border-dashed text-center cursor-pointer transition-all ${
            isParsing
              ? "border-amber-500 bg-amber-500/5"
              : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-amber-500 hover:bg-amber-50/20 dark:hover:bg-slate-800/60 shadow-sm"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileChange(e.target.files[0]);
              }
            }}
          />

          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4 shadow-sm">
            {isParsing ? (
              <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
            ) : (
              <FileUp className="w-8 h-8" />
            )}
          </div>

          <h3 className="text-lg font-black text-slate-900 dark:text-white">
            {isParsing ? "Đang xử lý và bóc tách cấu trúc PDF..." : "Kéo thả hoặc Bấm để tải lên file PDF của bạn"}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 max-w-md mx-auto">
            Hỗ trợ file PDF có sẵn Tab / Bookmark hoặc định dạng phân đoạn Vị Diện và Chương truyện.
          </p>

          {isParsing && (
            <div className="mt-6 max-w-md mx-auto space-y-2">
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-300 shadow-sm"
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

      {/* Parsed Result & Import Configuration */}
      {parseResult && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Summary Banner */}
          <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black shadow-md shadow-amber-500/20 flex-shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Đã bóc tách thành công từ: <span className="text-amber-600">{selectedFile?.name}</span>
                </h3>
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 mt-1">
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold">
                    🏛️ {parseResult.totalVolumes} Vị Diện (Quyển)
                  </span>
                  <span>•</span>
                  <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold">
                    📄 {parseResult.totalChapters} Chương nhỏ
                  </span>
                  <span>•</span>
                  <span className="text-slate-500 font-mono">
                    🔤 {parseResult.totalWords.toLocaleString()} chữ
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setParseResult(null);
                setSelectedFile(null);
              }}
              className="text-xs font-bold text-slate-500 hover:text-rose-500 self-start sm:self-auto flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              <span>Chọn file PDF khác</span>
            </button>
          </div>

          {/* Configuration Form: Import Options */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-500" />
              <span>Tùy chọn Lưu vào Hệ Thống</span>
            </h3>

            {/* Mode Switch Tabs */}
            <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 w-fit text-xs font-bold">
              <button
                type="button"
                onClick={() => setTargetMode("new")}
                className={`px-4 py-2 rounded-lg transition-all ${
                  targetMode === "new"
                    ? "bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                ➕ Tạo truyện mới hoàn toàn từ PDF
              </button>
              <button
                type="button"
                onClick={() => setTargetMode("existing")}
                className={`px-4 py-2 rounded-lg transition-all ${
                  targetMode === "existing"
                    ? "bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                📥 Nạp vào truyện đã có sẵn ({stories.length})
              </button>
            </div>

            {targetMode === "new" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Tên truyện mới <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newStoryTitle}
                    onChange={(e) => setNewStoryTitle(e.target.value)}
                    placeholder="Nhập tên truyện..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Tác giả
                  </label>
                  <input
                    type="text"
                    value={newStoryAuthor}
                    onChange={(e) => setNewStoryAuthor(e.target.value)}
                    placeholder="Chưa rõ"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Tóm tắt / Giới thiệu
                  </label>
                  <textarea
                    rows={2}
                    value={newStoryDesc}
                    onChange={(e) => setNewStoryDesc(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Thể loại truyện
                  </label>
                  <select
                    value={newStoryGenre}
                    onChange={(e) => setNewStoryGenre(e.target.value as StoryGenre)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white"
                  >
                    <option value="Tiên Hiệp">Tiên Hiệp</option>
                    <option value="Huyền Huyễn">Huyền Huyễn</option>
                    <option value="Khoa Huyễn">Khoa Huyễn</option>
                    <option value="Đô Thị">Đô Thị</option>
                    <option value="Dị Giới">Dị Giới</option>
                    <option value="Hệ Thống">Hệ Thống</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Ảnh bìa truyện (URL)
                  </label>
                  <input
                    type="text"
                    value={newStoryCover}
                    onChange={(e) => setNewStoryCover(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Chọn truyện muốn nạp nội dung PDF
                  </label>
                  <select
                    value={selectedStoryId}
                    onChange={(e) => setSelectedStoryId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white"
                  >
                    {stories.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title} ({s.volumes.length} quyển hiện có)
                      </option>
                    ))}
                  </select>
                </div>

                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={replaceExisting}
                    onChange={(e) => setReplaceExisting(e.target.checked)}
                    className="rounded text-amber-500 w-4 h-4"
                  />
                  <span>Thay thế / Ghi đè toàn bộ các quyển cũ của truyện này</span>
                </label>
              </div>
            )}
          </div>

          {/* Visual Tree of Detected Realms & Chapters */}
          <div className="space-y-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center justify-between">
              <span>Danh sách các Vị Diện & Chương đã phân tách ({parseResult.volumes.length} Vị Diện)</span>
              <span className="text-xs font-normal text-slate-500">
                Nhấp vào từng Vị Diện để xem các chương con
              </span>
            </h3>

            <div className="space-y-3">
              {parseResult.volumes.map((volume) => {
                const isCollapsed = !!collapsedVolIds[volume.number];

                return (
                  <div
                    key={volume.number}
                    className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm transition-all"
                  >
                    {/* Volume Header */}
                    <div
                      onClick={() => toggleVolumeCollapse(volume.number)}
                      className="p-4 bg-amber-500/10 dark:bg-amber-500/15 cursor-pointer hover:bg-amber-500/20 transition-colors flex items-center justify-between select-none"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-lg bg-amber-500 text-white font-black text-xs flex items-center justify-center font-mono">
                          {volume.number}
                        </span>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                          {volume.title}
                        </h4>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-amber-700 dark:text-amber-300 font-mono">
                          {volume.chapters.length} chương
                        </span>
                        <button className="text-slate-400">
                          {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Chapters Accordion Content */}
                    {!isCollapsed && (
                      <div className="divide-y divide-slate-100 dark:divide-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 text-xs">
                        {volume.chapters.map((chapter) => (
                          <div
                            key={chapter.number}
                            className="p-3 px-5 flex items-center justify-between gap-4 hover:bg-amber-50/60 dark:hover:bg-slate-800/60 transition-colors group"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="text-slate-400 font-mono font-bold text-[11px] w-8">
                                #{chapter.number}
                              </span>
                              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-amber-600 transition-colors">
                                {chapter.title}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 flex-shrink-0">
                              <span className="text-[11px] text-slate-400 font-mono">
                                {chapter.wordCount.toLocaleString()} chữ
                              </span>
                              <button
                                type="button"
                                onClick={() => setPreviewChapter(chapter)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-800 transition-colors"
                                title="Xem thử nội dung chương này"
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

          {/* Bottom Confirmation Action Button */}
          <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs text-amber-400 font-bold uppercase tracking-wider">
                Xác nhận hoàn tất
              </p>
              <h4 className="text-lg font-black mt-0.5">
                Tự động nhập {parseResult.totalVolumes} Vị Diện & {parseResult.totalChapters} Chương vào hệ thống
              </h4>
            </div>

            <button
              onClick={handleConfirmImport}
              disabled={isSaving}
              className="px-8 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-black text-sm shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{isSaving ? "Đang lưu vào hệ thống..." : "Xác nhận & Nạp truyện ngay"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Chapter Text Preview Modal */}
      {previewChapter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl overflow-hidden my-8 animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {previewChapter.title}
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">
                  {previewChapter.wordCount.toLocaleString()} chữ trích xuất từ PDF
                </span>
              </div>
              <button
                onClick={() => setPreviewChapter(null)}
                className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto font-serif text-sm leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
              {previewChapter.content || <span className="text-slate-400 italic">Chưa có nội dung văn bản trích xuất...</span>}
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setPreviewChapter(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
