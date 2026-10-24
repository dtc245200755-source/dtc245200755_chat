# Verify Configuration Script for Chat System De 32
$ErrorActionPreference = "Continue"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  KIEM TRA CAU HINH HE THONG CHAT SYSTEM - DE 32" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir

# 1. Kiem tra file .env
Write-Host ""
Write-Host "[1/5] Kiem tra file cau hinh .env..." -ForegroundColor Yellow
$envPath = Join-Path $projectRoot ".env"
$envExamplePath = Join-Path $projectRoot ".env.example"

if (Test-Path $envPath) {
    Write-Host "  [PASS] Da tim thay file .env" -ForegroundColor Green
} else {
    Write-Host "  [WARN] Chua co file .env! Dang tu dong tao tu .env.example..." -ForegroundColor Yellow
    if (Test-Path $envExamplePath) {
        Copy-Item $envExamplePath $envPath
        Write-Host "  [PASS] Da tao file .env tu .env.example" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] Khong tim thay file .env.example!" -ForegroundColor Red
    }
}

# 2. Kiem tra Docker Engine & Docker Compose
Write-Host ""
Write-Host "[2/5] Kiem tra Docker Daemon..." -ForegroundColor Yellow
try {
    $dockerVer = docker --version
    $composeVer = docker compose version
    Write-Host "  [PASS] Docker: $dockerVer" -ForegroundColor Green
    Write-Host "  [PASS] Compose: $composeVer" -ForegroundColor Green
} catch {
    Write-Host "  [FAIL] Docker khong hoat dong hoac chua khoi dong Docker Desktop!" -ForegroundColor Red
}

# 3. Kiem tra chung chi SSL
Write-Host ""
Write-Host "[3/5] Kiem tra chung chi SSL trong nginx/certs/..." -ForegroundColor Yellow
$certFile = Join-Path $projectRoot "nginx\certs\chat.crt"
$keyFile = Join-Path $projectRoot "nginx\certs\chat.key"

if ((Test-Path $certFile) -and (Test-Path $keyFile)) {
    Write-Host "  [PASS] Chung chi SSL da san sang (chat.crt va chat.key)" -ForegroundColor Green
} else {
    Write-Host "  [WARN] Thieu chung chi SSL. Vui long chay .\scripts\generate-certs.ps1" -ForegroundColor Yellow
}

# 4. Kiem tra cu phap docker-compose.yml
Write-Host ""
Write-Host "[4/5] Kiem tra cu phap docker-compose.yml bang 'docker compose config'..." -ForegroundColor Yellow
$composeConfig = docker compose config 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "  [PASS] Cu phap docker-compose.yml hoan toan hop le!" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] Cu phap docker-compose.yml bi loi:" -ForegroundColor Red
    Write-Host $composeConfig -ForegroundColor Red
}

# 5. Kiem tra cac cong host
Write-Host ""
Write-Host "[5/5] Kiem tra xung dot cac cong host..." -ForegroundColor Yellow
$portsToCheck = @(8084, 8443, 3003, 9092, 5052)
$usedPorts = (Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue).LocalPort

foreach ($port in $portsToCheck) {
    if ($port -in $usedPorts) {
        Write-Host "  [WARN] Cong $port dang duoc su dung boi mot tien trinh khac tren may!" -ForegroundColor Yellow
    } else {
        Write-Host "  [PASS] Cong $port dang trong, san sang bind." -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  HOAN TAT KIEM TRA CAU HINH" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
