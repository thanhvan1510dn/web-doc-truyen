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
  isActive?: boolean; // true = visible, false = inactive/draft
}

export interface Volume {
  id: string;
  number: number;
  title: string;
  description?: string;
  chapters: Chapter[];
}

export type StoryGenre = 
  | 'Tất cả'
  | 'Tiên Hiệp'
  | 'Kiếm Hiệp'
  | 'Huyền Huyễn'
  | 'Đô Thị'
  | 'Khoa Huyễn'
  | 'Võng Du'
  | 'Trinh Thám'
  | 'Ngôn Tình'
  | 'Lịch Sử'
  | 'Hài Hước'
  | 'Hệ Thống'
  | 'Dị Giới';

export type StoryStatus = 'Đang ra' | 'Hoàn thành' | 'Tạm dừng';

export interface Story {
  id: string;
  title: string;
  author: string;
  coverImage: string;
  genres: StoryGenre[];
  status: StoryStatus;
  rating: number; // 0 - 5
  ratingCount: number;
  views: number;
  favorites: number;
  description: string;
  updatedAt: string;
  createdAt?: string;
  volumes: Volume[];
  featured?: boolean;
  hot?: boolean;
  isActive?: boolean; // true = visible on user web, false = inactive
  isDeleted?: boolean;
  deletedAt?: string;
}

export type ThemeMode = 'light' | 'dark' | 'sepia' | 'midnight';
export type FontFamily = 'sans' | 'serif' | 'lora' | 'mono';
export type LineHeight = 'tight' | 'normal' | 'relaxed' | 'loose';
export type ReaderWidth = 'narrow' | 'medium' | 'wide' | 'full';
export type TextAlign = 'left' | 'justify';

export interface ReaderSettings {
  fontSize: number; // 14 -> 32
  fontFamily: FontFamily;
  lineHeight: LineHeight;
  readerWidth: ReaderWidth;
  textAlign: TextAlign;
  theme: ThemeMode;
  autoScrollSpeed: number; // 0 = off, 1-5 = speed
}

export interface ReadingProgress {
  storyId: string;
  chapterId: string;
  chapterNumber: number;
  chapterTitle: string;
  volumeTitle: string;
  percent: number;
  updatedAt: number;
}
