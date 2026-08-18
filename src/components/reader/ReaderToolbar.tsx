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
            <Type className="w-5 h-5 text-amber-500" />
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
            Chế độ màu / Giao diện
          </label>
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => onUpdateSettings({ theme: 'light' })}
              className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all ${
                settings.theme === 'light'
                  ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 text-amber-600 font-bold shadow-sm'
                  : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300'
              }`}
            >
              <div className="w-6 h-6 rounded-full bg-white border border-gray-300 flex items-center justify-center shadow-xs">
                <Sun className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <span className="text-xs">Sáng</span>
            </button>

            <button
              onClick={() => onUpdateSettings({ theme: 'sepia' })}
              className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all ${
                settings.theme === 'sepia'
                  ? 'border-amber-600 bg-amber-50/50 text-amber-700 font-bold shadow-sm'
                  : 'border-amber-200/80 bg-[#f5ecd4] text-[#4a3828]'
              }`}
            >
              <div className="w-6 h-6 rounded-full bg-[#ebdcb3] border border-[#d4c393] flex items-center justify-center shadow-xs">
                <Coffee className="w-3.5 h-3.5 text-amber-700" />
              </div>
              <span className="text-xs">Sepia</span>
            </button>

            <button
              onClick={() => onUpdateSettings({ theme: 'dark' })}
              className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all ${
                settings.theme === 'dark'
                  ? 'border-amber-500 bg-slate-800 text-amber-400 font-bold shadow-sm'
                  : 'border-slate-700 bg-slate-900 text-slate-300'
              }`}
            >
              <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shadow-xs">
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <span className="text-xs">Tối (Dark)</span>
            </button>

            <button
              onClick={() => onUpdateSettings({ theme: 'midnight' })}
              className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all ${
                settings.theme === 'midnight'
                  ? 'border-blue-500 bg-[#0e172a] text-blue-400 font-bold shadow-sm'
                  : 'border-slate-800 bg-[#0a0f1d] text-slate-300'
              }`}
            >
              <div className="w-6 h-6 rounded-full bg-[#131e38] border border-slate-700 flex items-center justify-center shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <span className="text-xs">Midnight</span>
            </button>
          </div>
        </div>

        {/* 2. Font Size Adjustment (A- / Slider / A+) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
              Cỡ chữ (Font Size)
            </label>
            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
              {settings.fontSize}px
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleFontSizeChange(-1)}
              disabled={settings.fontSize <= 14}
              className="p-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-bold flex items-center gap-1"
              title="Giảm cỡ chữ (A-)"
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
              className="flex-1 accent-amber-500 h-2 bg-gray-200 dark:bg-slate-700 rounded-lg cursor-pointer"
            />

            <button
              onClick={() => handleFontSizeChange(1)}
              disabled={settings.fontSize >= 32}
              className="p-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-bold flex items-center gap-1"
              title="Tăng cỡ chữ (A+)"
            >
              <span>A+</span>
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 3. Font Family */}
        <div>
          <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
            Kiểu phông chữ (Font Family)
          </label>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <button
              onClick={() => onUpdateSettings({ fontFamily: 'serif' })}
              className={`p-2.5 rounded-xl border font-serif transition-all ${
                settings.fontFamily === 'serif'
                  ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold'
                  : 'border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300'
              }`}
            >
              Merriweather
            </button>

            <button
              onClick={() => onUpdateSettings({ fontFamily: 'lora' })}
              className={`p-2.5 rounded-xl border font-serif italic transition-all ${
                settings.fontFamily === 'lora'
                  ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold'
                  : 'border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300'
              }`}
            >
              Lora Classic
            </button>

            <button
              onClick={() => onUpdateSettings({ fontFamily: 'sans' })}
              className={`p-2.5 rounded-xl border font-sans transition-all ${
                settings.fontFamily === 'sans'
                  ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold'
                  : 'border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300'
              }`}
            >
              Inter Sans
            </button>
          </div>
        </div>

        {/* 4. Line Spacing & Text Align & Width */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          {/* Line Spacing */}
          <div>
            <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
              Giãn dòng
            </label>
            <div className="flex rounded-xl bg-gray-100 dark:bg-slate-800 p-1 text-xs">
              {(['tight', 'normal', 'relaxed'] as LineHeight[]).map((lh) => (
                <button
                  key={lh}
                  onClick={() => onUpdateSettings({ lineHeight: lh })}
                  className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
                    settings.lineHeight === lh
                      ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm font-semibold'
                      : 'text-gray-600 dark:text-slate-400 hover:text-gray-900'
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
              Canh lề văn bản
            </label>
            <div className="flex rounded-xl bg-gray-100 dark:bg-slate-800 p-1 text-xs">
              <button
                onClick={() => onUpdateSettings({ textAlign: 'left' })}
                className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg font-medium transition-all ${
                  settings.textAlign === 'left'
                    ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm font-semibold'
                    : 'text-gray-600 dark:text-slate-400 hover:text-gray-900'
                }`}
              >
                <AlignLeft className="w-3.5 h-3.5" />
                <span>Trái</span>
              </button>
              <button
                onClick={() => onUpdateSettings({ textAlign: 'justify' })}
                className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg font-medium transition-all ${
                  settings.textAlign === 'justify'
                    ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm font-semibold'
                    : 'text-gray-600 dark:text-slate-400 hover:text-gray-900'
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
          <div className="flex rounded-xl bg-gray-100 dark:bg-slate-800 p-1 text-xs">
            {(['narrow', 'medium', 'wide', 'full'] as ReaderWidth[]).map((w) => (
              <button
                key={w}
                onClick={() => onUpdateSettings({ readerWidth: w })}
                className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
                  settings.readerWidth === w
                    ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm font-semibold'
                    : 'text-gray-600 dark:text-slate-400 hover:text-gray-900'
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
