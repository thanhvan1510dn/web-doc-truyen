import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Story, ReaderSettings } from '../types/story';
import { ReaderHeader } from '../components/reader/ReaderHeader';
import { ReaderContent } from '../components/reader/ReaderContent';
import { ReaderFooter } from '../components/reader/ReaderFooter';
import { ReaderToolbar } from '../components/reader/ReaderToolbar';
import { ReaderTOCModal } from '../components/reader/ReaderTOCModal';
import { MobileReaderBar } from '../components/reader/MobileReaderBar';
import { useReadingProgress } from '../hooks/useReadingProgress';
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
  const readingProgressPercent = useReadingProgress();
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

  useEffect(() => {
    if (!currentChapter) return;
    if (currentChapter.content && currentChapter.content.trim().length > 0) {
      setActiveContent(currentChapter.content);
    } else {
      storyStorage.getChapter(story.id, currentChapter.id).then((ch) => {
        if (ch && ch.content) {
          currentChapter.content = ch.content;
          setActiveContent(ch.content);
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

  // Scroll to top on chapter change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [chapterId]);

  // Handle keyboard shortcuts (← for prev, → for next)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.key === 'ArrowLeft' && hasPrev) {
        e.preventDefault();
        onNavigateChapter(flatChapters[currentIndex - 1].id);
      } else if (e.key === 'ArrowRight' && hasNext) {
        e.preventDefault();
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
    if (hasPrev) onNavigateChapter(flatChapters[currentIndex - 1].id);
  };

  const handleNext = () => {
    if (hasNext) onNavigateChapter(flatChapters[currentIndex + 1].id);
  };

  if (!currentChapter) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-sm font-medium mb-3">Không tìm thấy chương truyện này.</p>
          <button
            onClick={onBackToStory}
            className="px-4 py-2 rounded-xl bg-amber-500 text-white font-semibold text-xs"
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
    <div className={`min-h-screen flex flex-col selection:bg-amber-500 selection:text-white transition-colors theme-${settings.theme}`}>
      {/* Sticky Reader Header */}
      <ReaderHeader
        story={story}
        chapter={effectiveChapter}
        hasPrev={hasPrev}
        hasNext={hasNext}
        onPrevChapter={handlePrev}
        onNextChapter={handleNext}
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
          readingProgressPercent={readingProgressPercent}
        />
      </main>

      {/* Reader Footer with Pagination */}
      <ReaderFooter
        story={story}
        chapter={currentChapter}
        hasPrev={hasPrev}
        hasNext={hasNext}
        onPrevChapter={handlePrev}
        onNextChapter={handleNext}
        onBackToStory={onBackToStory}
        onSelectChapter={onNavigateChapter}
        onOpenTOC={() => setTocOpen(true)}
        settings={settings}
        readingProgressPercent={readingProgressPercent}
      />

      {/* TOC Drawer / Modal */}
      <ReaderTOCModal
        isOpen={tocOpen}
        onClose={() => setTocOpen(false)}
        story={story}
        currentChapterId={currentChapter.id}
        onSelectChapter={onNavigateChapter}
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
        onSelectChapter={onNavigateChapter}
        settings={settings}
      />
    </div>
  );
};
