import React, { useState } from "react";
import { X, Copy, Check, Download, Upload, RefreshCw, Database } from "lucide-react";
import { storyStorage } from "../../services/storyStorage";
import { useToast } from "../common/Toast";

interface UserSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const UserSyncModal: React.FC<UserSyncModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const [importText, setImportText] = useState("");

  if (!isOpen) return null;

  const stories = storyStorage.getStories({ includeInactive: true });
  const exportData = storyStorage.exportStoriesJson();

  const handleCopy = () => {
    navigator.clipboard.writeText(exportData);
    setCopied(true);
    toast.success("Đã sao chép mã dữ liệu!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([exportData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `web_doc_truyen_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Đã tải tệp sao lưu .json về máy!");
  };

  const handleImportText = () => {
    if (!importText.trim()) {
      toast.error("Vui lòng dán mã dữ liệu từ Admin");
      return;
    }
    const success = storyStorage.importStoriesJson(importText.trim());
    if (success) {
      toast.success("Đã nạp toàn bộ truyện từ Admin thành công!");
      setImportText("");
      if (onSuccess) onSuccess();
      onClose();
    } else {
      toast.error("Mã dữ liệu không hợp lệ");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = storyStorage.importStoriesJson(content);
        if (success) {
          toast.success("Đã nạp toàn bộ truyện từ file thành công!");
          if (onSuccess) onSuccess();
          onClose();
        } else {
          toast.error("File dữ liệu không đúng định dạng JSON");
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-gray-900 dark:text-white">Nạp Truyện Từ Admin</h3>
              <p className="text-[11px] text-gray-500 dark:text-slate-400">Đồng bộ truyện từ trang Admin sang Web Đọc</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-200/60 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5 overflow-y-auto">
          {/* Import section */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              1. Dán Mã Truyện Hoặc File Từ Admin
            </h4>
            <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed">
              Mở trang Admin, bấm nút <b>"Xuất mã / Đồng bộ"</b> rồi dán chuỗi mã vào ô dưới đây:
            </p>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Dán chuỗi mã JSON từ trang Admin vào đây..."
              rows={4}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-xs font-mono text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleImportText}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition-colors shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Nạp truyện ngay</span>
              </button>
              <label className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-200 text-xs font-semibold hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-gray-500" />
                <span>Tải file .json lên</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="border-t border-gray-100 dark:border-slate-800" />

          {/* Export / Backup */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider">
              2. Sao Lưu Truyện Hiện Tại ({stories.length} truyện)
            </h4>
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Đã sao chép!" : "Sao chép mã"}</span>
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Tải file</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
