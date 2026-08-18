import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Star, BookOpen, ChevronRight } from 'lucide-react';
import { Story } from '../../types/story';
import { getTotalChapters } from '../../utils/format';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  stories: Story[];
  onSelectStory: (storyId: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  stories,
  onSelectStory,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open triggered by parent
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const normalizedQuery = query.toLowerCase().trim();
  const searchResults = normalizedQuery === ''
    ? []
    : stories.filter((story) => {
        const titleMatch = story.title.toLowerCase().includes(normalizedQuery);
        const authorMatch = story.author.toLowerCase().includes(normalizedQuery);
        const genreMatch = story.genres.some(g => g.toLowerCase().includes(normalizedQuery));
        const descMatch = story.description.toLowerCase().includes(normalizedQuery);
        return titleMatch || authorMatch || genreMatch || descMatch;
      });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 pt-16 sm:pt-24 animate-in fade-in duration-200">
      <div 
        className="fixed inset-0" 
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 overflow-hidden z-10 flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-gray-100 dark:border-slate-700 gap-3">
          <Search className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm kiếm theo tên truyện, tác giả, thể loại..."
            className="flex-1 bg-transparent text-base text-gray-900 dark:text-slate-100 placeholder-gray-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400 hover:bg-gray-200"
          >
            ESC
          </button>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto flex-1 p-3 divide-y divide-gray-100 dark:divide-slate-700/60">
          {normalizedQuery === '' ? (
            <div className="py-12 text-center text-gray-400 dark:text-slate-500">
              <Search className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Gõ từ khóa để tìm kiếm hàng ngàn bộ truyện hấp dẫn</p>
              <div className="mt-4 flex justify-center gap-2 flex-wrap">
                <span className="text-xs text-gray-500">Gợi ý:</span>
                {['Phàm Nhân', 'Quỷ Bí', 'Kiếm Lai', 'Võng Du', 'Huyền Huyễn'].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setQuery(tag)}
                    className="text-xs px-2.5 py-1 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-amber-950/30 hover:text-amber-600 transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="py-12 text-center text-gray-400 dark:text-slate-500">
              <p className="text-base font-medium">Không tìm thấy truyện phù hợp</p>
              <p className="text-xs mt-1">Vui lòng thử tìm với từ khóa khác như tên nhân vật, tác giả...</p>
            </div>
          ) : (
            searchResults.map((story) => (
              <div
                key={story.id}
                onClick={() => {
                  onSelectStory(story.id);
                  onClose();
                }}
                className="flex items-center gap-3.5 p-3 rounded-xl hover:bg-amber-50/60 dark:hover:bg-slate-700/60 transition-colors cursor-pointer group"
              >
                <img
                  src={story.coverImage}
                  alt={story.title}
                  className="w-12 h-16 object-cover rounded-lg flex-shrink-0 shadow-sm"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-sm text-gray-900 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 truncate">
                      {story.title}
                    </h4>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                      {story.genres[0]}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
                    Tác giả: {story.author}
                  </p>
                  <div className="flex items-center gap-3 text-[11px] text-gray-400 dark:text-slate-500 mt-1">
                    <span className="flex items-center gap-0.5 text-amber-500">
                      <Star className="w-3 h-3 fill-current" />
                      {story.rating.toFixed(1)}
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      {getTotalChapters(story)} chương
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
