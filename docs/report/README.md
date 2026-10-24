# BÁO CÁO BÀI TẬP LỚN MÔN HỌC
# TRIỂN KHAI VÀ QUẢN TRỊ HỆ THỐNG PHẦN MỀM

---

## TRANG BÌA (THEO MẪU QUY CHUẨN CỦA TRƯỜNG)

```text
               BỘ GIÁO DỤC VÀ ĐÀO TẠO
         TRƯỜNG ĐẠI HỌC Công nghệ thông tin và truyền thông
             KHOA CÔNG NGHỆ THÔNG TIN
                   ---------------***---------------
                   
                   
                   
                   
                   
                   BÁO CÁO BÀI TẬP LỚN
        MÔN: TRIỂN KHAI VÀ QUẢN TRỊ HỆ THỐNG PHẦN MỀM
        
    ĐỀ TÀI: ĐỀ 32 — XÂY DỰNG VÀ QUẢN TRỊ HỆ THỐNG CHAT/MESSAGING 
           NỘI BỘ THỜI GIAN THỰC TRÊN DOCKER COMPOSE, 
          KẾT HỢP GIÁM SÁT PROMETHEUS VÀ GHI LOG LOKI
          
          
          
          
          
    Giảng viên hướng dẫn : Vũ Văn Diện
    Sinh viên thực hiện  : Đỗ Thùy Trang
    Mã số sinh viên      : DTC245200755
    Lớp                  : CNTTK23M
    Hệ đào tạo           : Chính quy
    Năm học              : 2025 - 2026
    
    
    
                        [ĐỊA DANH], NĂM 2026
```

---

## MỤC LỤC CHI TIẾT DÀN Ý BÁO CÁO (TỐI THIỂU 10 TRANG)

- **LỜI CẢM ƠN & LỜI CAM ĐOAN**
- **DANH MỤC CÁC KÝ HIỆU, TỪ VIẾT TẮT**
- **DANH MỤC HÌNH VẼ VÀ BẢNG BIỂU**

---

### CHƯƠNG 1: TỔNG QUAN ĐỀ TÀI VÀ YÊU CẦU BÀI TOÁN (Trang 1 - 2)
1.1. Bối cảnh và lý do chọn đề tài  
- Tầm quan trọng của hệ thống trao đổi thông tin nội bộ an toàn trong doanh nghiệp.  
- Thách thức về tính sẵn sàng cao, hiệu năng thời gian thực và quản trị vận hành tự động.  
1.2. Mục tiêu nghiên cứu và triển khai  
- Xây dựng ứng dụng Chat/Messaging hoàn chỉnh hỗ trợ WebSockets.  
- Đóng gói và điều phối toàn bộ hạ tầng bằng Docker Compose.  
- Tích hợp hệ thống Reverse Proxy Nginx có mã hóa HTTPS/TLS.  
- Thiết lập giải pháp giám sát đa tầng (Metrics) với Prometheus và Grafana.  
- Xây dựng hệ thống quản lý log tập trung (Centralized Logging) bằng Grafana Loki và Promtail.  
- Áp dụng các tiêu chuẩn an ninh hệ thống và làm cứng container (Security Hardening).  
1.3. Yêu cầu chức năng và phi chức năng của Đề 32  
- Yêu cầu chức năng: Đăng ký, đăng nhập, quản lý phòng chat, tham gia/rời phòng, gửi/nhận tin nhắn realtime, lưu trữ và xem lịch sử chat.  
- Yêu cầu phi chức năng: Độ trễ thấp (<100ms), bảo mật mật khẩu (Bcrypt), phân tách mạng Docker, ghi log có cấu trúc.

---

### CHƯƠNG 2: KIẾN TRÚC HỆ THỐNG VÀ THIẾT KẾ CƠ SỞ DỮ LIỆU (Trang 3 - 4)
2.1. Kiến trúc phân tầng hệ thống (Multi-tier Architecture)  
- Tầng Cổng vào (Reverse Proxy Layer): Nginx TLS Termination.  
- Tầng Xử lý nghiệp vụ (Application Layer): Node.js/Express và Socket.IO Server.  
- Tầng Lưu trữ dữ liệu (Database Layer): PostgreSQL 16 và giao diện quản trị pgAdmin 4.  
- Tầng Quan sát và Quản trị (Observability & Administration Layer): Prometheus, Grafana, Loki, cAdvisor, Node Exporter, Postgres Exporter.  
2.2. Thiết kế mạng nội bộ và cô lập dịch vụ (Network Segmentation)  
- Phân tích 4 mạng Docker: `frontend-net`, `backend-net`, `monitoring-net`, `logging-net`.  
2.3. Thiết kế Cơ sở dữ liệu quan hệ (PostgreSQL)  
- Lược đồ cơ sở dữ liệu: Các bảng `users`, `rooms`, `room_members`, `messages`, `schema_migrations`.  
- Các ràng buộc toàn vẹn: Khóa chính, khóa ngoại, unique constraint trên username và room_members.  
- Chiến lược đánh chỉ mục (Index Optimization): Index composite `(room_id, created_at DESC)` cho truy vấn lịch sử tin nhắn.  
2.4. Quy trình quản lý Migration và Seed Data an toàn  

