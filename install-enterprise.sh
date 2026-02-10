#!/bin/bash
set -euo pipefail

# ============================================================
#  FinPilote Enterprise On-Premise Installer
#  Tested on: Ubuntu 22.04 LTS, Debian 12
# ============================================================

BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo -e "${BOLD}═══════════════════════════════════════════════════${NC}"
echo -e "${BOLD}   FinPilote Enterprise — Installation On-Premise  ${NC}"
echo -e "${BOLD}═══════════════════════════════════════════════════${NC}"
echo ""

# ── 1. Check prerequisites ──────────────────────────────────
echo -e "${BOLD}[1/7] Vérification des prérequis...${NC}"

if ! command -v docker &> /dev/null; then
  echo -e "${RED}  ✗ Docker non installé${NC}"
  echo "  Installez Docker: https://docs.docker.com/engine/install/"
  exit 1
fi
echo -e "${GREEN}  ✓ Docker$(docker --version | grep -oP 'version \K[^ ,]+')${NC}"

if ! docker compose version &> /dev/null && ! command -v docker-compose &> /dev/null; then
  echo -e "${RED}  ✗ Docker Compose non installé${NC}"
  exit 1
fi
echo -e "${GREEN}  ✓ Docker Compose disponible${NC}"

# Check RAM (minimum 16 GB recommended)
TOTAL_RAM_KB=$(grep MemTotal /proc/meminfo | awk '{print $2}')
TOTAL_RAM_GB=$((TOTAL_RAM_KB / 1024 / 1024))
if [ "$TOTAL_RAM_GB" -lt 16 ]; then
  echo -e "${YELLOW}  ⚠ RAM: ${TOTAL_RAM_GB} GB (16 GB minimum recommandé)${NC}"
else
  echo -e "${GREEN}  ✓ RAM: ${TOTAL_RAM_GB} GB${NC}"
fi

# Check disk space (minimum 20 GB free)
FREE_DISK=$(df -BG . | tail -1 | awk '{print $4}' | sed 's/G//')
if [ "$FREE_DISK" -lt 20 ]; then
  echo -e "${RED}  ✗ Espace disque insuffisant: ${FREE_DISK} GB (20 GB minimum)${NC}"
  exit 1
fi
echo -e "${GREEN}  ✓ Espace disque: ${FREE_DISK} GB libre${NC}"

# ── 2. Generate secrets ─────────────────────────────────────
echo ""
echo -e "${BOLD}[2/7] Génération des secrets de sécurité...${NC}"

generate_secret() {
  openssl rand -hex "$1"
}

DB_PASSWORD=$(generate_secret 24)
JWT_SECRET=$(generate_secret 32)
ENCRYPTION_KEY=$(generate_secret 32)
CRON_SECRET=$(generate_secret 16)

# Generate JWT tokens (anon and service_role)
ANON_KEY=$(docker run --rm -e JWT_SECRET="$JWT_SECRET" \
  alpine sh -c "apk add --no-cache openssl > /dev/null 2>&1 && \
  echo '{\"role\":\"anon\",\"iss\":\"supabase\",\"iat\":'$(date +%s)',\"exp\":'$(($(date +%s) + 31536000))'}' | \
  openssl enc -base64 -A | tr '+/' '-_' | tr -d '='" 2>/dev/null || generate_secret 32)

SERVICE_ROLE_KEY=$(docker run --rm -e JWT_SECRET="$JWT_SECRET" \
  alpine sh -c "apk add --no-cache openssl > /dev/null 2>&1 && \
  echo '{\"role\":\"service_role\",\"iss\":\"supabase\",\"iat\":'$(date +%s)',\"exp\":'$(($(date +%s) + 31536000))'}' | \
  openssl enc -base64 -A | tr '+/' '-_' | tr -d '='" 2>/dev/null || generate_secret 32)

echo -e "${GREEN}  ✓ Secrets générés (DB, JWT, chiffrement, CRON)${NC}"

# ── 3. Create .env file ─────────────────────────────────────
echo ""
echo -e "${BOLD}[3/7] Configuration de l'environnement...${NC}"

