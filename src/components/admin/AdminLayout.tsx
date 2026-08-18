import React, { useState, useEffect } from "react";
import { 
  BarChart3, BookOpen, Upload, ExternalLink, Menu, X, 
  ChevronRight, LogOut, FileUp, Sun, Moon
} from "lucide-react";
import { authApi } from "../../api";
import { useToast } from "../common/Toast";

export type AdminTab = "dashboard" | "stories" | "upload" | "pdf-upload" | "story-details" | "settings";

interface AdminLayoutProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  onNavigateToUserWeb: () => void;
  onLogout?: () => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  activeTab,
  onTabChange,
  onNavigateToUserWeb,
  onLogout,
  children,
}) => {
  const toast = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("admin_theme");
      if (saved === "light" || saved === "dark") return saved;
      return document.documentElement.classList.contains("dark") ? "dark" : "light";
    }
    return "dark";
  });

  const currentUser = authApi.getCurrentUser();

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      localStorage.setItem("admin_theme", theme);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const handleLogout = () => {
    authApi.logout();
    toast.info("Đã đăng xuất");
    if (onLogout) {
      onLogout();
    } else {
      onNavigateToUserWeb();
    }
  };

  const navItems: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    {
      id: "dashboard",
      label: "Thống kê",
      icon: <BarChart3 className="w-4 h-4" />,
    },
    {
      id: "stories",
      label: "Quản lý truyện",
      icon: <BookOpen className="w-4 h-4" />,
    },
    {
      id: "pdf-upload",
      label: "Tự động tách file",
      icon: <FileUp className="w-4 h-4" />,
    },
    {
      id: "upload",
      label: "Đăng chương mới",
      icon: <Upload className="w-4 h-4" />,
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex transition-colors duration-150">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 p-4 justify-between z-30">
        <div className="space-y-5">
          {/* Logo & Theme Switcher */}
          <div className="flex items-center justify-between px-2 py-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center font-bold text-xs">
                AD
              </div>
              <div>
                <h1 className="font-bold text-sm tracking-tight text-zinc-900 dark:text-white leading-tight">
                  Quản Trị
                </h1>
                <span className="text-[11px] text-zinc-500 font-medium">
                  Web Đọc Truyện
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={toggleTheme}
              className="w-8 h-8 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400 transition-colors"
              title={theme === "dark" ? "Chuyển sang Giao diện Sáng (Light)" : "Chuyển sang Giao diện Tối (Dark)"}
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>

          {/* User Card */}
          {currentUser && (
            <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-800 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center font-bold text-xs text-zinc-700 dark:text-zinc-300 flex-shrink-0">
                SA
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-xs text-zinc-900 dark:text-white truncate">
                  {currentUser.name}
                </p>
                <p className="text-[10px] text-zinc-500 font-mono">
                  Super Admin
                </p>
              </div>
            </div>
          )}

          {/* Navigation Menu */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const active = activeTab === item.id || (item.id === "stories" && activeTab === "story-details");

              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    active
                      ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 hover:text-zinc-900 dark:hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {active && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-1.5">
          <button
            onClick={onNavigateToUserWeb}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-all"
          >
            <div className="flex items-center gap-2.5">
              <ExternalLink className="w-4 h-4" />
              <span>Xem Web Đọc</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-mono">
              User
            </span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header Bar */}
        <header className="lg:hidden h-14 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-4 flex items-center justify-between z-20">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center font-bold text-xs">
              AD
            </div>
            <span className="font-bold text-xs text-zinc-900 dark:text-white">Admin Portal</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 p-3 space-y-1 animate-in slide-in-from-top-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold ${
                  activeTab === item.id
                    ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                    : "text-zinc-600 dark:text-zinc-400"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex justify-between">
              <button
                onClick={onNavigateToUserWeb}
                className="text-xs font-semibold text-zinc-500 py-1"
              >
                Xem Web Đọc
              </button>
              <button
                onClick={handleLogout}
                className="text-xs font-semibold text-rose-500 py-1"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        )}

        {/* Page Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
