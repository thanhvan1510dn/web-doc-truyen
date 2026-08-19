import { ApiResponse, CreateChapterDto, CreateStoryDto, StoryFilterParams, UpdateChapterDto, UpdateStoryDto } from "../types/api";
import { Chapter, Story, Volume } from "../types/story";
import { storyStorage } from "../services/storyStorage";

/**
 * Story API client module
 * Connects both User Web and Admin Web to story data
 */
export const storyApi = {
  /**
   * Fetch list of stories with filtering, searching, and sorting
   * User Web: passes default { includeInactive: false }
   * Admin Web: passes { includeInactive: true }
   */
  async getStories(params: StoryFilterParams = {}): Promise<ApiResponse<Story[]>> {
    try {
            const data = storyStorage.getStories(params);
      return {
        success: true,
        data,
        meta: { total: data.length },
      };
    } catch (error: any) {
      return {
        success: false,
        data: [],
        error: error.message || "Failed to fetch stories",
      };
    }
  },

  /**
   * Fetch single story details with all volumes and chapters
   */
  async getStoryById(id: string, includeInactive = false): Promise<ApiResponse<Story | null>> {
    try {
      const data = storyStorage.getStoryById(id, includeInactive);
      if (!data) {
        return {
          success: false,
          data: null,
          error: "Story not found or inactive",
        };
      }
      return {
        success: true,
        data,
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        error: error.message || "Failed to fetch story",
      };
    }
  },

  /**
   * Fetch single chapter content
   */
  async getChapter(storyId: string, chapterId: string, includeInactive = false): Promise<ApiResponse<Chapter | null>> {
    try {
      const story = storyStorage.getStoryById(storyId, includeInactive);
      if (!story) {
        return { success: false, data: null, error: "Story not found" };
      }

      for (const vol of story.volumes) {
        const ch = vol.chapters.find((c) => c.id === chapterId);
        if (ch) {
          if (!includeInactive && ch.isActive === false) {
            return { success: false, data: null, error: "Chapter is inactive" };
          }
          return { success: true, data: ch };
        }
      }

      return { success: false, data: null, error: "Chapter not found" };
    } catch (error: any) {
      return { success: false, data: null, error: error.message || "Failed to fetch chapter" };
    }
  },

  /**
   * [Admin] Create a new story
   */
  async createStory(dto: CreateStoryDto): Promise<ApiResponse<Story>> {
    try {
      if (!dto.title || !dto.title.trim()) {
        return { success: false, data: null as any, error: "Tiêu đề truyện không được để trống" };
      }
      const newStory = storyStorage.createStory(dto);
      return {
        success: true,
        data: newStory,
        message: "Tạo truyện mới thành công",
      };
    } catch (error: any) {
      return {
        success: false,
        data: null as any,
        error: error.message || "Failed to create story",
      };
    }
  },

  /**
   * [Admin] Update story information
   */
  async updateStory(id: string, dto: UpdateStoryDto): Promise<ApiResponse<Story>> {
    try {
      const updated = storyStorage.updateStory(id, dto);
      return {
        success: true,
        data: updated || (null as any),
        message: "Cập nhật thông tin truyện thành công",
      };
    } catch (error: any) {
      return {
        success: false,
        data: null as any,
        error: error.message || "Failed to update story",
      };
    }
  },

  /**
   * [Admin] Toggle story active/inactive status
   */
  async toggleStoryStatus(id: string): Promise<ApiResponse<Story>> {
    try {
      const updated = storyStorage.toggleStoryActive(id);
      return {
        success: true,
        data: updated as Story,
        message: updated?.isActive ? "Đã kích hoạt hiển thị truyện" : "Đã tạm ẩn truyện khỏi người đọc",
      };
    } catch (error: any) {
      return {
        success: false,
        data: null as any,
        error: error.message || "Failed to toggle story status",
      };
    }
  },

  /**
   * [Admin] Delete story (soft or permanent)
   */
  async deleteStory(id: string, permanent = false): Promise<ApiResponse<boolean>> {
    try {
      const success = storyStorage.deleteStory(id, permanent);
      return {
        success,
        data: success,
        message: success ? "Đã xoá truyện thành công" : "Không tìm thấy truyện cần xoá",
      };
    } catch (error: any) {
      return {
        success: false,
        data: false,
        error: error.message || "Failed to delete story",
      };
    }
  },

  /**
   * [Admin] Restore soft-deleted story
   */
  async restoreStory(id: string): Promise<ApiResponse<Story>> {
    try {
      const restored = storyStorage.restoreStory(id);
      return {
        success: true,
        data: restored as Story,
        message: "Đã khôi phục truyện thành công",
      };
    } catch (error: any) {
      return {
        success: false,
        data: null as any,
        error: error.message || "Failed to restore story",
      };
    }
  },

  /**
   * [Admin] Add volume to a story
   */
  async addVolume(storyId: string, title: string): Promise<ApiResponse<Volume>> {
    try {
      const vol = storyStorage.addVolume(storyId, title);
      return {
        success: true,
        data: vol as Volume,
        message: "Tạo quyển mới thành công",
      };
    } catch (error: any) {
      return {
        success: false,
        data: null as any,
        error: error.message || "Failed to add volume",
      };
    }
  },

  /**
   * [Admin] Upload / Create a new chapter
   */
  async createChapter(dto: CreateChapterDto): Promise<ApiResponse<Chapter>> {
    try {
      if (!dto.storyId) {
        return { success: false, data: null as any, error: "Vui lòng chọn truyện" };
      }
      if (!dto.content || !dto.content.trim()) {
        return { success: false, data: null as any, error: "Nội dung chương không được để trống" };
      }
      const newChapter = storyStorage.createChapter(dto);
      return {
        success: true,
        data: newChapter || (null as any),
        message: "Đăng chương mới thành công",
      };
    } catch (error: any) {
      return {
        success: false,
        data: null as any,
        error: error.message || "Failed to create chapter",
      };
    }
  },

  /**
   * [Admin] Update chapter content
   */
  async updateChapter(storyId: string, chapterId: string, dto: UpdateChapterDto): Promise<ApiResponse<Chapter>> {
    try {
      const updated = storyStorage.updateChapter(storyId, chapterId, dto);
      return {
        success: true,
        data: (updated as Chapter),
        message: "Cập nhật chương thành công",
      };
    } catch (error: any) {
      return {
        success: false,
        data: null as any,
        error: error.message || "Failed to update chapter",
      };
    }
  },

  /**
   * [Admin] Update volume title
   */
  async updateVolume(storyId: string, volumeId: string, newTitle: string): Promise<ApiResponse<Volume>> {
    try {
      const updated = storyStorage.updateVolume(storyId, volumeId, newTitle);
      return {
        success: !!updated,
        data: updated as Volume,
        message: updated ? "Đã đổi tên mục lục thành công" : "Không tìm thấy mục lục",
      };
    } catch (error: any) {
      return {
        success: false,
        data: null as any,
        error: error.message || "Failed to update volume",
      };
    }
  },

  /**
   * [Admin] Delete an entire volume and all its chapters
   */
  async deleteVolume(storyId: string, volumeId: string): Promise<ApiResponse<boolean>> {
    try {
      const ok = storyStorage.deleteVolume(storyId, volumeId);
      return {
        success: ok,
        data: ok,
        message: ok ? "Đã xóa toàn bộ mục lục thành công" : "Không tìm thấy mục lục cần xóa",
      };
    } catch (error: any) {
      return {
        success: false,
        data: false,
        error: error.message || "Failed to delete volume",
      };
    }
  },

  /**
   * [Admin] Toggle chapter active/inactive
   */
  async toggleChapterStatus(storyId: string, chapterId: string): Promise<ApiResponse<Chapter>> {
    try {
      const updated = storyStorage.toggleChapterActive(storyId, chapterId);
      return {
        success: true,
        data: updated as Chapter,
        message: updated?.isActive ? "Đã hiển thị chương" : "Đã tạm ẩn chương",
      };
    } catch (error: any) {
      return {
        success: false,
        data: null as any,
        error: error.message || "Failed to toggle chapter status",
      };
    }
  },

  /**
   * [Admin] Delete chapter
   */
  async deleteChapter(storyId: string, chapterId: string): Promise<ApiResponse<boolean>> {
    try {
      const success = storyStorage.deleteChapter(storyId, chapterId);
      return {
        success,
        data: success,
        message: success ? "Đã xoá chương thành công" : "Không tìm thấy chương cần xoá",
      };
    } catch (error: any) {
      return {
        success: false,
        data: false,
        error: error.message || "Failed to delete chapter",
      };
    }
  },

  /**
   * Subscribe to real-time story data changes across tabs
   */
    /**
   * [Admin] Import full parsed volumes & chapters from PDF / Word / TXT
   */
  async importParsedVolumes(
    storyId: string,
    parsedVolumes: any[],
    replaceExisting = false
  ): Promise<ApiResponse<Story>> {
    try {
      const story = await storyStorage.importParsedVolumes(storyId, parsedVolumes, replaceExisting);
      if (!story) {
        return {
          success: false,
          data: null as any,
          error: "Không tìm thấy truyện đích để nạp chương",
        };
      }
      return {
        success: true,
        data: story,
        message: `Đã nhập thành công ${parsedVolumes.length} mục lục và toàn bộ các chương!`,
      };
    } catch (error: any) {
      return {
        success: false,
        data: null as any,
        error: error.message || "Failed to import volumes",
      };
    }
  },

  /**
   * [Admin] Create new story and import all parsed volumes from file
   */
  async importAsNewStory(
    dto: CreateStoryDto,
    parsedVolumes: any[]
  ): Promise<ApiResponse<Story>> {
    try {
      const story = await storyStorage.importAsNewStory(dto, parsedVolumes);
      return {
        success: true,
        data: story,
        message: `Đã tạo truyện mới và nhập thành công ${parsedVolumes.length} mục lục!`,
      };
    } catch (error: any) {
      return {
        success: false,
        data: null as any,
        error: error.message || "Failed to create story and import",
      };
    }
  },

  subscribe(callback: () => void): () => void {
    return storyStorage.subscribe(callback);
  },
};
