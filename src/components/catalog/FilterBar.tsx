import React from 'react';
import { LayoutGrid, List, Filter, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { StoryGenre, StoryStatus } from '../../types/story';

export type SortOption = 'views' | 'rating' | 'updated' | 'title';

interface FilterBarProps {
  selectedGenre: StoryGenre;
  onSelectGenre: (genre: StoryGenre) => void;
  selectedStatus: StoryStatus | 'Tất cả';
  onSelectStatus: (status: StoryStatus | 'Tất cả') => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  totalResults: number;
  onResetFilters: () => void;
  hasActiveFilters: boolean;
}

const GENRES: StoryGenre[] = [
  'Tất cả',
  'Tiên Hiệp',
  'Kiếm Hiệp',
  'Huyền Huyễn',
  'Đô Thị',
  'Khoa Huyễn',
  'Võng Du',
  'Trinh Thám',
  'Lịch Sử',
];

export const FilterBar: React.FC<FilterBarProps> = ({
  selectedGenre,
  onSelectGenre,
  selectedStatus,
  onSelectStatus,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  totalResults,
  onResetFilters,
  hasActiveFilters,
}) => {
  return (
    <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-4 sm:p-5 border border-gray-100 dark:border-slate-800 shadow-sm space-y-4 mb-6 transition-colors">
      {/* Top row: View Switcher, Total count & Sort selection */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Results count & active reset */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 opacity-80" />
            <span className="font-bold text-gray-800 dark:text-slate-100">
              Danh Sách Truyện
            </span>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 font-medium">
            {totalResults} bộ truyện
          </span>

          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              className="flex items-center gap-1 text-xs text-zinc-900 dark:text-zinc-100 hover:underline ml-2 font-medium"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Đặt lại bộ lọc</span>
            </button>
          )}
        </div>

        {/* Controls: Sort and View Mode */}
        <div className="flex items-center gap-3 justify-end flex-wrap">
          {/* Status filter selector */}
          <div className="flex items-center rounded-xl bg-gray-100 dark:bg-slate-700/80 p-1 text-xs">
            {(['Tất cả', 'Đang ra', 'Hoàn thành'] as const).map((status) => (
              <button
                key={status}
                onClick={() => onSelectStatus(status)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  selectedStatus === status
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm font-semibold'
                    : 'text-gray-600 dark:text-slate-300 hover:text-gray-900'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400">
            <span className="hidden sm:inline">Sắp xếp:</span>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              aria-label="Sắp xếp theo"
              className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-zinc-400"
            >
              <option value="views">Lượt xem nhiều nhất</option>
              <option value="rating">Đánh giá cao nhất</option>
              <option value="updated">Mới cập nhật</option>
              <option value="title">Tên A-Z</option>
            </select>
          </div>

          {/* View Mode Toggle Buttons (Grid / List) */}
          <div className="flex items-center rounded-xl bg-gray-100 dark:bg-slate-700/80 p-1">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'grid'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm'
                  : 'text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'
              }`}
              title="Xem dạng Lưới ảnh bìa (Thumbnail Grid)"
              aria-label="Xem dạng Lưới ảnh bìa (Thumbnail Grid)"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'list'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm'
                  : 'text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'
              }`}
              title="Xem dạng Danh sách chi tiết (List View)"
              aria-label="Xem dạng Danh sách chi tiết (List View)"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom row: Genre scrollable pills */}
      <div className="pt-2 border-t border-gray-100 dark:border-slate-700/60">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none no-scrollbar text-xs">
          <div className="flex items-center gap-1 text-gray-400 dark:text-slate-500 flex-shrink-0 pr-1 font-medium">
            <Filter className="w-3.5 h-3.5" />
            <span>Thể loại:</span>
          </div>
          {GENRES.map((genre) => (
            <button
              key={genre}
              onClick={() => onSelectGenre(genre)}
              className={`px-3 py-1.5 rounded-full font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                selectedGenre === genre
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm font-semibold'
                  : 'bg-gray-100 dark:bg-slate-700/70 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
