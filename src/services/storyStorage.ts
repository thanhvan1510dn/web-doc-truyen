import { Story, Chapter, Volume } from "../types/story";
import { CreateStoryDto, UpdateStoryDto, CreateChapterDto, UpdateChapterDto, StoryFilterParams } from "../types/api";
import { ParsedVolume } from "./documentParserService";

const STORAGE_KEY = "web_doc_truyen_stories_clean_v4";
const BROADCAST_CHANNEL_NAME = "web_doc_truyen_sync_channel";
const CLOUD_SYNC_URL = "https://api.restful-api.dev/objects/ff8081819ff5b11001a014b452944219";

function seedInitialStories(): Story[] {
  return [];
}

class StoryStorageService {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<() => void> = new Set();

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
        if (event.key === STORAGE_KEY) {
          this.notifyListeners();
        }
      });

      this.syncFromCloud();
      setInterval(() => {
        this.syncFromCloud();
      }, 10000);
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
        console.error("Error in storage listener:", err);
      }
    });
  }

  private broadcastChange(): void {
    this.notifyListeners();
    if (this.channel) {
      this.channel.postMessage({ type: "STORIES_UPDATED", timestamp: Date.now() });
    }
  }

  private loadStoriesFromStorage(): Story[] {
    if (typeof window === "undefined") return seedInitialStories();
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        const seeded = seedInitialStories();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
        return seeded;
      }
      return JSON.parse(data) as Story[];
    } catch (e) {
      console.error("Error reading localStorage", e);
      return seedInitialStories();
    }
  }

  private saveStoriesToStorage(stories: Story[]): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stories));
      this.broadcastChange();
      this.pushToCloud(stories);
    } catch (e) {
      console.error("Error writing localStorage", e);
    }
  }

  public async syncFromCloud(): Promise<Story[]> {
    if (typeof window === "undefined") return [];
    try {
      const res = await fetch(CLOUD_SYNC_URL, { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (json?.data?.stories && Array.isArray(json.data.stories)) {
          const cloudStories: Story[] = json.data.stories;
          const localStr = localStorage.getItem(STORAGE_KEY);
          const localStories: Story[] = localStr ? JSON.parse(localStr) : [];
          
          if (JSON.stringify(cloudStories) !== JSON.stringify(localStories)) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudStories));
            this.notifyListeners();
          }
          return cloudStories;
        }
      }
    } catch (err) {
      console.warn("Cloud sync warning:", err);
    }
    return [];
  }

  private async pushToCloud(stories: Story[]): Promise<void> {
    if (typeof window === "undefined") return;
    try {
      await fetch(CLOUD_SYNC_URL, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "web_doc_truyen_stories_data",
          data: { stories }
        })
      });
    } catch (err) {
      console.warn("Cloud push warning:", err);
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
}

export const storyStorage = new StoryStorageService();
