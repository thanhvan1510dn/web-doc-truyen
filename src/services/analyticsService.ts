import { ReadingEvent, TimeSeriesPoint, DashboardStats, StoryAnalyticsSummary } from "../types/analytics";
import { storyStorage } from "./storyStorage";

const ANALYTICS_STORAGE_KEY = "web_doc_truyen_analytics_events_v2";
const SESSION_ID_KEY = "web_doc_truyen_reader_session_id";
const BROADCAST_CHANNEL_NAME = "web_doc_truyen_analytics_channel";

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "session-server";
  let sessionId = localStorage.getItem(SESSION_ID_KEY);
  if (!sessionId) {
    sessionId = "reader_" + Math.random().toString(36).substring(2, 9) + "_" + Date.now().toString(36);
    localStorage.setItem(SESSION_ID_KEY, sessionId);
  }
  return sessionId;
}

// Generate realistic initial seed events for past 30 days
function seedInitialAnalyticsEvents(): ReadingEvent[] {
  const events: ReadingEvent[] = [];
  const now = new Date();
  const baseStories = [
    { id: "pham-nhan-tu-tien", title: "Phàm Nhân Tu Tiên", chapters: [1, 2, 3] },
    { id: "muc-than-ky", title: "Mục Thần Ký", chapters: [1, 2, 3] },
    { id: "quy-bi-chi-chu", title: "Quỷ Bí Chi Chủ", chapters: [1, 2, 3] },
    { id: "dau-pha-thuong-khung", title: "Đấu Phá Thương Khung", chapters: [1, 2, 3] },
  ];

  // Distribute ~1,200 events across the last 30 days
  for (let d = 29; d >= 0; d--) {
    const dayDate = new Date(now.getTime() - d * 24 * 60 * 60 * 1000);
    // More events on recent days and weekend
    const isWeekend = dayDate.getDay() === 0 || dayDate.getDay() === 6;
    const baseCount = isWeekend ? 65 : 40;
    const dayEventsCount = Math.floor(baseCount + Math.random() * 25);

    for (let i = 0; i < dayEventsCount; i++) {
      const hour = Math.floor(Math.random() * 24);
      const minute = Math.floor(Math.random() * 60);
      const eventTime = new Date(dayDate);
      eventTime.setHours(hour, minute, Math.floor(Math.random() * 60));

      const story = baseStories[Math.floor(Math.random() * baseStories.length)];
      const chapNum = story.chapters[Math.floor(Math.random() * story.chapters.length)];
      const readerNum = Math.floor(Math.random() * 35) + 1;
      const device: "desktop" | "mobile" | "tablet" = Math.random() > 0.4 ? "mobile" : "desktop";

      events.push({
        id: `evt-${dayDate.getTime()}-${i}`,
        storyId: story.id,
        storyTitle: story.title,
        chapterId: `${story.id}-c${chapNum}`,
        chapterNumber: chapNum,
        chapterTitle: `Chương ${chapNum}`,
        timestamp: eventTime.toISOString(),
        readerSessionId: `reader_sim_${readerNum}`,
        timeSpentSeconds: Math.floor(60 + Math.random() * 400),
        deviceType: device,
        percentRead: Math.floor(70 + Math.random() * 30),
      });
    }
  }

  return events;
}

class AnalyticsService {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<() => void> = new Set();

