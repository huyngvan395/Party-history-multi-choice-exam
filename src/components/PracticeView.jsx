import React, { useEffect, useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Play,
  Shuffle,
  SlidersHorizontal,
  CheckSquare,
  Square,
  MinusSquare,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { allQuestions, buildChapterTree, DIFFICULTY_META } from '../data';
import { prepareQuizQuestions } from '../utils/quizUtils';
import PracticeSession from './PracticeSession';

const DIFFICULTY_OPTIONS = [
  { id: 'all', label: 'Tất cả mức độ' },
  { id: 'nhan-biet', label: DIFFICULTY_META['nhan-biet'].label },
  { id: 'thong-hieu', label: DIFFICULTY_META['thong-hieu'].label },
  { id: 'van-dung', label: DIFFICULTY_META['van-dung'].label },
];

export default function PracticeView({
  initialChapter = null,
  onClearInitialChapter,
  progress,
  onToggleBookmark,
  onRecordPracticeAnswer,
}) {
  const chapterTree = useMemo(() => buildChapterTree(allQuestions), []);

  // All section keys formatted as "chapter::sectionId"
  const allSectionKeys = useMemo(() => {
    const keys = [];
    for (const chap of chapterTree) {
      for (const sec of chap.sections) {
        keys.push(`${chap.chapter}::${sec.sectionId}`);
      }
    }
    return keys;
  }, [chapterTree]);

  const [selectedSections, setSelectedSections] = useState(() => new Set(allSectionKeys));
  const [expandedChapters, setExpandedChapters] = useState(
    () => new Set(chapterTree.map((c) => c.chapter))
  );
  const [difficulty, setDifficulty] = useState('all');
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [shuffleOptions, setShuffleOptions] = useState(true);

  const [activeSession, setActiveSession] = useState(null);

  // If navigated from Dashboard "Luyện nhanh chương X", pre-select only that chapter
  useEffect(() => {
    if (initialChapter !== null) {
      const targetChap = chapterTree.find((c) => c.chapter === initialChapter);
      if (targetChap) {
        setSelectedSections(
          new Set(targetChap.sections.map((s) => `${targetChap.chapter}::${s.sectionId}`))
        );
        setExpandedChapters(new Set([initialChapter]));
      }
      if (onClearInitialChapter) onClearInitialChapter();
    }
  }, [initialChapter, chapterTree, onClearInitialChapter]);

  const filteredQuestions = useMemo(() => {
    return allQuestions.filter((q) => {
      const key = `${q.chapter}::${q.sectionId}`;
      if (!selectedSections.has(key)) return false;
      if (difficulty !== 'all' && q.difficulty !== difficulty) return false;
      return true;
    });
  }, [selectedSections, difficulty]);

  const toggleExpand = (chapterNum) => {
    setExpandedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(chapterNum)) next.delete(chapterNum);
      else next.add(chapterNum);
      return next;
    });
  };

  const toggleChapter = (chap) => {
    const chapKeys = chap.sections.map((s) => `${chap.chapter}::${s.sectionId}`);
    const allSelected = chapKeys.every((k) => selectedSections.has(k));
    setSelectedSections((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        chapKeys.forEach((k) => next.delete(k));
      } else {
        chapKeys.forEach((k) => next.add(k));
      }
      return next;
    });
  };

  const toggleSection = (secKey) => {
    setSelectedSections((prev) => {
      const next = new Set(prev);
      if (next.has(secKey)) next.delete(secKey);
      else next.add(secKey);
      return next;
    });
  };

  const selectAll = () => setSelectedSections(new Set(allSectionKeys));
  const clearAll = () => setSelectedSections(new Set());

  const handleStart = () => {
    if (!filteredQuestions.length) return;
    const prepared = prepareQuizQuestions(filteredQuestions, {
      shuffleQuestions,
      shuffleOptions,
    });
    const selectedChaps = Array.from(new Set(filteredQuestions.map((q) => q.chapter))).sort(
      (a, b) => a - b
    );
    const subtitle = `Phạm vi: Chương ${selectedChaps.join(', ')} • ${
      DIFFICULTY_OPTIONS.find((d) => d.id === difficulty)?.label
    }`;
    setActiveSession({
      id: Date.now(),
      questions: prepared,
      subtitle,
    });
  };

  if (activeSession) {
    return (
      <PracticeSession
        key={activeSession.id}
        title="Luyện tập theo Chương & Mục (Học sâu)"
        subtitle={activeSession.subtitle}
        questions={activeSession.questions}
        isWrongReview={false}
        wrongBank={progress.wrongBank}
        bookmarks={progress.bookmarks}
        onToggleBookmark={onToggleBookmark}
        onRecordAnswer={onRecordPracticeAnswer}
        onExit={() => setActiveSession(null)}
        onRestartWithQuestions={(retryQuestions) =>
          setActiveSession({
            id: Date.now(),
            questions: retryQuestions,
            subtitle: 'Luyện lại các câu vừa làm sai trong phiên trước',
          })
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-academic text-2xl font-bold text-stone-900 dark:text-white">
                Luyện theo Chương & theo Mục
              </h1>
              <p className="mt-1 text-sm text-stone-500 dark:text-slate-400">
                Chọn 1 chương trọn vẹn hoặc kết hợp nhiều mục nhỏ bất kỳ. Xem ngay đáp án và giải
                thích chi tiết sau mỗi câu để hiểu sâu bản chất lịch sử.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={selectAll}
              className="rounded-xl border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Chọn tất cả
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="rounded-xl border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Bỏ chọn
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left: Chapter -> Section Tree */}
        <div className="space-y-4 lg:col-span-8">
          {chapterTree.map((chap) => {
            const chapKeys = chap.sections.map((s) => `${chap.chapter}::${s.sectionId}`);
            const selectedInChap = chapKeys.filter((k) => selectedSections.has(k)).length;
            const isAllChecked = chapKeys.length > 0 && selectedInChap === chapKeys.length;
            const isIndeterminate = selectedInChap > 0 && selectedInChap < chapKeys.length;
            const isExpanded = expandedChapters.has(chap.chapter);

            const ChapCheckIcon = isAllChecked
              ? CheckSquare
              : isIndeterminate
                ? MinusSquare
                : Square;

            return (
              <div
                key={chap.chapter}
                className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900"
              >
                {/* Chapter Header */}
                <div className="flex items-center gap-3 bg-stone-50/70 px-4 py-3.5 dark:bg-slate-800/50">
                  <button
                    type="button"
                    onClick={() => toggleChapter(chap)}
                    className="shrink-0 text-rose-700 transition hover:scale-105 dark:text-rose-400"
                    aria-label={`Chọn toàn bộ Chương ${chap.chapter}`}
                  >
                    <ChapCheckIcon className="h-5 w-5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleExpand(chap.chapter)}
                    className="flex flex-1 items-center justify-between gap-2 text-left"
                  >
                    <div>
                      <div className="text-sm font-bold text-stone-900 dark:text-white sm:text-base">
                        {chap.title}
                      </div>
                      <div className="mt-0.5 text-xs text-stone-500 dark:text-slate-400">
                        {chap.sections.length} mục nhỏ • {chap.totalCount} câu hỏi (đã chọn{' '}
                        {selectedInChap}/{chap.sections.length} mục)
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 shrink-0 text-stone-400" />
                    ) : (
                      <ChevronRight className="h-5 w-5 shrink-0 text-stone-400" />
                    )}
                  </button>
                </div>

                {/* Section List */}
                {isExpanded && (
                  <div className="divide-y divide-stone-100 dark:divide-slate-800/80">
                    {chap.sections.map((sec) => {
                      const secKey = `${chap.chapter}::${sec.sectionId}`;
                      const checked = selectedSections.has(secKey);
                      const matchingInSec =
                        difficulty === 'all'
                          ? sec.questions.length
                          : sec.questions.filter((q) => q.difficulty === difficulty).length;

                      return (
                        <label
                          key={secKey}
                          className={`flex cursor-pointer items-center justify-between gap-3 px-4 py-3 pl-11 transition ${
                            checked
                              ? 'bg-rose-50/40 dark:bg-rose-950/15'
                              : 'hover:bg-stone-50 dark:hover:bg-slate-800/40'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleSection(secKey)}
                              className="mt-1 h-4 w-4 rounded border-stone-300 text-rose-700 focus:ring-rose-500 dark:border-slate-600 dark:bg-slate-800"
                            />
                            <div>
                              <span className="mr-2 inline-block rounded-md bg-stone-100 px-1.5 py-0.5 text-xs font-bold text-stone-700 dark:bg-slate-800 dark:text-slate-300">
                                {sec.sectionId}
                              </span>
                              <span className="text-sm font-medium text-stone-800 dark:text-slate-200">
                                {sec.sectionTitle}
                              </span>
                            </div>
                          </div>

                          <span className="shrink-0 rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-semibold text-stone-600 dark:bg-slate-800 dark:text-slate-300">
                            {matchingInSec} câu
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right: Practice Options Panel */}
        <div className="lg:col-span-4">
          <div className="sticky top-24 space-y-5 rounded-3xl border border-stone-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2 text-base font-bold text-stone-900 dark:text-white">
              <SlidersHorizontal className="h-5 w-5 text-rose-700 dark:text-rose-400" />
              <span>Tùy chọn phiên học</span>
            </div>

            {/* Difficulty Filter */}
            <div>
              <label className="text-xs font-bold tracking-wider text-stone-500 uppercase dark:text-slate-400">
                Lọc theo mức độ
              </label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {DIFFICULTY_OPTIONS.map((opt) => {
                  const active = difficulty === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setDifficulty(opt.id)}
                      className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                        active
                          ? 'border-rose-700 bg-rose-700 text-white shadow-xs dark:border-rose-600 dark:bg-rose-600'
                          : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Shuffle Toggles */}
            <div className="space-y-3 border-t border-stone-100 pt-4 dark:border-slate-800">
              <label className="flex cursor-pointer items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Shuffle className="h-4 w-4 text-stone-400" />
                  <div>
                    <div className="text-sm font-semibold text-stone-800 dark:text-slate-200">
                      Xáo trộn thứ tự câu hỏi
                    </div>
                    <div className="text-xs text-stone-500 dark:text-slate-400">
                      Tránh học vẹt theo vị trí
                    </div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={shuffleQuestions}
                  onChange={(e) => setShuffleQuestions(e.target.checked)}
                  className="h-5 w-5 rounded border-stone-300 accent-rose-700"
                />
              </label>

              <label className="flex cursor-pointer items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="h-4 w-4 text-stone-400" />
                  <div>
                    <div className="text-sm font-semibold text-stone-800 dark:text-slate-200">
                      Xáo trộn đáp án A / B / C / D
                    </div>
                    <div className="text-xs text-stone-500 dark:text-slate-400">
                      Fisher-Yates chuẩn xác
                    </div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={shuffleOptions}
                  onChange={(e) => setShuffleOptions(e.target.checked)}
                  className="h-5 w-5 rounded border-stone-300 accent-rose-700"
                />
              </label>
            </div>

            {/* Summary & Start */}
            <div className="rounded-2xl bg-stone-50 p-4 dark:bg-slate-800/60">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-medium text-stone-500 dark:text-slate-400">
                  Số câu phù hợp
                </span>
                <span className="text-2xl font-extrabold text-rose-700 dark:text-rose-400">
                  {filteredQuestions.length}{' '}
                  <span className="text-sm font-semibold text-stone-500 dark:text-slate-400">
                    câu
                  </span>
                </span>
              </div>

              <button
                type="button"
                disabled={filteredQuestions.length === 0}
                onClick={handleStart}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-rose-700 px-5 py-3 text-sm font-bold text-white shadow-sm shadow-rose-900/20 transition hover:bg-rose-800 disabled:cursor-not-allowed disabled:opacity-45"
              >
                <Play className="h-4 w-4 fill-current" />
                Bắt đầu luyện tập ngay
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
