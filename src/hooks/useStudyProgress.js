import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'lsd_exam_progress_v1';

const DEFAULT_STATE = {
  completed: {}, // { [qId]: { attempts, correctCount, lastCorrect, lastAnsweredAt } }
  wrongBank: {}, // { [qId]: { wrongCount, consecutiveCorrect, addedAt, lastWrongAt } }
  bookmarks: [], // string[]
  examHistory: [], // Array of exam attempt summaries
};

function loadInitialProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);
    return {
      completed: parsed.completed && typeof parsed.completed === 'object' ? parsed.completed : {},
      wrongBank: parsed.wrongBank && typeof parsed.wrongBank === 'object' ? parsed.wrongBank : {},
      bookmarks: Array.isArray(parsed.bookmarks) ? parsed.bookmarks : [],
      examHistory: Array.isArray(parsed.examHistory) ? parsed.examHistory : [],
    };
  } catch {
    return DEFAULT_STATE;
  }
}

export function useStudyProgress() {
  const [progress, setProgress] = useState(loadInitialProgress);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      // Ignore quota errors gracefully
    }
  }, [progress]);

  /**
   * Ghi nhận 1 câu trả lời trong chế độ Luyện sâu hoặc Ôn câu sai.
   * Trong chế độ Ôn câu sai: trả lời đúng 2 lần liên tiếp sẽ tự động gỡ khỏi Sổ tay câu sai.
   */
  const recordPracticeAnswer = useCallback(
    (questionId, isCorrect, { isWrongReview = false } = {}) => {
      let masteredNow = false;
      let nextStreak = 0;

      setProgress((prev) => {
        const now = new Date().toISOString();
        const prevComp = prev.completed[questionId] || {
          attempts: 0,
          correctCount: 0,
          lastCorrect: false,
          lastAnsweredAt: now,
        };

        const nextCompleted = {
          ...prev.completed,
          [questionId]: {
            attempts: prevComp.attempts + 1,
            correctCount: prevComp.correctCount + (isCorrect ? 1 : 0),
            lastCorrect: isCorrect,
            lastAnsweredAt: now,
          },
        };

        const nextWrongBank = { ...prev.wrongBank };
        const existingWrong = nextWrongBank[questionId];

        if (!isCorrect) {
          nextWrongBank[questionId] = {
            wrongCount: (existingWrong?.wrongCount || 0) + 1,
            consecutiveCorrect: 0,
            addedAt: existingWrong?.addedAt || now,
            lastWrongAt: now,
          };
          nextStreak = 0;
        } else if (isWrongReview && existingWrong) {
          const updatedStreak = (existingWrong.consecutiveCorrect || 0) + 1;
          nextStreak = updatedStreak;
          if (updatedStreak >= 2) {
            delete nextWrongBank[questionId];
            masteredNow = true;
          } else {
            nextWrongBank[questionId] = {
              ...existingWrong,
              consecutiveCorrect: updatedStreak,
            };
          }
        }

        return {
          ...prev,
          completed: nextCompleted,
          wrongBank: nextWrongBank,
        };
      });

      return { masteredNow, nextStreak };
    },
    []
  );

  /**
   * Lưu kết quả 1 lượt Thi thử thực chiến, đồng thời cập nhật tiến độ & Sổ tay câu sai.
   */
  const recordExamSubmission = useCallback((examRecord, questions, answersMap) => {
    setProgress((prev) => {
      const now = new Date().toISOString();
      const nextCompleted = { ...prev.completed };
      const nextWrongBank = { ...prev.wrongBank };

      for (const q of questions) {
        const chosen = answersMap[q.id];
        const isAnswered = chosen !== undefined && chosen !== null;
        const isCorrect = isAnswered && chosen === q.correctIndex;

        const prevComp = nextCompleted[q.id] || {
          attempts: 0,
          correctCount: 0,
          lastCorrect: false,
          lastAnsweredAt: now,
        };

        if (isAnswered) {
          nextCompleted[q.id] = {
            attempts: prevComp.attempts + 1,
            correctCount: prevComp.correctCount + (isCorrect ? 1 : 0),
            lastCorrect: isCorrect,
            lastAnsweredAt: now,
          };
        }

        if (!isCorrect) {
          const existingWrong = nextWrongBank[q.id];
          nextWrongBank[q.id] = {
            wrongCount: (existingWrong?.wrongCount || 0) + 1,
            consecutiveCorrect: 0,
            addedAt: existingWrong?.addedAt || now,
            lastWrongAt: now,
          };
        }
      }

      const nextHistory = [examRecord, ...prev.examHistory].slice(0, 50);

      return {
        ...prev,
        completed: nextCompleted,
        wrongBank: nextWrongBank,
        examHistory: nextHistory,
      };
    });
  }, []);

  const toggleBookmark = useCallback((questionId) => {
    setProgress((prev) => {
      const exists = prev.bookmarks.includes(questionId);
      return {
        ...prev,
        bookmarks: exists
          ? prev.bookmarks.filter((id) => id !== questionId)
          : [questionId, ...prev.bookmarks],
      };
    });
  }, []);

  const removeWrongQuestion = useCallback((questionId) => {
    setProgress((prev) => {
      const nextWrongBank = { ...prev.wrongBank };
      delete nextWrongBank[questionId];
      return { ...prev, wrongBank: nextWrongBank };
    });
  }, []);

  const deleteExamHistoryItem = useCallback((examId) => {
    setProgress((prev) => ({
      ...prev,
      examHistory: prev.examHistory.filter((item) => item.id !== examId),
    }));
  }, []);

  const resetAllProgress = useCallback(() => {
    setProgress(DEFAULT_STATE);
  }, []);

  return {
    progress,
    recordPracticeAnswer,
    recordExamSubmission,
    toggleBookmark,
    removeWrongQuestion,
    deleteExamHistoryItem,
    resetAllProgress,
  };
}
