# Hướng Dẫn Truy Vấn LogQL Trên Grafana Explore — Đề 32

Tài liệu này cung cấp các truy vấn LogQL (Loki Query Language) chuẩn để phân tích log hệ thống Chat thu thập qua Promtail và Loki.

---

## Kết Quả Kiểm Chứng Thực Tế (Verified — đã chạy trên hệ thống đang hoạt động)

Ba truy vấn dưới đây đã được thực thi trực tiếp trên hệ thống đang chạy (qua Grafana datasource proxy → Loki) và trả về dữ liệu thật:

### VQ1 — Thống kê tổng số dòng log theo từng dịch vụ (metric aggregation)
```logql
sum by (compose_service) (count_over_time({compose_service=~".+"}[5m]))
```
*Kết quả thật (11 dịch vụ):* `cadvisor=75`, `chat-app=20`, `grafana=1175`, `loki=65`, `nginx=12`, `node-exporter=55`, `pgadmin=12`, `postgres=162`, `postgres-exporter=18`, `prometheus=20`, `promtail=15`.

### VQ2 — Lọc dòng log theo nội dung (line filter `|=`)
```logql
{compose_service="grafana"} |= "Request Completed"
```
*Kết quả thật:* trả về các dòng log `Request Completed` của Grafana (gồm `method`, `path`, `status`, `remote_addr`, `time_ms`), minh họa bộ lọc nội dung trên luồng log.

### VQ3 — Lấy log theo nhãn container (label selector)
```logql
{container_name="chat-nginx"}
```
*Kết quả thật:* trả về các dòng access log của Nginx (ví dụ `GET / 200`, `POST /api/auth/login 200`, `GET /health 200`).

> **Cách chạy lại:** mở Grafana → **Explore** → chọn datasource **Loki** → dán câu lệnh trên. Loki không mở cổng ra host (chỉ nằm trong mạng nội bộ `logging-net`), nên truy vấn qua Grafana proxy là cách truy cập chính thống.

---

## 1. Lưu Ý Về Nhãn (Labels) & Hiệu Năng
- Cấu hình Promtail sử dụng nhãn có **độ phân tán thấp (low cardinality)**:
  - `compose_service`: Tên dịch vụ Docker (`chat-app`, `postgres`, `nginx`, `prometheus`...).
  - `container_name`: Tên container.
  - `stream`: Luồng log (`stdout` hoặc `stderr`).
- Các thông tin như `user_id`, `message_id`, token tuyệt đối không được dùng làm index label trong Loki để tránh tràn bộ nhớ bộ chỉ mục (index index explosion). Thay vào đó, sử dụng bộ lọc văn bản `|=` hoặc parser JSON.

---

## 2. Danh Sách Truy Vấn LogQL Chuẩn

### Truy Vấn 1: Xem toàn bộ log của ứng dụng Chat
Truy vấn này lấy toàn bộ các bản ghi log phát sinh từ container ứng dụng chat theo thứ tự thời gian.

```logql
{compose_service="chat-app"}
```

*Giải thích:* Bộ chọn luồng `{compose_service="chat-app"}` lọc chính xác các log được gắn nhãn service của ứng dụng Node.js backend.

---

### Truy Vấn 2: Lọc các log lỗi và cảnh báo (Error & Warning)
Truy vấn lọc các dòng log chứa thông tin lỗi từ ứng dụng chat:

```logql
{compose_service="chat-app"} |~ "(?i)error|fail|exception"
```

Hoặc lọc theo format JSON của Winston:

```logql
{compose_service="chat-app"} | json | level="error"
```

*Giải thích:* Bộ lọc regex `|~ "(?i)error|fail"` không phân biệt chữ hoa/thường, giúp phát hiện nhanh các lỗi kết nối DB, lỗi xác thực token hoặc lỗi cú pháp request.

---

### Truy Vấn 3: Thống kê số lượng lượt đăng nhập theo thời gian (Metric Query)
Truy vấn thống kê số sự kiện đăng nhập (`login`) thành công hoặc thất bại trong khoảng cửa sổ trượt 5 phút:

```logql
sum by (compose_service) (count_over_time({compose_service="chat-app"} |= "login" [5m]))
```

*Giải thích:*
- `{compose_service="chat-app"} |= "login"`: Lọc các log liên quan đến hành động login.
- `count_over_time(... [5m])`: Đếm số dòng log xuất hiện trong cửa sổ thời gian 5 phút.
- `sum by (...)`: Tổng hợp lại thành dạng biểu đồ số liệu hiển thị trên Grafana.

---

### Truy Vấn 4: Phân tích log truy cập Nginx Reverse Proxy
Truy vấn lọc các request bị lỗi Client (4xx) hoặc Server (5xx) từ Nginx:

```logql
{compose_service="nginx"} |~ "HTTP/1\\.[01]\" [45][0-9]{2}"
```

---

## 3. Khuyến Nghị Về Promtail & Grafana Alloy

> **Ghi chú lộ trình công nghệ (Technology Roadmap):**
> - **Promtail** hiện đã bước vào giai đoạn bảo trì (maintenance mode) từ Grafana Labs. 
> - Đối với các dự án triển khai quy mô lớn hoặc dài hạn trong môi trường sản xuất (Production), Grafana Labs khuyến nghị chuyển đổi sang **Grafana Alloy** (OpenTelemetry-collector based agent) để thống nhất việc thu thập cả Metrics, Logs và Traces trong một agent duy nhất.
> - Trong phạm vi bài tập lớn Đề 32, Promtail vẫn là giải pháp tương thích tốt, nhẹ và phổ biến khi kết hợp cùng Docker Compose trên môi trường local.
