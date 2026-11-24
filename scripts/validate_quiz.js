#!/usr/bin/env node
/**
 * Automated QA validator for the LSD Multi-Choice Question Bank:
 *   - src/data/chuong1.json (80 questions)
 *   - src/data/chuong2.json (80 questions)
 *   - src/data/chuong3.json (80 questions)
 * Total: 240 questions.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const REQUIRED_FIELDS = [
  'id',
  'chapter',
  'chapterTitle',
  'sectionId',
  'sectionTitle',
  'difficulty',
  'question',
  'options',
  'correctIndex',
  'explanation',
];

const VALID_DIFFICULTIES = new Set(['nhan-biet', 'thong-hieu', 'van-dung']);

const EXPECTED_SECTIONS = {
  1: { '1.1.1': 14, '1.1.2': 12, '1.1.3': 14, '1.1.4': 6, '1.2.1': 12, '1.2.2': 8, '1.2.3': 14 },
  2: { '2.1.1': 16, '2.1.2': 12, '2.1.3': 14, '2.1.4': 6, '2.2.1': 14, '2.2.2': 12, '2.2.3': 6 },
  3: { '3.1': 14, '3.2': 12, '3.3': 14, '3.4': 14, '3.5': 12, '3.6': 14 },
};

const FORBIDDEN_OPTION_RE =
  /(tất cả đều đúng|tất cả các đáp án|tất cả phương án|cả [a-d] và [a-d]|cả hai đều đúng|cả 3 đáp án)/i;

// Legacy TCVN3 / VNI font corruption markers
const GARBLED_CHARS_RE =
  /[§®µ¶·¸¹»¼½¾ÆÇËÎÏÐÑÖØÜÞßäåæçëîïñöøûüþª«¬\u00ad¨¡¢£¤¥¦]/;
const MIDWORD_TCVN3_UPPER_RE = /[a-zà-ỹ][ÊÓÔÕÌÍÒÚÝ][a-zà-ỹ]/;

function normalizeQuestionText(str) {
  return String(str || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function main() {
  const globalIds = new Set();
  const globalQuestions = new Map();
  const errors = [];
  let grandTotal = 0;

  console.log('=== KIỂM ĐỊNH NGÂN HÀNG CÂU HỎI LỊCH SỬ ĐẢNG CSVN ===\n');

  for (const chap of [1, 2, 3]) {
    const filePath = path.join(ROOT, 'src', 'data', `chuong${chap}.json`);
    let items;
    try {
      const raw = fs.readFileSync(filePath, 'utf8');
      items = JSON.parse(raw);
    } catch (err) {
      errors.push(`[chuong${chap}.json] Lỗi đọc/cú pháp JSON: ${err.message}`);
      continue;
    }

    if (!Array.isArray(items)) {
      errors.push(`[chuong${chap}.json] Dữ liệu gốc không phải mảng JSON.`);
      continue;
    }

    if (items.length !== 80) {
      errors.push(`[chuong${chap}.json] Kỳ vọng 80 câu, thực tế có ${items.length} câu.`);
    }

    grandTotal += items.length;
    const secCounts = {};
    const diffCounts = { 'nhan-biet': 0, 'thong-hieu': 0, 'van-dung': 0 };
    const idxCounts = [0, 0, 0, 0];

    for (let i = 0; i < items.length; i += 1) {
      const q = items[i];
      const tag = `chuong${chap}.json[${i}] (${q?.id || 'NO_ID'})`;

      // 1. Required fields
      for (const field of REQUIRED_FIELDS) {
        if (!(field in q)) {
          errors.push(`${tag}: Thiếu trường "${field}".`);
        }
      }

      // 2. Duplicate ID
      if (typeof q.id !== 'string' || !q.id.trim()) {
        errors.push(`${tag}: Trường "id" rỗng hoặc không hợp lệ.`);
      } else if (globalIds.has(q.id)) {
        errors.push(`${tag}: Trùng lặp id "${q.id}".`);
      } else {
        globalIds.add(q.id);
      }

      // 3. Chapter match
      if (q.chapter !== chap) {
        errors.push(`${tag}: chapter=${q.chapter} không khớp file chuong${chap}.json.`);
      }

      // 4. Difficulty
      if (!VALID_DIFFICULTIES.has(q.difficulty)) {
        errors.push(`${tag}: difficulty="${q.difficulty}" không hợp lệ.`);
      } else {
        diffCounts[q.difficulty] += 1;
      }

      // 5. Section count
      secCounts[q.sectionId] = (secCounts[q.sectionId] || 0) + 1;

      // 6. Duplicate question text
      const normQ = normalizeQuestionText(q.question);
      if (!normQ) {
        errors.push(`${tag}: Nội dung question bị rỗng.`);
      } else if (globalQuestions.has(normQ)) {
        errors.push(`${tag}: Trùng nội dung câu hỏi với ${globalQuestions.get(normQ)}.`);
      } else {
        globalQuestions.set(normQ, q.id);
      }

      // 7. Options & correctIndex
      if (!Array.isArray(q.options) || q.options.length !== 4) {
        errors.push(`${tag}: Mảng options phải có đúng 4 phần tử.`);
      } else {
        const optNormSet = new Set();
        q.options.forEach((opt, oIdx) => {
          if (typeof opt !== 'string' || !opt.trim()) {
            errors.push(`${tag}: Đáp án [${oIdx}] bị rỗng.`);
          } else {
            const normOpt = opt.trim().toLowerCase();
            if (optNormSet.has(normOpt)) {
              errors.push(`${tag}: Trùng lặp nội dung đáp án trong cùng câu hỏi.`);
            }
            optNormSet.add(normOpt);

            if (FORBIDDEN_OPTION_RE.test(opt)) {
              errors.push(`${tag}: Đáp án [${oIdx}] chứa cụm từ bị cấm: "${opt}".`);
            }
          }
        });
      }

      if (!Number.isInteger(q.correctIndex) || q.correctIndex < 0 || q.correctIndex > 3) {
        errors.push(`${tag}: correctIndex=${q.correctIndex} không thuộc 0..3.`);
      } else {
        idxCounts[q.correctIndex] += 1;
      }

      // 8. Explanation
      if (typeof q.explanation !== 'string' || q.explanation.trim().length < 20) {
        errors.push(`${tag}: explanation quá ngắn hoặc bị thiếu.`);
      }

      // 9. Encoding / TCVN3 / VNI check across all text fields
      const textFields = [
        ['chapterTitle', q.chapterTitle],
        ['sectionTitle', q.sectionTitle],
        ['question', q.question],
        ['explanation', q.explanation],
        ...(Array.isArray(q.options) ? q.options.map((o, idx) => [`options[${idx}]`, o]) : []),
      ];

      for (const [fname, val] of textFields) {
        if (typeof val !== 'string') continue;
        if (GARBLED_CHARS_RE.test(val) || MIDWORD_TCVN3_UPPER_RE.test(val)) {
          errors.push(`${tag}: Phát hiện ký tự nghi lỗi font TCVN3/VNI tại ${fname}: "${val.slice(0, 80)}"`);
        }
      }
    }

    // Check section quotas
    const expected = EXPECTED_SECTIONS[chap];
    for (const [secId, expCount] of Object.entries(expected)) {
      if ((secCounts[secId] || 0) !== expCount) {
        errors.push(
          `[chuong${chap}.json] Mục ${secId}: kỳ vọng ${expCount} câu, thực tế ${secCounts[secId] || 0}.`
        );
      }
    }
    for (const secId of Object.keys(secCounts)) {
      if (!(secId in expected)) {
        errors.push(`[chuong${chap}.json] Phát sinh mục ngoài đặc tả: ${secId}.`);
      }
    }

    // Check difficulty quotas (40% / 40% / 20% = 32 / 32 / 16)
    if (
      diffCounts['nhan-biet'] !== 32 ||
      diffCounts['thong-hieu'] !== 32 ||
      diffCounts['van-dung'] !== 16
    ) {
      errors.push(
        `[chuong${chap}.json] Sai tỷ lệ độ khó (cần 32/32/16), thực tế: ${JSON.stringify(diffCounts)}.`
      );
    }

    console.log(
      `✔ Chương ${chap}: ${items.length} câu | Độ khó (NB/TH/VD): ${diffCounts['nhan-biet']}/${diffCounts['thong-hieu']}/${diffCounts['van-dung']} | Đáp án (A/B/C/D): ${idxCounts.join('/')}`
    );
    console.log(`  Phân bổ mục: ${JSON.stringify(secCounts)}`);
  }

  console.log(`\nTổng số câu hỏi toàn hệ thống: ${grandTotal} / 240`);

  if (grandTotal !== 240) {
    errors.push(`Tổng số câu phải bằng 240, thực tế là ${grandTotal}.`);
  }

  if (errors.length > 0) {
    console.error(`\n✖ PHÁT HIỆN ${errors.length} LỖI:`);
    errors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }

  console.log('\n✅ TẤT CẢ 240 CÂU HỎI ĐẠT CHUẨN 100% — 0 LỖI!');
}

main();
