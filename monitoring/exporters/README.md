# Hướng Dẫn Các Exporters Giám Sát — Đề 32

Hệ thống tích hợp 3 exporter tiêu chuẩn trong hệ sinh thái Cloud Native / Prometheus để thu thập số liệu toàn diện từ 3 tầng: Cơ sở dữ liệu, Container và Host OS.

---

## 1. Danh Sách Exporters

| Exporter | Tầng giám sát | Cổng nội bộ | Endpoint | Mục đích |
|---|---|---|---|---|
| **postgres-exporter** | Database | `9187` | `/metrics` | Trạng thái PostgreSQL, số lượng connection, transaction commit/rollback, cache hit ratio. |
| **cadvisor** | Container | `8080` | `/metrics` | CPU, RAM, Network I/O và Disk I/O của từng container Docker trong hệ thống. |
| **node-exporter** | Host OS | `9100` | `/metrics` | CPU, Memory, Disk Space, Network throughput của máy chủ/host. |

---

## 2. Lưu Ý Về Môi Trường Windows / Docker Desktop

- **cAdvisor**: Trên Docker Desktop (WSL2), cAdvisor thu thập metrics thông qua việc mount `/var/run/docker.sock` và `/sys`.
- **Node Exporter**: Thu thập metrics của WSL2 Linux kernel bên dưới Docker Desktop.
- **postgres-exporter**: Kết nối với `postgres:5432` qua Docker network `monitoring-net` bằng biến môi trường `DATA_SOURCE_NAME`.

---

## 3. Cách Kiểm Tra Hoạt Động (Status > Targets)

1. Mở giao diện Prometheus tại: `http://localhost:9092/targets` (hoặc cổng được cấu hình trong `.env`).
2. Kiểm tra các mục sau đều ở trạng thái **UP (Xanh)**:
   - `chat-app` (1/1 up)
   - `postgres-exporter` (1/1 up)
   - `cadvisor` (1/1 up)
   - `node-exporter` (1/1 up)
