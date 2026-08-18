import { ApiResponse, TimeSeriesFilterParams, TrackReadingPayload } from "../types/api";
import { DashboardStats, ReadingEvent, TimeSeriesPoint } from "../types/analytics";
import { analyticsService } from "../services/analyticsService";

/**
 * Analytics API client module
 * Connects User Web reader events with Admin Analytics Dashboard
 */
export const analyticsApi = {
  /**
   * [User Web] Log reader event when user reads a chapter
   */
  async trackReading(payload: TrackReadingPayload): Promise<ApiResponse<ReadingEvent>> {
    try {
      const event = analyticsService.trackReadEvent({
        storyId: payload.storyId,
        chapterId: payload.chapterId,
        timeSpentSeconds: payload.timeSpentSeconds,
        percentRead: payload.percentRead,
      });
      return {
        success: true,
        data: event,
      };
    } catch (error: any) {
      return {
        success: false,
        data: null as any,
        error: error.message || "Failed to track reading event",
      };
    }
  },

  /**
   * [Admin] Fetch overall analytics dashboard KPIs
   */
  async getOverview(): Promise<ApiResponse<DashboardStats>> {
    try {
      const stats = analyticsService.getDashboardStats();
      return {
        success: true,
        data: stats,
      };
    } catch (error: any) {
      return {
        success: false,
        data: null as any,
        error: error.message || "Failed to fetch analytics overview",
      };
    }
  },

  /**
   * [Admin] Fetch time-series views and unique readers over time (24h, 7d, 30d)
   */
  async getTimeSeries(params: TimeSeriesFilterParams = {}): Promise<ApiResponse<TimeSeriesPoint[]>> {
    try {
      const range = params.range || "7d";
      const data = analyticsService.getTimeSeries(range as any, params.storyId);
      return {
        success: true,
        data,
      };
    } catch (error: any) {
      return {
        success: false,
        data: [],
        error: error.message || "Failed to fetch time series data",
      };
    }
  },

  /**
   * [Admin] Fetch real-time live reader log stream
   */
  async getLiveLogs(limit = 20): Promise<ApiResponse<ReadingEvent[]>> {
    try {
      const data = analyticsService.getRecentLogs(limit);
      return {
        success: true,
        data,
      };
    } catch (error: any) {
      return {
        success: false,
        data: [],
        error: error.message || "Failed to fetch live logs",
      };
    }
  },

  /**
   * Subscribe to live analytics updates
   */
  subscribe(callback: () => void): () => void {
    return analyticsService.subscribe(callback);
  },
};
