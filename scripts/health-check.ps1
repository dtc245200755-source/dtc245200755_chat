# Health Check Script for Chat System De 32
$ErrorActionPreference = "Continue"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  KIEM TRA SUC KHOE HE THONG (HEALTHCHECK) - DE 32" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# Doc cau hinh cong tu .env neu co
$httpsPort = 8443
$httpPort = 8084
$grafanaPort = 3003
$promPort = 9092
$pgadminPort = 5052

if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        if ($_ -match "^\s*NGINX_HTTPS_PORT\s*=\s*(\d+)") { $httpsPort = $matches[1] }
        if ($_ -match "^\s*NGINX_HTTP_PORT\s*=\s*(\d+)") { $httpPort = $matches[1] }
        if ($_ -match "^\s*GRAFANA_PORT\s*=\s*(\d+)") { $grafanaPort = $matches[1] }
        if ($_ -match "^\s*PROMETHEUS_PORT\s*=\s*(\d+)") { $promPort = $matches[1] }
        if ($_ -match "^\s*PGADMIN_PORT\s*=\s*(\d+)") { $pgadminPort = $matches[1] }
    }
}

# 1. Trang thai cac container qua Docker
Write-Host ""
Write-Host "[1/6] Trang thai cac Container trong Docker Compose:" -ForegroundColor Yellow
docker compose ps --format "table {{.Names}}`t{{.Status}}`t{{.Ports}}"

# 2. Kiem tra Nginx HTTPS
Write-Host ""
Write-Host "[2/6] Kiem tra Nginx Reverse Proxy (HTTPS :$httpsPort):" -ForegroundColor Yellow
try {
    [System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}
    $res = Invoke-WebRequest -Uri "https://localhost:$httpsPort/nginx-health" -TimeoutSec 5 -UseBasicParsing
    if ($res.StatusCode -eq 200) {
        Write-Host "  [PASS] Nginx HTTPS hoat dong tot (Status: 200 OK)" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] Nginx tra ve ma: $($res.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "  [FAIL] Khong the ket noi toi Nginx HTTPS: $($_.Exception.Message)" -ForegroundColor Red
}

# 3. Kiem tra Chat App Health Endpoint qua Nginx
Write-Host ""
Write-Host "[3/6] Kiem tra Ung Dung Chat Backend (/health):" -ForegroundColor Yellow
try {
    $res = Invoke-RestMethod -Uri "https://localhost:$httpsPort/health" -TimeoutSec 5
    if ($res.status -eq "UP") {
        Write-Host "  [PASS] Chat App Backend: UP (Database: $($res.services.database))" -ForegroundColor Green
    } else {
        Write-Host "  [WARN] Chat App trang thai: $($res.status) (DB: $($res.services.database))" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  [FAIL] Khong the ket noi toi Chat App /health: $($_.Exception.Message)" -ForegroundColor Red
}

# 4. Kiem tra Prometheus
Write-Host ""
Write-Host "[4/6] Kiem tra Prometheus Server (:$promPort):" -ForegroundColor Yellow
try {
    $res = Invoke-WebRequest -Uri "http://localhost:$promPort/-/ready" -TimeoutSec 5 -UseBasicParsing
    if ($res.StatusCode -eq 200) {
        Write-Host "  [PASS] Prometheus Server: San sang (Status: 200 OK)" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] Prometheus tra ve: $($res.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "  [FAIL] Khong the ket noi toi Prometheus: $($_.Exception.Message)" -ForegroundColor Red
}

# 5. Kiem tra Grafana
Write-Host ""
Write-Host "[5/6] Kiem tra Grafana Dashboard (:$grafanaPort):" -ForegroundColor Yellow
try {
    $res = Invoke-RestMethod -Uri "http://localhost:$grafanaPort/api/health" -TimeoutSec 5
    if ($res.database -eq "ok") {
        Write-Host "  [PASS] Grafana Service: Hoat dong tot (Database: ok)" -ForegroundColor Green
    } else {
        Write-Host "  [WARN] Grafana phan hoi: $($res | ConvertTo-Json -Compress)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  [FAIL] Khong the ket noi toi Grafana: $($_.Exception.Message)" -ForegroundColor Red
}

# 6. Kiem tra ket noi PostgreSQL trong container
Write-Host ""
Write-Host "[6/6] Kiem tra ket noi PostgreSQL (SELECT 1):" -ForegroundColor Yellow
$pgCheck = docker compose exec -T postgres psql -U chat_user -d chat_db -c "SELECT 1 AS status;" 2>&1
if ($pgCheck -match "1") {
    Write-Host "  [PASS] PostgreSQL Database san sang va tra ve ket qua truy van tot!" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] Loi ket noi PostgreSQL: $pgCheck" -ForegroundColor Red
}

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  HOAN TAT KIEM TRA SUC KHOE HE THONG" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
