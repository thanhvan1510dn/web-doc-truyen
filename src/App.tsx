import React, { useState, useEffect } from "react";
import { Story, ReaderSettings } from "./types/story";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { Navbar } from "./components/layout/Navbar";
import { HomeView } from "./views/HomeView";
import { StoryDetailView } from "./views/StoryDetailView";
import { ReaderView } from "./views/ReaderView";
import { ToastProvider } from "./components/common/Toast";
import { AdminLayout, AdminTab } from "./components/admin/AdminLayout";
import { AdminAnalyticsView } from "./components/admin/AdminAnalyticsView";
import { AdminStoryListView } from "./components/admin/AdminStoryListView";
import { AdminChapterUploadView } from "./components/admin/AdminChapterUploadView";
import { AdminPDFUploadStudio } from "./components/admin/AdminPDFUploadStudio";
import { AdminStoryDetailView } from "./components/admin/AdminStoryDetailView";
import { AdminLoginModal } from "./components/admin/AdminLoginModal";
import { authApi, storyApi } from "./api";

const DEFAULT_SETTINGS: ReaderSettings = {
  fontSize: 18,
  fontFamily: "sans",
  lineHeight: "normal",
  readerWidth: "medium",
  textAlign: "left",
  theme: "light",
  autoScrollSpeed: 0,
};