---

### CHƯƠNG 3: TRIỂN KHAI ỨNG DỤNG VÀ REVERSE PROXY NGXIN (Trang 5 - 6)
3.1. Phát triển Backend Node.js & Socket.IO  
- Kiến trúc module hóa: `auth`, `users`, `rooms`, `messages`.  
- Cơ chế xác thực Token JWT trên cả REST API và WebSocket Handshake.  
- Xử lý các sự kiện realtime: `room:join`, `room:leave`, `chat:message`, `typing:start/stop`.  
3.2. Thiết kế Giao diện người dùng thuần (Vanilla HTML/CSS/JS)  
- Thiết kế giao diện hiện đại theo phong cách Pastel Pink / Light Mode (hồng pastel, trắng, điểm nhấn hồng đậm).
- Tối ưu hóa trải nghiệm người dùng: Thông báo trạng thái kết nối, đếm ký tự, cuộn tự động.  
3.3. Đóng gói Container và tối ưu hóa Dockerfile  
- Sử dụng base image `node:20-alpine` gọn nhẹ.  
- Quản lý vòng đời tiến trình bằng `dumb-init`.  
- Chạy ứng dụng dưới quyền người dùng không đặc quyền (`USER node`).  
3.4. Cấu hình Reverse Proxy Nginx & Chứng chỉ số HTTPS  
- Cơ chế nâng cấp kết nối (WebSocket Upgrade) với các header `Upgrade` và `Connection`.  
- Cấu hình Timeout phù hợp cho kết nối Socket lâu dài (`proxy_read_timeout 86400s`).  
- Tạo và nạp chứng chỉ SSL/TLS tự ký phục vụ mã hóa lưu lượng mạng nội bộ.  
- Thiết lập các tiêu đề an ninh HTTP (Security Headers) tại tầng Nginx.

---

### CHƯƠNG 4: GIÁM SÁT HỆ THỐNG VÀ QUẢN LÝ LOG TẬP TRUNG (Trang 7 - 8)
4.1. Hệ thống giám sát số liệu (Metrics) với Prometheus  
- Thu thập số liệu ứng dụng qua `prom-client`: Requests/sec, Latency Histogram, Active Sockets.  
- Thu thập số liệu cơ sở dữ liệu qua `postgres-exporter`.  
- Thu thập số liệu tài nguyên container qua `cadvisor` và host OS qua `node-exporter`.  
- Cấu hình các quy tắc cảnh báo (Alerting Rules): Phát hiện dịch vụ sập, lỗi HTTP 5xx cao, trễ phản hồi.  
4.2. Xây dựng Bảng điều khiển Grafana  
- Tự động nạp (Provisioning) Datasource và Dashboards.  
- Trực quan hóa các chỉ số quan trọng: Tần suất gửi tin nhắn, phân bố mã phản hồi HTTP, dung lượng bộ nhớ Heap V8.  
4.3. Hệ thống ghi log tập trung với Loki & Promtail  
- Nguyên lý hoạt động của Grafana Loki so sánh với ELK Stack.  
- Cơ chế thu thập log từ Docker daemon qua Promtail Docker Service Discovery.  
- Thiết kế nhãn (Labels) với độ phân tán thấp (`compose_service`, `container_name`).  
- Kỹ thuật khử thông tin nhạy cảm (Sanitization) trước khi xuất log.  
4.4. Phân tích sự cố bằng ngôn ngữ truy vấn LogQL  
- Các mẫu truy vấn lọc lỗi, theo dõi sự kiện đăng nhập và thống kê sự kiện theo thời gian.

---

### CHƯƠNG 5: LÀM CỨNG HỆ THỐNG VÀ KẾT QUẢ KIỂM THỬ (Trang 9 - 10)
5.1. Triển khai các biện pháp làm cứng hệ thống (Security Hardening)  
- Phân tích chi tiết 12 biện pháp bảo mật từ tầng Container, Network, Application đến Logging.  
- Đánh giá việc loại bỏ đặc quyền root, chặn leo thang đặc quyền `no-new-privileges`, giới hạn tài nguyên.  
5.2. Kịch bản và kết quả kiểm thử thực tế  
- Kiểm thử chức năng nghiệp vụ chat (Đăng nhập, tạo phòng, chat 2 chiều realtime).  
- Kiểm thử tải và độ trễ WebSocket.  
- Kiểm thử chuyển hướng HTTP sang HTTPS và bảo mật API.  
- Kiểm thử khả năng phục hồi của Database khi khởi động lại container (Persistent Volume).  
- Kiểm tra tính đúng đắn của các mục tiêu scrape trên Prometheus và log trên Loki.  
5.3. Bảng tổng hợp kết quả nghiệm thu (PASS / FAIL)  

