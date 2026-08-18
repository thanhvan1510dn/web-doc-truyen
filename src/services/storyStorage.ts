import { Story, Chapter, Volume } from "../types/story";
import { CreateStoryDto, UpdateStoryDto, CreateChapterDto, UpdateChapterDto, StoryFilterParams } from "../types/api";
import { ParsedVolume } from "./documentParserService";
import { MOCK_STORIES } from "../data/mockStories";

const STORAGE_KEY = "web_doc_truyen_stories_clean_v4";
const BACKUP_KEY = "web_doc_truyen_stories_backup";
const BROADCAST_CHANNEL_NAME = "web_doc_truyen_sync_channel";

const ALL_STORAGE_KEYS = [
  STORAGE_KEY,
  BACKUP_KEY,
  "web_doc_truyen_stories_clean_v3",
  "web_doc_truyen_stories_clean_v2",
  "web_doc_truyen_stories_clean_v1",
  "web_doc_truyen_stories_v1",
  "web_doc_truyen_stories",
  "novels_storage_stories",
];

function sanitizeStory(story: any): Story | null {
  if (!story || typeof story !== "object" || !story.title) return null;

  const volumes: Volume[] = Array.isArray(story.volumes)
    ? story.volumes.map((v: any, vIdx: number) => ({
        id: v.id || "vol_" + (vIdx + 1),
        number: typeof v.number === "number" ? v.number : vIdx + 1,
        title: v.title || "Mục lục " + (vIdx + 1),
        chapters: Array.isArray(v.chapters)
          ? v.chapters.map((c: any, cIdx: number) => ({
              id: c.id || "chap_" + (cIdx + 1),
              number: typeof c.number === "number" ? c.number : cIdx + 1,
              title: c.title || "Chương " + (cIdx + 1),
              wordCount: typeof c.wordCount === "number" ? c.wordCount : (c.content ? c.content.trim().split(/\s+/).length : 0),
              updatedAt: c.updatedAt || new Date().toISOString(),
              createdAt: c.createdAt || new Date().toISOString(),
              volumeId: c.volumeId || v.id || "vol_" + (vIdx + 1),
              volumeTitle: c.volumeTitle || v.title || "Mục lục " + (vIdx + 1),
              content: typeof c.content === "string" ? c.content : "",
              isActive: c.isActive !== false,
            }))
          : [],
      }))
    : [];

  return {
    id: story.id || "story_" + Date.now(),
    title: String(story.title || "").trim(),
    hanVietTitle: story.hanVietTitle ? String(story.hanVietTitle).trim() : undefined,
    author: String(story.author || "Chưa rõ").trim(),
    originalStatus: story.originalStatus,
    editStatus: story.editStatus,
    status: story.status || "Đang ra",
    genres: Array.isArray(story.genres) ? story.genres : ["Huyền Huyễn"],
    editorBeta: story.editorBeta,
    coverCredit: story.coverCredit,
    coverImage:
      story.coverImage ||
      "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80",
    convertSource: story.convertSource,
    convertLink: story.convertLink,
    description: typeof story.description === "string" ? story.description : "",
    warning: story.warning,
    rating: typeof story.rating === "number" ? story.rating : 5.0,
    ratingCount: typeof story.ratingCount === "number" ? story.ratingCount : 1,
    views: typeof story.views === "number" ? story.views : 0,
    favorites: typeof story.favorites === "number" ? story.favorites : 0,
    updatedAt: story.updatedAt || new Date().toISOString(),
    createdAt: story.createdAt || new Date().toISOString(),
    volumes,
    featured: !!story.featured,
    hot: !!story.hot,
    isActive: story.isActive !== false,
    isDeleted: !!story.isDeleted,
    deletedAt: story.deletedAt,
  };
}

class StoryStorageService {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<() => void> = new Set();
  private bridgeIframe: HTMLIFrameElement | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      try {
        this.channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        this.channel.onmessage = (event) => {
          if (event.data?.type === "STORIES_UPDATED") {
            this.notifyListeners();
          }
        };
      } catch (e) {
        console.warn("BroadcastChannel not supported", e);
      }

      window.addEventListener("storage", (event) => {
        if (event.key === STORAGE_KEY || event.key === BACKUP_KEY) {
          this.notifyListeners();
        }
      });

