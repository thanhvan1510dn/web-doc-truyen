export interface Chapter {
  id: string;
  number: number;
  title: string;
  wordCount: number;
  updatedAt: string;
  createdAt?: string;
  volumeId: string;
  volumeTitle: string;
  content: string;
  isActive?: boolean;
}

export interface Volume {
  id: string;
  number: number;
  title: string;
  description?: string;
  chapters: Chapter[];
}

export type StoryGenre = 
  | "Tất cả"
  | "Tiên Hiệp"
  | "Kiếm Hiệp"
  | "Huyền Huyễn"
  | "Đô Thị"
  | "Khoa Huyễn"
  | "Võng Du"
  | "Trinh Thám"
  | "Ngôn Tình"
  | "Lịch Sử"
  | "Hài Hước"
  | "Hệ Thống"
  | "Dị Giới"
  | string;

export type StoryStatus = "Đang ra" | "Hoàn thành" | "Tạm dừng";

export interface Story {
  id: string;
  title: string;
  hanVietTitle?: string;
  author: string;
  originalStatus?: string;
  editStatus?: string;
  status: StoryStatus;
  genres: string[];
  editorBeta?: string;
  coverCredit?: string;
  coverImage: string;
  convertSource?: string;
  convertLink?: string;
  description: string;
  warning?: string;
  rating: number;
  ratingCount: number;
  views: number;
  favorites: number;
  updatedAt: string;
  createdAt?: string;
  volumes: Volume[];
  featured?: boolean;
  hot?: boolean;
  isActive?: boolean;
  isDeleted?: boolean;
  deletedAt?: string;
}

export interface StoryFilter {
  genre?: string;
  status?: string;
  search?: string;
  sortBy?: "latest" | "views" | "rating" | "chapters";
  page?: number;
  limit?: number;
  includeInactive?: boolean;
}

export type ThemeMode = "light" | "sepia" | "dark" | "midnight";
export type FontFamily = "serif" | "sans" | "lora" | "mono" | "jetbrains";
export type LineHeight = "tight" | "normal" | "relaxed" | "loose";
export type ReaderWidth = "narrow" | "medium" | "normal" | "wide" | "full";

export interface ReaderSettings {
  fontSize: number;
  fontFamily: FontFamily;
  lineHeight: LineHeight;
  theme: ThemeMode;
  readerWidth: ReaderWidth;
  textAlign?: "left" | "justify";
  paragraphSpacing?: number;
  keepAwake?: boolean;
  autoScrollSpeed?: number;
}

export interface ReadingProgress {
  storyId: string;
  chapterId: string;
  chapterTitle?: string;
  volumeTitle?: string;
  chapterNumber?: number;
  scrollPosition?: number;
  scrollPercent?: number;
  updatedAt: number;
}
