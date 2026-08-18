import React, { useState, useEffect, useMemo } from "react";
import { 
  Users, Eye, BookOpen, Clock, TrendingUp, Sparkles, Smartphone, Monitor, ArrowUpRight, 
  RefreshCw
} from "lucide-react";
import { analyticsApi } from "../../api";
import { DashboardStats, ReadingEvent, TimeSeriesPoint } from "../../types/analytics";
import { formatNumber } from "../../utils/format";

export const AdminAnalyticsView: React.FC<{
  onSelectStory?: (storyId: string) => void;
  onNavigateTab?: (tab: string) => void;
}> = ({ onSelectStory, onNavigateTab }) => {
  const [range, setRange] = useState<"24h" | "7d" | "30d">("7d");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesPoint[]>([]);
  const [liveLogs, setLiveLogs] = useState<ReadingEvent[]>([]);
  const [hoveredPoint, setHoveredPoint] = useState<TimeSeriesPoint | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const [statsRes, tsRes, logsRes] = await Promise.all([
      analyticsApi.getOverview(),
      analyticsApi.getTimeSeries({ range }),
      analyticsApi.getLiveLogs(12),
    ]);

    if (statsRes.success) setStats(statsRes.data);
    if (tsRes.success) setTimeSeries(tsRes.data);
    if (logsRes.success) setLiveLogs(logsRes.data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const unsub = analyticsApi.subscribe(() => {
      loadData();
    });
    return () => unsub();
  }, [range]);

  // Calculations for SVG chart
  const chartHeight = 220;
  const chartWidth = 700;
  const paddingX = 40;
  const paddingY = 30;

  const maxViews = useMemo(() => {
    if (timeSeries.length === 0) return 100;
    const max = Math.max(...timeSeries.map((p) => p.views), 10);
    return Math.ceil(max * 1.15); // Add 15% headroom
  }, [timeSeries]);

  const pointsString = useMemo(() => {
    if (timeSeries.length === 0) return "";
    const effectiveWidth = chartWidth - paddingX * 2;
    const effectiveHeight = chartHeight - paddingY * 2;

    const coords = timeSeries.map((p, idx) => {
      const x = paddingX + (idx / (timeSeries.length - 1 || 1)) * effectiveWidth;
      const y = chartHeight - paddingY - (p.views / maxViews) * effectiveHeight;
      return `${x},${y}`;
    });

    return coords.join(" ");
  }, [timeSeries, maxViews]);

  const areaString = useMemo(() => {
    if (!pointsString || timeSeries.length === 0) return "";
    const effectiveWidth = chartWidth - paddingX * 2;
    const firstX = paddingX;
    const lastX = paddingX + effectiveWidth;
    const baseY = chartHeight - paddingY;

    return `${firstX},${baseY} ${pointsString} ${lastX},${baseY}`;
  }, [pointsString, timeSeries]);

  return (
    <div className="space-y-6">
      {/* Header & Quick stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <span>Báo cáo & Phân tích Độc giả</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Tracking
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Theo dõi chi tiết số lượng người đọc, lượt xem và thời gian đọc theo thời gian thực.
          </p>
        </div>

        <button
          onClick={loadData}
          className="self-start sm:self-auto flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Làm mới dữ liệu</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Views */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="absolute right-3 top-3 w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Eye className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Tổng lượt xem</p>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1.5">
            {stats ? formatNumber(stats.totalViews) : "..."}
          </h3>
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-2">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+{stats?.viewsToday || 0} lượt hôm nay</span>
          </div>
        </div>

        {/* Card 2: Unique Readers */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="absolute right-3 top-3 w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Users className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Độc giả thực tế (Unique)</p>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1.5">
            {stats ? formatNumber(stats.uniqueReadersTotal) : "..."}
          </h3>
          <div className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-medium mt-2">
            <span>{stats?.uniqueReadersToday || 0} độc giả đang đọc hôm nay</span>
          </div>
        </div>

        {/* Card 3: Avg Time Spent */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="absolute right-3 top-3 w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Clock className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Thời gian đọc TB</p>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1.5">
            {stats ? `${stats.avgReadingTimeMinutes}m` : "..."}
          </h3>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium mt-2">
            <span>Đạt 82% tỷ lệ đọc hết chương</span>
          </div>
        </div>

        {/* Card 4: Active / Total Stories */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="absolute right-3 top-3 w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Kho truyện / Chương</p>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1.5">
            {stats ? `${stats.activeStoriesCount} truyện` : "..."}
          </h3>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium mt-2">
            <span className="text-emerald-600 font-semibold">{stats?.activeStoriesCount} đang hiện</span>
            <span>•</span>
            <span className="text-amber-600 font-semibold">{stats?.inactiveStoriesCount} tạm ẩn</span>
          </div>
        </div>
      </div>

      {/* Main Chart Section: Views & Readers Over Time */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
              <span>Lưu lượng người đọc theo thời gian</span>
              {hoveredPoint && (
                <span className="text-xs font-normal text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                  {hoveredPoint.label}: <strong>{hoveredPoint.views} lượt xem</strong> ({hoveredPoint.uniqueReaders} độc giả)
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Thống kê số lượt đọc chương truyện và độc giả thực tế theo các mốc thời gian.
            </p>
          </div>

          {/* Time Range Selector Tabs */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 self-start sm:self-auto">
            <button
              onClick={() => setRange("24h")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                range === "24h"
                  ? "bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              24 giờ qua
            </button>
            <button
              onClick={() => setRange("7d")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                range === "7d"
                  ? "bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              7 ngày qua
            </button>
            <button
              onClick={() => setRange("30d")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                range === "30d"
                  ? "bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              30 ngày qua
            </button>
          </div>
        </div>

        {/* Interactive Responsive SVG Line Chart */}
        <div className="w-full overflow-x-auto">
          <div className="min-w-[600px] h-[240px] relative">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-full overflow-visible"
            >
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                const y = chartHeight - paddingY - ratio * (chartHeight - paddingY * 2);
                const value = Math.round(ratio * maxViews);
                return (
                  <g key={i}>
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={chartWidth - paddingX}
                      y2={y}
                      stroke="currentColor"
                      className="text-slate-200 dark:text-slate-800"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={paddingX - 10}
                      y={y + 3}
                      textAnchor="end"
                      className="text-[10px] fill-slate-400 dark:fill-slate-500 font-mono"
                    >
                      {value}
                    </text>
                  </g>
                );
              })}

              {/* Area under line */}
              {areaString && (
                <polygon
                  points={areaString}
                  fill="url(#chartGradient)"
                />
              )}

              {/* Main Line */}
              {pointsString && (
                <polyline
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={pointsString}
                />
              )}

              {/* Data points and hover triggers */}
              {timeSeries.map((point, idx) => {
                const effectiveWidth = chartWidth - paddingX * 2;
                const effectiveHeight = chartHeight - paddingY * 2;
                const cx = paddingX + (idx / (timeSeries.length - 1 || 1)) * effectiveWidth;
                const cy = chartHeight - paddingY - (point.views / maxViews) * effectiveHeight;
                const isHovered = hoveredPoint?.timestamp === point.timestamp;

                return (
                  <g key={idx} className="cursor-pointer">
                    {/* Hit target */}
                    <rect
                      x={cx - 15}
                      y={0}
                      width={30}
                      height={chartHeight}
                      fill="transparent"
                      onMouseEnter={() => setHoveredPoint(point)}
                    />
                    
                    {/* Circle Dot */}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isHovered ? 6 : 3.5}
                      className={`transition-all ${
                        isHovered
                          ? "fill-amber-500 stroke-white stroke-2 shadow-lg"
                          : "fill-white dark:fill-slate-900 stroke-amber-500 stroke-2"
                      }`}
                    />

                    {/* X-axis Label (show select points for readability) */}
                    {(timeSeries.length <= 12 || idx % Math.ceil(timeSeries.length / 8) === 0 || idx === timeSeries.length - 1) && (
                      <text
                        x={cx}
                        y={chartHeight - 8}
                        textAnchor="middle"
                        className="text-[10px] fill-slate-400 dark:fill-slate-500 font-medium"
                      >
                        {point.label}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </div>

      {/* Two Columns: Top Stories Performance & Live Reader Activity Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Column 1: Top Read Stories */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-500" />
                <span>Truyện đọc nhiều nhất</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Xếp hạng theo tổng lượt xem và mức độ tương tác
              </p>
            </div>
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab("stories")}
                className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
              >
                <span>Xem tất cả</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="space-y-3.5">
            {stats?.topStories.slice(0, 5).map((story, index) => {
              const maxStoryViews = stats.topStories[0]?.totalViews || 1;
              const percent = Math.round((story.totalViews / maxStoryViews) * 100);

              return (
                <div
                  key={story.storyId}
                  onClick={() => onSelectStory && onSelectStory(story.storyId)}
                  className="p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black ${
                      index === 0
                        ? "bg-amber-500 text-white shadow-sm"
                        : index === 1
                        ? "bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-white"
                        : index === 2
                        ? "bg-amber-700/20 text-amber-700 dark:text-amber-300"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                    }`}>
                      {index + 1}
                    </span>

                    <img
                      src={story.coverImage}
                      alt={story.storyTitle}
                      className="w-10 h-13 object-cover rounded-md shadow-sm flex-shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                          {story.storyTitle}
                        </h4>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {formatNumber(story.totalViews)} views
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {story.author} • {story.uniqueReaders} độc giả
                      </p>

                      {/* Visual View Bar */}
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
                        <div
                          className="bg-amber-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Column 2: Real-time Live Activity Stream */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                <span>Nhật ký đọc theo thời gian thực</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Các lượt truy cập và đọc chương mới nhất của người dùng
              </p>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[380px] pr-1">
            {liveLogs.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-12">Chưa có nhật ký đọc nào</p>
            ) : (
              liveLogs.map((log) => {
                const logTime = new Date(log.timestamp);
                const timeFormatted = `${logTime.getHours().toString().padStart(2, "0")}:${logTime.getMinutes().toString().padStart(2, "0")}:${logTime.getSeconds().toString().padStart(2, "0")}`;

                return (
                  <div
                    key={log.id}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 flex-shrink-0">
                        {log.deviceType === "mobile" ? <Smartphone className="w-3.5 h-3.5" /> : <Monitor className="w-3.5 h-3.5" />}
                      </div>

                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 dark:text-slate-100 truncate">
                          {log.storyTitle}
                        </p>
                        <p className="text-slate-500 dark:text-slate-400 text-[11px] truncate">
                          Đã đọc: <span className="text-amber-600 dark:text-amber-400 font-medium">{log.chapterTitle}</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500 block">
                        {timeFormatted}
                      </span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        ~{log.timeSpentSeconds}s
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