if [ -f .env ]; then
  cp .env ".env.backup.$(date +%Y%m%d_%H%M%S)"
  echo -e "${YELLOW}  ⚠ Fichier .env existant sauvegardé${NC}"
fi

cat > .env << ENVEOF
# FinPilote Enterprise — Auto-generated $(date +%Y-%m-%d)
POSTGRES_DB=finpilote
POSTGRES_USER=finpilote
DB_PASSWORD=${DB_PASSWORD}
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRY=3600
ANON_KEY=${ANON_KEY}
SERVICE_ROLE_KEY=${SERVICE_ROLE_KEY}
NEXT_PUBLIC_SUPABASE_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_ANON_KEY=${ANON_KEY}
SITE_URL=http://localhost:3000
API_EXTERNAL_URL=http://localhost:8000
APP_PORT=3000
KONG_PORT=8000
OLLAMA_HOST=http://ollama:11434
OLLAMA_MODEL=mistral:7b-instruct-q5_K_M
ENCRYPTION_KEY=${ENCRYPTION_KEY}
CRON_SECRET=${CRON_SECRET}
DISABLE_SIGNUP=false
ENABLE_EMAIL_SIGNUP=true
ENABLE_EMAIL_AUTOCONFIRM=true
ENVEOF

echo -e "${GREEN}  ✓ Fichier .env créé${NC}"

# ── 4. Create data directories ──────────────────────────────
echo ""
echo -e "${BOLD}[4/7] Création des répertoires de données...${NC}"

mkdir -p data/postgres data/ollama
echo -e "${GREEN}  ✓ Répertoires data/ créés${NC}"

# ── 5. Start services ───────────────────────────────────────
echo ""
echo -e "${BOLD}[5/7] Démarrage des services Docker...${NC}"

COMPOSE_CMD="docker compose"
if ! docker compose version &> /dev/null; then
  COMPOSE_CMD="docker-compose"
fi

$COMPOSE_CMD up -d

echo -e "${GREEN}  ✓ Services démarrés${NC}"

# ── 6. Wait for services and pull AI model ──────────────────
echo ""
echo -e "${BOLD}[6/7] Attente des services et téléchargement du modèle IA...${NC}"

# Wait for PostgreSQL
echo -n "  Attente PostgreSQL..."
for i in $(seq 1 30); do
  if $COMPOSE_CMD exec -T postgres pg_isready -U finpilote > /dev/null 2>&1; then
    echo -e " ${GREEN}✓${NC}"
    break
  fi
  sleep 2
  echo -n "."
done

# Wait for Ollama and pull model
echo -n "  Attente Ollama..."
for i in $(seq 1 15); do
  if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo -e " ${GREEN}✓${NC}"
    break
  fi
  sleep 2
  echo -n "."
done

echo "  Téléchargement du modèle Mistral 7B (4.1 GB)..."
echo "  (Cela peut prendre plusieurs minutes selon votre connexion)"
$COMPOSE_CMD exec -T ollama ollama pull mistral:7b-instruct-q5_K_M || \
  echo -e "${YELLOW}  ⚠ Modèle non téléchargé (peut être fait manuellement plus tard)${NC}"

# ── 7. Summary ──────────────────────────────────────────────
echo ""
echo -e "${BOLD}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}${BOLD}  ✅ Installation terminée !${NC}"
echo -e "${BOLD}═══════════════════════════════════════════════════${NC}"
echo ""
echo -e "  Application:  ${BOLD}http://localhost:3000${NC}"
echo -e "  API Gateway:  ${BOLD}http://localhost:8000${NC}"
echo -e "  Ollama AI:    ${BOLD}http://localhost:11434${NC}"
echo ""
echo -e "  Commandes utiles:"
echo -e "    ${BOLD}$COMPOSE_CMD ps${NC}       — État des services"
echo -e "    ${BOLD}$COMPOSE_CMD logs -f${NC}  — Voir les logs"
echo -e "    ${BOLD}$COMPOSE_CMD down${NC}     — Arrêter les services"
echo -e "    ${BOLD}$COMPOSE_CMD up -d${NC}    — Redémarrer"
echo ""
echo -e "  ${YELLOW}⚠ Pensez à configurer SMTP dans .env pour les emails${NC}"
echo ""
