# Frontend — Hệ Thống Internal Chat

Thư mục chứa toàn bộ mã nguồn giao diện người dùng (Frontend) được tách biệt hoàn toàn với Backend.

## 1. Cấu Trúc Thư Mục Frontend

```text
frontend/
├── index.html            # Giao diện Chat chính
├── login.html            # Giao diện Đăng nhập & Đăng ký tài khoản
├── css/
│   └── style.css         # Hệ thống thiết kế CSS (Design System): pastel pink, Nav Rail, Sidebar, Chat Panel
├── js/
│   ├── api.js            # Tầng giao tiếp REST API (Fetch API, JWT Storage)
│   ├── socket.js         # Tầng kết nối Socket.IO thời gian thực (WebSocket)
│   ├── chat.js           # Điều khiển giao diện Chat, Channels, Users, Mentions, Emoji
│   └── auth.js           # Xử lý đăng nhập và đăng ký tài khoản
├── assets/
│   └── avatars/          # Vector SVG avatar mặc định: default.svg
└── README.md
```

## 2. Đặc Điểm Giao Diện

- **Cột 1: Thanh điều hướng rút gọn (Nav Rail 64px):**
  - Biểu tượng logo tin nhắn (3 chấm).
  - Tab Chat đang hoạt động (nền hồng bo góc).
  - Các icon điều hướng: Đội nhóm/Thành viên, Chuông thông báo, Cài đặt bánh răng.
  - Avatar người dùng hiện tại ở chân thanh điều hướng.
- **Cột 2: Thanh danh sách Kênh & Người dùng (Sidebar):**
  - Tiêu đề `INTERNAL CHAT` kèm nút đăng xuất.
  - Ô tìm kiếm kênh & người dùng: `Search channels & people...`.
  - Mục **Channels**: danh sách các kênh trò chuyện + nút tạo kênh mới.
  - Mục **Users**: danh sách thành viên kèm avatar và chấm trạng thái (online/busy/offline).
  - Khối hồ sơ người dùng hiện tại ở đáy sidebar.
- **Cột 3: Khung hội thoại chính (Main Chat Panel):**
  - Header: huy hiệu `#`, tên phòng và mô tả phòng, nhóm avatar chồng nhau kèm nhãn `Members online`.
  - Dòng hội thoại:
    - Tin nhắn đến (Incoming): nền hồng nhạt, avatar bên trái, tên người gửi + thời gian.
    - Tin nhắn đi (Outgoing): nền hồng đậm hơn, căn phải, hỗ trợ gắn thẻ `@tên người dùng` nổi bật.
  - Thanh nhập tin nhắn (Input Bar): ô nhập liệu `Nhập tin nhắn...`, nút `Send` kèm biểu tượng máy bay giấy, nút cảm xúc emoji, nút đính kèm và nút @mention.

## 3. Cách Chạy Độc Lập

Bạn có thể mở trực tiếp file `index.html` hoặc chạy qua bất kỳ static web server nào (Live Server trong VS Code, `npx serve`, hoặc qua Nginx).
Frontend tự động kết nối tới API `/api` và WebSocket `/socket.io`.

> **Lưu ý:** Trong môi trường Docker, thư mục được phục vụ thực tế là `backend/public/` (do Backend serve tĩnh). Hai bản sao `frontend/` và `backend/public/` cần được giữ đồng bộ.