export const AppContent: React.FC = () => {
  // Mode: "user" or "admin"
  const [appMode, setAppMode] = useState<"user" | "admin">("user");
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  // User Views: "home" | "story-detail" | "reader"
  const [userView, setUserView] = useState<"home" | "story-detail" | "reader">("home");
  const [activeStoryId, setActiveStoryId] = useState<string>("");
  const [activeChapterId, setActiveChapterId] = useState<string>("");

  // Admin Views: "dashboard" | "stories" | "upload" | "story-details"
  const [adminTab, setAdminTab] = useState<AdminTab>("dashboard");
  const [adminSelectedStoryId, setAdminSelectedStoryId] = useState<string>("");

  // Stories list for user web (only active stories)
  const [stories, setStories] = useState<Story[]>([]);

  // Reader Settings in localStorage
  const [readerSettings, setReaderSettings] = useLocalStorage<ReaderSettings>(
    "novels_reader_settings",
    DEFAULT_SETTINGS
  );

  // Load user web stories
  const loadUserStories = async () => {
    const res = await storyApi.getStories({ includeInactive: false });
    if (res.success) {
      setStories(res.data);
      if (!activeStoryId && res.data.length > 0) {
        setActiveStoryId(res.data[0].id);
      }
    }
  };

  useEffect(() => {
    loadUserStories();
    const unsub = storyApi.subscribe(() => {
      loadUserStories();
    });
    return () => unsub();
  }, []);

  // Global Theme Sync
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    body.classList.remove("theme-light", "theme-dark", "theme-sepia", "theme-midnight");
    body.classList.add(`theme-${readerSettings.theme}`);

    if (readerSettings.theme === "dark" || readerSettings.theme === "midnight") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [readerSettings.theme]);

  // Active story for user view
  const activeStory = stories.find((s) => s.id === activeStoryId) || stories[0];

  const handleSelectStory = (storyId: string) => {
    setActiveStoryId(storyId);
    setUserView("story-detail");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleReadChapter = (chapterId: string) => {
    setActiveChapterId(chapterId);
    setUserView("reader");
  };

  const handleReadDirect = (storyId: string, chapterId: string) => {
    setActiveStoryId(storyId);
    setActiveChapterId(chapterId);
    setUserView("reader");
  };

  const handleUpdateReaderSettings = (newSettings: Partial<ReaderSettings>) => {
    setReaderSettings((prev) => ({ ...prev, ...newSettings }));
  };

  // Request to open Admin (checks authentication first)
  const handleOpenAdmin = (tab: AdminTab = "dashboard") => {
    setAdminTab(tab);
    if (authApi.isAuthenticated()) {
      setAppMode("admin");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setLoginModalOpen(true);
    }
  };

  // Switch to User Web
  const handleOpenUserWeb = (storyId?: string, chapterId?: string) => {
    setAppMode("user");
    if (storyId && chapterId) {
      setActiveStoryId(storyId);
      setActiveChapterId(chapterId);
      setUserView("reader");
    } else if (storyId) {
      setActiveStoryId(storyId);
      setUserView("story-detail");
    } else {
      setUserView("home");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handle Logout from Admin
  const handleAdminLogout = () => {
    setAppMode("user");
    setUserView("home");
  };

  // Render Admin Portal
  if (appMode === "admin") {
    return (
      <>
        <AdminLayout
          activeTab={adminTab}
          onTabChange={(tab) => setAdminTab(tab)}
          onNavigateToUserWeb={() => handleOpenUserWeb()}
          onLogout={handleAdminLogout}
        >
          {adminTab === "dashboard" && (
            <AdminAnalyticsView
              onSelectStory={(storyId) => {
                setAdminSelectedStoryId(storyId);
                setAdminTab("story-details");
              }}
              onNavigateTab={(tab) => setAdminTab(tab as AdminTab)}
            />
          )}

          {adminTab === "stories" && (
            <AdminStoryListView
              onSelectStoryForUpload={(storyId) => {
                setAdminSelectedStoryId(storyId);
                setAdminTab("upload");
              }}
              onSelectStoryForDetails={(storyId) => {
                setAdminSelectedStoryId(storyId);
                setAdminTab("story-details");
              }}
              onPreviewOnUserWeb={(storyId) => {
                handleOpenUserWeb(storyId);
              }}
            />
          )}

          {adminTab === "pdf-upload" && (
          <AdminPDFUploadStudio
            onSuccess={(storyId) => {
              setAdminSelectedStoryId(storyId);
              setAdminTab("story-details");
            }}
          />
        )}

        {adminTab === "upload" && (
            <AdminChapterUploadView
              initialStoryId={adminSelectedStoryId}
              onBack={() => setAdminTab("stories")}
              onSuccess={(storyId) => {
                setAdminSelectedStoryId(storyId);
                setAdminTab("story-details");
              }}
            />
          )}

          {adminTab === "story-details" && (
            <AdminStoryDetailView
              storyId={adminSelectedStoryId || stories[0]?.id || ""}
              onBack={() => setAdminTab("stories")}
              onUploadChapter={(storyId) => {
                setAdminSelectedStoryId(storyId);
                setAdminTab("upload");
              }}
              onReadChapterOnWeb={(storyId, chapterId) => {
                handleOpenUserWeb(storyId, chapterId);
              }}
            />
          )}
        </AdminLayout>
      </>
    );
  }

  // Render User Web Reader
  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors ${
        readerSettings.theme === "dark"
          ? "bg-slate-900 text-slate-100"
          : readerSettings.theme === "sepia"
          ? "bg-[#faf6eb] text-[#4a3828]"
          : readerSettings.theme === "midnight"
          ? "bg-[#0a0f1d] text-slate-100"
          : "bg-gray-50 text-gray-900"
      }`}
    >
      {/* Top Navbar */}
      {userView !== "reader" && (
        <Navbar
          currentView={userView}
          onNavigateHome={() => setUserView("home")}
          onNavigateAdmin={() => handleOpenAdmin("dashboard")}
          theme={readerSettings.theme}
          onThemeChange={(theme) => handleUpdateReaderSettings({ theme })}
        />
      )}

      {/* Main Content */}
      <div className="flex-1">
        {userView === "home" && (
          <HomeView
            stories={stories}
            onSelectStory={handleSelectStory}
            onReadDirect={handleReadDirect}
          />
        )}

        {userView === "story-detail" && activeStory && (
          <StoryDetailView
            story={activeStory}
            onBack={() => setUserView("home")}
            onReadChapter={handleReadChapter}
          />
        )}

        {userView === "reader" && activeStory && (
          <ReaderView
            story={activeStory}
            chapterId={activeChapterId || activeStory.volumes[0]?.chapters[0]?.id || ""}
            onNavigateChapter={(chapId) => setActiveChapterId(chapId)}
            onBackToStory={() => setUserView("story-detail")}
            settings={readerSettings}
            onUpdateSettings={handleUpdateReaderSettings}
          />
        )}
      </div>

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onLoginSuccess={() => {
          setAppMode("admin");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
};

export default App;