  constructor() {
    if (typeof window !== "undefined") {
      try {
        this.channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        this.channel.onmessage = () => {
          this.notifyListeners();
        };
      } catch (e) {
        console.warn("Analytics BroadcastChannel not supported", e);
      }

      window.addEventListener("storage", (event) => {
        if (event.key === ANALYTICS_STORAGE_KEY) {
          this.notifyListeners();
        }
      });
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        console.error("Error in analytics listener:", err);
      }
    });
  }

  private broadcastChange(): void {
    this.notifyListeners();
    if (this.channel) {
      this.channel.postMessage({ type: "ANALYTICS_UPDATED", timestamp: Date.now() });
    }
  }

  private loadEvents(): ReadingEvent[] {
    if (typeof window === "undefined") return [];
    try {
      const data = localStorage.getItem(ANALYTICS_STORAGE_KEY);
      if (!data) {
        const seeded = seedInitialAnalyticsEvents();
        localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(seeded));
        return seeded;
      }
      return JSON.parse(data) as ReadingEvent[];
    } catch (e) {
      console.error("Error reading analytics events", e);
      return [];
    }
  }

  private saveEvents(events: ReadingEvent[]): void {
    if (typeof window === "undefined") return;
    try {
      // Keep at most 5000 recent events to prevent localStorage overflow
      const trimmed = events.slice(-5000);
      localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(trimmed));
      this.broadcastChange();
    } catch (e) {
      console.error("Error saving analytics events", e);
    }
  }

  /**
   * Track when a reader views / reads a chapter on User Web
   */
  public trackReadEvent(params: {
    storyId: string;
    chapterId: string;
    chapterNumber?: number;
    chapterTitle?: string;
    storyTitle?: string;
    timeSpentSeconds?: number;
    percentRead?: number;
  }): ReadingEvent {
    const events = this.loadEvents();
    const sessionId = getOrCreateSessionId();

    const story = storyStorage.getStoryById(params.storyId, true);
    const storyTitle = params.storyTitle || story?.title || "Truyện";
    
    let chapterTitle = params.chapterTitle;
    let chapterNumber = params.chapterNumber || 1;

    if (!chapterTitle && story) {
      for (const vol of story.volumes) {
        const c = vol.chapters.find((ch) => ch.id === params.chapterId);
        if (c) {
          chapterTitle = c.title;
          chapterNumber = c.number;
          break;
        }
      }
    }

    const isMobile =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(max-width: 768px)").matches;

    const newEvent: ReadingEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      storyId: params.storyId,
      storyTitle: storyTitle,
      chapterId: params.chapterId,
      chapterNumber: chapterNumber,
      chapterTitle: chapterTitle || `Chương ${chapterNumber}`,
      timestamp: new Date().toISOString(),
      readerSessionId: sessionId,
      timeSpentSeconds: params.timeSpentSeconds || 45,
      deviceType: isMobile ? "mobile" : "desktop",
      percentRead: params.percentRead || 100,
    };

    events.push(newEvent);
    this.saveEvents(events);

    // Also increment story views in storyStorage
    storyStorage.incrementStoryViews(params.storyId, 1);

    return newEvent;
  }

  /**
   * Get Time Series data for charts (24h, 7d, 30d, all)
   */
  public getTimeSeries(range: "24h" | "7d" | "30d" | "all" = "7d", storyId?: string): TimeSeriesPoint[] {
    const events = this.loadEvents();
    const filtered = storyId ? events.filter((e) => e.storyId === storyId) : events;
    const now = new Date();

    if (range === "24h") {
      // Group by hourly slots for the last 24 hours
      const points: TimeSeriesPoint[] = [];
      for (let h = 23; h >= 0; h--) {
        const slotStart = new Date(now.getTime() - h * 60 * 60 * 1000);
        const slotEnd = new Date(now.getTime() - (h - 1) * 60 * 60 * 1000);
        const hourLabel = `${slotStart.getHours().toString().padStart(2, "0")}:00`;

        const slotEvents = filtered.filter((e) => {
          const t = new Date(e.timestamp).getTime();
          return t >= slotStart.getTime() && t < slotEnd.getTime();
        });

        const uniqueReaders = new Set(slotEvents.map((e) => e.readerSessionId)).size;

        points.push({
          timestamp: slotStart.toISOString(),
          label: hourLabel,
          views: slotEvents.length,
          uniqueReaders,
        });
      }
      return points;
    }

    if (range === "7d" || range === "30d") {
      const daysCount = range === "7d" ? 7 : 30;
      const points: TimeSeriesPoint[] = [];

      for (let d = daysCount - 1; d >= 0; d--) {
        const dayDate = new Date(now.getTime() - d * 24 * 60 * 60 * 1000);
        const dayStr = dayDate.toISOString().split("T")[0];
        const dateLabel = `${dayDate.getDate()}/${dayDate.getMonth() + 1}`;

        const dayEvents = filtered.filter((e) => e.timestamp.startsWith(dayStr));
        const uniqueReaders = new Set(dayEvents.map((e) => e.readerSessionId)).size;

        points.push({
          timestamp: dayStr,
          label: dateLabel,
          views: dayEvents.length,
          uniqueReaders,
        });
      }
      return points;
    }

    // Default 7 days
    return this.getTimeSeries("7d", storyId);
  }

  /**
   * Get Overall Dashboard Statistics
   */
  public getDashboardStats(): DashboardStats {
    const events = this.loadEvents();
    const allStories = storyStorage.getStories({ includeInactive: true });
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).getTime();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).getTime();

    const todayEvents = events.filter((e) => e.timestamp.startsWith(todayStr));
    const past7DaysEvents = events.filter((e) => new Date(e.timestamp).getTime() >= sevenDaysAgo);
    const past30DaysEvents = events.filter((e) => new Date(e.timestamp).getTime() >= thirtyDaysAgo);

    const uniqueReadersTotal = new Set(events.map((e) => e.readerSessionId)).size;
    const uniqueReadersToday = new Set(todayEvents.map((e) => e.readerSessionId)).size;

    let totalChaptersCount = 0;
    allStories.forEach((s) => {
      s.volumes.forEach((v) => {
        totalChaptersCount += v.chapters.length;
      });
    });

    const activeStoriesCount = allStories.filter((s) => s.isActive !== false).length;
    const inactiveStoriesCount = allStories.filter((s) => s.isActive === false).length;

    const totalSeconds = events.reduce((acc, e) => acc + (e.timeSpentSeconds || 0), 0);
    const avgReadingTimeMinutes = events.length > 0 ? Math.round((totalSeconds / events.length / 60) * 10) / 10 : 3.5;

    // Per story analytics
    const storyMap = new Map<string, { totalViews: number; viewsToday: number; readers: Set<string>; seconds: number }>();
    events.forEach((e) => {
      const entry = storyMap.get(e.storyId) || { totalViews: 0, viewsToday: 0, readers: new Set<string>(), seconds: 0 };
      entry.totalViews += 1;
      if (e.timestamp.startsWith(todayStr)) {
        entry.viewsToday += 1;
      }
      entry.readers.add(e.readerSessionId);
      entry.seconds += e.timeSpentSeconds || 0;
      storyMap.set(e.storyId, entry);
    });

    const topStories: StoryAnalyticsSummary[] = allStories.map((s) => {
      const data = storyMap.get(s.id) || { totalViews: s.views || 0, viewsToday: 0, readers: new Set(), seconds: 0 };
      const totalChaps = s.volumes.reduce((acc, v) => acc + v.chapters.length, 0);
      const avgMins = data.totalViews > 0 ? Math.round((data.seconds / data.totalViews / 60) * 10) / 10 : 3.0;

      return {
        storyId: s.id,
        storyTitle: s.title,
        coverImage: s.coverImage,
        author: s.author,
        totalViews: data.totalViews,
        viewsToday: data.viewsToday,
        uniqueReaders: data.readers.size,
        avgTimeSpentMinutes: avgMins,
        totalChapters: totalChaps,
        completionRate: Math.min(100, Math.floor(65 + Math.random() * 30)),
        recentTrend: Math.floor(Math.random() * 25) + 5,
      };
    }).sort((a, b) => b.totalViews - a.totalViews);

    return {
      totalViews: events.length,
      viewsToday: todayEvents.length,
      viewsPast7Days: past7DaysEvents.length,
      viewsPast30Days: past30DaysEvents.length,
      uniqueReadersTotal,
      uniqueReadersToday,
      activeStoriesCount,
      inactiveStoriesCount,
      totalChaptersCount,
      avgReadingTimeMinutes,
      topStories,
    };
  }

  /**
   * Get latest live activity logs
   */
  public getRecentLogs(limit = 20): ReadingEvent[] {
    const events = this.loadEvents();
    return events.slice(-limit).reverse();
  }
}

export const analyticsService = new AnalyticsService();
