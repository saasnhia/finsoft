# ============================================================
#  FinPilote Enterprise On-Premise Installer (Windows)
#  Tested on: Windows Server 2022, Windows 11
# ============================================================

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "   FinPilote Enterprise - Installation On-Premise   " -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""

# -- 1. Check prerequisites --
Write-Host "[1/7] Verification des prerequis..." -ForegroundColor White

try {
    $dockerVersion = docker --version
    Write-Host "  + Docker $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "  x Docker non installe" -ForegroundColor Red
    Write-Host "  Installez Docker Desktop: https://docs.docker.com/desktop/install/windows-install/"
    exit 1
}

try {
    docker compose version | Out-Null
    Write-Host "  + Docker Compose disponible" -ForegroundColor Green
} catch {
    Write-Host "  x Docker Compose non disponible" -ForegroundColor Red
    exit 1
}

# Check RAM
$totalRAM = [math]::Round((Get-CimInstance -ClassName Win32_ComputerSystem).TotalPhysicalMemory / 1GB)
if ($totalRAM -lt 16) {
    Write-Host "  ! RAM: ${totalRAM} GB (16 GB minimum recommande)" -ForegroundColor Yellow
} else {
    Write-Host "  + RAM: ${totalRAM} GB" -ForegroundColor Green
}

# -- 2. Generate secrets --
Write-Host ""
Write-Host "[2/7] Generation des secrets de securite..." -ForegroundColor White

function New-Secret([int]$bytes) {
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $buf = New-Object byte[] $bytes
    $rng.GetBytes($buf)
    return ($buf | ForEach-Object { $_.ToString("x2") }) -join ""
}

$DB_PASSWORD = New-Secret 24
$JWT_SECRET = New-Secret 32
$ENCRYPTION_KEY = New-Secret 32
$CRON_SECRET = New-Secret 16
$ANON_KEY = New-Secret 32
$SERVICE_ROLE_KEY = New-Secret 32

Write-Host "  + Secrets generes (DB, JWT, chiffrement, CRON)" -ForegroundColor Green

# -- 3. Create .env file --
Write-Host ""
Write-Host "[3/7] Configuration de l'environnement..." -ForegroundColor White

if (Test-Path .env) {
    $backup = ".env.backup.$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    Copy-Item .env $backup
    Write-Host "  ! Fichier .env existant sauvegarde -> $backup" -ForegroundColor Yellow
}

@"
# FinPilote Enterprise - Auto-generated $(Get-Date -Format 'yyyy-MM-dd')
POSTGRES_DB=finpilote
POSTGRES_USER=finpilote
DB_PASSWORD=$DB_PASSWORD
JWT_SECRET=$JWT_SECRET
JWT_EXPIRY=3600
ANON_KEY=$ANON_KEY
SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY
NEXT_PUBLIC_SUPABASE_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY
SITE_URL=http://localhost:3000
API_EXTERNAL_URL=http://localhost:8000
APP_PORT=3000
KONG_PORT=8000
OLLAMA_HOST=http://ollama:11434
OLLAMA_MODEL=mistral:7b-instruct-q5_K_M
ENCRYPTION_KEY=$ENCRYPTION_KEY
CRON_SECRET=$CRON_SECRET
DISABLE_SIGNUP=false
ENABLE_EMAIL_SIGNUP=true
ENABLE_EMAIL_AUTOCONFIRM=true
"@ | Set-Content -Path .env -Encoding UTF8

Write-Host "  + Fichier .env cree" -ForegroundColor Green

# -- 4. Create data directories --
Write-Host ""
Write-Host "[4/7] Creation des repertoires de donnees..." -ForegroundColor White

New-Item -ItemType Directory -Force -Path "data\postgres" | Out-Null
New-Item -ItemType Directory -Force -Path "data\ollama" | Out-Null
Write-Host "  + Repertoires data/ crees" -ForegroundColor Green

# -- 5. Start services --
Write-Host ""
Write-Host "[5/7] Demarrage des services Docker..." -ForegroundColor White

docker compose up -d
Write-Host "  + Services demarres" -ForegroundColor Green

# -- 6. Wait and pull AI model --
Write-Host ""
Write-Host "[6/7] Attente des services et telechargement du modele IA..." -ForegroundColor White

Write-Host "  Attente PostgreSQL..." -NoNewline
for ($i = 0; $i -lt 30; $i++) {
    try {
        docker compose exec -T postgres pg_isready -U finpilote 2>$null | Out-Null
        Write-Host " +" -ForegroundColor Green
        break
    } catch {
        Start-Sleep -Seconds 2
        Write-Host "." -NoNewline
    }
}

Write-Host "  Telechargement du modele Mistral 7B (4.1 GB)..."
Write-Host "  (Cela peut prendre plusieurs minutes)"
try {
    docker compose exec -T ollama ollama pull mistral:7b-instruct-q5_K_M
} catch {
    Write-Host "  ! Modele non telecharge (peut etre fait manuellement)" -ForegroundColor Yellow
}

# -- 7. Summary --
Write-Host ""
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "  Installation terminee !" -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Application:  http://localhost:3000" -ForegroundColor White
Write-Host "  API Gateway:  http://localhost:8000" -ForegroundColor White
Write-Host "  Ollama AI:    http://localhost:11434" -ForegroundColor White
Write-Host ""
Write-Host "  Commandes utiles:"
Write-Host "    docker compose ps       - Etat des services"
Write-Host "    docker compose logs -f  - Voir les logs"
Write-Host "    docker compose down     - Arreter les services"
Write-Host ""
Write-Host "  Pensez a configurer SMTP dans .env pour les emails" -ForegroundColor Yellow
Write-Host ""
