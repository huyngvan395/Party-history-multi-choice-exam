export const OPTION_LABELS = ['A', 'B', 'C', 'D'];

/**
 * Thuật toán Fisher-Yates chuẩn (không làm biến đổi mảng gốc).
 */
export function fisherYatesShuffle(items) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Xáo trộn 4 đáp án A/B/C/D bằng Fisher-Yates và cập nhật chính xác correctIndex mới.
 */
export function shuffleQuestionOptions(question) {
  const indexed = question.options.map((text, idx) => ({
    text,
    isCorrect: idx === question.correctIndex,
  }));
  const shuffled = fisherYatesShuffle(indexed);
  const newCorrectIndex = shuffled.findIndex((item) => item.isCorrect);

  return {
    ...question,
    options: shuffled.map((item) => item.text),
    correctIndex: newCorrectIndex,
  };
}

/**
 * Chuẩn bị danh sách câu hỏi cho phiên luyện tập hoặc thi thử.
 */
export function prepareQuizQuestions(
  sourceQuestions,
  { shuffleQuestions = false, shuffleOptions = false, limit = null } = {}
) {
  let result = shuffleQuestions
    ? fisherYatesShuffle(sourceQuestions)
    : [...sourceQuestions];

  if (limit && limit > 0 && result.length > limit) {
    result = result.slice(0, limit);
  }

  if (shuffleOptions) {
    result = result.map(shuffleQuestionOptions);
  }

  return result;
}

/**
 * Chấm điểm thang 10 và thống kê tỷ lệ % làm đúng theo từng chương & từng mục nhỏ.
 */
export function computeExamBreakdown(questions, answersMap) {
  const total = questions.length;
  let correctCount = 0;
  let wrongCount = 0;
  let unansweredCount = 0;

  const chapterMap = new Map();
  const sectionMap = new Map();

  for (const q of questions) {
    const chosen = answersMap[q.id];
    const isAnswered = chosen !== undefined && chosen !== null;
    const isCorrect = isAnswered && chosen === q.correctIndex;

    if (!isAnswered) {
      unansweredCount += 1;
    } else if (isCorrect) {
      correctCount += 1;
    } else {
      wrongCount += 1;
    }

    if (!chapterMap.has(q.chapter)) {
      chapterMap.set(q.chapter, {
        chapter: q.chapter,
        chapterTitle: q.chapterTitle,
        total: 0,
        correct: 0,
      });
    }
    const cStat = chapterMap.get(q.chapter);
    cStat.total += 1;
    if (isCorrect) cStat.correct += 1;

    const secKey = `${q.chapter}::${q.sectionId}`;
    if (!sectionMap.has(secKey)) {
      sectionMap.set(secKey, {
        chapter: q.chapter,
        sectionId: q.sectionId,
        sectionTitle: q.sectionTitle,
        total: 0,
        correct: 0,
      });
    }
    const sStat = sectionMap.get(secKey);
    sStat.total += 1;
    if (isCorrect) sStat.correct += 1;
  }

  const score10 = total > 0 ? Number(((correctCount / total) * 10).toFixed(2)) : 0;
  const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;

  const chapterStats = Array.from(chapterMap.values())
    .sort((a, b) => a.chapter - b.chapter)
    .map((c) => ({
      ...c,
      percent: c.total > 0 ? Math.round((c.correct / c.total) * 100) : 0,
    }));

  const sectionStats = Array.from(sectionMap.values())
    .sort((a, b) =>
      a.chapter !== b.chapter
        ? a.chapter - b.chapter
        : a.sectionId.localeCompare(b.sectionId, undefined, { numeric: true })
    )
    .map((s) => ({
      ...s,
      percent: s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0,
    }));

  return {
    total,
    correctCount,
    wrongCount,
    unansweredCount,
    score10,
    accuracy,
    chapterStats,
    sectionStats,
  };
}

export function formatCountdown(totalSeconds) {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function formatDuration(totalSeconds) {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  if (mins === 0) return `${secs} giây`;
  if (secs === 0) return `${mins} phút`;
  return `${mins} phút ${secs} giây`;
}

export function formatDateTime(isoString) {
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(isoString));
  } catch {
    return isoString;
  }
}

export function getScoreRating(score10) {
  if (score10 >= 9) return { label: 'Xuất sắc', color: 'text-emerald-600 dark:text-emerald-400' };
  if (score10 >= 8) return { label: 'Giỏi', color: 'text-teal-600 dark:text-teal-400' };
  if (score10 >= 6.5) return { label: 'Khá', color: 'text-sky-600 dark:text-sky-400' };
  if (score10 >= 5) return { label: 'Trung bình', color: 'text-amber-600 dark:text-amber-400' };
  return { label: 'Cần ôn tập thêm', color: 'text-rose-600 dark:text-rose-400' };
}
