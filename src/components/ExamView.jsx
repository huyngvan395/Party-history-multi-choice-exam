import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ClipboardCheck,
  Clock,
  Flag,
  Play,
  ArrowLeft,
  ArrowRight,
  Send,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Lightbulb,
  Bookmark,
  Grid3X3,
  X,
  RotateCcw,
  Keyboard,
  BarChart3,
  BookOpen,
} from 'lucide-react';
import { allQuestions, CHAPTER_INFO, DIFFICULTY_META } from '../data';
import {
  OPTION_LABELS,
  prepareQuizQuestions,
  computeExamBreakdown,
  formatCountdown,
  formatDuration,
  getScoreRating,
} from '../utils/quizUtils';
import { useQuizKeyboard } from '../hooks/useKeyboardShortcuts';

const QUESTION_COUNT_OPTIONS = [20, 40, 50, 60];
const TIME_LIMIT_OPTIONS = [15, 30, 45, 60];

export default function ExamView({
  bookmarks,
  onToggleBookmark,
  onSubmitExamRecord,
  onExamStatusChange,
  onGoToWrongReview,
  onGoToDashboard,
}) {
  // Phase: 'setup' | 'running' | 'result'
  const [phase, setPhase] = useState('setup');

  // Setup state
  const [selectedCount, setSelectedCount] = useState(40);
  const [selectedMinutes, setSelectedMinutes] = useState(30);
  const [selectedChapters, setSelectedChapters] = useState([1, 2, 3]);

  // Running state
  const [examQuestions, setExamQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState(() => new Set());
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalTimeSeconds, setTotalTimeSeconds] = useState(0);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [mobilePaletteOpen, setMobilePaletteOpen] = useState(false);

  // Result state
  const [resultData, setResultData] = useState(null);
  const [reviewFilter, setReviewFilter] = useState('wrong'); // 'all' | 'wrong' | 'correct' | 'unanswered'

  // Refs for safe timer auto-submit
  const answersRef = useRef(answers);
  answersRef.current = answers;
  const submittedRef = useRef(false);

  useEffect(() => {
    if (onExamStatusChange) {
      onExamStatusChange(phase === 'running');
    }
    return () => {
      if (onExamStatusChange) onExamStatusChange(false);
    };
  }, [phase, onExamStatusChange]);

  const poolQuestions = useMemo(() => {
    return allQuestions.filter((q) => selectedChapters.includes(q.chapter));
  }, [selectedChapters]);

  const actualQuestionCount = Math.min(selectedCount, poolQuestions.length);

  const toggleChapter = (chapNum) => {
    setSelectedChapters((prev) => {
      if (prev.includes(chapNum)) {
        if (prev.length === 1) return prev; // Keep at least 1 chapter selected
        return prev.filter((c) => c !== chapNum);
      }
      return [...prev, chapNum].sort((a, b) => a - b);
    });
  };

  const handleStartExam = () => {
    if (poolQuestions.length === 0) return;
    const prepared = prepareQuizQuestions(poolQuestions, {
      shuffleQuestions: true,
      shuffleOptions: true,
      limit: selectedCount,
    });
    const limitSecs = selectedMinutes * 60;
    submittedRef.current = false;
    setExamQuestions(prepared);
    setCurrentIdx(0);
    setAnswers({});
    setFlagged(new Set());
    setTimeLeft(limitSecs);
    setTotalTimeSeconds(limitSecs);
    setShowSubmitModal(false);
    setMobilePaletteOpen(false);
    setResultData(null);
    setPhase('running');
  };

  const finalizeSubmit = useCallback(
    (isAutoTimeout = false) => {
      if (submittedRef.current) return;
      submittedRef.current = true;

      const finalAnswers = { ...answersRef.current };
      const breakdown = computeExamBreakdown(examQuestions, finalAnswers);
      const durationSeconds = Math.max(1, totalTimeSeconds - timeLeft);

      const examRecord = {
        id: `exam_${Date.now()}`,
        timestamp: new Date().toISOString(),
        totalQuestions: breakdown.total,
        correctCount: breakdown.correctCount,
        wrongCount: breakdown.wrongCount,
        unansweredCount: breakdown.unansweredCount,
        score10: breakdown.score10,
        durationSeconds,
        timeLimitMinutes: Math.round(totalTimeSeconds / 60),
        chapters: [...selectedChapters].sort((a, b) => a - b),
        chapterStats: breakdown.chapterStats,
        sectionStats: breakdown.sectionStats,
      };

      onSubmitExamRecord(examRecord, examQuestions, finalAnswers);

      setResultData({
        breakdown,
        finalAnswers,
        durationSeconds,
        isAutoTimeout,
      });
      setReviewFilter(breakdown.wrongCount + breakdown.unansweredCount > 0 ? 'wrong' : 'all');
      setShowSubmitModal(false);
      setMobilePaletteOpen(false);
      setPhase('result');
    },
    [examQuestions, onSubmitExamRecord, selectedChapters, timeLeft, totalTimeSeconds]
  );

  // Countdown Timer
  useEffect(() => {
    if (phase !== 'running') return undefined;
    if (timeLeft <= 0) {
      finalizeSubmit(true);
      return undefined;
    }
    const timer = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [phase, timeLeft, finalizeSubmit]);

  const currentQuestion = examQuestions[currentIdx];

  const handleSelectOption = useCallback(
    (optIdx) => {
      if (phase !== 'running' || showSubmitModal || !currentQuestion) return;
      if (optIdx < 0 || optIdx >= currentQuestion.options.length) return;
      setAnswers((prev) => ({
        ...prev,
        [currentQuestion.id]: optIdx,
      }));
    },
    [currentQuestion, phase, showSubmitModal]
  );

  const handlePrev = useCallback(() => {
    if (phase !== 'running' || showSubmitModal) return;
    setCurrentIdx((idx) => Math.max(0, idx - 1));
  }, [phase, showSubmitModal]);

  const handleNext = useCallback(() => {
    if (phase !== 'running' || showSubmitModal) return;
    setCurrentIdx((idx) => Math.min(examQuestions.length - 1, idx + 1));
  }, [examQuestions.length, phase, showSubmitModal]);

  useQuizKeyboard({
    enabled: phase === 'running' && !showSubmitModal,
    onSelectOption: handleSelectOption,
    onPrev: handlePrev,
    onNext: handleNext,
  });

  const toggleFlagCurrent = () => {
    if (!currentQuestion) return;
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(currentQuestion.id)) next.delete(currentQuestion.id);
      else next.add(currentQuestion.id);
      return next;
    });
  };

  // =========================================================================
  // PHASE 1: EXAM SETUP
  // =========================================================================
  if (phase === 'setup') {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-start gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
              <ClipboardCheck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-academic text-2xl font-bold text-stone-900 dark:text-white">
                Luyện đề tổng hợp (Thi thử thực chiến)
              </h1>
              <p className="mt-1 text-sm text-stone-500 dark:text-slate-400">
                Đề thi tự động xáo trộn ngẫu nhiên thứ tự câu hỏi và vị trí 4 đáp án A/B/C/D bằng
                Fisher-Yates. Có đồng hồ đếm ngược, bảng điều hướng câu hỏi, đặt cờ xem lại và chấm
                điểm thang 10.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6 rounded-3xl border border-stone-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          {/* 1. Scope */}
          <div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <label className="text-sm font-bold text-stone-900 dark:text-white">
                1. Phạm vi trộn đề (chọn 1, 2 hoặc cả 3 chương)
              </label>
              <button
                type="button"
                onClick={() => setSelectedChapters([1, 2, 3])}
                className="text-xs font-semibold text-rose-700 hover:underline dark:text-rose-400"
              >
                Trộn ngẫu nhiên cả 3 chương
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {CHAPTER_INFO.map((chap) => {
                const checked = selectedChapters.includes(chap.chapter);
                const countInChap = allQuestions.filter((q) => q.chapter === chap.chapter).length;
                return (
                  <button
                    key={chap.chapter}
                    type="button"
                    onClick={() => toggleChapter(chap.chapter)}
                    className={`flex flex-col items-start rounded-2xl border p-4 text-left transition ${
                      checked
                        ? 'border-rose-600 bg-rose-50/70 ring-1 ring-rose-600/30 dark:border-rose-500 dark:bg-rose-950/35'
                        : 'border-stone-200 bg-stone-50/50 hover:bg-stone-100/70 dark:border-slate-700 dark:bg-slate-800/40 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span className="text-sm font-bold text-stone-900 dark:text-white">
                        Chương {chap.chapter}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                          checked
                            ? 'bg-rose-700 text-white'
                            : 'bg-stone-200 text-stone-600 dark:bg-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {countInChap} câu
                      </span>
                    </div>
                    <span className="mt-1 text-xs font-medium text-stone-500 dark:text-slate-400">
                      Giai đoạn {chap.period}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Question Count */}
          <div>
            <label className="mb-3 block text-sm font-bold text-stone-900 dark:text-white">
              2. Số lượng câu hỏi
            </label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {QUESTION_COUNT_OPTIONS.map((num) => {
                const active = selectedCount === num;
                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setSelectedCount(num)}
                    className={`rounded-2xl border py-3.5 text-center transition ${
                      active
                        ? 'border-rose-600 bg-rose-700 text-white shadow-sm dark:border-rose-500 dark:bg-rose-600'
                        : 'border-stone-200 bg-white text-stone-800 hover:bg-stone-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <div className="text-xl font-extrabold">{num}</div>
                    <div className={`text-xs ${active ? 'text-rose-100' : 'text-stone-500 dark:text-slate-400'}`}>
                      câu hỏi
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Time Limit */}
          <div>
            <label className="mb-3 block text-sm font-bold text-stone-900 dark:text-white">
              3. Thời gian làm bài
            </label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {TIME_LIMIT_OPTIONS.map((mins) => {
                const active = selectedMinutes === mins;
                return (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setSelectedMinutes(mins)}
                    className={`rounded-2xl border py-3.5 text-center transition ${
                      active
                        ? 'border-amber-600 bg-amber-600 text-white shadow-sm'
                        : 'border-stone-200 bg-white text-stone-800 hover:bg-stone-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <div className="text-xl font-extrabold">{mins}</div>
                    <div className={`text-xs ${active ? 'text-amber-100' : 'text-stone-500 dark:text-slate-400'}`}>
                      phút
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pool Notice if current sample bank < selectedCount */}
          {poolQuestions.length < selectedCount && (
            <div className="flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-xs leading-relaxed text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span>
                Ngân hàng câu hỏi hiện có <strong>{poolQuestions.length} câu</strong> trong phạm vi
                Chương {selectedChapters.join(', ')} (đang dùng bộ câu hỏi mẫu kiểm thử). Đề thi sẽ
                tự động lấy tối đa <strong>{actualQuestionCount} câu</strong> hiện có và tự mở rộng
                đủ <strong>{selectedCount} câu</strong> ngay khi nạp ngân hàng đầy đủ ở Giai đoạn 3.
              </span>
            </div>
          )}

          {/* Start CTA */}
          <div className="flex flex-col items-center justify-between gap-4 border-t border-stone-100 pt-5 dark:border-slate-800 sm:flex-row">
            <div className="text-sm text-stone-600 dark:text-slate-300">
              Cấu hình đề:{' '}
              <strong className="text-stone-900 dark:text-white">{actualQuestionCount} câu</strong>{' '}
              •{' '}
              <strong className="text-stone-900 dark:text-white">{selectedMinutes} phút</strong> •{' '}
              <strong className="text-stone-900 dark:text-white">
                Chương {selectedChapters.join(', ')}
              </strong>
            </div>
            <button
              type="button"
              disabled={actualQuestionCount === 0}
              onClick={handleStartExam}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-rose-700 px-6 py-3 text-sm font-bold text-white shadow-sm shadow-rose-900/20 transition hover:bg-rose-800 disabled:opacity-45 sm:w-auto"
            >
              <Play className="h-4 w-4 fill-current" />
              Bắt đầu vào phòng thi
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // PHASE 2: EXAM ROOM (RUNNING)
  // =========================================================================
  if (phase === 'running' && currentQuestion) {
    const answeredCount = Object.keys(answers).length;
    const unansweredCount = examQuestions.length - answeredCount;
    const isLowTime = timeLeft <= 300;
    const isCriticalTime = timeLeft <= 60;
    const isCurrentFlagged = flagged.has(currentQuestion.id);
    const chosenIndex = answers[currentQuestion.id];
    const diffInfo = DIFFICULTY_META[currentQuestion.difficulty] || DIFFICULTY_META['nhan-biet'];

    const renderPaletteGrid = () => (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2 text-center text-[11px] font-semibold">
          <div className="rounded-xl bg-emerald-50 px-2 py-1.5 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
            Đã làm: {answeredCount}
          </div>
          <div className="rounded-xl bg-stone-100 px-2 py-1.5 text-stone-600 dark:bg-slate-800 dark:text-slate-300">
            Chưa làm: {unansweredCount}
          </div>
          <div className="rounded-xl bg-amber-50 px-2 py-1.5 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
            Đặt cờ: {flagged.size}
          </div>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {examQuestions.map((q, idx) => {
            const isAns = answers[q.id] !== undefined;
            const isFlg = flagged.has(q.id);
            const isCurr = idx === currentIdx;

            let cellClass =
              'border-stone-200 bg-white text-stone-700 hover:bg-stone-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300';
            if (isAns) {
              cellClass =
                'border-emerald-400 bg-emerald-100 text-emerald-900 dark:border-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-200';
            }
            if (isCurr) {
              cellClass +=
                ' ring-2 ring-rose-600 ring-offset-1 dark:ring-rose-400 dark:ring-offset-slate-900';
            }

            return (
              <button
                key={q.id}
                type="button"
                onClick={() => {
                  setCurrentIdx(idx);
                  setMobilePaletteOpen(false);
                }}
                className={`relative flex h-10 items-center justify-center rounded-xl border text-xs font-bold transition ${cellClass}`}
              >
                {idx + 1}
                {isFlg && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-white shadow-xs">
                    <Flag className="h-2.5 w-2.5 fill-current" />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setShowSubmitModal(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-700 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-rose-800"
        >
          <Send className="h-4 w-4" />
          Nộp bài thi ({answeredCount}/{examQuestions.length})
        </button>
      </div>
    );

    return (
      <div className="space-y-5">
        {/* Sticky Exam Header */}
        <div className="sticky top-[65px] z-30 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
          <div>
            <div className="text-sm font-bold text-stone-900 dark:text-white">
              Phòng thi thử • Chương {selectedChapters.join(', ')}
            </div>
            <div className="text-xs text-stone-500 dark:text-slate-400">
              Đã hoàn thành {answeredCount}/{examQuestions.length} câu
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Countdown Timer */}
            <div
              className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 font-mono text-base font-extrabold ${
                isCriticalTime
                  ? 'animate-pulse border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300'
                  : isLowTime
                    ? 'border-amber-400 bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                    : 'border-stone-200 bg-stone-50 text-stone-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white'
              }`}
            >
              <Clock className="h-4 w-4" />
              <span>{formatCountdown(timeLeft)}</span>
            </div>

            <button
              type="button"
              onClick={() => setMobilePaletteOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-bold text-stone-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 lg:hidden"
            >
              <Grid3X3 className="h-4 w-4" />
              Bảng câu
            </button>

            <button
              type="button"
              onClick={() => setShowSubmitModal(true)}
              className="hidden items-center gap-1.5 rounded-xl bg-rose-700 px-4 py-2 text-xs font-bold text-white transition hover:bg-rose-800 sm:inline-flex"
            >
              <Send className="h-3.5 w-3.5" />
              Nộp bài
            </button>
          </div>
        </div>

        {/* Main 2-Column Exam Layout */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Question Card */}
          <div className="space-y-4 lg:col-span-8">
            <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:p-7">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-4 dark:border-slate-800">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                    Câu {currentIdx + 1} / {examQuestions.length}
                  </span>
                  <span className="rounded-lg bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-600 dark:bg-slate-800 dark:text-slate-300">
                    Chương {currentQuestion.chapter} • Mục {currentQuestion.sectionId}
                  </span>
                  <span
                    className={`rounded-lg border px-2.5 py-1 text-xs font-semibold ${diffInfo.badgeClass}`}
                  >
                    {diffInfo.label}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={toggleFlagCurrent}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                    isCurrentFlagged
                      ? 'border-amber-400 bg-amber-50 text-amber-800 dark:border-amber-600 dark:bg-amber-950/60 dark:text-amber-300'
                      : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                  }`}
                >
                  <Flag className={`h-3.5 w-3.5 ${isCurrentFlagged ? 'fill-current' : ''}`} />
                  {isCurrentFlagged ? 'Đã đặt cờ' : 'Đặt cờ xem lại'}
                </button>
              </div>

              <h2 className="mt-5 text-lg leading-relaxed font-bold text-stone-900 dark:text-slate-50 sm:text-xl">
                {currentQuestion.question}
              </h2>

              <div className="mt-6 space-y-3">
                {currentQuestion.options.map((opt, idx) => {
                  const isSelected = chosenIndex === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectOption(idx)}
                      className={`flex w-full items-start gap-3.5 rounded-2xl border p-4 text-left transition active:scale-[0.995] ${
                        isSelected
                          ? 'border-rose-600 bg-rose-50/80 ring-1 ring-rose-600/40 dark:border-rose-500 dark:bg-rose-950/40'
                          : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50 dark:border-slate-700/80 dark:bg-slate-900/60 dark:hover:border-slate-600 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm font-bold transition ${
                          isSelected
                            ? 'bg-rose-700 text-white'
                            : 'bg-stone-100 text-stone-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {OPTION_LABELS[idx]}
                      </span>
                      <span className="flex-1 pt-0.5 text-sm leading-relaxed font-medium text-stone-800 dark:text-slate-100 sm:text-base">
                        {opt}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Prev/Next Controls */}
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <button
                type="button"
                disabled={currentIdx === 0}
                onClick={handlePrev}
                className="inline-flex items-center gap-2 rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <ArrowLeft className="h-4 w-4" />
                Câu trước
              </button>

              <div className="hidden items-center gap-1.5 text-xs text-stone-400 dark:text-slate-500 sm:flex">
                <Keyboard className="h-3.5 w-3.5" />
                <span>1-4 / A-D chọn đáp án • ← / → chuyển câu</span>
              </div>

              {currentIdx < examQuestions.length - 1 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                >
                  Câu tiếp
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-rose-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-rose-800"
                >
                  <Send className="h-4 w-4" />
                  Nộp bài ngay
                </button>
              )}
            </div>
          </div>

          {/* Desktop Question Palette Sidebar */}
          <aside className="hidden lg:col-span-4 lg:block">
            <div className="sticky top-36 rounded-3xl border border-stone-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-3 flex items-center gap-2 text-sm font-bold text-stone-900 dark:text-white">
                <Grid3X3 className="h-4 w-4 text-rose-700 dark:text-rose-400" />
                <span>Bảng điều hướng câu hỏi</span>
              </div>
              {renderPaletteGrid()}
            </div>
          </aside>
        </div>

        {/* Mobile Palette Slide-Over */}
        {mobilePaletteOpen && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs lg:hidden">
            <div className="h-full w-full max-w-xs overflow-y-auto bg-white p-5 shadow-xl dark:bg-slate-900">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-base font-bold text-stone-900 dark:text-white">
                  Bảng điều hướng câu hỏi
                </span>
                <button
                  type="button"
                  onClick={() => setMobilePaletteOpen(false)}
                  className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-100 dark:hover:bg-slate-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              {renderPaletteGrid()}
            </div>
          </div>
        )}

        {/* Submit Confirmation Modal */}
        {showSubmitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900">
              <h3 className="font-academic text-xl font-bold text-stone-900 dark:text-white">
                Xác nhận nộp bài thi?
              </h3>
              <p className="mt-2 text-sm text-stone-600 dark:text-slate-300">
                Bạn đã trả lời <strong>{answeredCount}/{examQuestions.length}</strong> câu hỏi.
              </p>

              {(unansweredCount > 0 || flagged.size > 0) && (
                <div className="mt-4 space-y-1.5 rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-xs font-medium text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200">
                  {unansweredCount > 0 && (
                    <div>• Còn {unansweredCount} câu hỏi chưa được trả lời.</div>
                  )}
                  {flagged.size > 0 && (
                    <div>• Có {flagged.size} câu hỏi đang đặt cờ xem lại.</div>
                  )}
                </div>
              )}

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Quay lại kiểm tra
                </button>
                <button
                  type="button"
                  onClick={() => finalizeSubmit(false)}
                  className="inline-flex items-center gap-2 rounded-xl bg-rose-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-rose-800"
                >
                  <Send className="h-4 w-4" />
                  Nộp bài ngay
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // PHASE 3: EXAM RESULT & ANALYTICS
  // =========================================================================
  if (phase === 'result' && resultData) {
    const { breakdown, finalAnswers, durationSeconds, isAutoTimeout } = resultData;
    const rating = getScoreRating(breakdown.score10);

    const reviewItems = examQuestions
      .map((q, idx) => {
        const chosen = finalAnswers[q.id];
        const isAnswered = chosen !== undefined && chosen !== null;
        const isCorrect = isAnswered && chosen === q.correctIndex;
        return { q, idx, chosen, isAnswered, isCorrect };
      })
      .filter((item) => {
        if (reviewFilter === 'wrong') return !item.isCorrect; // Wrong + Unanswered
        if (reviewFilter === 'correct') return item.isCorrect;
        if (reviewFilter === 'unanswered') return !item.isAnswered;
        return true;
      });

    return (
      <div className="space-y-6">
        {/* Score Summary Banner */}
        <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
          {isAutoTimeout && (
            <div className="mb-4 inline-flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
              <Clock className="h-4 w-4" />
              Hết thời gian làm bài — Hệ thống đã tự động thu bài và chấm điểm.
            </div>
          )}

          <div className="grid items-center gap-6 md:grid-cols-12">
            {/* Score Circle / Card */}
            <div className="flex flex-col items-center justify-center rounded-3xl bg-gradient-to-br from-rose-50 to-amber-50 p-6 text-center dark:from-rose-950/40 dark:to-slate-800/80 md:col-span-4">
              <div className="text-xs font-bold tracking-wider text-stone-500 uppercase dark:text-slate-400">
                Điểm số (Thang 10)
              </div>
              <div className="mt-2 text-5xl font-black tracking-tight text-rose-700 dark:text-rose-400">
                {breakdown.score10.toFixed(2)}
              </div>
              <div className={`mt-1.5 text-sm font-bold ${rating.color}`}>{rating.label}</div>
              <div className="mt-2 text-xs text-stone-500 dark:text-slate-400">
                Thời gian làm: {formatDuration(durationSeconds)}
              </div>
            </div>

            {/* Stats & Actions */}
            <div className="space-y-5 md:col-span-8">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/30">
                  <div className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400">
                    {breakdown.correctCount}
                  </div>
                  <div className="text-xs font-medium text-emerald-800/80 dark:text-emerald-300">
                    Câu đúng ({breakdown.accuracy}%)
                  </div>
                </div>
                <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4 dark:border-rose-900/60 dark:bg-rose-950/30">
                  <div className="text-2xl font-extrabold text-rose-700 dark:text-rose-400">
                    {breakdown.wrongCount}
                  </div>
                  <div className="text-xs font-medium text-rose-800/80 dark:text-rose-300">
                    Câu làm sai
                  </div>
                </div>
                <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
                  <div className="text-2xl font-extrabold text-stone-700 dark:text-slate-200">
                    {breakdown.unansweredCount}
                  </div>
                  <div className="text-xs font-medium text-stone-500 dark:text-slate-400">
                    Chưa trả lời
                  </div>
                </div>
              </div>

              {breakdown.wrongCount + breakdown.unansweredCount > 0 && (
                <p className="text-xs text-stone-500 dark:text-slate-400">
                  Toàn bộ{' '}
                  <strong>{breakdown.wrongCount + breakdown.unansweredCount} câu chưa đúng</strong>{' '}
                  đã được tự động đưa vào <strong>Sổ tay câu sai</strong> để bạn ôn tập lại.
                </p>
              )}

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setPhase('setup')}
                  className="inline-flex items-center gap-2 rounded-xl bg-rose-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-rose-800"
                >
                  <RotateCcw className="h-4 w-4" />
                  Thi đề mới
                </button>
                {breakdown.wrongCount + breakdown.unansweredCount > 0 && (
                  <button
                    type="button"
                    onClick={onGoToWrongReview}
                    className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-amber-700"
                  >
                    <BookOpen className="h-4 w-4" />
                    Vào Sổ tay câu sai
                  </button>
                )}
                <button
                  type="button"
                  onClick={onGoToDashboard}
                  className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  Về Tổng quan
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Breakdown by Chapter & Section */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* By Chapter */}
          <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <div className="mb-4 flex items-center gap-2 text-base font-bold text-stone-900 dark:text-white">
              <BarChart3 className="h-5 w-5 text-rose-700 dark:text-rose-400" />
              <span>Tỷ lệ đúng theo từng Chương</span>
            </div>
            <div className="space-y-4">
              {breakdown.chapterStats.map((c) => {
                const barColor =
                  c.percent >= 80
                    ? 'bg-emerald-500'
                    : c.percent >= 50
                      ? 'bg-amber-500'
                      : 'bg-rose-500';
                return (
                  <div key={c.chapter}>
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-stone-800 dark:text-slate-200">
                        Chương {c.chapter}
                      </span>
                      <span className="text-stone-600 dark:text-slate-300">
                        {c.correct}/{c.total} câu ({c.percent}%)
                      </span>
                    </div>
                    <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-stone-100 dark:bg-slate-800">
                      <div
                        className={`h-full rounded-full transition-all ${barColor}`}
                        style={{ width: `${c.percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* By Section (Knowledge Gaps) */}
          <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-base font-bold text-stone-900 dark:text-white">
                Chi tiết theo từng Mục kiến thức
              </span>
              <span className="text-xs text-stone-500 dark:text-slate-400">
                Phát hiện phần hổng
              </span>
            </div>
            <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
              {breakdown.sectionStats.map((s) => {
                const isWeak = s.percent < 70;
                return (
                  <div
                    key={`${s.chapter}-${s.sectionId}`}
                    className="rounded-2xl border border-stone-100 bg-stone-50/70 p-3 dark:border-slate-800 dark:bg-slate-800/40"
                  >
                    <div className="flex items-start justify-between gap-2 text-xs">
                      <div className="font-semibold text-stone-800 dark:text-slate-200">
                        <span className="mr-1.5 font-bold text-rose-700 dark:text-rose-400">
                          {s.sectionId}
                        </span>
                        {s.sectionTitle}
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        {isWeak && (
                          <span className="rounded-md bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                            Cần ôn
                          </span>
                        )}
                        <span className="font-bold text-stone-700 dark:text-slate-200">
                          {s.correct}/{s.total} ({s.percent}%)
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-stone-200 dark:bg-slate-700">
                      <div
                        className={`h-full rounded-full ${isWeak ? 'bg-rose-500' : 'bg-emerald-500'}`}
                        style={{ width: `${s.percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Detailed Question Review with Wrong Filter */}
        <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-academic text-xl font-bold text-stone-900 dark:text-white">
              Xem lại đáp án & Giải thích chi tiết
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {[
                {
                  id: 'wrong',
                  label: `Các câu làm sai (${breakdown.wrongCount + breakdown.unansweredCount})`,
                },
                { id: 'all', label: `Tất cả (${breakdown.total})` },
                { id: 'correct', label: `Làm đúng (${breakdown.correctCount})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setReviewFilter(tab.id)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                    reviewFilter === tab.id
                      ? 'bg-rose-700 text-white'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {reviewItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-emerald-300 bg-emerald-50/50 py-10 text-center text-sm font-semibold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-300">
              Không có câu hỏi nào trong bộ lọc này!
            </div>
          ) : (
            <div className="space-y-5">
              {reviewItems.map(({ q, idx, chosen, isAnswered, isCorrect }) => {
                const isBookmarked = bookmarks.includes(q.id);
                return (
                  <div
                    key={q.id}
                    className={`rounded-2xl border p-4 sm:p-5 ${
                      isCorrect
                        ? 'border-emerald-200/80 bg-emerald-50/20 dark:border-emerald-900/50 dark:bg-emerald-950/10'
                        : 'border-rose-200/80 bg-rose-50/20 dark:border-rose-900/50 dark:bg-rose-950/10'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                        <span
                          className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 ${
                            isCorrect
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}
                        >
                          {isCorrect ? (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5" />
                          )}
                          Câu {idx + 1}:{' '}
                          {isCorrect ? 'Đúng' : isAnswered ? 'Sai' : 'Chưa trả lời'}
                        </span>
                        <span className="text-stone-500 dark:text-slate-400">
                          Chương {q.chapter} • Mục {q.sectionId}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => onToggleBookmark(q.id)}
                        className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold transition ${
                          isBookmarked
                            ? 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        <Bookmark className={`h-3.5 w-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
                        {isBookmarked ? 'Đã lưu' : 'Lưu Sổ tay'}
                      </button>
                    </div>

                    <p className="mt-3 text-sm font-bold text-stone-900 dark:text-white sm:text-base">
                      {q.question}
                    </p>

                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {q.options.map((opt, optIdx) => {
                        const isRightOpt = optIdx === q.correctIndex;
                        const isUserOpt = optIdx === chosen;
                        let cls =
                          'border-stone-200 bg-white/80 text-stone-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300';
                        if (isRightOpt) {
                          cls =
                            'border-emerald-500 bg-emerald-50 font-semibold text-emerald-900 dark:border-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-200';
                        } else if (isUserOpt && !isRightOpt) {
                          cls =
                            'border-rose-500 bg-rose-50 font-semibold text-rose-900 dark:border-rose-600 dark:bg-rose-950/50 dark:text-rose-200';
                        }
                        return (
                          <div
                            key={optIdx}
                            className={`flex items-start gap-2 rounded-xl border px-3 py-2 text-xs leading-relaxed sm:text-sm ${cls}`}
                          >
                            <span className="font-bold">{OPTION_LABELS[optIdx]}.</span>
                            <span className="flex-1">{opt}</span>
                          </div>
                        );
                      })}
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
          )}
        </div>
      </div>
    );
  }

  return null;
}
