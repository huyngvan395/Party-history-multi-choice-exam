# 🇻🇳 Ôn thi Trắc nghiệm Lịch sử Đảng Cộng sản Việt Nam

[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=111827)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)

---

## 📖 Giới thiệu dự án

**Lịch sử Đảng CSVN — Hệ thống luyện thi trắc nghiệm thông minh** là ứng dụng web chạy 100% phía client (Client-Side SPA), được xây dựng nhằm hỗ trợ sinh viên ôn luyện, ghi nhớ sâu mốc thời gian, văn kiện, hội nghị và đường lối của Đảng một cách khoa học và hiệu quả.

Ngân hàng gồm **268 câu hỏi trắc nghiệm chuẩn hóa theo phong cách đề thi đại học** bám sát 100% nội dung giáo trình qua **3 chương lớn**, kèm **giải thích lịch sử súc tích** cho từng câu:

- **Chương 1 (1930 – 1945):** Đảng Cộng sản Việt Nam ra đời và lãnh đạo đấu tranh giành chính quyền *(108 câu độc lập chuẩn hóa từ bộ đề mẫu — 7 mục chuyên đề)*.
- **Chương 2 (1945 – 1975):** Đảng lãnh đạo hai cuộc kháng chiến, hoàn thành giải phóng dân tộc, thống nhất đất nước *(80 câu — 7 mục chuyên đề, tỷ lệ độ khó 40/40/20)*.
- **Chương 3 (1975 – Nay):** Đảng lãnh đạo cả nước quá độ lên chủ nghĩa xã hội và tiến hành công cuộc đổi mới *(80 câu — 6 mục chuyên đề, tỷ lệ độ khó 40/40/20)*.

---

## ✨ Tính năng nổi bật

### 1. 📚 Luyện theo Chương & Mục (Học sâu)
- Tự động phân nhóm cây kiến thức theo **Chương → Mục nhỏ**, cho phép chọn toàn bộ 1 chương hoặc tick kết hợp nhiều mục nhỏ bất kỳ.
- Lọc câu hỏi theo mức độ nhận thức: **Tất cả**, **Nhận biết**, **Thông hiểu**, **Vận dụng**.
- Tùy chọn bật/tắt **xáo trộn thứ tự câu hỏi** và **xáo trộn 4 đáp án A/B/C/D** bằng thuật toán **Fisher-Yates** (tự động cập nhật chính xác `correctIndex`).
- Khóa câu ngay khi chọn đáp án, tô màu xanh/đỏ trực quan, mở ngay khung **Giải thích chi tiết** và hỗ trợ nút **Lưu vào Sổ tay ghi nhớ (Bookmark)**.

### 2. ⏱️ Luyện đề tổng hợp (Thi thử thực chiến)
- Cấu hình đề linh hoạt: chọn số lượng câu (**20 / 40 / 50 / 60 câu**), thời gian làm bài (**15 / 30 / 45 / 60 phút**) và phạm vi trộn đề (1 chương, 2 chương hoặc trộn ngẫu nhiên toàn bộ 3 chương).
- Phòng thi chuẩn thực chiến: **đồng hồ đếm ngược tự động nộp bài khi hết giờ**, **Bảng điều hướng câu hỏi (Question Palette)** hiển thị trạng thái *Chưa làm / Đã làm / Đặt cờ xem lại (Flag)*.
- Màn hình kết quả chi tiết: chấm điểm **thang 10**, phân tích biểu đồ **% làm đúng theo từng Chương và từng Mục** giúp phát hiện chính xác lỗ hổng kiến thức, hỗ trợ lọc xem riêng **Các câu làm sai** kèm giải thích chi tiết.

### 3. 🧠 Sổ tay câu sai, Sổ tay ghi nhớ & Dashboard
- Tự động gom toàn bộ câu trả lời sai (ở cả chế độ Luyện tập và Thi thử) vào **Sổ tay câu sai** lưu trên `localStorage`.
- Cơ chế ôn tập lặp lại thông minh: khi vào chế độ luyện lại câu sai và trả lời **đúng 2 lần liên tiếp**, hệ thống sẽ **tự động gỡ** câu hỏi đó khỏi danh sách sai.
- Màn hình **Dashboard** theo dõi tổng quan % hoàn thành từng chương, điểm trung bình thi thử, số câu cần ôn và lịch sử các lần thi gần đây.

