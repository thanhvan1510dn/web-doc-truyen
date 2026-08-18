export interface ReadingEvent {
  id: string;
  storyId: string;
  storyTitle: string;
  chapterId: string;
  chapterNumber: number;
  chapterTitle: string;
  timestamp: string; // ISO string
  readerSessionId: string;
  timeSpentSeconds: number; // Duration spent reading in seconds
  deviceType: "mobile" | "desktop" | "tablet";
  percentRead: number;
}

export interface TimeSeriesPoint {
  timestamp: string; // e.g. "14:00" or "2026-08-18"
  label: string;
  views: number;
  uniqueReaders: number;
}

export interface StoryAnalyticsSummary {
  storyId: string;
  storyTitle: string;
  coverImage: string;
  author: string;
  totalViews: number;
  viewsToday: number;
  uniqueReaders: number;
  avgTimeSpentMinutes: number;
  totalChapters: number;
  completionRate: number; // 0 - 100%
  recentTrend: number; // percentage change vs previous period
}

export interface ChapterAnalyticsSummary {
  chapterId: string;
  chapterNumber: number;
  chapterTitle: string;
  views: number;
  avgTimeSpentSeconds: number;
  completionRate: number;
}

export interface DashboardStats {
  totalViews: number;
  viewsToday: number;
  viewsPast7Days: number;
  viewsPast30Days: number;
  uniqueReadersTotal: number;
  uniqueReadersToday: number;
  activeStoriesCount: number;
  inactiveStoriesCount: number;
  totalChaptersCount: number;
  avgReadingTimeMinutes: number;
  topStories: StoryAnalyticsSummary[];
}
