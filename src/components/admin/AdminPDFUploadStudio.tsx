import React, { useState, useEffect, useRef } from "react";
import {
  CheckCircle2, RefreshCw, Files, ChevronDown, ChevronUp,
  Plus, X, Edit3, Check, Scissors, Trash2, Sparkles, AlertCircle, ArrowRight
} from "lucide-react";
import { storyApi } from "../../api";
import { Story, StoryGenre } from "../../types/story";
import { documentParserService, DocumentParseResult, ParsedVolume } from "../../services/documentParserService";
import { findCanonArc } from "../../data/storyArcRegistry";
import { useToast } from "../common/Toast";

interface AdminPDFUploadStudioProps {
  storyId?: string;
  onSuccess?: (storyId: string) => void;
}

// --- per-file parse state ---
type FileParseStatus = "pending" | "parsing" | "done" | "error";

interface FileEntry {
  id: string; // unique per entry
  file: File;
  status: FileParseStatus;
  progress: number;
  progressMsg: string;
  result?: DocumentParseResult;
  error?: string;
}

// Helper: lấy số chương bắt đầu của một Volume để sắp xếp tự nhiên
function getVolumeStartChapter(vol: ParsedVolume): number {
  const chaps = vol.chapters.map((c) => c.number).filter((n) => typeof n === "number" && n > 0);
  if (chaps.length > 0) return Math.min(...chaps);
  const match = (vol.title || "").match(/\b(\d{1,5})\b/);
  return match ? parseInt(match[1], 10) : 999999;
}

// Merge multiple DocumentParseResult into one, tự động sắp xếp theo thứ tự chương tăng dần
function mergeResults(entries: FileEntry[]): DocumentParseResult | null {
  const doneEntries = entries.filter((e) => e.status === "done" && e.result);
  if (doneEntries.length === 0) return null;

  // Thu thập toàn bộ volumes từ các file đã hoàn thành
  const rawVolumes: ParsedVolume[] = [];
  for (const entry of doneEntries) {
    if (entry.result?.volumes) {
      for (const vol of entry.result.volumes) {
        const sortedChaps = [...vol.chapters].sort((a, b) => a.number - b.number);
        rawVolumes.push({ ...vol, chapters: sortedChaps });
      }
    }
  }

  // TỰ ĐỘNG SẮP XẾP TẤT CẢ MỤC LỤC THEO SỐ CHƯƠNG TĂNG DẦN (3344 -> 3372 -> ... -> 3873)
  rawVolumes.sort((a, b) => getVolumeStartChapter(a) - getVolumeStartChapter(b));

  // Loại bỏ chương trùng lặp (nếu trùng số chương, ưu tiên file xuất hiện sau)
  const chapSeen = new Map<number, boolean>();
  const dedupedVolumes: ParsedVolume[] = [];

  for (let i = rawVolumes.length - 1; i >= 0; i--) {
    const vol = rawVolumes[i];
    const dedupedChapters = vol.chapters.filter((c) => {
      if (chapSeen.has(c.number)) return false;
      chapSeen.set(c.number, true);
      return true;
    });
    if (dedupedChapters.length > 0) {
      dedupedVolumes.unshift({ ...vol, chapters: dedupedChapters });
    }
  }

  // Đánh số thứ tự tuần tự chuẩn 1, 2, 3...
  const finalVolumes = dedupedVolumes.map((v, i) => ({ ...v, number: i + 1 }));

  const totalChapters = finalVolumes.reduce((s, v) => s + v.chapters.length, 0);
  const totalWords = finalVolumes.reduce(
    (s, v) => s + v.chapters.reduce((cs, c) => cs + c.wordCount, 0),
    0
  );

  return {
    fileType: doneEntries[0].result!.fileType,
    fileName: doneEntries.map((e) => e.file.name).join(", "),
    detectedTitle: doneEntries[0].result!.detectedTitle,
    totalVolumes: finalVolumes.length,
    totalChapters,
    totalWords,
    volumes: finalVolumes,
  };
}

