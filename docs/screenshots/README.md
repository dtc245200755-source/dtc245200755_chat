# Danh Sách & Hướng Dẫn Chụp Ảnh Minh Chứng (Screenshots) — Đề 32

Thư mục này dùng để lưu trữ các hình ảnh chụp màn hình minh chứng kết quả triển khai phục vụ báo cáo môn học và bảo vệ đồ án.

---

## Danh Sách Ảnh Cần Chụp Theo Tiêu Chuẩn Đánh Giá

| STT | Tên file ảnh gợi ý | Nội dung cần thể hiện trong ảnh | Tiêu chí đạt |
|---|---|---|---|
| **1** | `01-docker-compose-ps.png` | Cửa sổ PowerShell chạy lệnh `docker compose ps` hoặc giao diện Docker Desktop | Hiển thị đủ 11 container ở trạng thái `Up (healthy)` hoặc `Up` |
| **2** | `02-nginx-https-browser.png` | Trình duyệt truy cập `https://localhost:8443` | Biểu tượng ổ khóa HTTPS, thông tin chứng chỉ SSL tự ký của Nginx |
| **3** | `03-chat-login-register.png` | Giao diện đăng nhập và đăng ký (`/login.html`) | Giao diện pastel pink hiện đại, các tab chuyển đổi và ô nhập liệu |
| **4** | `04-chat-realtime-demo.png` | Hai cửa sổ trình duyệt song song (ví dụ: hai tài khoản thành viên) đang nhắn tin realtime | Tin nhắn xuất hiện ngay lập tức giữa 2 bên, có avatar, tên và timestamp |
| **5** | `05-database-pgadmin.png` | Giao diện pgAdmin 4 hiển thị bảng `messages` và `users` | Thấy rõ các cột dữ liệu, password được băm bằng bcrypt, tin nhắn đã lưu |
| **6** | `06-prometheus-targets.png` | Giao diện Prometheus tại menu `Status > Targets` (`:9092/targets`) | Cả 5 scrape jobs (`prometheus`, `chat-app`, `postgres-exporter`, `cadvisor`, `node-exporter`) đều có trạng thái **UP (Xanh)** |
| **7** | `07-prometheus-alerts.png` | Giao diện Prometheus tại menu `Alerts` (`:9092/alerts`) | Các quy tắc cảnh báo (Alert Rules) được nạp thành công ở trạng thái `0 active` |
| **8** | `08-grafana-dashboard.png` | Bảng điều khiển Grafana "Bảng Giám Sát Chat System — Đề 32" | Đầy đủ các biểu đồ: Sockets hoạt động, tổng tin nhắn, RPS, Latency P95, RAM Node.js |
| **9** | `09-grafana-loki-explore.png` | Giao diện Grafana Explore truy vấn LogQL `{compose_service="chat-app"}` | Luồng log có cấu trúc JSON của Winston hiển thị rõ ràng trên Loki |
| **10** | `10-security-hardening.png` | Kết quả lệnh kiểm tra non-root user `docker compose exec chat-app id` | Hiển thị `uid=1000(node) gid=1000(node)` xác nhận không chạy quyền root |
