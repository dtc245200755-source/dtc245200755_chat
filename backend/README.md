# Backend — Hệ Thống Internal Chat & Messaging

Thư mục chứa toàn bộ mã nguồn máy chủ (Backend), Socket.IO Real-time Server, REST API và kết nối Cơ sở dữ liệu PostgreSQL.

## 1. Cấu Trúc Thư Mục Backend

```text
backend/
├── src/
│   ├── config/              # Xác thực và đọc biến môi trường
│   ├── db/                  # PostgreSQL Connection Pool & Truy vấn SQL
│   ├── middleware/          # JWT Auth, Rate Limiter, Error Handler
│   ├── modules/
│   │   ├── auth/            # Đăng ký, đăng nhập, bcrypt hashing, JWT issuance
│   │   ├── users/           # Danh sách người dùng, hồ sơ cá nhân
│   │   ├── rooms/           # Quản lý kênh/phòng chat, tham gia/rời phòng
│   │   └── messages/        # Gửi tin nhắn, lưu DB, truy xuất lịch sử
│   ├── routes/              # Centralized API Routes (/api/*)
│   ├── socket/              # Socket.IO Real-time WebSocket Handler
│   ├── metrics/             # prom-client Prometheus Metrics (/metrics)
│   ├── logger/              # Winston JSON Logger
│   ├── app.js               # Cấu hình Express App
│   └── server.js            # Khởi tạo HTTP Server & Socket.IO
├── tests/                   # Automated Unit Tests
├── Dockerfile               # Multi-stage production Docker build
├── package.json
└── README.md
```

## 2. API Endpoints

- **Auth:**
  - `POST /api/auth/register` — Đăng ký tài khoản mới
  - `POST /api/auth/login` — Đăng nhập, nhận JWT Token
  - `POST /api/auth/logout` — Đăng xuất
  - `GET /api/auth/me` — Lấy thông tin tài khoản hiện tại
- **Users:**
  - `GET /api/users` — Danh sách tất cả thành viên trong hệ thống
  - `GET /api/users/:id` — Chi tiết hồ sơ thành viên
- **Rooms (Kênh chat):**
  - `GET /api/rooms` — Danh sách các kênh/phòng chat
  - `POST /api/rooms` — Tạo kênh/phòng chat mới
  - `GET /api/rooms/:id/messages` — Lấy lịch sử tin nhắn của kênh
- **Giám sát & Sức khỏe:**
  - `GET /health` — Healthcheck endpoint
  - `GET /metrics` — Prometheus metrics endpoint

## 3. Cách Khởi Chạy Backend Độc Lập

```bash
cd backend
npm install
npm run dev   # Chạy chế độ development tự reload với node --watch
# hoặc
npm start     # Chạy production
```
