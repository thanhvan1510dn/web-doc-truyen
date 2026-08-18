import { StoryGenre, StoryStatus } from "./story";

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

export interface StoryFilterParams {
  search?: string;
  genre?: StoryGenre | "Tất cả";
  status?: StoryStatus | "Tất cả";
  includeInactive?: boolean;
  sortBy?: "views" | "updatedAt" | "title" | "rating";
  order?: "asc" | "desc";
}

export interface CreateStoryDto {
  title: string;
  hanVietTitle?: string;
  author: string;
  originalStatus?: string;
  editStatus?: string;
  coverImage?: string;
  genres: string[];
  editorBeta?: string;
  coverCredit?: string;
  convertSource?: string;
  convertLink?: string;
  status: StoryStatus;
  description: string;
  warning?: string;
  featured?: boolean;
  hot?: boolean;
  isActive?: boolean;
}

export interface UpdateStoryDto extends Partial<CreateStoryDto> {}

export interface CreateChapterDto {
  storyId: string;
  volumeId?: string;
  volumeTitle?: string;
  title: string;
  number?: number;
  content: string;
  isActive?: boolean;
}

export interface UpdateChapterDto {
  title?: string;
  number?: number;
  content?: string;
  isActive?: boolean;
  volumeId?: string;
}

export interface TrackReadingPayload {
  storyId: string;
  chapterId: string;
  timeSpentSeconds?: number;
  percentRead?: number;
}

export interface TimeSeriesFilterParams {
  period?: "day" | "week" | "month" | "year";
  range?: "7d" | "30d" | "90d" | "all" | string;
  storyId?: string;
  from?: string;
  to?: string;
}