      // Listen for Cross-Domain Sync messages
      window.addEventListener("message", (event) => {
        if (event.data && event.data.type === "SYNC_STORIES_DATA" && Array.isArray(event.data.stories)) {
          this.importStoriesFromBridge(event.data.stories);
        }
      });

      // Auto-mount cross domain bridge
      this.initCrossDomainBridge();
    }
  }

  private initCrossDomainBridge(): void {
    if (typeof document === "undefined") return;

    try {
      const isUserWeb = window.location.hostname.includes("web-doc-truyen") && !window.location.hostname.includes("admin");
      const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      
      let targetOrigin = "";
      if (isLocalhost) {
        targetOrigin = window.location.port === "5173"
          ? "http://localhost:5174/sync-bridge.html"
          : "http://localhost:5173/sync-bridge.html";
      } else {
        targetOrigin = isUserWeb
          ? "https://admin-web-doc-truyen.vercel.app/sync-bridge.html"
          : "https://web-doc-truyen.vercel.app/sync-bridge.html";
      }

      const iframe = document.createElement("iframe");
      iframe.src = targetOrigin;
      iframe.style.display = "none";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "none";
      iframe.setAttribute("aria-hidden", "true");

      document.body.appendChild(iframe);
      this.bridgeIframe = iframe;

      const pingBridge = () => {
        try {
          if (this.bridgeIframe && this.bridgeIframe.contentWindow) {
            this.bridgeIframe.contentWindow.postMessage({ type: "REQUEST_STORIES_DATA" }, "*");
          }
        } catch (e) {
          // ignore
        }
      };

      iframe.onload = () => {
        pingBridge();
        setTimeout(pingBridge, 500);
        setTimeout(pingBridge, 2000);
      };

      // Periodic ping
      setInterval(pingBridge, 3000);
    } catch (e) {
      console.warn("Could not mount sync bridge iframe", e);
    }
  }

  public importStoriesFromBridge(incomingStories: any[]): boolean {
    if (!Array.isArray(incomingStories)) return false;
    try {
      const sanitized = incomingStories.map(sanitizeStory).filter(Boolean) as Story[];

      const localStr = localStorage.getItem(STORAGE_KEY);
      const currentJson = localStr ? localStr : "[]";
      const newJson = JSON.stringify(sanitized);

      if (currentJson !== newJson) {
        localStorage.setItem(STORAGE_KEY, newJson);
        localStorage.setItem(BACKUP_KEY, newJson);
        this.notifyListeners();
        return true;
      }
    } catch (e) {
      console.warn("Error importing bridge stories", e);
    }
    return false;
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
        console.error("Error in storage listener:", err);
      }
    });
  }

  private broadcastChange(): void {
    this.notifyListeners();
    if (this.channel) {
      this.channel.postMessage({ type: "STORIES_UPDATED", timestamp: Date.now() });
    }
    if (this.bridgeIframe && this.bridgeIframe.contentWindow) {
      const stories = this.loadStoriesFromStorage();
      this.bridgeIframe.contentWindow.postMessage({
        type: "SYNC_STORIES_DATA",
        stories: stories
      }, "*");
    }
  }

  private loadStoriesFromStorage(): Story[] {
    if (typeof window === "undefined") return [];

    // Try current key first
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data !== null) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          const sanitized = parsed.map(sanitizeStory).filter(Boolean) as Story[];
          return sanitized;
        }
      }
    } catch (e) {
      console.warn("Error reading main STORAGE_KEY", e);
    }

    // Auto-recovery fallback from any previous keys
    for (const key of ALL_STORAGE_KEYS) {
      try {
        const raw = localStorage.getItem(key);
        if (raw !== null) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            const sanitized = parsed.map(sanitizeStory).filter(Boolean) as Story[];
            localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
            return sanitized;
          }
        }
      } catch (e) {
        // continue
      }
    }

    // Default initial seed from MOCK_STORIES only if storage was never set
    if (Array.isArray(MOCK_STORIES) && MOCK_STORIES.length > 0) {
      const sanitizedMock = MOCK_STORIES.map(sanitizeStory).filter(Boolean) as Story[];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitizedMock));
        localStorage.setItem(BACKUP_KEY, JSON.stringify(sanitizedMock));
      } catch (e) {
        // ignore
      }
      return sanitizedMock;
    }

    return [];
  }

  private saveStoriesToStorage(stories: Story[]): void {
    if (typeof window === "undefined") return;
    try {
      const sanitized = stories.map(sanitizeStory).filter(Boolean) as Story[];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
      localStorage.setItem(BACKUP_KEY, JSON.stringify(sanitized));
      this.broadcastChange();
    } catch (e) {
      console.error("Error writing localStorage", e);
    }
  }

  public getStories(params: StoryFilterParams = {}): Story[] {
    let stories = this.loadStoriesFromStorage();

    // Soft delete filter
    stories = stories.filter((s) => !s.isDeleted);

    // Filter inactive if not explicitly requested
    if (!params.includeInactive) {
      stories = stories.filter((s) => s.isActive !== false);
    }

    // Status filter
    if (params.status && params.status !== "Tất cả") {
      stories = stories.filter((s) => s.status === params.status);
    }

    // Genre filter
    if (params.genre && params.genre !== "Tất cả") {
      stories = stories.filter((s) => s.genres.includes(params.genre as any));
    }

    // Search query
    if (params.search && params.search.trim()) {
      const q = params.search.toLowerCase().trim();
      stories = stories.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.author.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q)
      );
    }

    // Sorting
    if (params.sortBy) {
      const order = params.order === "asc" ? 1 : -1;
      stories.sort((a, b) => {
        if (params.sortBy === "views") return (a.views - b.views) * order;
        if (params.sortBy === "rating") return (a.rating - b.rating) * order;
        if (params.sortBy === "title") return a.title.localeCompare(b.title) * order;
        if (params.sortBy === "updatedAt") {
          return (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()) * order;
        }
        return 0;
      });
    }

    return stories;
  }

  public getStoryById(id: string, includeInactive = false): Story | null {
    const stories = this.loadStoriesFromStorage();
    const story = stories.find((s) => s.id === id && !s.isDeleted);
    if (!story) return null;
    if (!includeInactive && story.isActive === false) return null;
    return story;
  }

  public createStory(dto: CreateStoryDto): Story {
    const stories = this.loadStoriesFromStorage();
    const now = new Date().toISOString();
    const newStory: Story = {
      id: "story_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
      title: dto.title,
      hanVietTitle: dto.hanVietTitle,
      author: dto.author || "Chưa rõ",
      originalStatus: dto.originalStatus,
      editStatus: dto.editStatus,
      status: dto.status || "Đang ra",
      genres: dto.genres || ["Huyền Huyễn"],
      editorBeta: dto.editorBeta,
      coverCredit: dto.coverCredit,
      coverImage: dto.coverImage || "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80",
      convertSource: dto.convertSource,
      convertLink: dto.convertLink,
      description: dto.description || "",
      warning: dto.warning,
      rating: 5.0,
      ratingCount: 1,
      views: 0,
      favorites: 0,
      createdAt: now,
      updatedAt: now,
      volumes: (dto as any).volumes || [
        {
          id: "vol_1",
          number: 1,
          title: "Mục lục chính",
          chapters: [],
        },
      ],
      isActive: dto.isActive !== false,
      hot: dto.hot || false,
      featured: dto.featured || false,
    };

    stories.unshift(newStory);
    this.saveStoriesToStorage(stories);
    return newStory;
  }

  public updateStory(id: string, dto: UpdateStoryDto): Story | null {
    const stories = this.loadStoriesFromStorage();
    const index = stories.findIndex((s) => s.id === id && !s.isDeleted);
    if (index === -1) return null;

    const current = stories[index];
    const updated: Story = {
      ...current,
      ...dto,
      updatedAt: new Date().toISOString(),
    };

    stories[index] = updated;
    this.saveStoriesToStorage(stories);
    return updated;
  }

  public deleteStory(id: string, soft = true): boolean {
    const stories = this.loadStoriesFromStorage();
    const index = stories.findIndex((s) => s.id === id);
    if (index === -1) return false;

    if (soft) {
      stories[index].isDeleted = true;
      stories[index].deletedAt = new Date().toISOString();
    } else {
      stories.splice(index, 1);
    }

    this.saveStoriesToStorage(stories);
    return true;
  }

  public restoreStory(id: string): Story | null {
    const stories = this.loadStoriesFromStorage();
    const story = stories.find((s) => s.id === id);
    if (!story) return null;

    story.isDeleted = false;
    story.deletedAt = undefined;
    story.updatedAt = new Date().toISOString();
    this.saveStoriesToStorage(stories);
    return story;
  }

  public toggleStoryStatus(id: string): Story | null {
    return this.toggleStoryActive(id);
  }

  public toggleStoryActive(id: string): Story | null {
    const stories = this.loadStoriesFromStorage();
    const story = stories.find((s) => s.id === id);
    if (!story) return null;

    story.isActive = !story.isActive;
    story.updatedAt = new Date().toISOString();
    this.saveStoriesToStorage(stories);
    return story;
  }

  public addVolume(storyId: string, title: string, number?: number): Volume | null {
    const stories = this.loadStoriesFromStorage();
    const story = stories.find((s) => s.id === storyId && !s.isDeleted);
    if (!story) return null;

    const newVolume: Volume = {
      id: "vol_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
      number: number || story.volumes.length + 1,
      title: title || "Mục lục " + (story.volumes.length + 1),
      chapters: [],
    };

    story.volumes.push(newVolume);
    story.updatedAt = new Date().toISOString();
    this.saveStoriesToStorage(stories);
    return newVolume;
  }

  public createChapter(storyIdOrDto: string | CreateChapterDto, maybeDto?: CreateChapterDto): Chapter | null {
    const dto = typeof storyIdOrDto === "string" ? maybeDto! : storyIdOrDto;
    const storyId = typeof storyIdOrDto === "string" ? storyIdOrDto : dto.storyId;
    return this.addChapter(storyId, dto);
  }

  public addChapter(storyId: string, dto: CreateChapterDto): Chapter | null {
    const stories = this.loadStoriesFromStorage();
    const story = stories.find((s) => s.id === storyId && !s.isDeleted);
    if (!story) return null;

    let targetVol = story.volumes.find((v) => v.id === dto.volumeId || v.title === dto.volumeTitle);
    if (!targetVol) {
      targetVol = {
        id: dto.volumeId || "vol_" + (story.volumes.length + 1),
        number: story.volumes.length + 1,
        title: dto.volumeTitle || "Mục lục " + (story.volumes.length + 1),
        chapters: [],
      };
      story.volumes.push(targetVol);
    }

    const now = new Date().toISOString();
    const newChapter: Chapter = {
      id: "chap_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
      number: dto.number || targetVol.chapters.length + 1,
      title: dto.title,
      wordCount: dto.content ? dto.content.trim().split(/\s+/).length : 0,
      content: dto.content,
      volumeId: targetVol.id,
      volumeTitle: targetVol.title,
      createdAt: now,
      updatedAt: now,
      isActive: dto.isActive !== false,
    };

    targetVol.chapters.push(newChapter);
    story.updatedAt = now;
    this.saveStoriesToStorage(stories);
    return newChapter;
  }

  public updateChapter(storyId: string, chapterId: string, dto: UpdateChapterDto): Chapter | null {
    const stories = this.loadStoriesFromStorage();
    const story = stories.find((s) => s.id === storyId && !s.isDeleted);
    if (!story) return null;

    for (const vol of story.volumes) {
      const chIndex = vol.chapters.findIndex((c) => c.id === chapterId);
      if (chIndex !== -1) {
        const current = vol.chapters[chIndex];
        const updated: Chapter = {
          ...current,
          ...dto,
          wordCount: dto.content ? dto.content.trim().split(/\s+/).length : current.wordCount,
          updatedAt: new Date().toISOString(),
        };
        vol.chapters[chIndex] = updated;
        story.updatedAt = new Date().toISOString();
        this.saveStoriesToStorage(stories);
        return updated;
      }
    }
    return null;
  }

  public deleteChapter(storyId: string, chapterId: string): boolean {
    const stories = this.loadStoriesFromStorage();
    const story = stories.find((s) => s.id === storyId && !s.isDeleted);
    if (!story) return false;

    for (const vol of story.volumes) {
      const idx = vol.chapters.findIndex((c) => c.id === chapterId);
      if (idx !== -1) {
        vol.chapters.splice(idx, 1);
        story.updatedAt = new Date().toISOString();
        this.saveStoriesToStorage(stories);
        return true;
      }
    }
    return false;
  }

  public toggleChapterStatus(storyId: string, chapterId: string): Chapter | null {
    return this.toggleChapterActive(storyId, chapterId);
  }

  public toggleChapterActive(storyId: string, chapterId: string): Chapter | null {
    const stories = this.loadStoriesFromStorage();
    const story = stories.find((s) => s.id === storyId && !s.isDeleted);
    if (!story) return null;

    for (const vol of story.volumes) {
      const ch = vol.chapters.find((c) => c.id === chapterId);
      if (ch) {
        ch.isActive = !ch.isActive;
        story.updatedAt = new Date().toISOString();
        this.saveStoriesToStorage(stories);
        return ch;
      }
    }
    return null;
  }

  public incrementStoryViews(storyId: string, _arg2?: any): void {
    const stories = this.loadStoriesFromStorage();
    const story = stories.find((s) => s.id === storyId);
    if (story) {
      story.views = (story.views || 0) + 1;
      this.saveStoriesToStorage(stories);
    }
  }

  public importParsedVolumes(storyId: string, parsedVolumes: ParsedVolume[], replaceExisting = true): Story | null {
    const stories = this.loadStoriesFromStorage();
    const story = stories.find((s) => s.id === storyId && !s.isDeleted);
    if (!story) return null;

    const now = new Date().toISOString();
    const convertedVolumes: Volume[] = parsedVolumes.map((pv, vIdx) => {
      const volumeId = "vol_" + Date.now() + "_" + vIdx + "_" + Math.random().toString(36).substring(2, 5);
      return {
        id: volumeId,
        number: pv.number || vIdx + 1,
        title: pv.title,
        chapters: pv.chapters.map((ch, cIdx) => ({
          id: "chap_" + Date.now() + "_" + vIdx + "_" + cIdx + "_" + Math.random().toString(36).substring(2, 6),
          number: ch.number || cIdx + 1,
          title: ch.title,
          wordCount: ch.wordCount || (ch.content ? ch.content.trim().split(/\s+/).length : 0),
          content: ch.content,
          volumeId: volumeId,
          volumeTitle: pv.title,
          createdAt: now,
          updatedAt: now,
          isActive: true,
        })),
      };
    });

    if (replaceExisting) {
      story.volumes = convertedVolumes;
    } else {
      story.volumes = [...story.volumes, ...convertedVolumes];
    }

    story.updatedAt = now;
    this.saveStoriesToStorage(stories);
    return story;
  }

  public importAsNewStory(
    metadata: {
      title: string;
      author?: string;
      genres?: string[];
      coverImage?: string;
      description?: string;
    },
    parsedVolumes: ParsedVolume[]
  ): Story {
    const stories = this.loadStoriesFromStorage();
    const now = new Date().toISOString();
    const storyId = "story_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);

    const convertedVolumes: Volume[] = parsedVolumes.map((pv, vIdx) => {
      const volumeId = "vol_" + Date.now() + "_" + vIdx + "_" + Math.random().toString(36).substring(2, 5);
      return {
        id: volumeId,
        number: pv.number || vIdx + 1,
        title: pv.title,
        chapters: pv.chapters.map((ch, cIdx) => ({
          id: "chap_" + Date.now() + "_" + vIdx + "_" + cIdx + "_" + Math.random().toString(36).substring(2, 6),
          number: ch.number || cIdx + 1,
          title: ch.title,
          wordCount: ch.wordCount || (ch.content ? ch.content.trim().split(/\s+/).length : 0),
          content: ch.content,
          volumeId: volumeId,
          volumeTitle: pv.title,
          createdAt: now,
          updatedAt: now,
          isActive: true,
        })),
      };
    });

    const newStory: Story = {
      id: storyId,
      title: metadata.title,
      author: metadata.author || "Chưa rõ",
      coverImage: metadata.coverImage || "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80",
      genres: metadata.genres || ["Huyền Huyễn"],
      status: "Đang ra",
      rating: 5.0,
      ratingCount: 1,
      views: 0,
      favorites: 0,
      description: metadata.description || "Truyện tự động nạp từ tệp văn bản.",
      createdAt: now,
      updatedAt: now,
      volumes: convertedVolumes,
      isActive: true,
      hot: true,
      featured: false,
    };

    stories.unshift(newStory);
    this.saveStoriesToStorage(stories);
    return newStory;
  }

  public exportStoriesJson(): string {
    const stories = this.loadStoriesFromStorage();
    return JSON.stringify(stories, null, 2);
  }

  public importStoriesJson(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (Array.isArray(parsed)) {
        const sanitized = parsed.map(sanitizeStory).filter(Boolean) as Story[];
        if (sanitized.length > 0) {
          this.saveStoriesToStorage(sanitized);
          return true;
        }
      }
    } catch (e) {
      console.error("Import failed", e);
    }
    return false;
  }
}

export const storyStorage = new StoryStorageService();
