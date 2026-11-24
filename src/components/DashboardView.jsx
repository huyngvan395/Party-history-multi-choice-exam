import React from 'react';
import {
  BookOpen,
  ClipboardCheck,
  AlertTriangle,
  Bookmark,
  TrendingUp,
  History,
  Trash2,
  ArrowRight,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';
import { allQuestions, CHAPTER_INFO, questionsByChapter } from '../data';
import { formatDateTime, formatDuration, getScoreRating } from '../utils/quizUtils';

const ACCENT_STYLES = {
  rose: {
    bar: 'from-rose-600 to-red-500',
    badge: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
  },
  amber: {
    bar: 'from-amber-500 to-orange-500',
    badge: 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
  },
  emerald: {
    bar: 'from-emerald-600 to-teal-500',
    badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
  },
};

export default function DashboardView({
  progress,
  onNavigate,
  onStartQuickChapter,
  onDeleteExamHistory,
  onResetAllProgress,
}) {
  const totalBank = allQuestions.length;
  const completedCount = allQuestions.filter((q) => Boolean(progress.completed[q.id])).length;
  const overallPercent = totalBank > 0 ? Math.round((completedCount / totalBank) * 100) : 0;

  const wrongIds = Object.keys(progress.wrongBank).filter((id) =>
    allQuestions.some((q) => q.id === id)
  );
  const bookmarkIds = progress.bookmarks.filter((id) =>
    allQuestions.some((q) => q.id === id)
  );

  const avgScore =
    progress.examHistory.length > 0
      ? (
          progress.examHistory.reduce((sum, item) => sum + item.score10, 0) /
          progress.examHistory.length
        ).toFixed(2)
      : null;

  const handleResetConfirm = () => {
    const ok = window.confirm(
      'Bạn có chắc muốn xóa toàn bộ tiến độ học tập, Sổ tay câu sai, Sổ tay ghi nhớ và lịch sử thi thử? Thao tác này không thể hoàn tác.'
    );
    if (ok) onResetAllProgress();
  };

  return (
    <div className="space-y-6">
      {/* Academic Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-rose-200/70 bg-gradient-to-br from-rose-800 via-red-800 to-amber-900 p-6 text-white shadow-md dark:border-rose-900/50 sm:p-8">
        <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-amber-100 backdrop-blur-xs">
              Ôn thi đại học • 100% bám sát giáo trình 3 chương
            </span>
            <h1 className="font-academic mt-3 text-2xl leading-tight font-bold sm:text-3xl">
              Luyện thi Trắc nghiệm Lịch sử Đảng Cộng sản Việt Nam
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-rose-100/90 sm:text-base">
              Học sâu từng mục lịch sử có giải thích chi tiết, thi thử tính giờ theo cấu trúc thực
              chiến và tự động theo dõi lỗ hổng kiến thức bằng Sổ tay câu sai.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => onNavigate('practice')}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-rose-800 shadow-sm transition hover:bg-amber-50"
            >
              <BookOpen className="h-4 w-4" />
              Luyện theo Chương
            </button>
            <button
              type="button"
              onClick={() => onNavigate('exam')}
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur-xs transition hover:bg-white/20"
            >
              <ClipboardCheck className="h-4 w-4" />
              Thi thử thực chiến
            </button>
          </div>
        </div>
      </section>

      {/* 4 KPI Cards */}
      <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 dark:text-slate-400">
              Tiến độ hoàn thành
            </span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-stone-900 dark:text-white">
            {overallPercent}%
          </div>
          <div className="mt-1 text-xs text-stone-500 dark:text-slate-400">
            Đã luyện {completedCount} / {totalBank} câu hỏi
          </div>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 dark:text-slate-400">
              Điểm TB thi thử
            </span>
            <TrendingUp className="h-4 w-4 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-stone-900 dark:text-white">
            {avgScore !== null ? `${avgScore}` : '--'}
            <span className="text-sm font-semibold text-stone-400"> / 10</span>
          </div>
          <div className="mt-1 text-xs text-stone-500 dark:text-slate-400">
            Qua {progress.examHistory.length} lượt thi thử
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('review', 'wrong')}
          className="rounded-2xl border border-stone-200 bg-white p-4 text-left shadow-xs transition hover:border-rose-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-rose-800 sm:p-5"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 dark:text-slate-400">
              Sổ tay câu sai
            </span>
            <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-rose-700 dark:text-rose-400">
            {wrongIds.length}
          </div>
          <div className="mt-1 text-xs text-stone-500 dark:text-slate-400">
            {wrongIds.length > 0 ? 'Bấm để ôn lại ngay →' : 'Chưa có câu sai nào'}
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('review', 'bookmarks')}
          className="rounded-2xl border border-stone-200 bg-white p-4 text-left shadow-xs transition hover:border-amber-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-amber-800 sm:p-5"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 dark:text-slate-400">
              Sổ tay ghi nhớ
            </span>
            <Bookmark className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-amber-700 dark:text-amber-400">
            {bookmarkIds.length}
          </div>
          <div className="mt-1 text-xs text-stone-500 dark:text-slate-400">
            Câu hỏi đánh dấu trọng tâm
          </div>
        </button>
      </section>

      {/* Progress by Chapter */}
      <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-academic text-xl font-bold text-stone-900 dark:text-white">
              Tiến độ hoàn thành theo từng Chương
            </h2>
            <p className="text-xs text-stone-500 dark:text-slate-400">
              Thống kê số câu đã luyện tập và tỷ lệ làm đúng gần nhất trên từng chương giáo trình
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {CHAPTER_INFO.map((chap) => {
            const list = questionsByChapter[chap.chapter] || [];
            const done = list.filter((q) => Boolean(progress.completed[q.id])).length;
            const correctLast = list.filter((q) => progress.completed[q.id]?.lastCorrect).length;
            const pct = list.length > 0 ? Math.round((done / list.length) * 100) : 0;
            const style = ACCENT_STYLES[chap.accent] || ACCENT_STYLES.rose;

            return (
              <div
                key={chap.chapter}
                className="flex flex-col justify-between rounded-2xl border border-stone-200/80 bg-stone-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/40"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className={`rounded-lg px-2.5 py-1 text-xs font-bold ${style.badge}`}>
                      Chương {chap.chapter} ({chap.period})
                    </span>
                    <span className="text-sm font-extrabold text-stone-900 dark:text-white">
                      {pct}%
                    </span>
                  </div>
                  <h3 className="mt-2.5 line-clamp-2 text-sm font-bold text-stone-800 dark:text-slate-100">
                    {chap.title.replace(/^Chương \d+:\s*/, '')}
                  </h3>

                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-stone-200 dark:bg-slate-700">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r transition-all duration-500 ${style.bar}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-stone-500 dark:text-slate-400">
                    <span>
                      Đã làm: <strong>{done}/{list.length}</strong> câu
                    </span>
                    <span>
                      Đúng gần nhất: <strong>{correctLast}</strong>
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onStartQuickChapter(chap.chapter)}
                  className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-bold text-stone-700 transition hover:border-rose-300 hover:text-rose-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-rose-700 dark:hover:text-rose-300"
                >
                  Luyện Chương {chap.chapter}
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Exam History */}
      <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-rose-700 dark:text-rose-400" />
            <h2 className="font-academic text-xl font-bold text-stone-900 dark:text-white">
              Lịch sử thi thử gần đây
            </h2>
          </div>
          {(completedCount > 0 || progress.examHistory.length > 0 || wrongIds.length > 0) && (
            <button
              type="button"
              onClick={handleResetConfirm}
              className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-500 transition hover:border-rose-300 hover:text-rose-700 dark:border-slate-700 dark:text-slate-400 dark:hover:border-rose-800 dark:hover:text-rose-300"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Đặt lại tiến độ
            </button>
          )}
        </div>

        {progress.examHistory.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-300 py-10 text-center dark:border-slate-700">
            <p className="text-sm font-medium text-stone-500 dark:text-slate-400">
              Bạn chưa thực hiện bài thi thử nào. Hãy thử sức với chế độ Thi thử thực chiến!
            </p>
            <button
              type="button"
              onClick={() => onNavigate('exam')}
              className="mt-3 inline-flex items-center gap-2 rounded-xl bg-rose-700 px-4 py-2 text-xs font-bold text-white transition hover:bg-rose-800"
            >
              <ClipboardCheck className="h-4 w-4" />
              Tạo đề thi thử đầu tiên
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead>
                <tr className="border-b border-stone-200 text-xs font-bold text-stone-500 uppercase dark:border-slate-800 dark:text-slate-400">
                  <th className="py-2.5 pr-3">Thời gian</th>
                  <th className="px-3 py-2.5">Phạm vi</th>
                  <th className="px-3 py-2.5">Kết quả</th>
                  <th className="px-3 py-2.5">Điểm (Thang 10)</th>
                  <th className="px-3 py-2.5">Thời lượng</th>
                  <th className="py-2.5 pl-3 text-right">Xóa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-slate-800/80">
                {progress.examHistory.map((item) => {
                  const rating = getScoreRating(item.score10);
                  return (
                    <tr
                      key={item.id}
                      className="transition hover:bg-stone-50/70 dark:hover:bg-slate-800/40"
                    >
                      <td className="py-3 pr-3 text-xs font-medium text-stone-600 dark:text-slate-300">
                        {formatDateTime(item.timestamp)}
                      </td>
                      <td className="px-3 py-3 text-xs font-semibold text-stone-800 dark:text-slate-200">
                        Chương {item.chapters.join(', ')}
                      </td>
                      <td className="px-3 py-3 text-xs font-medium text-stone-600 dark:text-slate-300">
                        <span className="font-bold text-emerald-700 dark:text-emerald-400">
                          {item.correctCount}
                        </span>
                        /{item.totalQuestions} câu đúng
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-base font-extrabold text-stone-900 dark:text-white">
                          {item.score10.toFixed(2)}
                        </span>
                        <span className={`ml-2 text-xs font-semibold ${rating.color}`}>
                          {rating.label}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-xs text-stone-500 dark:text-slate-400">
                        {formatDuration(item.durationSeconds)}
                      </td>
                      <td className="py-3 pl-3 text-right">
                        <button
                          type="button"
                          onClick={() => onDeleteExamHistory(item.id)}
                          title="Xóa bản ghi này"
                          className="rounded-lg p-1.5 text-stone-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50 dark:hover:text-rose-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
