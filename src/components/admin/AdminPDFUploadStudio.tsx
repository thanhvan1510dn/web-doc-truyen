import React, { useState, useEffect, useRef } from "react";
import { 
  FileUp, CheckCircle2, RefreshCw, 
  Plus, Minus, X, Edit3, Check, Scissors, Trash2
} from "lucide-react";
import { storyApi } from "../../api";
import { Story, StoryGenre } from "../../types/story";
import { documentParserService, DocumentParseResult, ParsedVolume } from "../../services/documentParserService";
import { useToast } from "../common/Toast";

interface AdminPDFUploadStudioProps {
  storyId?: string;
  onSuccess?: (storyId: string) => void;
}

export const AdminPDFUploadStudio: React.FC<AdminPDFUploadStudioProps> = ({ storyId, onSuccess }) => {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stories, setStories] = useState<Story[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseProgress, setParseProgress] = useState(0);
  const [parseStatus, setParseStatus] = useState("");
  const [parseResult, setParseResult] = useState<DocumentParseResult | null>(null);

  // Target Mode: "new" | "existing"
  const [targetMode, setTargetMode] = useState<"new" | "existing">(storyId ? "existing" : "new");
  const [selectedStoryId, setSelectedStoryId] = useState<string>(storyId || "");
  const [replaceExisting, setReplaceExisting] = useState(false);

  // New Story Form
  const [newStoryTitle, setNewStoryTitle] = useState("");
  const [newStoryAuthor, setNewStoryAuthor] = useState("");
  const [newStoryGenre, setNewStoryGenre] = useState<StoryGenre>("Huyền Huyễn");
  const [newStoryCover, setNewStoryCover] = useState(
    "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80"
  );
  const [newStoryDesc, setNewStoryDesc] = useState("");

  const [expandedVolIds, setExpandedVolIds] = useState<Record<number, boolean>>({});
  const [editingVolNumber, setEditingVolNumber] = useState<number | null>(null);
  const [editingVolTitle, setEditingVolTitle] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  const loadStories = async () => {
    const res = await storyApi.getStories({ includeInactive: true });
    if (res.success) {
      setStories(res.data);
      if (storyId) {
        setSelectedStoryId(storyId);
        setTargetMode("existing");
      } else if (res.data.length > 0 && !selectedStoryId) {
        setSelectedStoryId(res.data[0].id);
      }
    }
  };

  useEffect(() => {
    loadStories();
    if (storyId) {
      setSelectedStoryId(storyId);
      setTargetMode("existing");
    }
  }, [storyId]);

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
        setNewStoryDesc("Tác phẩm gồm " + result.totalVolumes + " Mục lục trích xuất từ " + file.name);
      }

      toast.success("Đã nhận diện: " + result.totalVolumes + " Mục lục & " + result.totalChapters + " chương!");
    } catch (err: any) {
      toast.error(err.message || "Không thể đọc tệp");
    } finally {
      setIsParsing(false);
    }
  };

  const toggleVolumeCollapse = (volNumber: number) => {
    setExpandedVolIds((prev) => ({
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
    toast.success("Đã đổi tên Mục lục!");
  };

  const handleSplitVolumeAtChapter = (volNumber: number, chapNumber: number) => {
    if (!parseResult) return;

    const sourceVol = parseResult.volumes.find((v) => v.number === volNumber);
    if (!sourceVol) return;

    const splitIdx = sourceVol.chapters.findIndex((c) => c.number === chapNumber);
    if (splitIdx <= 0) {
      toast.error("Không thể tách ở đầu Mục lục");
      return;
    }

    const keptChapters = sourceVol.chapters.slice(0, splitIdx);
    const movedChapters = sourceVol.chapters.slice(splitIdx);

    const newVolTitle = window.prompt(
      "Nhập tên Mục lục mới cho các chương từ #" + chapNumber + ":",
      "Mục lục " + (parseResult.volumes.length + 1)
    );

    if (!newVolTitle || !newVolTitle.trim()) return;

    const newVol: ParsedVolume = {
      number: volNumber + 1,
      title: newVolTitle.trim(),
      chapters: movedChapters,
    };

    const newVolumes: ParsedVolume[] = [];
    parseResult.volumes.forEach((v) => {
      if (v.number < volNumber) {
        newVolumes.push(v);
      } else if (v.number === volNumber) {
        newVolumes.push({ ...v, chapters: keptChapters });
        newVolumes.push(newVol);
      } else {
        newVolumes.push({ ...v, number: v.number + 1 });
      }
    });

    newVolumes.forEach((v, idx) => {
      v.number = idx + 1;
    });

    setParseResult({
      ...parseResult,
      totalVolumes: newVolumes.length,
      volumes: newVolumes,
    });

    toast.success("Đã tách thành công: " + newVolTitle);
  };

  const handleMergeWithPrevVolume = (volNumber: number) => {
    if (!parseResult || volNumber <= 1) return;

    const prevVol = parseResult.volumes.find((v) => v.number === volNumber - 1);
    const currVol = parseResult.volumes.find((v) => v.number === volNumber);
    if (!prevVol || !currVol) return;

    prevVol.chapters.push(...currVol.chapters);

    const remainingVolumes = parseResult.volumes
      .filter((v) => v.number !== volNumber)
      .map((v, idx) => ({ ...v, number: idx + 1 }));

    setParseResult({
      ...parseResult,
      totalVolumes: remainingVolumes.length,
      volumes: remainingVolumes,
    });

    toast.success("Đã gộp vào " + prevVol.title);
  };

  const handleDeleteVolume = (volNumber: number) => {
    if (!parseResult) return;
    const remainingVolumes = parseResult.volumes
      .filter((v) => v.number !== volNumber)
      .map((v, idx) => ({ ...v, number: idx + 1 }));

    const totalCh = remainingVolumes.reduce((acc, v) => acc + v.chapters.length, 0);
    const totalW = remainingVolumes.reduce((acc, v) => acc + v.chapters.reduce((ca, c) => ca + c.wordCount, 0), 0);

    setParseResult({
      ...parseResult,
      totalVolumes: remainingVolumes.length,
      totalChapters: totalCh,
      totalWords: totalW,
      volumes: remainingVolumes,
    });

    toast.info("Đã xóa mục lục " + volNumber);
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
            description: newStoryDesc.trim() || ("Tác phẩm gồm " + parseResult.totalVolumes + " Mục lục."),
            isActive: true,
          },
          parseResult.volumes
        );

        if (res.success) {
          toast.success("Đã lưu truyện " + res.data.title + " thành công!");
          if (onSuccess) onSuccess(res.data.id);
        } else {
          toast.error(res.error || "Không thể nạp truyện");
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
          toast.error(res.error || "Không thể nạp dữ liệu");
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Có lỗi xảy ra khi lưu");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
          Nạp file
        </h2>
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
          className={"p-8 sm:p-14 rounded-2xl border border-dashed text-center cursor-pointer transition-all " + (
            isParsing
              ? "border-zinc-500 bg-zinc-100/60 dark:bg-zinc-900/60"
              : "border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-400 dark:hover:border-zinc-700 shadow-sm"
          )}
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

          <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center mx-auto mb-3.5">
            {isParsing ? (
              <RefreshCw className="w-6 h-6 animate-spin" />
            ) : (
              <FileUp className="w-6 h-6" />
            )}
          </div>

          <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
            {isParsing ? "Đang đọc tệp..." : "Kéo thả hoặc bấm để chọn tệp"}
          </h3>

          {isParsing && (
            <div className="mt-5 max-w-sm mx-auto space-y-1.5">
              <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-zinc-900 dark:bg-white h-full rounded-full transition-all duration-200"
                  style={{ width: parseProgress + "%" }}
                />
              </div>
              <p className="text-xs font-medium text-zinc-500 font-mono">
                {parseProgress}% • {parseStatus}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Parse Result & Setup Form */}
      {parseResult && (
        <div className="space-y-5 animate-in fade-in duration-150">
          {/* Summary Top Bar */}
          <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-sm text-zinc-900 dark:text-white">
                  {selectedFile?.name}
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {parseResult.totalVolumes} Mục lục
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={isSaving}
                className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-900 text-white text-xs font-bold shadow-sm transition-all flex items-center justify-center disabled:opacity-50"
              >
                <span>{isSaving ? "Đang lưu..." : "Lưu & Nạp vào hệ thống"}</span>
              </button>

              <button
                onClick={() => {
                  setParseResult(null);
                  setSelectedFile(null);
                }}
                className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-white flex items-center justify-center"
              >
                <span>Đổi tệp</span>
              </button>
            </div>
          </div>

          {/* Import Mode Form */}
          <div className="p-5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
            {storyId ? (
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                <div>
                  <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block">Truyện đích tiếp nhận chương</span>
                  <p className="font-bold text-zinc-900 dark:text-white text-sm mt-0.5">
                    {stories.find((s) => s.id === storyId)?.title || "Truyện hiện tại"}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <label className="flex items-center gap-2 cursor-pointer font-medium">
                    <input
                      type="radio"
                      name="importMode"
                      checked={!replaceExisting}
                      onChange={() => setReplaceExisting(false)}
                      className="text-zinc-900 focus:ring-0"
                    />
                    <span className={!replaceExisting ? "font-bold text-emerald-600 dark:text-emerald-400" : "text-zinc-500"}>
                      ➕ Gộp tiếp nối (File tiếp theo)
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-medium">
                    <input
                      type="radio"
                      name="importMode"
                      checked={replaceExisting}
                      onChange={() => setReplaceExisting(true)}
                      className="text-zinc-900 focus:ring-0"
                    />
                    <span className={replaceExisting ? "font-bold text-rose-600 dark:text-rose-400" : "text-zinc-500"}>
                      ⚠️ Ghi đè toàn bộ
                    </span>
                  </label>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center p-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 w-fit text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setTargetMode("new")}
                    className={"px-3 py-1.5 rounded-md transition-all " + (
                      targetMode === "new"
                        ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm"
                        : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                    )}
                  >
                    Tạo truyện mới
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetMode("existing")}
                    className={"px-3 py-1.5 rounded-md transition-all " + (
                      targetMode === "existing"
                        ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm"
                        : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                    )}
                  >
                    Nạp vào truyện có sẵn ({stories.length})
                  </button>
                </div>

                {targetMode === "new" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                        Tên truyện
                      </label>
                      <input
                        type="text"
                        value={newStoryTitle}
                        onChange={(e) => setNewStoryTitle(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-medium text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                        Tác giả
                      </label>
                      <input
                        type="text"
                        value={newStoryAuthor}
                        onChange={(e) => setNewStoryAuthor(e.target.value)}
                        placeholder="Chưa rõ"
                        className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                        Thể loại
                      </label>
                      <select
                        value={newStoryGenre}
                        onChange={(e) => setNewStoryGenre(e.target.value as StoryGenre)}
                        className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-medium text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
                      >
                        <option value="Huyền Huyễn">Huyền Huyễn</option>
                        <option value="Tiên Hiệp">Tiên Hiệp</option>
                        <option value="Khoa Huyễn">Khoa Huyễn</option>
                        <option value="Đô Thị">Đô Thị</option>
                        <option value="Dị Giới">Dị Giới</option>
                        <option value="Hệ Thống">Hệ Thống</option>
                        <option value="Ngôn Tình">Ngôn Tình</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                        Ảnh bìa (URL)
                      </label>
                      <input
                        type="text"
                        value={newStoryCover}
                        onChange={(e) => setNewStoryCover(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                        Chọn truyện nhận file tiếp theo
                      </label>
                      <select
                        value={selectedStoryId}
                        onChange={(e) => setSelectedStoryId(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-medium text-zinc-900 dark:text-white"
                      >
                        {stories.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.title} ({s.volumes.length} mục lục)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 flex flex-col sm:flex-row gap-4 text-xs">
                      <label className="flex items-center gap-2 cursor-pointer font-medium">
                        <input
                          type="radio"
                          name="importModeExisting"
                          checked={!replaceExisting}
                          onChange={() => setReplaceExisting(false)}
                          className="text-zinc-900 focus:ring-0"
                        />
                        <span className={!replaceExisting ? "font-semibold text-zinc-900 dark:text-white" : "text-zinc-500 dark:text-zinc-400"}>
                          Gộp tiếp nối (Thêm vào sau các mục lục hiện có)
                        </span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer font-medium">
                        <input
                          type="radio"
                          name="importModeExisting"
                          checked={replaceExisting}
                          onChange={() => setReplaceExisting(true)}
                          className="text-zinc-900 focus:ring-0"
                        />
                        <span className={replaceExisting ? "font-semibold text-zinc-900 dark:text-white" : "text-zinc-500 dark:text-zinc-400"}>
                          Ghi đè (Thay thế toàn bộ nội dung)
                        </span>
                      </label>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Volumes & Chapters Tree */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-xs text-zinc-900 dark:text-white">
                Mục lục ({parseResult.volumes.length})
              </h4>
            </div>

            <div className="space-y-2">
              {parseResult.volumes.map((volume) => {
                const isExpanded = !!expandedVolIds[volume.number];
                const isEditingThis = editingVolNumber === volume.number;

                return (
                  <div
                    key={volume.number}
                    className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm"
                  >
                    <div className="p-2.5 px-3 bg-zinc-50/80 dark:bg-zinc-800/40 flex items-center justify-between select-none text-xs group">
                      <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                        <span className="w-5 h-5 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-semibold text-[11px] flex items-center justify-center font-mono flex-shrink-0">
                          {volume.number}
                        </span>

                        {isEditingThis ? (
                          <div className="flex items-center gap-1.5 flex-1 max-w-md" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="text"
                              value={editingVolTitle}
                              onChange={(e) => setEditingVolTitle(e.target.value)}
                              className="px-2 py-1 rounded border border-zinc-400 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-xs font-medium w-full"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveVolTitle(volume.number)}
                              className="p-1 rounded bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingVolNumber(null)}
                              className="p-1 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span 
                              onClick={() => toggleVolumeCollapse(volume.number)}
                              className="font-bold text-sm sm:text-base text-zinc-900 dark:text-white truncate cursor-pointer hover:underline"
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
                              className="p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Sửa tên mục lục"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>

                            {volume.number > 1 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMergeWithPrevVolume(volume.number);
                                }}
                                className="px-1.5 py-0.5 text-[10px] text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Gộp vào mục lục phía trước"
                              >
                                Gộp lên
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteVolume(volume.number);
                              }}
                              className="p-1 text-zinc-400 hover:text-rose-500 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Xóa mục lục này"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>

                      <div 
                        onClick={() => toggleVolumeCollapse(volume.number)}
                        className="w-6 h-6 rounded-md bg-zinc-200/70 dark:bg-zinc-700/70 flex items-center justify-center font-bold text-xs text-zinc-700 dark:text-zinc-200 cursor-pointer"
                      >
                        {isExpanded ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60 text-xs">
                        {volume.chapters.map((chapter, idx) => (
                          <div
                            key={chapter.number + "-" + idx}
                            className="p-2 px-3 flex items-center justify-between gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 group"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span className="font-normal text-zinc-700 dark:text-zinc-300 truncate">
                                {chapter.title}
                              </span>
                            </div>

                            <div className="flex items-center flex-shrink-0">
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {idx > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => handleSplitVolumeAtChapter(volume.number, chapter.number)}
                                    className="p-1 rounded text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                                    title="Tách thành Mục lục mới từ chương này"
                                  >
                                    <Scissors className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
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

          {/* Action Button */}
          <div className="pt-2">
            <button
              onClick={handleConfirmImport}
              disabled={isSaving}
              className="w-full py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-900 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all flex items-center justify-center disabled:opacity-50"
            >
              <span>{isSaving ? "Đang lưu..." : ("Xác nhận nạp " + parseResult.totalVolumes + " Mục lục")}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
