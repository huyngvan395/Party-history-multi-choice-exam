import React, { useCallback, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  CheckCircle2,
  XCircle,
  Lightbulb,
  RotateCcw,
  Trophy,
  Sparkles,
  Keyboard,
  Award,
} from 'lucide-react';
import { DIFFICULTY_META } from '../data';
import { OPTION_LABELS, prepareQuizQuestions } from '../utils/quizUtils';
import { useQuizKeyboard } from '../hooks/useKeyboardShortcuts';

/**
 * Phiên luyện tập chuyên sâu (dùng chung cho Luyện theo Chương/Mục,
 * Luyện lại câu sai và Luyện Sổ tay ghi nhớ).
 */
export default function PracticeSession({
  title,
  subtitle,
  questions,
  isWrongReview = false,
  wrongBank = {},
  bookmarks = [],
  onToggleBookmark,
  onRecordAnswer,
  onExit,
  onRestartWithQuestions,
}) {
  const [currentIdx, setCurrentIdx] = useState(0);
  // answers: { [questionId]: { selectedIndex, isCorrect, masteredNow, streakAfter } }
  const [answers, setAnswers] = useState({});
  const [showSummary, setShowSummary] = useState(false);

  const currentQuestion = questions[currentIdx];
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : null;
  const isLocked = Boolean(currentAnswer);

  const stats = useMemo(() => {
    const entries = Object.values(answers);
    const answered = entries.length;
    const correct = entries.filter((a) => a.isCorrect).length;
    const wrong = answered - correct;
    const masteredCount = entries.filter((a) => a.masteredNow).length;
    return { answered, correct, wrong, masteredCount };
  }, [answers]);

  const handleSelectOption = useCallback(
    (optIndex) => {
      if (!currentQuestion || answers[currentQuestion.id] || showSummary) return;
      if (optIndex < 0 || optIndex >= currentQuestion.options.length) return;

      const isCorrect = optIndex === currentQuestion.correctIndex;
      const prevWrongEntry = wrongBank[currentQuestion.id];
      const expectedStreak = isCorrect
        ? isWrongReview && prevWrongEntry
          ? (prevWrongEntry.consecutiveCorrect || 0) + 1
          : 0
        : 0;
      const expectedMastered = isWrongReview && isCorrect && Boolean(prevWrongEntry) && expectedStreak >= 2;

      onRecordAnswer(currentQuestion.id, isCorrect, { isWrongReview });

      setAnswers((prev) => ({
        ...prev,
        [currentQuestion.id]: {
          selectedIndex: optIndex,
          isCorrect,
          masteredNow: expectedMastered,
          streakAfter: expectedStreak,
        },
      }));
    },
    [answers, currentQuestion, isWrongReview, onRecordAnswer, showSummary, wrongBank]
  );

  const handlePrev = useCallback(() => {
    if (showSummary) return;
    setCurrentIdx((idx) => Math.max(0, idx - 1));
  }, [showSummary]);

  const handleNext = useCallback(() => {
    if (showSummary) return;
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((idx) => idx + 1);
    } else if (Object.keys(answers).length === questions.length) {
      setShowSummary(true);
    }
  }, [answers, currentIdx, questions.length, showSummary]);

  useQuizKeyboard({
    enabled: !showSummary && Boolean(currentQuestion),
    onSelectOption: handleSelectOption,
    onPrev: handlePrev,
    onNext: handleNext,
  });

  if (!questions.length) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <p className="text-stone-600 dark:text-slate-300">Không có câu hỏi nào trong phiên này.</p>
        <button
          type="button"
          onClick={onExit}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-rose-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </button>
      </div>
    );
  }

  if (showSummary) {
    const percent = questions.length > 0 ? Math.round((stats.correct / questions.length) * 100) : 0;
    const wrongInSession = questions.filter(
      (q) => answers[q.id] && !answers[q.id].isCorrect
    );

    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
              <Trophy className="h-8 w-8" />
            </div>
            <h2 className="font-academic mt-4 text-2xl font-bold text-stone-900 dark:text-white">
              Hoàn thành phiên luyện tập!
            </h2>
            <p className="mt-1 text-sm text-stone-500 dark:text-slate-400">{title}</p>

            <div className="mt-6 grid w-full grid-cols-3 gap-3 sm:gap-4">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/30">
                <div className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400">
                  {stats.correct}
                </div>
                <div className="text-xs font-medium text-emerald-800/80 dark:text-emerald-300/80">
                  Trả lời đúng
                </div>
              </div>
              <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4 dark:border-rose-900/60 dark:bg-rose-950/30">
                <div className="text-2xl font-extrabold text-rose-700 dark:text-rose-400">
                  {stats.wrong}
                </div>
                <div className="text-xs font-medium text-rose-800/80 dark:text-rose-300/80">
                  Trả lời sai
                </div>
              </div>
              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
                <div className="text-2xl font-extrabold text-stone-900 dark:text-white">
                  {percent}%
                </div>
                <div className="text-xs font-medium text-stone-500 dark:text-slate-400">
                  Độ chính xác
                </div>
              </div>
            </div>

            {isWrongReview && stats.masteredCount > 0 && (
              <div className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300">
                <Sparkles className="h-4 w-4 shrink-0" />
                <span>
                  Chúc mừng! Đã tự động gỡ <strong>{stats.masteredCount}</strong> câu hỏi khỏi Sổ
                  tay câu sai sau khi trả lời đúng 2 lần liên tiếp.
                </span>
              </div>
            )}

            {stats.wrong > 0 && (
              <p className="mt-4 text-xs text-stone-500 dark:text-slate-400">
                Các câu trả lời sai đã được tự động lưu vào <strong>Sổ tay câu sai</strong> để bạn
                ôn lại sau.
              </p>
            )}

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              {wrongInSession.length > 0 && onRestartWithQuestions && (
                <button
                  type="button"
                  onClick={() => {
                    const retryList = prepareQuizQuestions(wrongInSession, {
                      shuffleQuestions: true,
                      shuffleOptions: true,
                    });
                    onRestartWithQuestions(retryList);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-amber-700"
                >
                  <RotateCcw className="h-4 w-4" />
                  Làm lại {wrongInSession.length} câu vừa sai
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowSummary(false)}
                className="inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-5 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                Xem lại từng câu
              </button>
              <button
                type="button"
                onClick={onExit}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-700 px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-rose-800"
              >
                Hoàn tất & Quay lại
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const diffInfo = DIFFICULTY_META[currentQuestion.difficulty] || DIFFICULTY_META['nhan-biet'];
  const bookmarked = bookmarks.includes(currentQuestion.id);
  const currentWrongMeta = wrongBank[currentQuestion.id];
  const progressPercent = Math.round(((currentIdx + 1) / questions.length) * 100);

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onExit}
            className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 px-3 py-1.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Thoát
          </button>
          <div>
            <div className="text-sm font-bold text-stone-900 dark:text-white">{title}</div>
            {subtitle && (
              <div className="text-xs text-stone-500 dark:text-slate-400">{subtitle}</div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
            Đúng: {stats.correct}
          </span>
          <span className="rounded-lg bg-rose-50 px-2.5 py-1 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
            Sai: {stats.wrong}
          </span>
          <span className="rounded-lg bg-stone-100 px-2.5 py-1 text-stone-700 dark:bg-slate-800 dark:text-slate-300">
            Câu {currentIdx + 1} / {questions.length}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-stone-200 dark:bg-slate-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-rose-600 to-amber-500 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Main Question Card */}
      <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
        {/* Metadata Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-4 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-700 dark:bg-slate-800 dark:text-slate-300">
              Chương {currentQuestion.chapter} • Mục {currentQuestion.sectionId}
            </span>
            <span
              className={`rounded-lg border px-2.5 py-1 text-xs font-semibold ${diffInfo.badgeClass}`}
            >
              {diffInfo.label}
            </span>
            {isWrongReview && (
              <span className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 dark:border-amber-800/70 dark:bg-amber-950/50 dark:text-amber-300">
                <Award className="h-3.5 w-3.5" />
                Đúng liên tiếp:{' '}
                {currentAnswer
                  ? `${currentAnswer.streakAfter}/2`
                  : `${currentWrongMeta?.consecutiveCorrect || 0}/2`}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => onToggleBookmark(currentQuestion.id)}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
              bookmarked
                ? 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            <Bookmark className={`h-3.5 w-3.5 ${bookmarked ? 'fill-current' : ''}`} />
            {bookmarked ? 'Đã lưu Sổ tay' : 'Lưu vào Sổ tay ghi nhớ'}
          </button>
        </div>

        <p className="mt-3 text-xs font-medium text-stone-500 dark:text-slate-400">
          {currentQuestion.sectionTitle}
        </p>

        {/* Question Text */}
        <h3 className="mt-2 text-lg leading-relaxed font-bold text-stone-900 dark:text-slate-50 sm:text-xl">
          <span className="mr-2 text-rose-700 dark:text-rose-400">Câu {currentIdx + 1}:</span>
          {currentQuestion.question}
        </h3>

        {/* Options */}
        <div className="mt-6 space-y-3">
          {currentQuestion.options.map((opt, idx) => {
            const isSelected = currentAnswer?.selectedIndex === idx;
            const isCorrectOpt = idx === currentQuestion.correctIndex;

            let optionClasses =
              'border-stone-200 bg-white hover:border-rose-300 hover:bg-rose-50/40 dark:border-slate-700/80 dark:bg-slate-900/60 dark:hover:border-rose-700/60 dark:hover:bg-rose-950/20';
            let labelBadgeClasses =
              'bg-stone-100 text-stone-700 dark:bg-slate-800 dark:text-slate-300';

            if (isLocked) {
              if (isCorrectOpt) {
                optionClasses =
                  'border-emerald-500 bg-emerald-50/90 ring-1 ring-emerald-500/40 dark:border-emerald-500/80 dark:bg-emerald-950/40';
                labelBadgeClasses = 'bg-emerald-600 text-white';
              } else if (isSelected && !isCorrectOpt) {
                optionClasses =
                  'border-rose-500 bg-rose-50/90 ring-1 ring-rose-500/40 dark:border-rose-500/80 dark:bg-rose-950/40';
                labelBadgeClasses = 'bg-rose-600 text-white';
              } else {
                optionClasses =
                  'border-stone-200/70 bg-stone-50/50 opacity-65 dark:border-slate-800 dark:bg-slate-900/30';
              }
            }

            return (
              <button
                key={idx}
                type="button"
                disabled={isLocked}
                onClick={() => handleSelectOption(idx)}
                className={`group flex w-full items-start gap-3.5 rounded-2xl border p-4 text-left transition-all ${optionClasses} ${
                  isLocked ? 'cursor-default' : 'cursor-pointer active:scale-[0.995]'
                }`}
              >
                <span
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm font-bold transition ${labelBadgeClasses}`}
                >
                  {OPTION_LABELS[idx]}
                </span>
                <span className="flex-1 pt-0.5 text-sm leading-relaxed font-medium text-stone-800 dark:text-slate-100 sm:text-base">
                  {opt}
                </span>
                {isLocked && isCorrectOpt && (
                  <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                )}
                {isLocked && isSelected && !isCorrectOpt && (
                  <XCircle className="mt-1 h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
                )}
              </button>
            );
          })}
        </div>

        {/* Immediate Mastered Banner (Wrong Review Mode) */}
        {currentAnswer?.masteredNow && (
          <div className="mt-5 flex items-center gap-3 rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 dark:border-emerald-700/70 dark:bg-emerald-950/50 dark:text-emerald-300">
            <Sparkles className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>
              Xuất sắc! Bạn đã trả lời đúng 2 lần liên tiếp — câu hỏi này đã được tự động gỡ khỏi
              Sổ tay câu sai.
            </span>
          </div>
        )}

        {/* Immediate Explanation Box */}
        {isLocked && (
          <div className="mt-5 rounded-2xl border border-amber-200/90 bg-amber-50/70 p-4 dark:border-amber-800/50 dark:bg-amber-950/25 sm:p-5">
            <div className="flex items-center gap-2 text-sm font-bold text-amber-900 dark:text-amber-300">
              <Lightbulb className="h-4 w-4 shrink-0" />
              <span>
                Giải thích chi tiết (Đáp án đúng: {OPTION_LABELS[currentQuestion.correctIndex]})
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-stone-700 dark:text-slate-200">
              {currentQuestion.explanation}
            </p>
          </div>
        )}
      </div>

      {/* Navigation Footer & Mini Jump Dots */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <button
          type="button"
          onClick={handlePrev}
          disabled={currentIdx === 0}
          className="inline-flex items-center gap-2 rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Câu trước
        </button>

        {/* Keyboard Shortcut Hint */}
        <div className="hidden items-center gap-1.5 text-xs text-stone-400 dark:text-slate-500 sm:flex">
          <Keyboard className="h-3.5 w-3.5" />
          <span>Phím tắt: 1-4 / A-D chọn đáp án • ← / → chuyển câu</span>
        </div>

        {currentIdx < questions.length - 1 ? (
          <button
            type="button"
            onClick={handleNext}
            className="inline-flex items-center gap-2 rounded-xl bg-rose-700 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-rose-800"
          >
            Câu tiếp
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setShowSummary(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-emerald-700"
          >
            <Trophy className="h-4 w-4" />
            Xem tổng kết ({stats.answered}/{questions.length})
          </button>
        )}
      </div>

      {/* Compact Question Navigator */}
      <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-2.5 flex items-center justify-between text-xs font-semibold text-stone-500 dark:text-slate-400">
          <span>Danh sách câu hỏi</span>
          <span>
            Đã trả lời {stats.answered} / {questions.length}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {questions.map((q, idx) => {
            const ans = answers[q.id];
            let btnClass =
              'border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300';
            if (ans) {
              btnClass = ans.isCorrect
                ? 'border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                : 'border-rose-300 bg-rose-100 text-rose-800 dark:border-rose-800 dark:bg-rose-950/70 dark:text-rose-300';
            }
            if (idx === currentIdx) {
              btnClass += ' ring-2 ring-rose-600 ring-offset-1 dark:ring-rose-400 dark:ring-offset-slate-900';
            }
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => setCurrentIdx(idx)}
                className={`h-8 w-8 rounded-lg border text-xs font-bold transition ${btnClass}`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