### 4. 🎨 Trải nghiệm học tập tối ưu
- Giao diện học thuật hiện đại, dịu mắt khi ôn thi lâu, chuyển đổi mượt mà **Light Mode / Dark Mode**.
- Thiết kế **Responsive** tối ưu cho cả máy tính và điện thoại di động.
- Hỗ trợ **phím tắt bàn phím**: nhấn `1`, `2`, `3`, `4` hoặc `A`, `B`, `C`, `D` để chọn đáp án; phím mũi tên `←` / `→` để chuyển câu trước/sau.

---

## 🛠️ Công nghệ sử dụng

- **Frontend:** [React 19](https://react.dev/) + [Vite 6](https://vite.dev/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Lưu trữ tiến độ:** Browser `localStorage` (không cần backend/database)
- **Xử lý & Kiểm định dữ liệu:** Python Stdlib (`zipfile`, `xml.etree.ElementTree`) & Node.js Validator

---

## 📁 Cấu trúc thư mục

```text
LSD_multi-choice_exam/
├── docs/                           # Tài liệu gốc (.pptx), bản trích xuất (.md) & bộ đề mẫu
│   ├── extracted_c1.md             # Nội dung 116 slide Chương 1 đã giải mã TCVN3/VNI -> Unicode
│   ├── extracted_c2.md             # Nội dung 78 slide Chương 2
│   ├── extracted_c3.md             # Nội dung 112 slide Chương 3
│   └── ngan_hang_mau_c1.md         # Bộ câu hỏi mẫu chuẩn đề thi học phần Chương 1
├── scripts/
│   ├── extract_pptx.py             # Script trích xuất .pptx & tự động giải mã font TCVN3/VNI
│   └── validate_quiz.js            # Script kiểm định tự động 268 câu hỏi (JSON, trùng lặp, font)
├── src/
│   ├── components/
│   │   ├── Navbar.jsx              # Thanh điều hướng, Dark/Light Mode & cảnh báo rời phòng thi
│   │   ├── DashboardView.jsx       # Thống kê tiến độ từng chương, điểm TB & lịch sử thi thử
│   │   ├── PracticeView.jsx        # Chọn cây Chương/Mục, lọc độ khó & cấu hình xáo trộn
│   │   ├── PracticeSession.jsx     # Phiên luyện tập chuyên sâu (dùng chung cho Luyện sâu & Ôn sai)
│   │   ├── ExamView.jsx            # Cấu hình đề, phòng thi đếm ngược, Palette & phân tích kết quả
│   │   └── ReviewView.jsx          # Quản lý Sổ tay câu sai (quy tắc đúng 2 lần) & Sổ tay ghi nhớ
│   ├── data/
│   │   ├── chuong1.json            # 108 câu hỏi Chương 1 (1930 - 1945)
│   │   ├── chuong2.json            # 80 câu hỏi Chương 2 (1945 - 1975)
│   │   ├── chuong3.json            # 80 câu hỏi Chương 3 (1975 - nay)
│   │   └── index.js                # Export tổng hợp & hàm dựng cây Chương/Mục tự động
│   ├── hooks/
│   │   ├── useStudyProgress.js     # Quản lý tiến độ, Sổ tay câu sai, Bookmark & lịch sử localStorage
│   │   ├── useTheme.js             # Quản lý Light / Dark Mode
│   │   └── useKeyboardShortcuts.js # Phím tắt 1-4 / A-D và mũi tên ← / →
│   ├── utils/
│   │   └── quizUtils.js            # Thuật toán Fisher-Yates, chấm điểm thang 10 & thống kê lỗ hổng
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── package.json
└── vite.config.js
```

---

## 🚀 Hướng dẫn chạy Local & Deploy Vercel

### Yêu cầu môi trường
- Node.js phiên bản `18+` (khuyến nghị LTS hoặc mới hơn).

### Cài đặt và chạy ứng dụng

```bash
# 1. Cài đặt các thư viện phụ thuộc
npm install

# 2. Chạy server phát triển (mặc định tại http://localhost:5173)
npm run dev

# 3. Kiểm định toàn vẹn 268 câu hỏi trong ngân hàng dữ liệu
node scripts/validate_quiz.js

# 4. Đóng gói bản Production
npm run build

# 5. Xem trước bản build Production
npm run preview
```

### Deploy nhanh lên Vercel
1. Import repository GitHub vào [Vercel](https://vercel.com/new).
2. Vercel sẽ tự động nhận diện framework **Vite** với cấu hình mặc định:
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Nhấn **Deploy** — ứng dụng chạy hoàn toàn phía client, không cần cấu hình biến môi trường.
