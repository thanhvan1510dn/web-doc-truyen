import React, { useState, useEffect, useRef } from "react";
import {
  CheckCircle2, RefreshCw, Files,
  Plus, Minus, X, Edit3, Check, Scissors, Trash2, Sparkles, AlertCircle
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

// Merge multiple DocumentParseResult into one, re-numbering volumes sequentially
// and deduplicating chapters by chapter number (higher file index wins)
function mergeResults(entries: FileEntry[]): DocumentParseResult | null {
  const doneEntries = entries.filter((e) => e.status === "done" && e.result);
  if (doneEntries.length === 0) return null;

  let allVolumes: ParsedVolume[] = [];
  let volOffset = 0;

  for (const entry of doneEntries) {
    const vols = entry.result!.volumes;
    for (const vol of vols) {
      allVolumes.push({ ...vol, number: volOffset + vol.number });
    }
    volOffset += vols.length;
  }

  // Re-number sequentially
  allVolumes = allVolumes.map((v, i) => ({ ...v, number: i + 1 }));

  // Dedup chapters across volumes: keep latest by chapter number
  // (later file wins for same chap number)
  const chapSeen = new Map<number, boolean>();
  const dedupedVolumes: ParsedVolume[] = [];

  // Process in reverse so later files' chapters take precedence;
  // then reverse back
  for (let i = allVolumes.length - 1; i >= 0; i--) {
    const vol = allVolumes[i];
    const dedupedChapters = vol.chapters.filter((c) => {
      if (chapSeen.has(c.number)) return false;
      chapSeen.set(c.number, true);
      return true;
    });
    dedupedVolumes.unshift({ ...vol, chapters: dedupedChapters });
  }

  // Remove empty volumes
  const finalVolumes = dedupedVolumes
    .filter((v) => v.chapters.length > 0)
    .map((v, i) => ({ ...v, number: i + 1 }));

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

  // Multi-file list
  const [fileEntries, setFileEntries] = useState<FileEntry[]>([]);
  const [isAnyParsing, setIsAnyParsing] = useState(false);

  // Merged result after all files parsed
  const [parseResult, setParseResult] = useState<DocumentParseResult | null>(null);

  // Target Mode
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

  // --- Enrich logic (unchanged) ---
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
          if (evRange && minCh > 0 && maxCh > 0) {
            return parseInt(evRange[1], 10) === minCh && parseInt(evRange[2], 10) === maxCh;
          }
          if (Array.isArray(ev.chapters) && ev.chapters.length > 0) {
            const evNums = new Set(ev.chapters.map((c) => c.number).filter((n) => n > 0));
            let overlap = 0;
            chapNumbers.forEach((n) => { if (evNums.has(n)) overlap++; });
            return overlap >= Math.min(ev.chapters.length, chapNumbers.length) * 0.5 && overlap > 0;
          }
          return false;
        });

        if (matched && matched.title && matched.title.includes(" ") && !matched.title.startsWith("Mục lục")) {
          if (vol.title !== matched.title) {
            enrichedCount++;
            arcNames.push(matched.title);
          }
          return { ...vol, title: matched.title };
        }
      }

      if (minCh > 0 && maxCh > 0) {
        const canon = findCanonArc(minCh, maxCh);
        if (canon && canon.includes(" ")) {
          if (vol.title !== canon) {
            enrichedCount++;
            arcNames.push(canon);
          }
          return { ...vol, title: canon };
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
      toast.success(`✨ Đã tự động nhận diện và gán ${enrichedCount} tên Mục lục: ${arcNames.join(", ")}`);
    } else {
      toast.info("Các mục lục đã ở trạng thái chuẩn.");
    }
  };

  // --- Multi-file add ---
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

    // Reset preview if there was one
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

    // Parse them sequentially (to avoid memory spikes with large PDFs)
    for (const entry of newEntries) {
      setFileEntries((prev) =>
        prev.map((e) =>
          e.id === entry.id ? { ...e, status: "parsing", progress: 0, progressMsg: "Bắt đầu..." } : e
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

  // After fileEntries change, auto-merge and show preview if all done
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
            `✨ ${done.length} file · ${merged.totalVolumes} Mục lục · Khớp ${enrichedCount} tên vị diện: ${arcNames.slice(0, 2).join(", ")}${arcNames.length > 2 ? "..." : ""}`
          );
        } else {
          toast.success(`Đã đọc ${done.length} file · ${merged.totalVolumes} Mục lục · ${merged.totalChapters} chương`);
        }
      }
    }
  }, [fileEntries]);

  const removeFile = (id: string) => {
    setFileEntries((prev) => {
      const updated = prev.filter((e) => e.id !== id);
      // Rebuild merged result
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
          } else {
            setParseResult(null);
          }
        }
      }
      return updated;
    });
  };

  const resetAll = () => {
    setFileEntries([]);
    setParseResult(null);
    setIsAnyParsing(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // --- Volume editing helpers (unchanged) ---
  const toggleVolumeCollapse = (volNumber: number) => {
    setExpandedVolIds((prev) => ({ ...prev, [volNumber]: !prev[volNumber] }));
  };

  const handleSaveVolTitle = (volNumber: number) => {
    if (!parseResult || !editingVolTitle.trim()) { setEditingVolNumber(null); return; }
    const updatedVolumes = parseResult.volumes.map((v) =>
      v.number === volNumber ? { ...v, title: editingVolTitle.trim() } : v
    );
    setParseResult({ ...parseResult, volumes: updatedVolumes });
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
        if (res.success) { toast.success("Đã lưu truyện " + res.data.title + " thành công!"); if (onSuccess) onSuccess(res.data.id); }
        else toast.error(res.error || "Không thể nạp truyện");
      } else {
        if (!selectedStoryId) { toast.error("Vui lòng chọn truyện đích"); setIsSaving(false); return; }
        const res = await storyApi.importParsedVolumes(selectedStoryId, parseResult.volumes, replaceExisting);
        if (res.success) { toast.success("Đã nạp nội dung vào truyện thành công!"); if (onSuccess) onSuccess(selectedStoryId); }
        else toast.error(res.error || "Không thể nạp dữ liệu");
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

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
          Nạp file
        </h2>
      </div>

      {/* Upload Zone — always visible until user clicks reset */}
      {fileEntries.length === 0 ? (
        <label
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              addFiles(Array.from(e.dataTransfer.files));
            }
          }}
          className="p-8 sm:p-14 rounded-2xl border border-dashed text-center cursor-pointer transition-all border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-400 dark:hover:border-zinc-700 shadow-sm block"
        >
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
          <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center mx-auto mb-3.5">
            <Files className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
            Kéo thả hoặc bấm để chọn nhiều tệp
          </h3>
          <p className="text-xs text-zinc-500 mt-1">
            Hỗ trợ .PDF · .DOCX · .TXT · Có thể chọn nhiều file cùng lúc
          </p>
        </label>
      ) : (
        /* File list panel */
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
          {/* header */}
          <div className="px-4 py-3 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <Files className="w-4 h-4 text-zinc-500" />
              <span className="text-sm font-semibold text-zinc-900 dark:text-white">
                {fileEntries.length} tệp
              </span>
              {doneCount > 0 && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  {doneCount} xong
                </span>
              )}
              {parsingCount > 0 && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                  <RefreshCw className="w-2.5 h-2.5 animate-spin" /> {parsingCount} đang đọc
                </span>
              )}
              {errorCount > 0 && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                  {errorCount} lỗi
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* Add more files button */}
              {!isAnyParsing && (
                <label className="text-xs px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800 font-medium transition-colors flex items-center gap-1 cursor-pointer">
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
                className="text-xs px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-rose-500 hover:border-rose-200 font-medium transition-colors"
              >
                Đặt lại
              </button>
            </div>
          </div>

          {/* file rows */}
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {fileEntries.map((entry) => (
              <div key={entry.id} className="px-4 py-3 flex items-center gap-3 text-xs">
                {/* status icon */}
                <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                  {entry.status === "done" && <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500" />}
                  {entry.status === "parsing" && <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />}
                  {entry.status === "pending" && <div className="w-3 h-3 rounded-full border-2 border-zinc-300 dark:border-zinc-600" />}
                  {entry.status === "error" && <AlertCircle className="w-4 h-4 text-rose-500" />}
                </div>

                {/* file name + info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-zinc-800 dark:text-zinc-200 truncate">
                      {entry.file.name}
                    </span>
                    {entry.status === "done" && entry.result && (
                      <span className="flex-shrink-0 text-zinc-400">
                        {entry.result.totalVolumes}ML · {entry.result.totalChapters}ch
                      </span>
                    )}
                    {entry.status === "error" && (
                      <span className="flex-shrink-0 text-rose-500">{entry.error}</span>
                    )}
                  </div>
                  {entry.status === "parsing" && (
                    <div className="mt-1.5 space-y-1">
                      <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-500 h-full rounded-full transition-all duration-200"
                          style={{ width: entry.progress + "%" }}
                        />
                      </div>
                      <p className="text-[11px] text-zinc-400 font-mono">{entry.progress}% · {entry.progressMsg}</p>
                    </div>
                  )}
                </div>

                {/* remove */}
                {!isAnyParsing && (
                  <button
                    type="button"
                    onClick={() => removeFile(entry.id)}
                    className="flex-shrink-0 p-1 text-zinc-300 hover:text-rose-500 rounded transition-colors"
                    title="Xóa tệp này"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
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
                  {doneCount} tệp · {parseResult.totalVolumes} Mục lục · {parseResult.totalChapters} chương
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {fileEntries.filter((e) => e.status === "done").map((e) => e.file.name).join(" + ")}
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
                    <input type="radio" name="importMode" checked={!replaceExisting} onChange={() => setReplaceExisting(false)} className="text-zinc-900 focus:ring-0" />
                    <span className={!replaceExisting ? "font-bold text-emerald-600 dark:text-emerald-400" : "text-zinc-500"}>➕ Gộp tiếp nối (File tiếp theo)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-medium">
                    <input type="radio" name="importMode" checked={replaceExisting} onChange={() => setReplaceExisting(true)} className="text-zinc-900 focus:ring-0" />
                    <span className={replaceExisting ? "font-bold text-rose-600 dark:text-rose-400" : "text-zinc-500"}>⚠️ Ghi đè toàn bộ</span>
                  </label>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center p-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 w-fit text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setTargetMode("new")}
                    className={"px-3 py-1.5 rounded-md transition-all " + (targetMode === "new" ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white")}
                  >
                    Tạo truyện mới
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetMode("existing")}
                    className={"px-3 py-1.5 rounded-md transition-all " + (targetMode === "existing" ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white")}
                  >
                    Nạp vào truyện có sẵn ({stories.length})
                  </button>
                </div>

                {targetMode === "new" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Tên truyện</label>
                      <input type="text" value={newStoryTitle} onChange={(e) => setNewStoryTitle(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-medium text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400" required />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Tác giả</label>
                      <input type="text" value={newStoryAuthor} onChange={(e) => setNewStoryAuthor(e.target.value)} placeholder="Chưa rõ" className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Thể loại</label>
                      <select value={newStoryGenre} onChange={(e) => setNewStoryGenre(e.target.value as StoryGenre)} className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-medium text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400">
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
                      <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Ảnh bìa (URL)</label>
                      <input type="text" value={newStoryCover} onChange={(e) => setNewStoryCover(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400" />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Chọn truyện nhận file tiếp theo</label>
                      <select
                        value={selectedStoryId}
                        onChange={(e) => {
                          const newId = e.target.value;
                          setSelectedStoryId(newId);
                          if (parseResult) {
                            const { enriched, enrichedCount, arcNames } = enrichVolumes(parseResult.volumes, newId);
                            if (enrichedCount > 0) {
                              setParseResult({ ...parseResult, volumes: enriched });
                              toast.success(`✨ Tự động nhận diện ${enrichedCount} tên Mục lục: ${arcNames.join(", ")}`);
                            }
                          }
                        }}
                        className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-medium text-zinc-900 dark:text-white"
                      >
                        {stories.map((s) => (
                          <option key={s.id} value={s.id}>{s.title} ({s.volumes.length} mục lục)</option>
                        ))}
                      </select>
                    </div>
                    <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 flex flex-col sm:flex-row gap-4 text-xs">
                      <label className="flex items-center gap-2 cursor-pointer font-medium">
                        <input type="radio" name="importModeExisting" checked={!replaceExisting} onChange={() => setReplaceExisting(false)} className="text-zinc-900 focus:ring-0" />
                        <span className={!replaceExisting ? "font-semibold text-zinc-900 dark:text-white" : "text-zinc-500 dark:text-zinc-400"}>Gộp thông minh (Đè nội dung lên mục lục trùng tên, thêm tiếp nối mục lục mới)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer font-medium">
                        <input type="radio" name="importModeExisting" checked={replaceExisting} onChange={() => setReplaceExisting(true)} className="text-zinc-900 focus:ring-0" />
                        <span className={replaceExisting ? "font-semibold text-zinc-900 dark:text-white" : "text-zinc-500 dark:text-zinc-400"}>Ghi đè toàn bộ truyện (Xoá hết mục lục cũ)</span>
                      </label>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Volumes & Chapters Tree */}
          <div className="space-y-2">
            <div className="flex items-center justify-between pb-1 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-xs text-zinc-900 dark:text-white">
                  Mục lục bóc tách ({parseResult.volumes.length})
                </h4>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-medium border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Tự động nhận diện tên
                </span>
              </div>
              <button
                type="button"
                onClick={handleAutoEnrichTitles}
                className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white font-medium flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                title="Quét lại tên vị diện theo cơ sở dữ liệu truyện"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Nhận diện lại</span>
              </button>
            </div>

            <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
              {parseResult.volumes.map((volume) => {
                const isExpanded = !!expandedVolIds[volume.number];
                const isEditingThis = editingVolNumber === volume.number;

                return (
                  <div key={volume.number} className="py-1">
                    <div className="py-2 px-2 rounded-lg hover:bg-zinc-100/70 dark:hover:bg-zinc-800/50 flex items-center justify-between select-none text-xs group transition-colors">
                      <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                        <span className="text-[11px] font-semibold text-zinc-400 flex-shrink-0">#{volume.number}</span>

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
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span
                              onClick={() => toggleVolumeCollapse(volume.number)}
                              className="font-semibold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-black dark:group-hover:text-white transition-colors truncate cursor-pointer"
                            >
                              {volume.title || `Mục lục ${volume.number}`}
                            </span>
                            <span className="text-[11px] font-normal text-zinc-400 flex-shrink-0">({volume.chapters.length})</span>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setEditingVolNumber(volume.number); setEditingVolTitle(volume.title); }}
                              className="p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded transition-colors inline-flex items-center ml-1"
                              title="Sửa tên mục lục"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
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

                      <div
                        onClick={() => toggleVolumeCollapse(volume.number)}
                        className="text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 p-1 flex items-center justify-center cursor-pointer transition-colors"
                      >
                        {isExpanded ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="pl-3 sm:pl-4 py-1 space-y-0.5 border-l-2 border-zinc-200/70 dark:border-zinc-800 ml-3 my-1">
                        {volume.chapters.map((chapter, idx) => (
                          <div
                            key={chapter.number + "-" + idx}
                            className="px-2 py-1.5 rounded-lg flex items-center justify-between gap-2 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/40 group transition-colors"
                          >
                            <div className="flex items-center truncate">
                              <span className="font-medium text-sm text-zinc-800 dark:text-zinc-200 group-hover:text-black dark:group-hover:text-white truncate">
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
              <span>{isSaving ? "Đang lưu..." : `Xác nhận nạp ${parseResult.totalVolumes} Mục lục`}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
