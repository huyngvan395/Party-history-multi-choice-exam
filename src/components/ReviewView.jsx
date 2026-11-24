import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Bookmark,
  Play,
  Trash2,
  CheckCircle2,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Award,
} from 'lucide-react';
import { DIFFICULTY_META, questionMap } from '../data';
import { OPTION_LABELS, prepareQuizQuestions } from '../utils/quizUtils';
import PracticeSession from './PracticeSession';

export default function ReviewView({
  initialSubTab = 'wrong',
  progress,
  onToggleBookmark,
  onRecordPracticeAnswer,
  onRemoveWrongQuestion,
}) {
  const [subTab, setSubTab] = useState(initialSubTab);
  const [expandedIds, setExpandedIds] = useState(() => new Set());
  const [activeSession, setActiveSession] = useState(null);

  useEffect(() => {
    setSubTab(initialSubTab);
  }, [initialSubTab]);

  const wrongQuestions = useMemo(() => {
    return Object.entries(progress.wrongBank)
      .map(([id, meta]) => {
        const q = questionMap.get(id);
        return q ? { question: q, meta } : null;
      })
      .filter(Boolean)
      .sort((a, b) => (b.meta.lastWrongAt || '').localeCompare(a.meta.lastWrongAt || ''));
  }, [progress.wrongBank]);

  const bookmarkedQuestions = useMemo(() => {
    return progress.bookmarks.map((id) => questionMap.get(id)).filter(Boolean);
  }, [progress.bookmarks]);

  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const startWrongReview = () => {
    if (!wrongQuestions.length) return;
    const prepared = prepareQuizQuestions(
      wrongQuestions.map((item) => item.question),
      { shuffleQuestions: true, shuffleOptions: true }
    );
    setActiveSession({
      id: Date.now(),
      isWrongReview: true,
      title: 'Ôn tập Sổ tay câu sai',
      subtitle: 'Trả lời đúng 2 lần liên tiếp để tự động gỡ câu hỏi khỏi danh sách sai',
      questions: prepared,
    });
  };

  const startBookmarkPractice = () => {
    if (!bookmarkedQuestions.length) return;
    const prepared = prepareQuizQuestions(bookmarkedQuestions, {
      shuffleQuestions: true,
      shuffleOptions: true,
    });
    setActiveSession({
      id: Date.now(),
      isWrongReview: false,
      title: 'Ôn tập Sổ tay ghi nhớ (Bookmark)',
      subtitle: `${prepared.length} câu hỏi trọng tâm đã đánh dấu`,
      questions: prepared,
    });
  };

  if (activeSession) {
    return (
      <PracticeSession
        key={activeSession.id}
        title={activeSession.title}
        subtitle={activeSession.subtitle}
        questions={activeSession.questions}
        isWrongReview={activeSession.isWrongReview}
        wrongBank={progress.wrongBank}
        bookmarks={progress.bookmarks}
        onToggleBookmark={onToggleBookmark}
        onRecordAnswer={onRecordPracticeAnswer}
        onExit={() => setActiveSession(null)}
        onRestartWithQuestions={(retryQuestions) =>
          setActiveSession({
            ...activeSession,
            id: Date.now(),
            questions: retryQuestions,
          })
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <h1 className="font-academic text-2xl font-bold text-stone-900 dark:text-white">
          Sổ tay câu sai & Sổ tay ghi nhớ
        </h1>
        <p className="mt-1 text-sm text-stone-500 dark:text-slate-400">
          Hệ thống tự động gom toàn bộ câu hỏi bạn trả lời sai ở cả chế độ Luyện tập và Thi thử.
          Ôn lại và trả lời đúng <strong>2 lần liên tiếp</strong> để xóa sổ lỗ hổng kiến thức.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSubTab('wrong')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
              subTab === 'wrong'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            <AlertTriangle className="h-4 w-4" />
            Sổ tay câu sai ({wrongQuestions.length})
          </button>

          <button
            type="button"
            onClick={() => setSubTab('bookmarks')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
              subTab === 'bookmarks'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            <Bookmark className="h-4 w-4" />
            Sổ tay ghi nhớ ({bookmarkedQuestions.length})
          </button>
        </div>
      </div>

      {/* TAB 1: WRONG BANK */}
      {subTab === 'wrong' && (
        <div className="space-y-4">
          {wrongQuestions.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-emerald-300 bg-white p-10 text-center dark:border-emerald-900 dark:bg-slate-900">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h2 className="mt-4 text-lg font-bold text-stone-900 dark:text-white">
                Sổ tay câu sai đang trống!
              </h2>
              <p className="mt-1 text-sm text-stone-500 dark:text-slate-400">
                Tuyệt vời! Hiện tại bạn không còn câu hỏi nào chưa khắc phục.
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50/70 p-4 dark:border-rose-900/60 dark:bg-rose-950/30">
                <div className="text-sm font-medium text-rose-900 dark:text-rose-200">
                  Hiện có <strong>{wrongQuestions.length} câu hỏi</strong> cần ôn luyện lại. Trả
                  lời đúng <strong>2 lần liên tiếp</strong> trong chế độ ôn tập sẽ tự động gỡ khỏi
                  danh sách!
                </div>
                <button
                  type="button"
                  onClick={startWrongReview}
                  className="inline-flex items-center gap-2 rounded-xl bg-rose-700 px-5 py-2.5 text-sm font-bold text-white shadow-xs transition hover:bg-rose-800"
                >
                  <Play className="h-4 w-4 fill-current" />
                  Luyện lại {wrongQuestions.length} câu sai
                </button>
              </div>

              <div className="space-y-3">
                {wrongQuestions.map(({ question: q, meta }) => {
                  const isExpanded = expandedIds.has(q.id);
                  const diff = DIFFICULTY_META[q.difficulty] || DIFFICULTY_META['nhan-biet'];
                  const streak = meta.consecutiveCorrect || 0;
                  const bookmarked = progress.bookmarks.includes(q.id);

                  return (
                    <div
                      key={q.id}
                      className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-lg bg-stone-100 px-2.5 py-0.5 text-xs font-semibold text-stone-700 dark:bg-slate-800 dark:text-slate-300">
                            Chương {q.chapter} • Mục {q.sectionId}
                          </span>
                          <span
                            className={`rounded-lg border px-2 py-0.5 text-xs font-semibold ${diff.badgeClass}`}
                          >
                            {diff.label}
                          </span>
                          <span className="rounded-lg bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                            Sai {meta.wrongCount} lần
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                            <Award className="h-3.5 w-3.5" />
                            Đúng liên tiếp: {streak}/2
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onToggleBookmark(q.id)}
                            title="Lưu vào Sổ tay ghi nhớ"
                            className={`rounded-lg border p-1.5 transition ${
                              bookmarked
                                ? 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                                : 'border-stone-200 text-stone-500 hover:bg-stone-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800'
                            }`}
                          >
                            <Bookmark className={`h-4 w-4 ${bookmarked ? 'fill-current' : ''}`} />
                          </button>
                          <button
                            type="button"
                            onClick={() => onRemoveWrongQuestion(q.id)}
                            title="Gỡ thủ công khỏi Sổ tay câu sai"
                            className="rounded-lg border border-stone-200 p-1.5 text-stone-400 transition hover:border-rose-300 hover:text-rose-600 dark:border-slate-700 dark:hover:border-rose-800 dark:hover:text-rose-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <p className="mt-3 text-sm font-bold text-stone-900 dark:text-white sm:text-base">
                        {q.question}
                      </p>

                      <button
                        type="button"
                        onClick={() => toggleExpand(q.id)}
                        className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-rose-700 hover:underline dark:text-rose-400"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="h-4 w-4" />
                            Ẩn đáp án & giải thích
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4" />
                            Xem đáp án đúng & giải thích
                          </>
                        )}
                      </button>

                      {isExpanded && (
                        <div className="mt-3 space-y-3 border-t border-stone-100 pt-3 dark:border-slate-800">
                          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs font-semibold text-emerald-900 dark:border-emerald-800/60 dark:bg-emerald-950/30 dark:text-emerald-200 sm:text-sm">
                            Đáp án đúng ({OPTION_LABELS[q.correctIndex]}):{' '}
                            {q.options[q.correctIndex]}
                          </div>
                          <div className="rounded-xl border border-amber-200/80 bg-amber-50/70 p-3.5 text-xs leading-relaxed text-stone-700 dark:border-amber-800/50 dark:bg-amber-950/25 dark:text-slate-200 sm:text-sm">
                            <div className="mb-1 flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-300">
                              <Lightbulb className="h-4 w-4" />
                              Giải thích chi tiết:
                            </div>
                            {q.explanation}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 2: BOOKMARKS */}
      {subTab === 'bookmarks' && (
        <div className="space-y-4">
          {bookmarkedQuestions.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-stone-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
                <Bookmark className="h-7 w-7" />
              </div>
              <h2 className="mt-4 text-lg font-bold text-stone-900 dark:text-white">
                Chưa có câu hỏi nào trong Sổ tay ghi nhớ
              </h2>
              <p className="mt-1 text-sm text-stone-500 dark:text-slate-400">
                Khi luyện tập hoặc xem lại bài thi, bấm nút &ldquo;Lưu vào Sổ tay ghi nhớ&rdquo; để
                đánh dấu các câu mốc sự kiện, văn kiện quan trọng.
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-900/60 dark:bg-amber-950/30">
                <div className="text-sm font-medium text-amber-900 dark:text-amber-200">
                  Bạn đã lưu <strong>{bookmarkedQuestions.length} câu hỏi trọng tâm</strong> vào Sổ
                  tay ghi nhớ.
                </div>
                <button
                  type="button"
                  onClick={startBookmarkPractice}
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-bold text-white shadow-xs transition hover:bg-amber-700"
                >
                  <Play className="h-4 w-4 fill-current" />
                  Luyện tập {bookmarkedQuestions.length} câu đã lưu
                </button>
              </div>

              <div className="space-y-3">
                {bookmarkedQuestions.map((q) => {
                  const diff = DIFFICULTY_META[q.difficulty] || DIFFICULTY_META['nhan-biet'];
                  return (
                    <div
                      key={q.id}
                      className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-lg bg-stone-100 px-2.5 py-0.5 text-xs font-semibold text-stone-700 dark:bg-slate-800 dark:text-slate-300">
                            Chương {q.chapter} • Mục {q.sectionId}
                          </span>
                          <span
                            className={`rounded-lg border px-2 py-0.5 text-xs font-semibold ${diff.badgeClass}`}
                          >
                            {diff.label}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => onToggleBookmark(q.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 transition hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                        >
                          <Bookmark className="h-3.5 w-3.5 fill-current" />
                          Bỏ lưu
                        </button>
                      </div>

                      <p className="mt-3 text-sm font-bold text-stone-900 dark:text-white sm:text-base">
                        {q.question}
                      </p>

                      <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs font-semibold text-emerald-900 dark:border-emerald-800/60 dark:bg-emerald-950/30 dark:text-emerald-200 sm:text-sm">
                        Đáp án đúng: {q.options[q.correctIndex]}
                      </div>

                      <div className="mt-3 rounded-xl border border-amber-200/80 bg-amber-50/70 p-3.5 text-xs leading-relaxed text-stone-700 dark:border-amber-800/50 dark:bg-amber-950/25 dark:text-slate-200 sm:text-sm">
                        <div className="mb-1 flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-300">
                          <Lightbulb className="h-4 w-4" />
                          Giải thích chi tiết:
                        </div>
                        {q.explanation}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
