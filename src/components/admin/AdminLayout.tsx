import React, { useState, useEffect } from "react";
import { 
  BarChart3, BookOpen, ExternalLink, Menu, X, 
  ChevronRight, LogOut
} from "lucide-react";
import { authApi } from "../../api";
import { useToast } from "../common/Toast";

export type AdminTab = "dashboard" | "stories" | "story-details";

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

  useEffect(() => {
    if (typeof window !== "undefined") {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("admin_theme", "light");
    }
  }, []);

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
  ];

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex font-sans">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-zinc-200 p-4 justify-between z-30">
        <div className="space-y-5">
          {/* Logo */}
          <div className="flex items-center gap-2.5 px-2 py-1">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-bold text-xs">
              AD
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-tight text-zinc-900 leading-tight">
                Quản Trị
              </h1>
              <span className="text-[11px] text-zinc-500 font-medium">
                Web Đọc Truyện
              </span>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const active = activeTab === item.id || (item.id === "stories" && activeTab === "story-details");

              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={"w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all " + (
                    active
                      ? "bg-zinc-900 text-white shadow-sm"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                  )}
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
        <div className="pt-4 border-t border-zinc-200 space-y-1.5">
          <button
            onClick={onNavigateToUserWeb}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-zinc-700 bg-zinc-100/80 hover:bg-zinc-200/70 hover:text-zinc-900 transition-all"
          >
            <div className="flex items-center gap-2.5">
              <ExternalLink className="w-4 h-4" />
              <span>Xem Web Đọc</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-500 font-mono">
              User
            </span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-500 hover:text-rose-600 hover:bg-rose-50 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header Bar */}
        <header className="lg:hidden h-14 bg-white border-b border-zinc-200 px-4 flex items-center justify-between z-20">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-bold text-xs">
              AD
            </div>
            <span className="font-bold text-xs text-zinc-900">Admin Portal</span>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-zinc-100 text-zinc-600"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </header>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-zinc-200 p-3 space-y-1 animate-in slide-in-from-top-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  setMobileMenuOpen(false);
                }}
                className={"w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold " + (
                  activeTab === item.id
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-600"
                )}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
            <div className="pt-2 border-t border-zinc-100 flex justify-between">
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