export const AdminPDFUploadStudio: React.FC<AdminPDFUploadStudioProps> = ({ storyId, onSuccess }) => {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stories, setStories] = useState<Story[]>([]);

  // Multi-file state
  const [fileEntries, setFileEntries] = useState<FileEntry[]>([]);
  const [isAnyParsing, setIsAnyParsing] = useState(false);
  const [showFileDetail, setShowFileDetail] = useState(false);

  // Merged result
  const [parseResult, setParseResult] = useState<DocumentParseResult | null>(null);

  // Target Mode
  const [targetMode, setTargetMode] = useState<"new" | "existing">(storyId ? "existing" : "new");
  const [selectedStoryId, setSelectedStoryId] = useState<string>(storyId || "");
  const [replaceExisting, setReplaceExisting] = useState(false);

  // New Story Form (khi không có storyId)
  const [newStoryTitle, setNewStoryTitle] = useState("");
  const [newStoryAuthor, setNewStoryAuthor] = useState("");
  const [newStoryGenre, setNewStoryGenre] = useState<StoryGenre>("Huyền Huyễn");
  const [newStoryCover, setNewStoryCover] = useState(
    "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80"
  );
  const [newStoryDesc, setNewStoryDesc] = useState("");

  const [expandedVolIds, setExpandedVolIds] = useState<Record<number, boolean>>({});
  const [allExpanded, setAllExpanded] = useState(false);
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

  // Làm giàu tên vị diện theo Canon Arcs
  const enrichVolumes = (
    vols: ParsedVolume[],
    targetStoryIdArg: string
  ): { enriched: ParsedVolume[]; enrichedCount: number; arcNames: string[] } => {
    const targetStory = stories.find((s) => s.id === targetStoryIdArg);
    let enrichedCount = 0;
    const arcNames: string[] = [];

    const enriched = vols.map((vol) => {
      const chapNumbers = vol.chapters
        .map((c) => c.number)
        .filter((n) => typeof n === "number" && n > 0);
      const minCh = chapNumbers.length > 0 ? Math.min(...chapNumbers) : 0;
      const maxCh = chapNumbers.length > 0 ? Math.max(...chapNumbers) : 0;

      if (targetStory && Array.isArray(targetStory.volumes)) {
        const matched = targetStory.volumes.find((ev) => {
          const evRange = (ev.title || "").match(/[\(\[【]\s*(\d{1,5})\s*[-–—]\s*(\d{1,5})\s*[\)\]】]/);
          if (evRange) {
            const evMin = parseInt(evRange[1], 10);
            const evMax = parseInt(evRange[2], 10);
            return minCh >= evMin && maxCh <= evMax && ev.title.trim().length > evRange[0].length;
          }
          return false;
        });
        if (matched && matched.title) {
          const currentClean = vol.title.trim();
          const targetClean = matched.title.trim();
          if (currentClean !== targetClean && currentClean.length <= 15) {
            enrichedCount++;
            arcNames.push(targetClean);
            return { ...vol, title: targetClean };
          }
        }
      }

      if (minCh > 0 && maxCh > 0) {
        const canonTitle = findCanonArc(minCh, maxCh);
        if (canonTitle) {
          const currentClean = vol.title.trim();
          if (currentClean !== canonTitle && currentClean.length <= 15) {
            enrichedCount++;
            arcNames.push(canonTitle);
            return { ...vol, title: canonTitle };
          }
        }
      }

      return vol;
    });

    return { enriched, enrichedCount, arcNames };
  };

  const handleAutoEnrichTitles = () => {
    if (!parseResult) return;
    const { enriched, enrichedCount, arcNames } = enrichVolumes(parseResult.volumes, selectedStoryId);
    setParseResult({ ...parseResult, volumes: enriched });
    if (enrichedCount > 0) {
      toast.success(`✨ Đã nhận diện và gán ${enrichedCount} tên vị diện: ${arcNames.slice(0, 3).join(", ")}${arcNames.length > 3 ? "..." : ""}`);
    } else {
      toast.info("Tên các mục lục đã ở trạng thái tối ưu.");
    }
  };

  // Thêm tệp tải lên
  const addFiles = async (newFiles: File[]) => {
    const valid: File[] = [];
    for (const file of newFiles) {
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (!["pdf", "docx", "txt"].includes(ext || "")) {
        toast.error(`Bỏ qua ${file.name}: chỉ hỗ trợ .PDF, .DOCX, .TXT`);
        continue;
      }
      valid.push(file);
    }
    if (valid.length === 0) return;

    setParseResult(null);

    const newEntries: FileEntry[] = valid.map((f) => ({
      id: `${f.name}-${f.size}-${Date.now()}-${Math.random()}`,
      file: f,
      status: "pending",
      progress: 0,
      progressMsg: "",
    }));

    setFileEntries((prev) => [...prev, ...newEntries]);
    setIsAnyParsing(true);

    for (const entry of newEntries) {
      setFileEntries((prev) =>
        prev.map((e) =>
          e.id === entry.id ? { ...e, status: "parsing", progress: 0, progressMsg: "Đang đọc..." } : e
        )
      );

      try {
        const result = await documentParserService.parseFile(
          entry.file,
          (progress: number, status: string) => {
            setFileEntries((prev) =>
              prev.map((e) =>
                e.id === entry.id ? { ...e, progress, progressMsg: status } : e
              )
            );
          }
        );

        setFileEntries((prev) =>
          prev.map((e) =>
            e.id === entry.id ? { ...e, status: "done", progress: 100, progressMsg: "Hoàn thành", result } : e
          )
        );
      } catch (err: any) {
        setFileEntries((prev) =>
          prev.map((e) =>
            e.id === entry.id
              ? { ...e, status: "error", progress: 0, progressMsg: "", error: err.message || "Lỗi đọc file" }
              : e
          )
        );
      }
    }

    setIsAnyParsing(false);
  };

  // Khi fileEntries thay đổi, tự động hợp nhất và sắp xếp
  useEffect(() => {
    const pending = fileEntries.filter((e) => e.status === "pending" || e.status === "parsing");
    const done = fileEntries.filter((e) => e.status === "done");
    if (pending.length === 0 && done.length > 0) {
      const merged = mergeResults(fileEntries);
      if (merged) {
        const targetId = selectedStoryId || storyId || (stories.length > 0 ? stories[0].id : "");
        const { enriched, enrichedCount, arcNames } = enrichVolumes(merged.volumes, targetId);
        merged.volumes = enriched;
        setParseResult(merged);

        if (done.length === 1 && merged.detectedTitle) {
          setNewStoryTitle(merged.detectedTitle);
          setNewStoryDesc(`Tác phẩm gồm ${merged.totalVolumes} Mục lục trích xuất từ ${done[0].file.name}`);
        } else if (done.length > 1 && !newStoryTitle.trim()) {
          const commonTitle = stories.length > 0 ? stories[0].title : (merged.detectedTitle || "Bút Ký Phản Công");
          setNewStoryTitle(commonTitle);
          setNewStoryDesc(`Tác phẩm gồm ${merged.totalVolumes} Mục lục gộp từ ${done.length} tệp.`);
        }

        if (enrichedCount > 0) {
          toast.success(
            `✨ ${done.length} tệp · ${merged.totalVolumes} Mục lục (đã tự sắp xếp thứ tự) · Khớp ${enrichedCount} vị diện: ${arcNames.slice(0, 2).join(", ")}${arcNames.length > 2 ? "..." : ""}`
          );
        } else {
          toast.success(`Đã nạp ${done.length} tệp · ${merged.totalVolumes} Mục lục · ${merged.totalChapters} chương`);
        }
      }
    }
  }, [fileEntries]);

  const removeFile = (id: string) => {
    setFileEntries((prev) => {
      const updated = prev.filter((e) => e.id !== id);
      if (updated.length === 0) {
        setParseResult(null);
      } else {
        const pending = updated.filter((e) => e.status === "pending" || e.status === "parsing");
        if (pending.length === 0) {
          const merged = mergeResults(updated);
          if (merged) {
            const targetId = selectedStoryId || storyId || (stories.length > 0 ? stories[0].id : "");
            const { enriched } = enrichVolumes(merged.volumes, targetId);
            merged.volumes = enriched;
            setParseResult(merged);
          }
        }
      }
      return updated;
    });
  };

  const resetAll = () => {
    setFileEntries([]);
    setParseResult(null);
    setExpandedVolIds({});
    setEditingVolNumber(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    toast.info("Đã làm mới khu vực tải lên.");
  };

  const toggleVolumeCollapse = (volNumber: number) => {
    setExpandedVolIds((prev) => ({ ...prev, [volNumber]: !prev[volNumber] }));
  };

  const handleToggleExpandAll = () => {
    if (!parseResult) return;
    const nextState = !allExpanded;
    setAllExpanded(nextState);
    const newMap: Record<number, boolean> = {};
    if (nextState) {
      parseResult.volumes.forEach((v) => {
        newMap[v.number] = true;
      });
    }
    setExpandedVolIds(newMap);
  };

  const handleSaveVolTitle = (volNumber: number) => {
    if (!parseResult || !editingVolTitle.trim()) return;
    const updated = parseResult.volumes.map((v) =>
      v.number === volNumber ? { ...v, title: editingVolTitle.trim() } : v
    );
    setParseResult({ ...parseResult, volumes: updated });
    setEditingVolNumber(null);
    toast.success("Đã đổi tên Mục lục!");
  };

  const handleSplitVolumeAtChapter = (volNumber: number, chapNumber: number) => {
    if (!parseResult) return;
    const sourceVol = parseResult.volumes.find((v) => v.number === volNumber);
    if (!sourceVol) return;
    const splitIdx = sourceVol.chapters.findIndex((c) => c.number === chapNumber);
    if (splitIdx <= 0) { toast.error("Không thể tách ở đầu Mục lục"); return; }

    const keptChapters = sourceVol.chapters.slice(0, splitIdx);
    const movedChapters = sourceVol.chapters.slice(splitIdx);

    const suggestedTitle = movedChapters.length > 0
      ? `(${movedChapters[0].number}-${movedChapters[movedChapters.length - 1].number})`
      : `Mục lục ${parseResult.volumes.length + 1}`;

    const newVolTitle = window.prompt("Nhập tên Mục lục mới cho các chương từ #" + chapNumber + ":", suggestedTitle);
    if (!newVolTitle || !newVolTitle.trim()) return;

    let updatedKeptTitle = sourceVol.title;
    if (keptChapters.length > 0 && /^\(\d+-\d+\)/.test(sourceVol.title)) {
      updatedKeptTitle = `(${keptChapters[0].number}-${keptChapters[keptChapters.length - 1].number})`;
    }

    const newVol: ParsedVolume = { number: volNumber + 1, title: newVolTitle.trim(), chapters: movedChapters };
    const newVolumes: ParsedVolume[] = [];
    parseResult.volumes.forEach((v) => {
      if (v.number < volNumber) newVolumes.push(v);
      else if (v.number === volNumber) { newVolumes.push({ ...v, title: updatedKeptTitle, chapters: keptChapters }); newVolumes.push(newVol); }
      else newVolumes.push({ ...v, number: v.number + 1 });
    });
    newVolumes.forEach((v, idx) => { v.number = idx + 1; });
    setParseResult({ ...parseResult, totalVolumes: newVolumes.length, volumes: newVolumes });
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
    setParseResult({ ...parseResult, totalVolumes: remainingVolumes.length, volumes: remainingVolumes });
    toast.success("Đã gộp vào " + prevVol.title);
  };

  const handleDeleteVolume = (volNumber: number) => {
    if (!parseResult) return;
    const remainingVolumes = parseResult.volumes
      .filter((v) => v.number !== volNumber)
      .map((v, idx) => ({ ...v, number: idx + 1 }));
    const totalCh = remainingVolumes.reduce((acc, v) => acc + v.chapters.length, 0);
    const totalW = remainingVolumes.reduce((acc, v) => acc + v.chapters.reduce((ca, c) => ca + c.wordCount, 0), 0);
    setParseResult({ ...parseResult, totalVolumes: remainingVolumes.length, totalChapters: totalCh, totalWords: totalW, volumes: remainingVolumes });
    toast.info("Đã xóa mục lục " + volNumber);
  };

  const handleConfirmImport = async () => {
    if (!parseResult || parseResult.volumes.length === 0) { toast.error("Chưa có dữ liệu chương"); return; }
    setIsSaving(true);
    try {
      if (targetMode === "new") {
        if (!newStoryTitle.trim()) { toast.error("Vui lòng nhập tên truyện"); setIsSaving(false); return; }
        const res = await storyApi.importAsNewStory(
          {
            title: newStoryTitle.trim(),
            author: newStoryAuthor.trim() || "Chưa rõ",
            coverImage: newStoryCover,
            genres: [newStoryGenre],
            status: "Đang ra",
            description: newStoryDesc.trim() || `Tác phẩm gồm ${parseResult.totalVolumes} Mục lục.`,
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
        if (!selectedStoryId) { toast.error("Vui lòng chọn truyện đích"); setIsSaving(false); return; }
        const res = await storyApi.importParsedVolumes(selectedStoryId, parseResult.volumes, replaceExisting);
        if (res.success) {
          toast.success(`Đã nạp ${parseResult.totalVolumes} Mục lục vào truyện thành công!`);
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

  const doneCount = fileEntries.filter((e) => e.status === "done").length;
  const errorCount = fileEntries.filter((e) => e.status === "error").length;
  const parsingCount = fileEntries.filter((e) => e.status === "parsing").length;
  const currentStoryObj = stories.find((s) => s.id === (selectedStoryId || storyId));

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* 1. KHU VỰC TẢI LÊN (Chưa có file hoặc muốn nạp mới) */}
      {fileEntries.length === 0 ? (
        <label
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              addFiles(Array.from(e.dataTransfer.files));
            }
          }}
          className="p-10 sm:p-14 rounded-2xl border-2 border-dashed text-center cursor-pointer transition-all border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 hover:border-zinc-400 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900 block group"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                addFiles(Array.from(e.target.files));
                e.target.value = "";
              }
            }}
          />
          <div className="w-12 h-12 rounded-2xl bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center mx-auto mb-3 shadow-sm border border-zinc-200/80 dark:border-zinc-700 group-hover:scale-105 transition-transform">
            <Files className="w-6 h-6" />
          </div>
          <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white">
            Kéo thả hoặc bấm để chọn tệp truyện
          </h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
            Hỗ trợ nạp cùng lúc nhiều file <b>.PDF</b> · <b>.DOCX</b> · <b>.TXT</b> (Hệ thống tự động sắp xếp theo thứ tự chương)
          </p>
        </label>
      ) : (
        /* 2. THANH QUẢN LÝ TỆP NGUỒN GỌN GÀNG (FILE HUB - 1 HÀNG DUY NHẤT) */
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden text-xs">
          <div className="p-3.5 flex items-center justify-between gap-3">
            {/* Tóm tắt ngắn gọn */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-zinc-900 dark:text-white">
                    {doneCount}/{fileEntries.length} tệp đã nạp
                  </span>
                  {parseResult && (
                    <span className="text-zinc-500 font-medium">
                      • {parseResult.totalVolumes} Mục lục • {parseResult.totalChapters} chương
                    </span>
                  )}
                  {parsingCount > 0 && (
                    <span className="text-blue-500 flex items-center gap-1 font-medium animate-pulse">
                      <RefreshCw className="w-3 h-3 animate-spin" /> Đang đọc {parsingCount} tệp...
                    </span>
                  )}
                  {errorCount > 0 && (
                    <span className="text-rose-500 font-medium">
                      ({errorCount} lỗi)
                    </span>
                  )}
                </div>
                {/* Nút bấm xem danh sách tệp nguồn */}
                <button
                  type="button"
                  onClick={() => setShowFileDetail(!showFileDetail)}
                  className="text-[11px] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 font-medium flex items-center gap-1 mt-0.5"
                >
                  {showFileDetail ? "Thu gọn danh sách tệp" : "Xem chi tiết tệp"}
                  {showFileDetail ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              </div>
            </div>

            {/* Các nút hành động nhanh */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {!isAnyParsing && (
                <label className="px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 font-medium transition-colors flex items-center gap-1 cursor-pointer">
                  <input
                    type="file"
                    accept=".pdf,.docx,.txt"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        addFiles(Array.from(e.target.files));
                        e.target.value = "";
                      }
                    }}
                  />
                  <Plus className="w-3.5 h-3.5" /> Thêm tệp
                </label>
              )}
              <button
                type="button"
                onClick={resetAll}
                className="px-2.5 py-1.5 rounded-lg text-zinc-400 hover:text-rose-500 font-medium transition-colors"
                title="Làm mới lại từ đầu"
              >
                Đặt lại
              </button>
            </div>
          </div>

          {/* Chi tiết từng file (Thu gọn mặc định, cuộn mượt max-h-44) */}
          {showFileDetail && (
            <div className="border-t border-zinc-100 dark:border-zinc-800 p-2 max-h-44 overflow-y-auto space-y-1 bg-zinc-50/50 dark:bg-zinc-900/50">
              {fileEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-800/80 border border-zinc-100 dark:border-zinc-700/60 flex items-center justify-between gap-2 text-[11px]"
                >
                  <div className="flex items-center gap-2 truncate">
                    {entry.status === "done" && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />}
                    {entry.status === "parsing" && <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-500 flex-shrink-0" />}
                    {entry.status === "error" && <AlertCircle className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />}
                    <span className="font-medium text-zinc-800 dark:text-zinc-200 truncate">{entry.file.name}</span>
                    {entry.result && (
                      <span className="text-zinc-400 flex-shrink-0">({entry.result.totalChapters} ch)</span>
                    )}
                  </div>
                  {!isAnyParsing && (
                    <button
                      type="button"
                      onClick={() => removeFile(entry.id)}
                      className="text-zinc-400 hover:text-rose-500 p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. KHU VỰC CẤU HÌNH & XEM TRƯỚC MỤC LỤC */}
      {parseResult && (
        <div className="space-y-4">
          {/* Cấu hình chế độ nạp (Tinh gọn, không lặp lại tên truyện) */}
          {storyId ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-zinc-500">Chế độ nạp:</span>
                <div className="inline-flex rounded-lg border border-zinc-200 dark:border-zinc-700 p-0.5 bg-white dark:bg-zinc-900">
                  <button
                    type="button"
                    onClick={() => setReplaceExisting(false)}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      !replaceExisting
                        ? "bg-emerald-500 text-white shadow-sm"
                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" /> Gộp tiếp nối (Khuyên dùng)
                  </button>
                  <button
                    type="button"
                    onClick={() => setReplaceExisting(true)}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      replaceExisting
                        ? "bg-rose-500 text-white shadow-sm"
                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
                    }`}
                  >
                    <AlertCircle className="w-3.5 h-3.5" /> Ghi đè toàn bộ
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {!replaceExisting
                  ? `Nối ${parseResult.totalVolumes} mục lục mới vào sau các mục lục hiện có.`
                  : "⚠️ Sẽ thay thế toàn bộ mục lục và chương cũ."}
              </p>
            </div>
          ) : (
            /* Khi không có storyId sẵn */
            <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3 text-xs">
              <div className="flex items-center p-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 w-fit font-semibold">
                <button
                  type="button"
                  onClick={() => setTargetMode("new")}
                  className={`px-3 py-1.5 rounded-md transition-all ${
                    targetMode === "new" ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-500"
                  }`}
                >
                  Tạo truyện mới
                </button>
                <button
                  type="button"
                  onClick={() => setTargetMode("existing")}
                  className={`px-3 py-1.5 rounded-md transition-all ${
                    targetMode === "existing" ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-500"
                  }`}
                >
                  Nạp vào truyện có sẵn ({stories.length})
                </button>
              </div>

              {targetMode === "new" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">Tên truyện</label>
                    <input
                      type="text"
                      value={newStoryTitle}
                      onChange={(e) => setNewStoryTitle(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-medium"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">Tác giả</label>
                    <input
                      type="text"
                      value={newStoryAuthor}
                      onChange={(e) => setNewStoryAuthor(e.target.value)}
                      placeholder="Chưa rõ"
                      className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">Thể loại</label>
                    <select
                      value={newStoryGenre}
                      onChange={(e) => setNewStoryGenre(e.target.value as StoryGenre)}
                      className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-medium"
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
                    <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">Ảnh bìa (URL)</label>
                    <input
                      type="text"
                      value={newStoryCover}
                      onChange={(e) => setNewStoryCover(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2 pt-1">
                  <select
                    value={selectedStoryId}
                    onChange={(e) => setSelectedStoryId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-medium"
                  >
                    {stories.map((s) => (
                      <option key={s.id} value={s.id}>{s.title} ({s.volumes.length} mục lục)</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* 4. DANH SÁCH MỤC LỤC BÓC TÁCH (Đã tự động sắp xếp chuẩn từ bé đến lớn) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between pb-1 pt-1">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-white">
                  Mục lục bóc tách ({parseResult.volumes.length})
                </h4>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-medium border border-emerald-200 dark:border-emerald-800">
                  {parseResult.totalChapters} chương
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAutoEnrichTitles}
                  className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white font-medium flex items-center gap-1 px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                  title="Tự động nhận diện tên vị diện theo cơ sở dữ liệu"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Nhận diện vị diện</span>
                </button>
                <button
                  type="button"
                  onClick={handleToggleExpandAll}
                  className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white font-medium px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  {allExpanded ? "Thu gọn hết" : "Mở rộng hết"}
                </button>
              </div>
            </div>

            {/* List Volumes */}
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
              {parseResult.volumes.map((volume) => {
                const isExpanded = !!expandedVolIds[volume.number];
                const isEditingThis = editingVolNumber === volume.number;
                const chapCount = volume.chapters.length;
                const minC = chapCount > 0 ? volume.chapters[0].number : 0;
                const maxC = chapCount > 0 ? volume.chapters[chapCount - 1].number : 0;

                return (
                  <div key={volume.number} className="text-xs">
                    <div className="py-2.5 px-3 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/50 select-none group transition-colors">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                        {/* STT */}
                        <span className="w-5 text-[11px] font-mono text-zinc-400 font-semibold flex-shrink-0">
                          #{volume.number}
                        </span>

                        {/* Inline edit or Title */}
                        {isEditingThis ? (
                          <div className="flex items-center gap-1.5 flex-1 max-w-md" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="text"
                              value={editingVolTitle}
                              onChange={(e) => setEditingVolTitle(e.target.value)}
                              className="px-2 py-1 rounded border border-zinc-400 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-xs font-medium w-full"
                              autoFocus
                            />
                            <button onClick={() => handleSaveVolTitle(volume.number)} className="p-1 rounded bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setEditingVolNumber(null)} className="p-1 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 min-w-0">
                            {/* Dải chương */}
                            <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-mono text-[11px] font-semibold flex-shrink-0">
                              Ch. {minC}–{maxC}
                            </span>

                            {/* Tên mục lục */}
                            <span
                              onClick={() => toggleVolumeCollapse(volume.number)}
                              className="font-semibold text-zinc-900 dark:text-zinc-100 truncate cursor-pointer hover:underline"
                            >
                              {volume.title || `Mục lục ${volume.number}`}
                            </span>

                            <span className="text-[11px] text-zinc-400 flex-shrink-0">
                              ({chapCount} ch)
                            </span>

                            {/* Nút sửa */}
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setEditingVolNumber(volume.number); setEditingVolTitle(volume.title); }}
                              className="p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded transition-colors"
                              title="Sửa tên mục lục"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {/* Nút gộp lên */}
                            {volume.number > 1 && (
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleMergeWithPrevVolume(volume.number); }}
                                className="px-1.5 py-0.5 text-[10px] text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Gộp vào mục lục phía trước"
                              >
                                Gộp lên
                              </button>
                            )}

                            {/* Nút xóa */}
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleDeleteVolume(volume.number); }}
                              className="p-1 text-zinc-400 hover:text-rose-500 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Xóa mục lục này"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Icon mở rộng */}
                      <button
                        type="button"
                        onClick={() => toggleVolumeCollapse(volume.number)}
                        className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1 flex items-center justify-center transition-colors"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Danh sách chương bên trong khi mở rộng */}
                    {isExpanded && (
                      <div className="pl-8 pr-3 py-2 space-y-1 bg-zinc-50/50 dark:bg-zinc-800/30 border-t border-zinc-100 dark:border-zinc-800/60 max-h-60 overflow-y-auto">
                        {volume.chapters.map((chapter, idx) => (
                          <div
                            key={chapter.number + "-" + idx}
                            className="px-2 py-1 rounded flex items-center justify-between gap-2 hover:bg-white dark:hover:bg-zinc-800 transition-colors text-[11px]"
                          >
                            <span className="font-medium text-zinc-700 dark:text-zinc-300 truncate">
                              {chapter.title}
                            </span>
                            {idx > 0 && (
                              <button
                                type="button"
                                onClick={() => handleSplitVolumeAtChapter(volume.number, chapter.number)}
                                className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white p-0.5"
                                title="Tách thành Mục lục mới từ chương này"
                              >
                                <Scissors className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 5. NÚT XÁC NHẬN NẠP DUY NHẤT (STICKY BOTTOM BAR) */}
          <div className="pt-2 sticky bottom-3 z-10">
            <div className="p-3.5 rounded-2xl bg-zinc-900/95 dark:bg-white/95 backdrop-blur-md shadow-xl text-white dark:text-zinc-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-zinc-800 dark:border-zinc-200">
              <div className="text-xs">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
                  <span>Sẵn sàng nạp {parseResult.totalVolumes} Mục lục ({parseResult.totalChapters} chương)</span>
                </div>
                <p className="text-zinc-400 dark:text-zinc-600 text-[11px] mt-0.5">
                  {storyId ? (
                    !replaceExisting ? (
                      `✓ Sẽ gộp tiếp nối vào "${currentStoryObj?.title || "truyện"}" (an toàn)`
                    ) : (
                      `⚠️ Cảnh báo: Sẽ ghi đè toàn bộ truyện "${currentStoryObj?.title || "truyện"}"`
                    )
                  ) : (
                    targetMode === "new" ? "Tạo truyện mới trên hệ thống" : "Nạp vào truyện đích đã chọn"
                  )}
                </p>
              </div>

              <button
                onClick={handleConfirmImport}
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50 flex-shrink-0"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Đang lưu...
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-3.5 h-3.5" /> Xác nhận nạp {parseResult.totalVolumes} Mục lục
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
