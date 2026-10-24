<#
.SYNOPSIS
    Tạo chứng chỉ SSL/TLS tự ký cho Nginx reverse proxy.
.DESCRIPTION
    Tự động tìm kiếm OpenSSL trên Windows (Git OpenSSL hoặc PATH) và sinh cặp khóa chat.key / chat.crt.
#>

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir
$certsDir = Join-Path $projectRoot "nginx\certs"

if (-not (Test-Path $certsDir)) {
    New-Item -ItemType Directory -Path $certsDir -Force | Out-Null
}

$keyPath = Join-Path $certsDir "chat.key"
$crtPath = Join-Path $certsDir "chat.crt"

Write-Host "==> [SSL] Dang tim kiem OpenSSL..." -ForegroundColor Cyan

$opensslCmd = $null
if (Get-Command openssl -ErrorAction SilentlyContinue) {
    $opensslCmd = "openssl"
} elseif (Test-Path "C:\Program Files\Git\usr\bin\openssl.exe") {
    $opensslCmd = "C:\Program Files\Git\usr\bin\openssl.exe"
} elseif (Test-Path "C:\Program Files (x86)\Git\usr\bin\openssl.exe") {
    $opensslCmd = "C:\Program Files (x86)\Git\usr\bin\openssl.exe"
}

if (-not $opensslCmd) {
    Write-Error "Khong tim thay openssl tren may tinh. Vui long cai dat Git hoac OpenSSL."
    exit 1
}

Write-Host "==> [SSL] Su dung OpenSSL tai: $opensslCmd" -ForegroundColor Green
Write-Host "==> [SSL] Dang sinh cap chung chi tu ky cho localhost..." -ForegroundColor Cyan

& $opensslCmd req -x509 -nodes -days 365 -newkey rsa:2048 `
    -keyout $keyPath `
    -out $crtPath `
    -subj "/C=VN/ST=Hanoi/L=Hanoi/O=MSSV-De32/OU=IT/CN=localhost"

if ((Test-Path $keyPath) -and (Test-Path $crtPath)) {
    Write-Host "[OK] Da tao thanh cong chung chi SSL tai:" -ForegroundColor Green
    Write-Host "     Key : $keyPath" -ForegroundColor Gray
    Write-Host "     Cert: $crtPath" -ForegroundColor Gray
} else {
    Write-Error "Loi khi tao chung chi SSL!"
    exit 1
}
