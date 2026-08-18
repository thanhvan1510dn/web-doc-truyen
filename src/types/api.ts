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
  author: string;
  coverImage?: string;
  genres: StoryGenre[];
  status: StoryStatus;
  description: string;
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
  range?: "24h" | "7d" | "30d" | "all";
  storyId?: string;
}
