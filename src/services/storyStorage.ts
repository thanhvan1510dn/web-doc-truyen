import { Story, Chapter, Volume } from "../types/story";
import { CreateStoryDto, UpdateStoryDto, CreateChapterDto, UpdateChapterDto, StoryFilterParams } from "../types/api";
import { ParsedVolume } from "./documentParserService";
import { MOCK_STORIES } from "../data/mockStories";
import { db } from "./firebase";
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc, 
  onSnapshot, 
  increment,
  getDoc,
  writeBatch,
  Unsubscribe
} from "firebase/firestore";

const STORAGE_KEY = "web_doc_truyen_stories_clean_v5";
const BACKUP_KEY = "web_doc_truyen_stories_backup";
const BROADCAST_CHANNEL_NAME = "web_doc_truyen_sync_channel";

function toFirestoreData(data: any): any {
  if (data === undefined) return null;
  return JSON.parse(JSON.stringify(data));
}

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
    id: String(story.id || "story_" + Date.now()),
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
  private firestoreUnsub: Unsubscribe | null = null;
  private cachedStories: Story[] = [];

  constructor() {
    this.cachedStories = this.loadFromLocalStorage();

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
          this.cachedStories = this.loadFromLocalStorage();
          this.notifyListeners();
        }
      });

      this.initFirestoreSync();
    }
  }

  public destroy(): void {
    if (this.firestoreUnsub) {
      this.firestoreUnsub();
      this.firestoreUnsub = null;
    }
  }

  private initFirestoreSync(): void {
    try {
      const storiesCol = collection(db, "stories");
      this.firestoreUnsub = onSnapshot(
        storiesCol,
        (snapshot) => {
          if (!snapshot.empty) {
            const remoteStories: Story[] = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data();
              const sanitized = sanitizeStory({ ...data, id: docSnap.id });
              if (sanitized) {
                // If local memory cache has existing chapter contents, preserve only the content text for matching active chapters
                const existing = this.cachedStories.find((s) => s.id === sanitized.id);
                if (existing && Array.isArray(existing.volumes)) {
                  sanitized.volumes.forEach((rVol) => {
                    const lVol = existing.volumes.find((v) => v.id === rVol.id);
                    if (lVol && Array.isArray(lVol.chapters)) {
                      rVol.chapters.forEach((rCh) => {
                        if (!rCh.content) {
                          const lCh = lVol.chapters.find((c) => c.id === rCh.id);
                          if (lCh && lCh.content) {
                            rCh.content = lCh.content;
                          }
                        }
                      });
                    }
                  });
                }
                remoteStories.push(sanitized);
              }
            });

            this.cachedStories = remoteStories;
            this.saveToLocalStorage(remoteStories);
            this.notifyListeners();
          } else if (snapshot.empty && this.cachedStories.length === 0) {
            this.seedMockStoriesToFirestore();
          }
        },
        (error) => {
          console.warn("Firestore snapshot error, using offline local cache:", error);
        }
      );
    } catch (err) {
      console.warn("Could not start Firestore listener:", err);
    }
  }

  private async seedMockStoriesToFirestore(): Promise<void> {
    if (!Array.isArray(MOCK_STORIES) || MOCK_STORIES.length === 0) return;
    try {
      for (const s of MOCK_STORIES) {
        const sanitized = sanitizeStory(s);
        if (sanitized) {
          await setDoc(doc(db, "stories", sanitized.id), toFirestoreData(sanitized));
        }
      }
    } catch (e) {
      console.warn("Auto-seed error:", e);
    }
  }

  private loadFromLocalStorage(): Story[] {
    if (typeof window === "undefined") return [];
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data !== null) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          return parsed.map(sanitizeStory).filter(Boolean) as Story[];
        }
      }
    } catch (e) {
      console.warn("Error reading localStorage", e);
    }

    if (Array.isArray(MOCK_STORIES) && MOCK_STORIES.length > 0) {
      return MOCK_STORIES.map(sanitizeStory).filter(Boolean) as Story[];
    }
    return [];
  }

  private saveToLocalStorage(stories: Story[]): void {
    if (typeof window === "undefined") return;
    try {
      const json = JSON.stringify(stories);
      localStorage.setItem(STORAGE_KEY, json);
      localStorage.setItem(BACKUP_KEY, json);
    } catch (e) {
      console.warn("Error writing localStorage", e);
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
    this.saveToLocalStorage(this.cachedStories);
    this.notifyListeners();
    if (this.channel) {
      this.channel.postMessage({ type: "STORIES_UPDATED", timestamp: Date.now() });
    }
  }

  public async saveStoryToFirestore(story: Story): Promise<void> {
    try {
      const sanitized = sanitizeStory(story);
      if (!sanitized) return;

      const firestoreData = toFirestoreData(sanitized);
      const jsonStr = JSON.stringify(firestoreData);

      // If document payload is larger than 600KB, split chapter contents into subcollections to prevent hitting Firestore 1MB limit
      if (jsonStr.length > 600000) {
        const lightweightStory = JSON.parse(jsonStr);
        const chaptersWithContent: any[] = [];

        lightweightStory.volumes?.forEach((vol: any) => {
          vol.chapters?.forEach((ch: any) => {
            if (ch.content) {
              chaptersWithContent.push({
                id: ch.id,
                number: ch.number,
                title: ch.title,
                wordCount: ch.wordCount,
                content: ch.content,
                volumeId: vol.id,
                volumeTitle: vol.title,
                storyId: story.id,
                updatedAt: ch.updatedAt || new Date().toISOString(),
                createdAt: ch.createdAt || new Date().toISOString(),
                isActive: ch.isActive !== false,
              });
              ch.content = ""; // clear bulky content from main story doc
            }
          });
        });

        // 1. Save lightweight TOC main doc (< 50KB)
        await setDoc(doc(db, "stories", story.id), lightweightStory);

        // 2. Save individual chapter documents to subcollection in batches of 200
        const chunkSize = 200;
        for (let i = 0; i < chaptersWithContent.length; i += chunkSize) {
          const chunk = chaptersWithContent.slice(i, i + chunkSize);
          const batch = writeBatch(db);
          for (const ch of chunk) {
            batch.set(doc(db, "stories", story.id, "chapters", ch.id), toFirestoreData(ch));
          }
          await batch.commit();
        }
      } else {
        // Under 600KB: Save directly in 1 doc
        await setDoc(doc(db, "stories", story.id), firestoreData);
      }
    } catch (err) {
      console.error("Firestore saveStoryToFirestore error:", err);
      throw err;
    }
  }

  // --- CRUD METHODS (Realtime Cloud Firestore + Instant Optimistic Cache) ---

  public getStories(params: StoryFilterParams = {}): Story[] {
    let stories = [...this.cachedStories];

    stories = stories.filter((s) => !s.isDeleted);

    if (!params.includeInactive) {
      stories = stories.filter((s) => s.isActive !== false);
    }

    if (params.status && params.status !== "Tất cả") {
      stories = stories.filter((s) => s.status === params.status);
    }

    if (params.genre && params.genre !== "Tất cả") {
      stories = stories.filter((s) => s.genres.includes(params.genre as any));
    }

    if (params.search && params.search.trim()) {
      const q = params.search.toLowerCase().trim();
      stories = stories.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.author.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q)
      );
    }

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
    const story = this.cachedStories.find((s) => s.id === id && !s.isDeleted);
    if (!story) return null;
    if (!includeInactive && story.isActive === false) return null;
    return JSON.parse(JSON.stringify(story));
  }

  public createStory(dto: CreateStoryDto): Story {
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

    this.cachedStories.unshift(newStory);
    this.broadcastChange();

    this.saveStoryToFirestore(newStory).catch((err) =>
      console.error("Firestore create error:", err)
    );

    return newStory;
  }

  public updateStory(id: string, dto: UpdateStoryDto): Story | null {
    const index = this.cachedStories.findIndex((s) => s.id === id && !s.isDeleted);
    if (index === -1) return null;

    const current = this.cachedStories[index];
    const updated: Story = {
      ...current,
      ...dto,
      updatedAt: new Date().toISOString(),
    };

    this.cachedStories[index] = updated;
    this.broadcastChange();

    this.saveStoryToFirestore(updated).catch((err) =>
      console.error("Firestore update error:", err)
    );

    return updated;
  }

  public deleteStory(id: string, soft = false): boolean {
    const index = this.cachedStories.findIndex((s) => s.id === id);
    if (index === -1) return false;

    if (soft) {
      this.cachedStories[index].isDeleted = true;
      this.cachedStories[index].deletedAt = new Date().toISOString();
      this.saveStoryToFirestore(this.cachedStories[index]).catch((err) =>
        console.error("Firestore soft delete error:", err)
      );
    } else {
      this.cachedStories.splice(index, 1);
      deleteDoc(doc(db, "stories", id)).catch((err) =>
        console.error("Firestore delete error:", err)
      );
    }

    this.broadcastChange();
    return true;
  }

  public restoreStory(id: string): Story | null {
    const story = this.cachedStories.find((s) => s.id === id);
    if (!story) return null;

    story.isDeleted = false;
    story.deletedAt = undefined;
    story.updatedAt = new Date().toISOString();
    this.broadcastChange();

    this.saveStoryToFirestore(story).catch((err) =>
      console.error("Firestore restore error:", err)
    );

    return story;
  }

  public toggleStoryStatus(id: string): Story | null {
    return this.toggleStoryActive(id);
  }

  public toggleStoryActive(id: string): Story | null {
    const story = this.cachedStories.find((s) => s.id === id);
    if (!story) return null;

    story.isActive = !story.isActive;
    story.updatedAt = new Date().toISOString();
    this.broadcastChange();

    this.saveStoryToFirestore(story).catch((err) =>
      console.error("Firestore toggle status error:", err)
    );

    return story;
  }

  public addVolume(storyId: string, title: string, number?: number): Volume | null {
    const story = this.cachedStories.find((s) => s.id === storyId && !s.isDeleted);
    if (!story) return null;

    const newVolume: Volume = {
      id: "vol_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
      number: number || story.volumes.length + 1,
      title: title || "Mục lục " + (story.volumes.length + 1),
      chapters: [],
    };

    story.volumes.push(newVolume);
    story.updatedAt = new Date().toISOString();
    this.broadcastChange();

    this.saveStoryToFirestore(story).catch((err) =>
      console.error("Firestore addVolume error:", err)
    );

    return newVolume;
  }

  public updateVolume(storyId: string, volumeId: string, newTitle: string): Volume | null {
    const story = this.cachedStories.find((s) => s.id === storyId && !s.isDeleted);
    if (!story) return null;

    const vol = story.volumes.find((v) => v.id === volumeId);
    if (!vol) return null;

    vol.title = newTitle.trim() || vol.title;
    story.updatedAt = new Date().toISOString();
    this.broadcastChange();

    this.saveStoryToFirestore(story).catch((err) =>
      console.error("Firestore updateVolume error:", err)
    );

    return vol;
  }

  public deleteVolume(storyId: string, volumeId: string): boolean {
    const story = this.cachedStories.find((s) => s.id === storyId && !s.isDeleted);
    if (!story) return false;

    const volIndex = story.volumes.findIndex((v) => v.id === volumeId);
    if (volIndex === -1) return false;

    const [deletedVol] = story.volumes.splice(volIndex, 1);
    // Re-index remaining volumes
    story.volumes.forEach((v, idx) => {
      v.number = idx + 1;
    });
    story.updatedAt = new Date().toISOString();
    this.broadcastChange();

    this.saveStoryToFirestore(story).catch((err) =>
      console.error("Firestore deleteVolume error:", err)
    );

    // Delete subcollection chapter documents for chapters in this volume
    if (deletedVol && Array.isArray(deletedVol.chapters)) {
      for (const ch of deletedVol.chapters) {
        deleteDoc(doc(db, "stories", storyId, "chapters", ch.id)).catch((err) =>
          console.warn("Firestore subcollection deleteChapter error:", err)
        );
      }
    }

    return true;
  }

  public reorderVolumes(storyId: string, orderedVolumeIds: string[]): boolean {
    const story = this.cachedStories.find((s) => s.id === storyId && !s.isDeleted);
    if (!story) return false;

    const volumeMap = new Map(story.volumes.map((v) => [v.id, v]));
    const newVolumes: Volume[] = [];

    orderedVolumeIds.forEach((id, idx) => {
      const vol = volumeMap.get(id);
      if (vol) {
        vol.number = idx + 1;
        newVolumes.push(vol);
        volumeMap.delete(id);
      }
    });

    // Append any remaining volumes
    volumeMap.forEach((vol) => {
      vol.number = newVolumes.length + 1;
      newVolumes.push(vol);
    });

    story.volumes = newVolumes;
    story.updatedAt = new Date().toISOString();
    this.broadcastChange();

    this.saveStoryToFirestore(story).catch((err) =>
      console.error("Firestore reorderVolumes error:", err)
    );

    return true;
  }

  public reorderChapters(storyId: string, volumeId: string, orderedChapterIds: string[]): boolean {
    const story = this.cachedStories.find((s) => s.id === storyId && !s.isDeleted);
    if (!story) return false;

    const vol = story.volumes.find((v) => v.id === volumeId);
    if (!vol) return false;

    const chapterMap = new Map(vol.chapters.map((c) => [c.id, c]));
    const newChapters: Chapter[] = [];

    orderedChapterIds.forEach((id, idx) => {
      const ch = chapterMap.get(id);
      if (ch) {
        ch.number = idx + 1;
        newChapters.push(ch);
        chapterMap.delete(id);
      }
    });

    chapterMap.forEach((ch) => {
      ch.number = newChapters.length + 1;
      newChapters.push(ch);
    });

    vol.chapters = newChapters;
    story.updatedAt = new Date().toISOString();
    this.broadcastChange();

    this.saveStoryToFirestore(story).catch((err) =>
      console.error("Firestore reorderChapters error:", err)
    );

    return true;
  }

  public createChapter(storyIdOrDto: string | CreateChapterDto, maybeDto?: CreateChapterDto): Chapter | null {
    const dto = typeof storyIdOrDto === "string" ? maybeDto! : storyIdOrDto;
    const storyId = typeof storyIdOrDto === "string" ? storyIdOrDto : dto.storyId;
    return this.addChapter(storyId, dto);
  }

  public addChapter(storyId: string, dto: CreateChapterDto): Chapter | null {
    const story = this.cachedStories.find((s) => s.id === storyId && !s.isDeleted);
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
    this.broadcastChange();

    this.saveStoryToFirestore(story).catch((err) =>
      console.error("Firestore addChapter error:", err)
    );

    return newChapter;
  }

  public updateChapter(storyId: string, chapterId: string, dto: UpdateChapterDto): Chapter | null {
    const story = this.cachedStories.find((s) => s.id === storyId && !s.isDeleted);
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
        this.broadcastChange();

        // 1. Direct subcollection write for instant Cloud sync
        setDoc(
          doc(db, "stories", storyId, "chapters", chapterId),
          toFirestoreData({
            ...updated,
            volumeId: vol.id,
            volumeTitle: vol.title,
            storyId: story.id,
          }),
          { merge: true }
        ).catch((err) => console.warn("Firestore direct subcollection update error:", err));

        // 2. Save full story structure to Firestore
        this.saveStoryToFirestore(story).catch((err) =>
          console.error("Firestore updateChapter error:", err)
        );

        return updated;
      }
    }
    return null;
  }

  public deleteChapter(storyId: string, chapterId: string): boolean {
    const story = this.cachedStories.find((s) => s.id === storyId && !s.isDeleted);
    if (!story) return false;

    for (const vol of story.volumes) {
      const idx = vol.chapters.findIndex((c) => c.id === chapterId);
      if (idx !== -1) {
        vol.chapters.splice(idx, 1);
        story.updatedAt = new Date().toISOString();
        this.broadcastChange();

        this.saveStoryToFirestore(story).catch((err) =>
          console.error("Firestore deleteChapter error:", err)
        );

        deleteDoc(doc(db, "stories", storyId, "chapters", chapterId)).catch((err) =>
          console.warn("Firestore subcollection deleteChapter error:", err)
        );

        return true;
      }
    }
    return false;
  }

  public toggleChapterStatus(storyId: string, chapterId: string): Chapter | null {
    return this.toggleChapterActive(storyId, chapterId);
  }

  public toggleChapterActive(storyId: string, chapterId: string): Chapter | null {
    const story = this.cachedStories.find((s) => s.id === storyId && !s.isDeleted);
    if (!story) return null;

    for (const vol of story.volumes) {
      const ch = vol.chapters.find((c) => c.id === chapterId);
      if (ch) {
        ch.isActive = !ch.isActive;
        story.updatedAt = new Date().toISOString();
        this.broadcastChange();

        this.saveStoryToFirestore(story).catch((err) =>
          console.error("Firestore toggleChapter error:", err)
        );

        return ch;
      }
    }
    return null;
  }

  public async getChapter(storyId: string, chapterId: string, includeInactive = false): Promise<Chapter | null> {
    const story = this.cachedStories.find((s) => s.id === storyId && !s.isDeleted);
    if (!story) return null;

    for (const vol of story.volumes) {
      const ch = vol.chapters.find((c) => c.id === chapterId);
      if (ch) {
        if (!includeInactive && ch.isActive === false) return null;
        if (ch.content && ch.content.trim().length > 0) {
          return ch;
        }

        try {
          const snap = await getDoc(doc(db, "stories", storyId, "chapters", chapterId));
          if (snap.exists()) {
            const data = snap.data();
            if (data?.content) {
              ch.content = data.content;
              this.broadcastChange();
              return ch;
            }
          }
        } catch (e) {
          console.warn("Could not fetch subcollection chapter:", e);
        }

        return ch;
      }
    }
    return null;
  }

  public incrementStoryViews(storyId: string, _arg2?: any): void {
    const story = this.cachedStories.find((s) => s.id === storyId);
    if (story) {
      story.views = (story.views || 0) + 1;
      this.broadcastChange();

      updateDoc(doc(db, "stories", storyId), {
        views: increment(1),
      }).catch((err) => console.warn("Firestore incrementViews error:", err));
    }
  }

  public async importParsedVolumes(
    storyId: string,
    parsedVolumes: ParsedVolume[],
    replaceExisting = false
  ): Promise<Story | null> {
    let story = this.cachedStories.find((s) => s.id === storyId && !s.isDeleted);
    if (!story) {
      const localList = this.loadFromLocalStorage();
      story = localList.find((s) => s.id === storyId && !s.isDeleted);
      if (story) {
        this.cachedStories.push(story);
      }
    }

    if (!story) {
      console.error("Story not found:", storyId);
      throw new Error(`Không tìm thấy truyện đích (ID: ${storyId})`);
    }

    const now = new Date().toISOString();
    const existingVolCount = replaceExisting ? 0 : story.volumes.length;

    const convertedVolumes: Volume[] = parsedVolumes.map((pv, vIdx) => {
      const volumeId = "vol_" + Date.now() + "_" + vIdx + "_" + Math.random().toString(36).substring(2, 5);
      return {
        id: volumeId,
        number: existingVolCount + (pv.number || vIdx + 1),
        title: pv.title,
        chapters: pv.chapters.map((ch, cIdx) => ({
          id: "chap_" + Date.now() + "_" + vIdx + "_" + cIdx + "_" + Math.random().toString(36).substring(2, 6),
          number: ch.number || cIdx + 1,
          title: ch.title,
          wordCount: ch.wordCount || (ch.content ? ch.content.trim().split(/\s+/).length : 0),
          content: ch.content || "",
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

    // Re-index all volumes sequentially 1..N and sort chapters in each volume
    story.volumes.forEach((vol, idx) => {
      vol.number = idx + 1;
      vol.chapters.sort((a, b) => a.number - b.number);
    });

    story.updatedAt = now;
    this.broadcastChange();

    await this.saveStoryToFirestore(story);

    return story;
  }

  public async importAsNewStory(
    metadata: {
      title: string;
      author?: string;
      genres?: string[];
      coverImage?: string;
      description?: string;
      hanVietTitle?: string;
      editorBeta?: string;
      originalStatus?: string;
      editStatus?: string;
    },
    parsedVolumes: ParsedVolume[]
  ): Promise<Story> {
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
          content: ch.content || "",
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
      hanVietTitle: metadata.hanVietTitle,
      author: metadata.author || "Chưa rõ",
      editorBeta: metadata.editorBeta,
      originalStatus: metadata.originalStatus,
      editStatus: metadata.editStatus,
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

    this.cachedStories.unshift(newStory);
    this.broadcastChange();

    await this.saveStoryToFirestore(newStory);

    return newStory;
  }

  public exportStoriesJson(): string {
    return JSON.stringify(this.cachedStories, null, 2);
  }

  public importStoriesJson(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (Array.isArray(parsed)) {
        const sanitized = parsed.map(sanitizeStory).filter(Boolean) as Story[];
        if (sanitized.length > 0) {
          this.cachedStories = sanitized;
          this.broadcastChange();
          for (const s of sanitized) {
            setDoc(doc(db, "stories", s.id), toFirestoreData(s)).catch(console.error);
          }
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