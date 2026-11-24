import chuong1 from './chuong1.json';
import chuong2 from './chuong2.json';
import chuong3 from './chuong3.json';

export const CHAPTER_INFO = [
  {
    chapter: 1,
    shortTitle: 'Chương 1 (1930 - 1945)',
    title:
      'Chương 1: Đảng Cộng sản Việt Nam ra đời và lãnh đạo đấu tranh giành chính quyền (1930 - 1945)',
    period: '1930 - 1945',
    accent: 'rose',
  },
  {
    chapter: 2,
    shortTitle: 'Chương 2 (1945 - 1975)',
    title:
      'Chương 2: Đảng lãnh đạo hai cuộc kháng chiến, hoàn thành giải phóng dân tộc, thống nhất đất nước (1945 - 1975)',
    period: '1945 - 1975',
    accent: 'amber',
  },
  {
    chapter: 3,
    shortTitle: 'Chương 3 (1975 - nay)',
    title:
      'Chương 3: Đảng lãnh đạo cả nước quá độ lên chủ nghĩa xã hội và tiến hành công cuộc đổi mới (1975 - nay)',
    period: '1975 - nay',
    accent: 'emerald',
  },
];

export const DIFFICULTY_META = {
  'nhan-biet': {
    label: 'Nhận biết',
    badgeClass:
      'bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800/70',
  },
  'thong-hieu': {
    label: 'Thông hiểu',
    badgeClass:
      'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/70',
  },
  'van-dung': {
    label: 'Vận dụng',
    badgeClass:
      'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800/70',
  },
};

export const questionsByChapter = {
  1: chuong1,
  2: chuong2,
  3: chuong3,
};

export const allQuestions = [...chuong1, ...chuong2, ...chuong3];

export const questionMap = new Map(allQuestions.map((q) => [q.id, q]));

/**
 * Tự động nhóm câu hỏi theo cây Chapter -> Section (sectionId).
 * Hoạt động linh hoạt bất kể sau này nạp thêm bao nhiêu câu hỏi ở Giai đoạn 3.
 */
export function buildChapterTree(questions = allQuestions) {
  const byChapter = new Map();

  for (const info of CHAPTER_INFO) {
    byChapter.set(info.chapter, {
      ...info,
      totalCount: 0,
      sections: new Map(),
    });
  }

  for (const q of questions) {
    if (!byChapter.has(q.chapter)) {
      byChapter.set(q.chapter, {
        chapter: q.chapter,
        shortTitle: `Chương ${q.chapter}`,
        title: q.chapterTitle || `Chương ${q.chapter}`,
        period: '',
        accent: 'rose',
        totalCount: 0,
        sections: new Map(),
      });
    }

    const chapNode = byChapter.get(q.chapter);
    chapNode.totalCount += 1;

    if (!chapNode.sections.has(q.sectionId)) {
      chapNode.sections.set(q.sectionId, {
        sectionId: q.sectionId,
        sectionTitle: q.sectionTitle,
        chapter: q.chapter,
        questions: [],
      });
    }
    chapNode.sections.get(q.sectionId).questions.push(q);
  }

  return Array.from(byChapter.values())
    .sort((a, b) => a.chapter - b.chapter)
    .map((chap) => ({
      ...chap,
      sections: Array.from(chap.sections.values()).sort((a, b) =>
        a.sectionId.localeCompare(b.sectionId, undefined, { numeric: true })
      ),
    }));
}

export { chuong1, chuong2, chuong3 };
export default allQuestions;
