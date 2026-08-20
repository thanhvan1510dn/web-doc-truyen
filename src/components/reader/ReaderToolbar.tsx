import React from 'react';
import { X, Sun, Moon, Coffee, Sparkles, Minus, Plus, AlignLeft, AlignJustify, Type } from 'lucide-react';
import { ReaderSettings, LineHeight, ReaderWidth } from '../../types/story';

interface ReaderToolbarProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ReaderSettings;
  onUpdateSettings: (newSettings: Partial<ReaderSettings>) => void;
}

export const ReaderToolbar: React.FC<ReaderToolbarProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  const handleFontSizeChange = (delta: number) => {
    const newSize = Math.max(14, Math.min(32, settings.fontSize + delta));
    onUpdateSettings({ fontSize: newSize });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-gray-200 dark:border-slate-800 p-5 sm:p-6 z-10 space-y-5 animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Type className="w-5 h-5 opacity-80" />
            <h3 className="font-bold text-base text-gray-900 dark:text-slate-100">
              Tùy Chỉnh Đọc Truyện
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Theme Color Picker */}
        <div>
          <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
            Màu nền đọc
          </label>
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => onUpdateSettings({ theme: 'light' })}
              className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border transition-all ${
                settings.theme === 'light'
                  ? 'border-zinc-900 dark:border-white bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-bold shadow-sm'
                  : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700'
              }`}
            >
              <Sun className="w-4 h-4" />
              <span className="text-xs">Sáng</span>
            </button>

            <button
              onClick={() => onUpdateSettings({ theme: 'sepia' })}
              className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border transition-all ${
                settings.theme === 'sepia'
                  ? 'border-zinc-900 dark:border-white bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-bold shadow-sm'
                  : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700'
              }`}
            >
              <Coffee className="w-4 h-4" />
              <span className="text-xs">Giấy ngà</span>
            </button>

            <button
              onClick={() => onUpdateSettings({ theme: 'dark' })}
              className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border transition-all ${
                settings.theme === 'dark'
                  ? 'border-zinc-900 dark:border-white bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-bold shadow-sm'
                  : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700'
              }`}
            >
              <Moon className="w-4 h-4" />
              <span className="text-xs">Ban đêm</span>
            </button>

            <button
              onClick={() => onUpdateSettings({ theme: 'midnight' })}
              className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border transition-all ${
                settings.theme === 'midnight'
                  ? 'border-zinc-900 dark:border-white bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-bold shadow-sm'
                  : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span className="text-xs">Nền đen</span>
            </button>
          </div>
        </div>

        {/* 2. Font Size Adjustment (A- / Slider / A+) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
              Cỡ chữ
            </label>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700">
              {settings.fontSize}px
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleFontSizeChange(-1)}
              disabled={settings.fontSize <= 14}
              className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-bold flex items-center gap-1 text-zinc-700 dark:text-zinc-300"
              title="Giảm cỡ chữ"
            >
              <Minus className="w-4 h-4" />
              <span>A-</span>
            </button>

            <input
              type="range"
              min="14"
              max="32"
              step="1"
              value={settings.fontSize}
              onChange={(e) => onUpdateSettings({ fontSize: Number(e.target.value) })}
              aria-label="Thanh trượt cỡ chữ"
              className="flex-1 accent-zinc-900 dark:accent-white h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg cursor-pointer"
            />

            <button
              onClick={() => handleFontSizeChange(1)}
              disabled={settings.fontSize >= 32}
              className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-bold flex items-center gap-1 text-zinc-700 dark:text-zinc-300"
              title="Tăng cỡ chữ"
            >
              <span>A+</span>
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 3. Font Family */}
        <div>
          <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
            Kiểu phông chữ
          </label>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <button
              onClick={() => onUpdateSettings({ fontFamily: 'serif' })}
              className={`p-2.5 rounded-xl border font-serif transition-all ${
                settings.fontFamily === 'serif'
                  ? 'border-zinc-900 dark:border-white bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-bold shadow-sm'
                  : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
              }`}
            >
              Có chân (Merriweather)
            </button>

            <button
              onClick={() => onUpdateSettings({ fontFamily: 'lora' })}
              className={`p-2.5 rounded-xl border font-serif italic transition-all ${
                settings.fontFamily === 'lora'
                  ? 'border-zinc-900 dark:border-white bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-bold shadow-sm'
                  : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
              }`}
            >
              Cổ điển (Lora)
            </button>

            <button
              onClick={() => onUpdateSettings({ fontFamily: 'sans' })}
              className={`p-2.5 rounded-xl border font-sans transition-all ${
                settings.fontFamily === 'sans'
                  ? 'border-zinc-900 dark:border-white bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-bold shadow-sm'
                  : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
              }`}
            >
              Không chân (Inter)
            </button>
          </div>
        </div>

        {/* 4. Line Spacing & Text Align */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          {/* Line Spacing */}
          <div>
            <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
              Giãn dòng
            </label>
            <div className="flex rounded-xl bg-zinc-100 dark:bg-zinc-800 p-1 text-xs">
              {(['tight', 'normal', 'relaxed'] as LineHeight[]).map((lh) => (
                <button
                  key={lh}
                  onClick={() => onUpdateSettings({ lineHeight: lh })}
                  className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
                    settings.lineHeight === lh
                      ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm font-bold'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  {lh === 'tight' ? 'Hẹp' : lh === 'normal' ? 'Vừa' : 'Rộng'}
                </button>
              ))}
            </div>
          </div>

          {/* Text Alignment */}
          <div>
            <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
              Căn lề
            </label>
            <div className="flex rounded-xl bg-zinc-100 dark:bg-zinc-800 p-1 text-xs">
              <button
                onClick={() => onUpdateSettings({ textAlign: 'left' })}
                className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg font-medium transition-all ${
                  settings.textAlign === 'left'
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm font-bold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <AlignLeft className="w-3.5 h-3.5" />
                <span>Trái</span>
              </button>
              <button
                onClick={() => onUpdateSettings({ textAlign: 'justify' })}
                className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg font-medium transition-all ${
                  settings.textAlign === 'justify'
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm font-bold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <AlignJustify className="w-3.5 h-3.5" />
                <span>Căn đều</span>
              </button>
            </div>
          </div>
        </div>

        {/* 5. Reader Max Width (Narrow, Medium, Wide, Full) */}
        <div>
          <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
            Độ rộng khung đọc
          </label>
          <div className="flex rounded-xl bg-zinc-100 dark:bg-zinc-800 p-1 text-xs">
            {(['narrow', 'medium', 'wide', 'full'] as ReaderWidth[]).map((w) => (
              <button
                key={w}
                onClick={() => onUpdateSettings({ readerWidth: w })}
                className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
                  settings.readerWidth === w
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm font-bold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                {w === 'narrow' ? '650px' : w === 'medium' ? '800px' : w === 'wide' ? '1000px' : 'Tràn viền'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
