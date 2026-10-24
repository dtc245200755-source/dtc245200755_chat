# Hướng Dẫn Chứng Chỉ SSL/TLS Tự Ký Cho Nginx — Đề 32

Thư mục này dùng để chứa file chứng chỉ (`chat.crt`) và khóa riêng tư (`chat.key`) phục vụ cho HTTPS demo trên môi trường cục bộ.

> **Quy định an toàn thông tin:** Khóa riêng tư (`*.key`) và chứng chỉ (`*.crt`) đã được đưa vào `.gitignore` để **không bao giờ commit private key lên GitHub**.

---

## 1. Tạo Chứng Chỉ Tự Ký Bằng OpenSSL

Chạy lệnh sau trong PowerShell (sử dụng OpenSSL của Git hoặc hệ thống):

```powershell
& "C:\Program Files\Git\usr\bin\openssl.exe" req -x509 -nodes -days 365 -newkey rsa:2048 `
  -keyout "nginx/certs/chat.key" `
  -out "nginx/certs/chat.crt" `
  -subj "/C=VN/ST=Hanoi/L=Hanoi/O=MSSV-De32/OU=IT/CN=localhost"
```

Hoặc sử dụng script tự động đã chuẩn bị sẵn:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\generate-certs.ps1
```

---

## 2. Xử Lý Cảnh Báo Trình Duyệt Khi Dùng Chứng Chỉ Tự Ký

Do chứng chỉ tự ký (Self-signed Certificate) không được cấp bởi cơ quan thẩm quyền (CA) thương mại, trình duyệt sẽ hiển thị cảnh báo bảo mật:
- **Google Chrome / Microsoft Edge:** Nhấp **Nâng cao (Advanced)** -> Chọn **Tiếp tục truy cập localhost (không an toàn)**. (Hoặc gõ phím `thisisunsafe` trên cửa sổ cảnh báo).
- **Mozilla Firefox:** Nhấp **Nâng cao (Advanced)** -> Chọn **Chấp nhận rủi ro và tiếp tục (Accept the Risk and Continue)**.
