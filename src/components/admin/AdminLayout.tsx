import React, { useState } from "react";
import { FileUp, 
  BarChart3, BookOpen, Upload, ExternalLink, Menu, X, 
  ShieldCheck, ChevronRight, RefreshCw, LogOut
} from "lucide-react";
import { authApi, storyApi } from "../../api";
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
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const currentUser = authApi.getCurrentUser();

  const handleResetData = async () => {
    if (window.confirm("Bạn có chắc chắn muốn khôi phục toàn bộ dữ liệu mẫu ban đầu?")) {
      storyApi.restoreStory("");
      localStorage.removeItem("web_doc_truyen_stories_v2");
      localStorage.removeItem("web_doc_truyen_analytics_events_v2");
      window.location.reload();
    }
  };

  const handleLogout = () => {
    authApi.logout();
    toast.info("Đã đăng xuất khỏi tài khoản Quản trị");
    if (onLogout) {
      onLogout();
    }
  };

  const navItems: { id: AdminTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: "dashboard",
      label: "Báo cáo & Độc giả",
      icon: <BarChart3 className="w-4 h-4" />,
      badge: "Live",
    },
    {
      id: "stories",
      label: "Quản lý Truyện",
      icon: <BookOpen className="w-4 h-4" />,
    },
        {
      id: "pdf-upload",
      label: "Tự động tách File (PDF/DOCX/TXT)",
      icon: <FileUp className="w-4 h-4 text-amber-500" />,
      badge: "Auto",
    },
    {
      id: "upload",
      label: "Đăng chương thủ công",
      icon: <Upload className="w-4 h-4" />,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 p-4 justify-between z-30">
        <div className="space-y-6">
          {/* Admin Brand Logo */}
          <div className="flex items-center gap-3 px-2 py-1.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-black text-sm tracking-tight text-slate-900 dark:text-white leading-tight">
                Admin Truyện
              </h1>
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">
                Management Portal
              </span>
            </div>
          </div>

          {/* Logged in User Card */}
          {currentUser && (
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-800 flex items-center gap-2.5">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-9 h-9 rounded-xl object-cover border border-amber-500/30"
              />
              <div className="min-w-0 flex-1">
                <p className="font-bold text-xs text-slate-900 dark:text-white truncate">
                  {currentUser.name}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-black uppercase">
                    "Super Admin"
                  </span>
                </div>
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
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    active
                      ? "bg-amber-500 text-white shadow-sm shadow-amber-500/30"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                      active
                        ? "bg-white/20 text-white"
                        : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer: Switch to User Web & Logout & Reset */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <button
            onClick={onNavigateToUserWeb}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500 hover:text-white text-amber-700 dark:text-amber-400 text-xs font-bold transition-all group"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Xem Web Đọc Giả</span>
            </span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Đăng xuất Admin</span>
          </button>

          <button
            onClick={handleResetData}
            title="Khôi phục lại dữ liệu mẫu nếu cần test lại từ đầu"
            className="w-full flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-[11px] font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Khôi phục dữ liệu gốc</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header Bar */}
        <header className="lg:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 h-14 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="font-black text-sm text-slate-900 dark:text-white">Admin Quản Trị</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLogout}
              title="Đăng xuất"
              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
            >
              <LogOut className="w-4 h-4" />
            </button>
            <button
              onClick={onNavigateToUserWeb}
              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-500 text-white flex items-center gap-1.5 shadow-sm"
            >
              <span>Web Đọc</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </header>

        {/* Mobile Drawer */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <div className="relative w-64 bg-white dark:bg-slate-900 h-full p-4 flex flex-col justify-between z-50">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="font-black text-sm">Menu Quản trị</span>
                  <button
                    onClick={() => setMobileSidebarOpen(false)}
                    className="p-1 rounded-lg text-slate-400"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {currentUser && (
                  <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center gap-2">
                    <img src={currentUser.avatar} alt="" className="w-8 h-8 rounded-lg object-cover" />
                    <div className="min-w-0">
                      <p className="font-bold text-xs truncate">{currentUser.name}</p>
                      <p className="text-[10px] text-amber-600 font-bold">"Super Admin"</p>
                    </div>
                  </div>
                )}

                <nav className="space-y-1">
                  {navItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        onTabChange(item.id);
                        setMobileSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold ${
                        activeTab === item.id
                          ? "bg-amber-500 text-white"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                      }`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </button>
                  ))}
                </nav>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <button
                  onClick={() => {
                    setMobileSidebarOpen(false);
                    onNavigateToUserWeb();
                  }}
                  className="w-full py-2.5 bg-amber-500/10 text-amber-600 rounded-xl text-xs font-bold text-center"
                >
                  ← Sang Web Đọc Truyện
                </button>
                <button
                  onClick={() => {
                    setMobileSidebarOpen(false);
                    handleLogout();
                  }}
                  className="w-full py-2 text-rose-600 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
