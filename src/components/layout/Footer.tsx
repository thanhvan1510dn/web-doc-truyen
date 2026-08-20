import React from 'react';
import { BookOpen, Heart, ShieldCheck, Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-20 border-t border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 py-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 dark:bg-white flex items-center justify-center text-white dark:text-zinc-900 font-bold">
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="text-lg font-bold text-zinc-900 dark:text-white">
                Đọc Truyện
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-slate-400 max-w-md leading-relaxed">
              Trang web đọc tiểu thuyết, truyện chữ trực tuyến chất lượng cao với giao diện hiện đại, tối ưu cho trải nghiệm đọc mượt mà trên mọi thiết bị. Hỗ trợ tùy biến cỡ chữ, màu nền và đánh dấu tiến trình đọc.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-slate-200 uppercase tracking-wider mb-3">
              Thể Loại Nổi Bật
            </h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-slate-400">
              <li className="hover:text-zinc-900 dark:hover:text-white cursor-pointer transition-colors">Tiên Hiệp & Tu Chân</li>
              <li className="hover:text-zinc-900 dark:hover:text-white cursor-pointer transition-colors">Huyền Huyễn & Dị Giới</li>
              <li className="hover:text-zinc-900 dark:hover:text-white cursor-pointer transition-colors">Kiếm Hiệp Cổ Điển</li>
              <li className="hover:text-zinc-900 dark:hover:text-white cursor-pointer transition-colors">Trinh Thám & Phá Án</li>
              <li className="hover:text-zinc-900 dark:hover:text-white cursor-pointer transition-colors">Đô Thị & Võng Du</li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-slate-200 uppercase tracking-wider mb-3">
              Tính Năng Độc Đáo
            </h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-slate-400">
              <li className="flex items-center gap-2"><Sparkles className="w-4 h-4 opacity-70" /> Tùy chỉnh Font & Cỡ chữ</li>
              <li className="flex items-center gap-2"><Sparkles className="w-4 h-4 opacity-70" /> Chia chương theo Quyển/Phần</li>
              <li className="flex items-center gap-2"><Sparkles className="w-4 h-4 opacity-70" /> Chế độ Dark/Light/Sepia</li>
              <li className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-500" /> Tự động lưu tiến độ đọc</li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 dark:text-slate-400 gap-4">
          <p>© 2026 Mê Đọc Truyện. Được thiết kế với tâm huyết dành cho độc giả yêu tiểu thuyết.</p>
          <div className="flex items-center gap-1 text-gray-500 dark:text-slate-400">
            <span>Made with</span>
            <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 inline" />
            <span>for Web Story Lovers</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
