# Hướng Dẫn Triển Khai Hệ Thống (Deployment Guide) — Đề 32

Tài liệu hướng dẫn từng bước triển khai toàn bộ hệ thống Chat/Messaging trên môi trường **Windows 11 + PowerShell + Docker Desktop**.

---

## 1. Yêu Cầu Môi Trường (Prerequisites)

- **Hệ điều hành:** Windows 10/11 64-bit (hỗ trợ WSL2).
- **Docker Desktop:** Phiên bản 4.28+ (Docker Engine 26+, Docker Compose v2.20+).
- **PowerShell:** 5.1 hoặc PowerShell 7+.
- **Git for Windows:** Cung cấp lệnh `git` và công cụ OpenSSL (`C:\Program Files\Git\usr\bin\openssl.exe`).
- **RAM tối thiểu:** 8 GB (khuyến nghị 16 GB để chạy đồng thời 11 container ổn định).

---

## 2. Quy Trình Triển Khai Chi Tiết

### Bước 1: Chuẩn bị file biến môi trường (`.env`)

Sao chép file mẫu `.env.example` thành `.env`:

```powershell
Copy-Item .env.example .env
```

Mở file `.env` và kiểm tra cấu hình cổng host để đảm bảo không bị xung đột với các ứng dụng khác trên máy:
- `NGINX_HTTPS_PORT=8443`
- `NGINX_HTTP_PORT=8084`
- `GRAFANA_PORT=3003`
- `PROMETHEUS_PORT=9092`
- `PGADMIN_PORT=5052`

### Bước 2: Sinh chứng chỉ SSL/TLS tự ký cho Nginx

Chạy script tự động tạo chứng chỉ SSL vào thư mục `nginx/certs/`:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\generate-certs.ps1
```

### Bước 3: Kiểm tra tính hợp lệ của cấu hình

Chạy script kiểm tra cú pháp và biến môi trường:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\verify-config.ps1
```

Hoặc dùng lệnh của Docker:

```powershell
docker compose config
```

### Bước 4: Khởi động hệ thống bằng Docker Compose

Build và chạy toàn bộ 11 container ở chế độ background:

```powershell
docker compose up -d --build
```

### Bước 5: Kiểm tra trạng thái và Healthcheck

Chạy script kiểm tra sức khỏe hệ thống:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\health-check.ps1
```

Hoặc kiểm tra danh sách container:

```powershell
docker compose ps
```

### Bước 6: Khởi tạo Database & tạo tài khoản Admin chính thức

Chạy migration tạo schema (chỉ bảng/khóa/chỉ mục, **không có dữ liệu demo**):

```powershell
docker compose exec -T postgres psql -U postgres -d chat_db < database/migrations/001_init_schema.sql
```

Tạo tài khoản **Admin** do bạn chủ động khởi tạo (mật khẩu băm bcrypt, đọc từ `.env`):

```powershell
# 1. Điền ADMIN_USERNAME / ADMIN_EMAIL / ADMIN_PASSWORD vào file .env
# 2. Nạp biến mới cho container chat-app
docker compose up -d chat-app
# 3. Chạy script tạo Admin (idempotent — không ghi đè nếu đã tồn tại)
docker compose exec chat-app node src/scripts/create-admin.js
```

> Thành viên bình thường tự đăng ký qua giao diện; role của họ luôn là `member`
> (không thể tự nâng quyền Admin).

---

## 3. Danh Sách URL Truy Cập Các Dịch Vụ

| Dịch vụ | URL Truy Cập | Tài khoản / Mật khẩu | Ghi chú |
|---|---|---|---|
| **Ứng dụng Chat (HTTPS)** | [https://localhost:8443](https://localhost:8443) | Tài khoản Admin do bạn tạo + thành viên tự đăng ký | Trình duyệt cảnh báo chứng chỉ tự ký -> chọn "Tiếp tục truy cập" |
| **Ứng dụng Chat (HTTP)** | [http://localhost:8084](http://localhost:8084) | Tự động chuyển hướng sang HTTPS | Chuyển hướng 301 |
| **Bảng điều khiển Grafana** | [http://localhost:3003](http://localhost:3003) | `admin` / `<GRAFANA_ADMIN_PASSWORD trong .env>` | Đã nạp sẵn Dashboard "Bảng Giám Sát Chat System" |
| **Prometheus Web UI** | [http://localhost:9092](http://localhost:9092) | Không yêu cầu | Xem tại menu `Status > Targets` và `Alerts` |
| **pgAdmin 4** | [http://localhost:5052](http://localhost:5052) | `admin@example.com` / `<PGADMIN_DEFAULT_PASSWORD trong .env>` | Quản trị giao diện DB PostgreSQL |
| **Loki Log API** | `http://localhost:3100` | Nội bộ Docker network | Truy vấn qua Grafana Explore với datasource Loki |

---

## 4. Dừng Hệ Thống An Toàn

Dừng các container và bảo toàn dữ liệu trong named volumes:

```powershell
docker compose down
```

Nếu muốn xóa toàn bộ container và cả volumes dữ liệu (reset sạch):

```powershell
docker compose down -v
```

---

## 5. Xử Lý Sự Cố Thường Gặp (Troubleshooting)

1. **Lỗi cổng bị chiếm (Port is already allocated):**
   - Đổi giá trị cổng trong `.env` (ví dụ `NGINX_HTTPS_PORT=8444`).
   - Chạy lại `docker compose up -d`.
2. **PostgreSQL chưa sẵn sàng khi app khởi động:**
   - Docker Compose đã cấu hình `depends_on` với điều kiện `condition: service_healthy`. Nếu cần khởi động lại riêng app: `docker compose restart chat-app`.
3. **Nginx không khởi động được do thiếu file cert:**
   - Đảm bảo đã chạy `.\scripts\generate-certs.ps1` để sinh file `nginx/certs/chat.crt` và `nginx/certs/chat.key`.
