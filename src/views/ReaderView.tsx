import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Story, ReaderSettings } from '../types/story';
import { ReaderHeader } from '../components/reader/ReaderHeader';
import { ReaderContent } from '../components/reader/ReaderContent';
import { ReaderToolbar } from '../components/reader/ReaderToolbar';
import { ReaderTOCModal } from '../components/reader/ReaderTOCModal';
import { MobileReaderBar } from '../components/reader/MobileReaderBar';
import { analyticsApi } from '../api';
import { storyStorage } from '../services/storyStorage';

interface ReaderViewProps {
  story: Story;
  chapterId: string;
  onNavigateChapter: (chapterId: string) => void;
  onBackToStory: () => void;
  settings: ReaderSettings;
  onUpdateSettings: (newSettings: Partial<ReaderSettings>) => void;
}

export const ReaderView: React.FC<ReaderViewProps> = ({
  story,
  chapterId,
  onNavigateChapter,
  onBackToStory,
  settings,
  onUpdateSettings,
}) => {
  const [tocOpen, setTocOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const startTimeRef = useRef<number>(Date.now());

  // Flatten all active chapters across volumes for easy sequence navigation
  const flatChapters = useMemo(() => {
    return story.volumes.flatMap((v) => v.chapters).filter((c) => c.isActive !== false);
  }, [story]);

  // Current chapter and its index
  const currentIndex = useMemo(() => {
    return flatChapters.findIndex((c) => c.id === chapterId);
  }, [flatChapters, chapterId]);

  const currentChapter = flatChapters[currentIndex] || flatChapters[0];
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < flatChapters.length - 1;

  const [activeContent, setActiveContent] = useState<string>(currentChapter?.content || '');

  const scrollToTop = () => {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    } catch {
      window.scrollTo(0, 0);
    }
    if (document.documentElement) {
      document.documentElement.scrollTop = 0;
    }
    if (document.body) {
      document.body.scrollTop = 0;
    }
  };

  useEffect(() => {
    if (!currentChapter) return;
    if (currentChapter.content && currentChapter.content.trim().length > 0) {
      setActiveContent(currentChapter.content);
      scrollToTop();
    } else {
      storyStorage.getChapter(story.id, currentChapter.id).then((ch) => {
        if (ch && ch.content) {
          currentChapter.content = ch.content;
          setActiveContent(ch.content);
          scrollToTop();
        }
      });
    }
  }, [currentChapter?.id, story?.id]);

  // Track analytics event when chapter is loaded
  useEffect(() => {
    if (currentChapter && story) {
      startTimeRef.current = Date.now();
      // Track view
      analyticsApi.trackReading({
        storyId: story.id,
        chapterId: currentChapter.id,
        timeSpentSeconds: 30,
        percentRead: 50,
      });
    }

    return () => {
      // Calculate duration when leaving
      const durationSeconds = Math.max(5, Math.round((Date.now() - startTimeRef.current) / 1000));
      if (currentChapter && story && durationSeconds > 10) {
        analyticsApi.trackReading({
          storyId: story.id,
          chapterId: currentChapter.id,
          timeSpentSeconds: durationSeconds,
          percentRead: 100,
        });
      }
    };
  }, [chapterId, currentChapter?.id, story?.id]);

  // Instant scroll to top on chapter change (for responsive & desktop)
  useEffect(() => {
    scrollToTop();
    const rafId = requestAnimationFrame(() => {
      scrollToTop();
    });
    const timer1 = setTimeout(() => {
      scrollToTop();
    }, 30);
    const timer2 = setTimeout(() => {
      scrollToTop();
    }, 100);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [chapterId]);

  // Handle keyboard shortcuts (← for prev, → for next)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.key === 'ArrowLeft' && hasPrev) {
        e.preventDefault();
        scrollToTop();
        onNavigateChapter(flatChapters[currentIndex - 1].id);
      } else if (e.key === 'ArrowRight' && hasNext) {
        e.preventDefault();
        scrollToTop();
        onNavigateChapter(flatChapters[currentIndex + 1].id);
      } else if (e.key === 'Escape') {
        setTocOpen(false);
        setSettingsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, flatChapters, hasPrev, hasNext, onNavigateChapter]);

  const handlePrev = () => {
    if (hasPrev) {
      scrollToTop();
      onNavigateChapter(flatChapters[currentIndex - 1].id);
    }
  };

  const handleNext = () => {
    if (hasNext) {
      scrollToTop();
      onNavigateChapter(flatChapters[currentIndex + 1].id);
    }
  };

  const handleSelectChapterDirect = (chapId: string) => {
    scrollToTop();
    onNavigateChapter(chapId);
  };

  if (!currentChapter) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-sm font-medium mb-3">Không tìm thấy chương truyện này.</p>
          <button
            onClick={onBackToStory}
            className="px-4 py-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold text-xs shadow-sm"
          >
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  const effectiveChapter = {
    ...currentChapter,
    content: activeContent || currentChapter.content || '',
  };

  return (
    <div className={`min-h-screen flex flex-col selection:bg-zinc-800 selection:text-white dark:selection:bg-zinc-200 dark:selection:text-zinc-900 transition-colors theme-${settings.theme}`}>
      {/* Sticky Reader Header */}
      <ReaderHeader
        story={story}
        onBackToStory={onBackToStory}
        onOpenTOC={() => setTocOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        settings={settings}
      />

      {/* Main Chapter Content */}
      <main className="flex-1">
        <ReaderContent
          story={story}
          chapter={effectiveChapter}
          settings={settings}
        />
      </main>


      {/* TOC Drawer / Modal */}
      <ReaderTOCModal
        isOpen={tocOpen}
        onClose={() => setTocOpen(false)}
        story={story}
        currentChapterId={currentChapter.id}
        onSelectChapter={handleSelectChapterDirect}
      />

      {/* Settings Modal (Font Size, Font Family, Theme, Spacing) */}
      <ReaderToolbar
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={onUpdateSettings}
      />

      {/* Fixed Bottom Chapter Navigation Bar (Quick next/prev chapter without scrolling to the end) */}
      <MobileReaderBar
        story={story}
        chapter={effectiveChapter}
        hasPrev={hasPrev}
        hasNext={hasNext}
        onPrevChapter={handlePrev}
        onNextChapter={handleNext}
        onSelectChapter={handleSelectChapterDirect}
        settings={settings}
      />
    </div>
  );
};
