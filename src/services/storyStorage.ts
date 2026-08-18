import { Story, Chapter, Volume } from "../types/story";
import { CreateStoryDto, UpdateStoryDto, CreateChapterDto, UpdateChapterDto, StoryFilterParams } from "../types/api";


const STORAGE_KEY = "web_doc_truyen_stories_v3";
const BROADCAST_CHANNEL_NAME = "web_doc_truyen_sync_channel";

// Clean fresh system: No demo data
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

    // Filter inactive chapters if user mode
    if (!includeInactive) {
      return {
        ...story,
        volumes: story.volumes.map((v) => ({
          ...v,
          chapters: v.chapters.filter((c) => c.isActive !== false),
        })),
      };
    }

    return story;
  }

  public createStory(dto: CreateStoryDto): Story {
    const stories = this.loadStoriesFromStorage();
    const nowStr = new Date().toISOString();
    const dateOnly = nowStr.split("T")[0];

    const slug = dto.title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[đĐ]/g, "d")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const newId = `${slug || "truyen"}-${Date.now().toString().slice(-4)}`;

    const newStory: Story = {
      id: newId,
      title: dto.title.trim(),
      author: dto.author.trim() || "Chưa rõ",
      coverImage:
        dto.coverImage?.trim() ||
        "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80",
      genres: dto.genres && dto.genres.length > 0 ? dto.genres : ["Huyền Huyễn"],
      status: dto.status || "Đang ra",
      rating: 5.0,
      ratingCount: 1,
      views: 0,
      favorites: 0,
      description: dto.description.trim(),
      updatedAt: dateOnly,
      createdAt: nowStr,
      featured: dto.featured ?? false,
      hot: dto.hot ?? false,
      isActive: dto.isActive ?? true,
      isDeleted: false,
      volumes: [
        {
          id: `${newId}-vol-1`,
          number: 1,
          title: "Quyển 1: Mở Đầu",
          chapters: [],
        },
      ],
    };

    stories.unshift(newStory);
    this.saveStoriesToStorage(stories);
    return newStory;
  }

  public updateStory(id: string, dto: UpdateStoryDto): Story {
    const stories = this.loadStoriesFromStorage();
    const index = stories.findIndex((s) => s.id === id);
    if (index === -1) throw new Error(`Story with id ${id} not found`);

    const existing = stories[index];
    const updated: Story = {
      ...existing,
      title: dto.title !== undefined ? dto.title.trim() : existing.title,
      author: dto.author !== undefined ? dto.author.trim() : existing.author,
      coverImage: dto.coverImage !== undefined ? dto.coverImage.trim() : existing.coverImage,
      genres: dto.genres !== undefined ? dto.genres : existing.genres,
      status: dto.status !== undefined ? dto.status : existing.status,
      description: dto.description !== undefined ? dto.description.trim() : existing.description,
      featured: dto.featured !== undefined ? dto.featured : existing.featured,
      hot: dto.hot !== undefined ? dto.hot : existing.hot,
      isActive: dto.isActive !== undefined ? dto.isActive : existing.isActive,
      updatedAt: new Date().toISOString().split("T")[0],
    };

    stories[index] = updated;
    this.saveStoriesToStorage(stories);
    return updated;
  }

  public toggleStoryActive(id: string): Story {
    const stories = this.loadStoriesFromStorage();
    const index = stories.findIndex((s) => s.id === id);
    if (index === -1) throw new Error(`Story with id ${id} not found`);

    stories[index].isActive = !(stories[index].isActive ?? true);
    this.saveStoriesToStorage(stories);
    return stories[index];
  }

  public deleteStory(id: string, permanent = false): boolean {
    let stories = this.loadStoriesFromStorage();
    if (permanent) {
      stories = stories.filter((s) => s.id !== id);
    } else {
      const index = stories.findIndex((s) => s.id === id);
      if (index === -1) return false;
      stories[index].isDeleted = true;
      stories[index].deletedAt = new Date().toISOString();
    }
    this.saveStoriesToStorage(stories);
    return true;
  }

  public restoreStory(id: string): Story {
    const stories = this.loadStoriesFromStorage();
    const index = stories.findIndex((s) => s.id === id);
    if (index === -1) throw new Error(`Story with id ${id} not found`);

    stories[index].isDeleted = false;
    delete stories[index].deletedAt;
    this.saveStoriesToStorage(stories);
    return stories[index];
  }

  public addVolume(storyId: string, volumeTitle: string): Volume {
    const stories = this.loadStoriesFromStorage();
    const story = stories.find((s) => s.id === storyId);
    if (!story) throw new Error("Story not found");

    const newVolNumber = story.volumes.length + 1;
    const newVolume: Volume = {
      id: `${storyId}-vol-${newVolNumber}`,
      number: newVolNumber,
      title: volumeTitle.trim() || `Quyển ${newVolNumber}`,
      chapters: [],
    };

    story.volumes.push(newVolume);
    story.updatedAt = new Date().toISOString().split("T")[0];
    this.saveStoriesToStorage(stories);
    return newVolume;
  }

  public createChapter(dto: CreateChapterDto): Chapter {
    const stories = this.loadStoriesFromStorage();
    const story = stories.find((s) => s.id === dto.storyId);
    if (!story) throw new Error("Story not found");

    // Default or target volume
    let targetVol = story.volumes.find((v) => v.id === dto.volumeId);
    if (!targetVol) {
      if (story.volumes.length === 0) {
        targetVol = {
          id: `${dto.storyId}-vol-1`,
          number: 1,
          title: dto.volumeTitle || "Quyển 1: Mở Đầu",
          chapters: [],
        };
        story.volumes.push(targetVol);
      } else {
        targetVol = story.volumes[0];
      }
    }

    // Calculate next chapter number
    const totalChapters = story.volumes.reduce((acc, v) => acc + v.chapters.length, 0);
    const chapterNumber = dto.number || totalChapters + 1;
    const nowStr = new Date().toISOString();
    const wordCount = dto.content.trim().split(/\s+/).filter(Boolean).length;

    const newChapter: Chapter = {
      id: `${dto.storyId}-c${chapterNumber}-${Date.now().toString().slice(-4)}`,
      number: chapterNumber,
      title: dto.title.trim() || `Chương ${chapterNumber}`,
      wordCount,
      updatedAt: nowStr.split("T")[0],
      createdAt: nowStr,
      volumeId: targetVol.id,
      volumeTitle: targetVol.title,
      content: dto.content,
      isActive: dto.isActive ?? true,
    };

    targetVol.chapters.push(newChapter);
    story.updatedAt = nowStr.split("T")[0];

    this.saveStoriesToStorage(stories);
    return newChapter;
  }

  public updateChapter(storyId: string, chapterId: string, dto: UpdateChapterDto): Chapter {
    const stories = this.loadStoriesFromStorage();
    const story = stories.find((s) => s.id === storyId);
    if (!story) throw new Error("Story not found");

    for (const vol of story.volumes) {
      const chIndex = vol.chapters.findIndex((c) => c.id === chapterId);
      if (chIndex !== -1) {
        const existing = vol.chapters[chIndex];
        const content = dto.content !== undefined ? dto.content : existing.content;
        const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

        const updated: Chapter = {
          ...existing,
          title: dto.title !== undefined ? dto.title.trim() : existing.title,
          number: dto.number !== undefined ? dto.number : existing.number,
          content,
          wordCount,
          isActive: dto.isActive !== undefined ? dto.isActive : existing.isActive,
          updatedAt: new Date().toISOString().split("T")[0],
        };

        vol.chapters[chIndex] = updated;
        story.updatedAt = new Date().toISOString().split("T")[0];
        this.saveStoriesToStorage(stories);
        return updated;
      }
    }

    throw new Error(`Chapter ${chapterId} not found in story ${storyId}`);
  }

  public toggleChapterActive(storyId: string, chapterId: string): Chapter {
    const stories = this.loadStoriesFromStorage();
    const story = stories.find((s) => s.id === storyId);
    if (!story) throw new Error("Story not found");

    for (const vol of story.volumes) {
      const chapter = vol.chapters.find((c) => c.id === chapterId);
      if (chapter) {
        chapter.isActive = !(chapter.isActive ?? true);
        this.saveStoriesToStorage(stories);
        return chapter;
      }
    }
    throw new Error(`Chapter ${chapterId} not found`);
  }

  public deleteChapter(storyId: string, chapterId: string): boolean {
    const stories = this.loadStoriesFromStorage();
    const story = stories.find((s) => s.id === storyId);
    if (!story) return false;

    let removed = false;
    for (const vol of story.volumes) {
      const initialLength = vol.chapters.length;
      vol.chapters = vol.chapters.filter((c) => c.id !== chapterId);
      if (vol.chapters.length !== initialLength) {
        removed = true;
        break;
      }
    }

    if (removed) {
      story.updatedAt = new Date().toISOString().split("T")[0];
      this.saveStoriesToStorage(stories);
    }
    return removed;
  }

  public incrementStoryViews(storyId: string, count = 1): void {
    const stories = this.loadStoriesFromStorage();
    const story = stories.find((s) => s.id === storyId);
    if (story) {
      story.views = (story.views || 0) + count;
      this.saveStoriesToStorage(stories);
    }
  }

  
  public importParsedVolumes(
    storyId: string,
    parsedVolumes: Array<{
      number: number;
      title: string;
      chapters: Array<{ number: number; title: string; content: string; wordCount: number }>;
    }>,
    replaceExisting = false
  ): Story {
    const stories = this.loadStoriesFromStorage();
    const story = stories.find((s) => s.id === storyId);
    if (!story) throw new Error("Story not found");

    const nowStr = new Date().toISOString();
    const dateOnly = nowStr.split("T")[0];

    const newVolumes: Volume[] = parsedVolumes.map((pv, vIdx) => {
      const volId = `${storyId}-vol-${pv.number || vIdx + 1}-${Date.now().toString().slice(-4)}`;
      const chapters: Chapter[] = pv.chapters.map((pc, cIdx) => ({
        id: `${storyId}-c${pc.number || cIdx + 1}-${Date.now().toString().slice(-4)}-${cIdx}`,
        number: pc.number || cIdx + 1,
        title: pc.title || `Chương ${pc.number || cIdx + 1}`,
        wordCount: pc.wordCount || pc.content.trim().split(/\s+/).filter(Boolean).length,
        updatedAt: dateOnly,
        createdAt: nowStr,
        volumeId: volId,
        volumeTitle: pv.title,
        content: pc.content,
        isActive: true,
      }));

      return {
        id: volId,
        number: pv.number || vIdx + 1,
        title: pv.title || `Quyển ${vIdx + 1}`,
        chapters,
      };
    });

    if (replaceExisting || story.volumes.length === 0 || (story.volumes.length === 1 && story.volumes[0].chapters.length === 0)) {
      story.volumes = newVolumes;
    } else {
      story.volumes.push(...newVolumes);
    }

    story.updatedAt = dateOnly;
    this.saveStoriesToStorage(stories);
    return story;
  }

  public importAsNewStory(
    dto: CreateStoryDto,
    parsedVolumes: Array<{
      number: number;
      title: string;
      chapters: Array<{ number: number; title: string; content: string; wordCount: number }>;
    }>
  ): Story {
    const createdStory = this.createStory(dto);
    return this.importParsedVolumes(createdStory.id, parsedVolumes, true);
  }

  public resetToDefault(): void {
    const seeded = seedInitialStories();
    this.saveStoriesToStorage(seeded);
  }
}

export const storyStorage = new StoryStorageService();
