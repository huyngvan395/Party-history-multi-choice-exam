import React, { useCallback, useMemo, useState } from 'react';
import Navbar from './components/Navbar';
import DashboardView from './components/DashboardView';
import PracticeView from './components/PracticeView';
import ExamView from './components/ExamView';
import ReviewView from './components/ReviewView';
import { useStudyProgress } from './hooks/useStudyProgress';
import { useTheme } from './hooks/useTheme';
import { allQuestions } from './data';

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const {
    progress,
    recordPracticeAnswer,
    recordExamSubmission,
    toggleBookmark,
    removeWrongQuestion,
    deleteExamHistoryItem,
    resetAllProgress,
  } = useStudyProgress();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [reviewSubTab, setReviewSubTab] = useState('wrong');
  const [practiceQuickChapter, setPracticeQuickChapter] = useState(null);
  const [examInProgress, setExamInProgress] = useState(false);

  const wrongCount = useMemo(() => {
    const validIds = new Set(allQuestions.map((q) => q.id));
    return Object.keys(progress.wrongBank).filter((id) => validIds.has(id)).length;
  }, [progress.wrongBank]);

  const handleNavigate = useCallback((tab, sub = null) => {
    setActiveTab(tab);
    if (tab === 'review' && sub) {
      setReviewSubTab(sub);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleStartQuickChapter = useCallback((chapterNum) => {
    setPracticeQuickChapter(chapterNum);
    setActiveTab('practice');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const clearQuickChapter = useCallback(() => {
    setPracticeQuickChapter(null);
  }, []);

  return (
    <div className="min-h-screen bg-[#faf8f5] text-stone-900 transition-colors dark:bg-[#0c0f17] dark:text-slate-100">
      <Navbar
        activeTab={activeTab}
        onChangeTab={(tab) => handleNavigate(tab)}
        theme={theme}
        onToggleTheme={toggleTheme}
        wrongCount={wrongCount}
        examInProgress={examInProgress}
      />

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {activeTab === 'dashboard' && (
          <DashboardView
            progress={progress}
            onNavigate={handleNavigate}
            onStartQuickChapter={handleStartQuickChapter}
            onDeleteExamHistory={deleteExamHistoryItem}
            onResetAllProgress={resetAllProgress}
          />
        )}

        {activeTab === 'practice' && (
          <PracticeView
            initialChapter={practiceQuickChapter}
            onClearInitialChapter={clearQuickChapter}
            progress={progress}
            onToggleBookmark={toggleBookmark}
            onRecordPracticeAnswer={recordPracticeAnswer}
          />
        )}

        {activeTab === 'exam' && (
          <ExamView
            bookmarks={progress.bookmarks}
            onToggleBookmark={toggleBookmark}
            onSubmitExamRecord={recordExamSubmission}
            onExamStatusChange={setExamInProgress}
            onGoToWrongReview={() => handleNavigate('review', 'wrong')}
            onGoToDashboard={() => handleNavigate('dashboard')}
          />
        )}

        {activeTab === 'review' && (
          <ReviewView
            initialSubTab={reviewSubTab}
            progress={progress}
            onToggleBookmark={toggleBookmark}
            onRecordPracticeAnswer={recordPracticeAnswer}
            onRemoveWrongQuestion={removeWrongQuestion}
          />
        )}
      </main>

      <footer className="mt-8 border-t border-stone-200/80 py-6 text-center text-xs text-stone-500 dark:border-slate-800/80 dark:text-slate-500">
        <div className="mx-auto max-w-6xl px-4">
          Hệ thống luyện thi trắc nghiệm Lịch sử Đảng Cộng sản Việt Nam • Dữ liệu tiến độ lưu tự
          động trên trình duyệt (localStorage)
        </div>
      </footer>
    </div>
  );
}
