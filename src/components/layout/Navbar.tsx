import React, { useState } from "react";
import { BookOpen, Sun, Moon, Coffee, Sparkles, LogIn } from "lucide-react";
import { ThemeMode } from "../../types/story";

interface NavbarProps {
  currentView: string;
  onNavigateHome: () => void;
  onNavigateAdmin?: () => void;
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigateHome,
  onNavigateAdmin,
  theme,
  onThemeChange,
}) => {
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);

  const getThemeIcon = () => {
    switch (theme) {
      case "dark":
        return <Moon className="w-4 h-4 text-slate-300" />;
      case "sepia":
        return <Coffee className="w-4 h-4 text-[#4a3828]" />;
      case "midnight":
        return <Sparkles className="w-4 h-4 text-indigo-300" />;
      default:
        return <Sun className="w-4 h-4 text-zinc-700" />;
    }
  };

  const navClasses =
    theme === "dark" || theme === "midnight"
      ? "bg-slate-900/90 border-slate-800 text-slate-100"
      : theme === "sepia"
      ? "bg-[#f0e6cb]/90 border-[#dfd2af] text-[#4a3828]"
      : "bg-white/90 border-gray-200 text-gray-800";

  return (
    <header className={`sticky top-0 z-40 backdrop-blur-md border-b transition-colors ${navClasses}`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Logo / Home Button */}
        <div 
          onClick={onNavigateHome}
          className="flex items-center gap-2.5 cursor-pointer select-none"
        >
          <div className="w-8 h-8 rounded-lg bg-zinc-900 dark:bg-white flex items-center justify-center text-white dark:text-zinc-900 shadow-sm font-bold">
            <BookOpen className="w-4 h-4" />
          </div>
          <span className="font-bold text-base tracking-tight hover:opacity-80 transition-opacity">
            Đọc Truyện
          </span>
          {currentView !== "home" && (
            <span className="text-xs text-gray-400 dark:text-slate-500 ml-1">
              / Danh sách
            </span>
          )}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Login Button */}
          {onNavigateAdmin && (
            <button
              onClick={onNavigateAdmin}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold transition-all shadow-sm"
              title="Đăng nhập"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Login</span>
            </button>
          )}

          {/* Theme Switcher Button */}
          <div className="relative">
            <button
              onClick={() => setThemeDropdownOpen(!themeDropdownOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-xs font-medium"
              title="Đổi giao diện màu"
            >
              {getThemeIcon()}
              <span className="hidden sm:inline capitalize">
                {theme === "sepia" ? "Sepia" : theme === "dark" ? "Dark" : theme === "midnight" ? "Midnight" : "Light"}
              </span>
            </button>

            {themeDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setThemeDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-40 rounded-xl shadow-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1.5 z-50 animate-in fade-in duration-100">
                  <button
                    onClick={() => { onThemeChange("light"); setThemeDropdownOpen(false); }}
                    className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium text-left transition-colors ${
                      theme === "light" ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold" : "hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200"
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5" />
                    <span>Sáng (Light)</span>
                  </button>
                  <button
                    onClick={() => { onThemeChange("dark"); setThemeDropdownOpen(false); }}
                    className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium text-left transition-colors ${
                      theme === "dark" ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold" : "hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200"
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5" />
                    <span>Tối (Dark)</span>
                  </button>
                  <button
                    onClick={() => { onThemeChange("sepia"); setThemeDropdownOpen(false); }}
                    className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium text-left transition-colors ${
                      theme === "sepia" ? "bg-[#4a3828] text-[#ebdcb3] font-bold" : "hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200"
                    }`}
                  >
                    <Coffee className="w-3.5 h-3.5" />
                    <span>Ấm áp (Sepia)</span>
                  </button>
                  <button
                    onClick={() => { onThemeChange("midnight"); setThemeDropdownOpen(false); }}
                    className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium text-left transition-colors ${
                      theme === "midnight" ? "bg-indigo-600 text-white font-bold" : "hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200"
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Đêm sâu (Midnight)</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