---

### KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN (Trang 11)
- **Những kết quả đã đạt được:** Hoàn thành 100% các yêu cầu của Đề 32; hệ thống hoạt động ổn định, có tài liệu và script kiểm chứng rõ ràng.  
- **Những hạn chế hiện tại:** Chứng chỉ SSL là tự ký; phân cụm Socket.IO chưa sử dụng Redis Adapter phân tán; Promtail đang trong giai đoạn chuyển dịch sang Grafana Alloy.  
- **Hướng phát triển tương lai:** Tích hợp chứng chỉ Let's Encrypt tự động (Certbot); mở rộng quy mô Backend đa container qua Docker Swarm/Kubernetes; bổ sung tính năng gọi video WebRTC.

---

## PHỤ LỤC A: KẾT QUẢ RÀ SOÁT AN NINH & KIỂM THỬ THỰC TẾ

Phụ lục này ghi nhận kết quả rà soát code (code review) và kiểm thử thực tế đã thực hiện,
dùng làm minh chứng cho Chương 5 của báo cáo.

### A.1. Các lỗi phát hiện và biện pháp khắc phục

| Mức độ | Lỗi phát hiện | File | Khắc phục |
|---|---|---|---|
| Critical | Lỗ hổng IDOR / leo thang đặc quyền: người dùng thường có thể thêm/gỡ thành viên khác qua tham số `userId` | `backend/src/modules/rooms/rooms.controller.js` | Chỉ `admin` được ghi đè `userId`; người thường bị chặn 403 |
| Critical | Bỏ qua kiểm tra quyền khi gửi tin nhắn qua Socket.IO (gửi vào phòng riêng không phải thành viên) | `backend/src/socket/index.js` | Kiểm tra phòng tồn tại + tư cách thành viên trước khi lưu |
| High | Rò rỉ `err.message`/`stack` ra client ở chế độ production | `backend/src/middleware/errorHandler.js` | Trả về `Internal Server Error` chung cho lỗi 5xx |
| High | Mật khẩu DB / JWT secret mặc định hardcode | `backend/src/config/index.js`, `docker-compose.yml`, `.env.example` | Bỏ giá trị mặc định, yêu cầu bắt buộc qua `.env` (`:?`) |
| High | CORS mở `origin: true` và Socket.IO `origin: '*'` | `backend/src/app.js`, `backend/src/server.js` | Allow-list theo `CORS_ORIGIN` |
| Medium | Cardinality nhãn Prometheus không giới hạn (`req.path`) | `backend/src/metrics/index.js` | Dùng `req.route.path` hoặc `unmatched` |
| Medium | Cổng quản trị (Prometheus/Grafana/pgAdmin) mở ra mọi interface | `docker-compose.yml` | Bind `127.0.0.1` |
| Medium | Grafana tắt sanitize HTML | `docker-compose.yml` | Bỏ `GF_PANELS_DISABLE_SANITIZE_HTML` |
| Medium | `express` 4.19.2 có CVE (body-parser DoS) | `backend/package-lock.json` | `npm audit fix` → express 4.22.3 |

### A.2. Kết quả kiểm thử thực tế

| Kiểm thử | Kết quả |
|---|---|
| Unit tests (`npm test`) | 18/18 PASS |
| `npm audit` | 0 lỗ hổng |
| `docker compose config -q` | hợp lệ |
| `nginx -t` | cú pháp đúng |
| `/health` qua HTTPS | 200 (app + DB UP) |
| Đăng nhập member / admin | 200 |
| IDOR (member thêm user khác) | 403 (đã chặn) |
| Gửi tin nhắn REST | 201 |
| Liệt kê phòng / thành viên | 200 |
| `docker compose ps` | 11/11 container UP, các service chính healthy |

> **Ghi chú:** MSSV, họ tên sinh viên và ảnh chụp màn hình thực tế cần được điền/chèn trước khi
> nộp (xem các placeholder `[...]` ở trang bìa và `docs/screenshots/`).

---

## TÀI LIỆU THAM KHẢO
1. Docker Documentation: *Docker Compose file specification and multi-stage builds*, 2024.
2. Prometheus Authors: *Prometheus Best Practices and Alerting Rules*, 2024.
3. Grafana Labs: *Grafana Loki and Promtail Configuration Guide*, 2024.
4. OWASP Foundation: *Node.js and Docker Security Cheat Sheet*, 2024.
5. Socket.IO Official Documentation: *Using Socket.IO with Nginx and Reverse Proxies*, 2024.
