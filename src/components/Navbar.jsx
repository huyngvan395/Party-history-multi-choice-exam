import React from 'react';
import {
  BookOpen,
  ClipboardCheck,
  LayoutDashboard,
  BookmarkCheck,
  Sun,
  Moon,
  GraduationCap,
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Tổng quan', shortLabel: 'Tổng quan', icon: LayoutDashboard },
  { id: 'practice', label: 'Luyện theo Chương', shortLabel: 'Luyện sâu', icon: BookOpen },
  { id: 'exam', label: 'Thi thử tổng hợp', shortLabel: 'Thi thử', icon: ClipboardCheck },
  { id: 'review', label: 'Sổ tay & Câu sai', shortLabel: 'Sổ tay', icon: BookmarkCheck },
];

export default function Navbar({
  activeTab,
  onChangeTab,
  theme,
  onToggleTheme,
  wrongCount,
  examInProgress,
}) {
  const handleSelect = (tabId) => {
    if (tabId === activeTab) return;
    if (examInProgress) {
      const ok = window.confirm(
        'Bạn đang trong phiên thi thử có tính giờ. Rời khỏi trang sẽ hủy bài thi hiện tại. Bạn có chắc muốn chuyển mục không?'
      );
      if (!ok) return;
    }
    onChangeTab(tabId);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-[#faf8f5]/90 backdrop-blur-md dark:border-slate-800/80 dark:bg-[#0c0f17]/90">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        {/* Brand */}
        <button
          type="button"
          onClick={() => handleSelect('dashboard')}
          className="group flex items-center gap-2.5 text-left focus:outline-none"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-700 to-red-800 text-amber-100 shadow-sm shadow-rose-900/20 transition-transform group-hover:scale-105">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="font-academic truncate text-base font-bold tracking-tight text-stone-900 dark:text-slate-100 sm:text-lg">
              Lịch sử Đảng CSVN
            </div>
            <div className="hidden text-xs font-medium text-stone-500 dark:text-slate-400 sm:block">
              Hệ thống luyện thi trắc nghiệm thông minh
            </div>
          </div>
        </button>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 rounded-2xl border border-stone-200/80 bg-white/80 p-1 shadow-xs dark:border-slate-800 dark:bg-slate-900/70 md:flex">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                className={`relative flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-rose-700 text-white shadow-sm shadow-rose-900/20 dark:bg-rose-600'
                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
                {item.id === 'review' && wrongCount > 0 && (
                  <span
                    className={`ml-0.5 inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-bold ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                    }`}
                  >
                    {wrongCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Theme Toggle */}
        <button
          type="button"
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-700 shadow-xs transition hover:border-stone-300 hover:bg-stone-50 dark:border-slate-700 dark:bg-slate-900 dark:text-amber-300 dark:hover:bg-slate-800"
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Bottom-style Sub-Nav */}
      <nav className="grid grid-cols-4 border-t border-stone-200/80 bg-white/90 px-2 py-1.5 dark:border-slate-800 dark:bg-slate-900/90 md:hidden">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelect(item.id)}
              className={`relative flex flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 text-[11px] font-semibold transition ${
                isActive
                  ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                  : 'text-stone-500 hover:text-stone-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className="h-4 w-4" />
                {item.id === 'review' && wrongCount > 0 && (
                  <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">
                    {wrongCount}
                  </span>
                )}
              </div>
              <span className="truncate">{item.shortLabel}</span>
            </button>
          );
        })}
      </nav>
    </header>
  );
}
