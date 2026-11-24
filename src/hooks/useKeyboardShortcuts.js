import { useEffect } from 'react';

const OPTION_KEY_MAP = {
  '1': 0,
  '2': 1,
  '3': 2,
  '4': 3,
  a: 0,
  b: 1,
  c: 2,
  d: 3,
};

/**
 * Phím tắt bàn phím cho cả Luyện tập & Thi thử:
 * - 1, 2, 3, 4 hoặc A, B, C, D: Chọn đáp án tương ứng
 * - ← / →: Chuyển câu trước / câu sau
 */
export function useQuizKeyboard({
  enabled = true,
  onSelectOption,
  onPrev,
  onNext,
}) {
  useEffect(() => {
    if (!enabled) return undefined;

    const handleKeyDown = (event) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const tag = event.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      const key = event.key.toLowerCase();

      if (key in OPTION_KEY_MAP && onSelectOption) {
        event.preventDefault();
        onSelectOption(OPTION_KEY_MAP[key]);
        return;
      }

      if (event.key === 'ArrowLeft' && onPrev) {
        event.preventDefault();
        onPrev();
      } else if (event.key === 'ArrowRight' && onNext) {
        event.preventDefault();
        onNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, onSelectOption, onPrev, onNext]);
}
