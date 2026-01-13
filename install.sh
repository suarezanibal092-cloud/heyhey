#!/bin/bash

# ===========================================
# SCRIPT DE INSTALACIÓN - HEYHEY WHATSAPP PORTAL
# VPS Ubuntu - Hostinger
# ===========================================

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║     🚀 HEYHEY WHATSAPP PORTAL - INSTALACIÓN               ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Verificar si es root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ Por favor ejecuta como root (sudo)${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Este script instalará:${NC}"
echo "   - Node.js 20"
echo "   - PostgreSQL"
echo "   - Nginx"
echo "   - PM2"
echo "   - Certbot (SSL)"
echo ""
read -p "¿Continuar? (s/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    exit 1
fi

# ===========================================
# PASO 1: Actualizar sistema
# ===========================================
echo -e "\n${GREEN}[1/10] 📦 Actualizando sistema...${NC}"
apt update && apt upgrade -y

# ===========================================
# PASO 2: Instalar herramientas básicas
# ===========================================
echo -e "\n${GREEN}[2/10] 🔧 Instalando herramientas básicas...${NC}"
apt install -y curl wget git build-essential unzip nginx ufw

# ===========================================
# PASO 3: Instalar Node.js
# ===========================================
echo -e "\n${GREEN}[3/10] 📗 Instalando Node.js 20...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
echo -e "   Node.js: $(node --version)"
echo -e "   npm: $(npm --version)"

# ===========================================
# PASO 4: Instalar PM2
# ===========================================
echo -e "\n${GREEN}[4/10] 🔄 Instalando PM2...${NC}"
npm install -g pm2

# ===========================================
# PASO 5: Instalar PostgreSQL
# ===========================================
echo -e "\n${GREEN}[5/10] 🗄️ Instalando PostgreSQL...${NC}"
apt install -y postgresql postgresql-contrib
systemctl start postgresql
systemctl enable postgresql

# ===========================================
# PASO 6: Crear base de datos
# ===========================================
echo -e "\n${GREEN}[6/10] 🗃️ Configurando base de datos...${NC}"

# Generar contraseña aleatoria
DB_PASSWORD=$(openssl rand -base64 16 | tr -dc 'a-zA-Z0-9' | head -c 16)

sudo -u postgres psql <<EOF
CREATE DATABASE heyhey;
CREATE USER heyhey_user WITH ENCRYPTED PASSWORD '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON DATABASE heyhey TO heyhey_user;
ALTER DATABASE heyhey OWNER TO heyhey_user;
\c heyhey
GRANT ALL ON SCHEMA public TO heyhey_user;
EOF

echo -e "${YELLOW}   📝 Contraseña de BD guardada en /root/.heyhey_db_password${NC}"
echo "${DB_PASSWORD}" > /root/.heyhey_db_password
chmod 600 /root/.heyhey_db_password

# ===========================================
# PASO 7: Clonar proyecto
# ===========================================
echo -e "\n${GREEN}[7/10] 📥 Clonando proyecto...${NC}"
mkdir -p /var/www
cd /var/www

if [ -d "heyhey" ]; then
    echo "   Directorio existe, actualizando..."
    cd heyhey
    git pull origin main
else
    git clone https://github.com/suarezanibal092-cloud/heyhey.git
    cd heyhey
fi

# ===========================================
# PASO 8: Configurar variables de entorno
# ===========================================
echo -e "\n${GREEN}[8/10] ⚙️ Configurando variables de entorno...${NC}"

# Generar NEXTAUTH_SECRET
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Obtener IP del servidor
SERVER_IP=$(curl -s ifconfig.me)

cat > .env <<EOF
# ===========================================
# DATABASE - PostgreSQL
# ===========================================
DATABASE_URL="postgresql://heyhey_user:${DB_PASSWORD}@localhost:5432/heyhey?schema=public"

# ===========================================
# NEXTAUTH
# ===========================================
NEXTAUTH_SECRET="${NEXTAUTH_SECRET}"
NEXTAUTH_URL="http://${SERVER_IP}"

# ===========================================
# META / FACEBOOK
# ===========================================
NEXT_PUBLIC_META_APP_ID="843644315059004"
NEXT_PUBLIC_META_CONFIG_ID="843644315059004"

# ===========================================
# WHATSAPP
# ===========================================
WHATSAPP_VERIFY_TOKEN="heyhey_webhook_$(openssl rand -hex 8)"
NEXT_PUBLIC_WHATSAPP_SUPPORT="+573238261825"

# ===========================================
# EMAIL SMTP (Configurar manualmente)
# ===========================================
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM="HeyHey <noreply@heyhey.com>"

# ===========================================
# OPENAI (Opcional)
# ===========================================
OPENAI_API_KEY=""
EOF

echo -e "${YELLOW}   📝 Archivo .env creado${NC}"

# ===========================================
# PASO 9: Instalar dependencias y construir
# ===========================================
echo -e "\n${GREEN}[9/10] 📦 Instalando dependencias...${NC}"
npm install

echo -e "\n${GREEN}[9/10] 🔨 Configurando Prisma...${NC}"
# Usar schema de PostgreSQL
cp prisma/schema.postgresql.prisma prisma/schema.prisma 2>/dev/null || true
npx prisma generate
npx prisma db push

echo -e "\n${GREEN}[9/10] 🏗️ Construyendo proyecto...${NC}"
npm run build

# ===========================================
# PASO 10: Configurar Nginx
# ===========================================
echo -e "\n${GREEN}[10/10] 🌐 Configurando Nginx...${NC}"

cat > /etc/nginx/sites-available/heyhey <<EOF
server {
    listen 80;
    server_name ${SERVER_IP};

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }
}
EOF

# Activar sitio
ln -sf /etc/nginx/sites-available/heyhey /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx

# ===========================================
# Configurar Firewall
# ===========================================
echo -e "\n${GREEN}🔥 Configurando Firewall...${NC}"
ufw allow ssh
ufw allow 80
ufw allow 443
ufw --force enable

# ===========================================
# Iniciar con PM2
# ===========================================
echo -e "\n${GREEN}🚀 Iniciando aplicación...${NC}"
cd /var/www/heyhey
pm2 delete heyhey 2>/dev/null || true
pm2 start npm --name "heyhey" -- start
pm2 save
pm2 startup systemd -u root --hp /root

# ===========================================
# RESUMEN
# ===========================================
echo -e "\n${BLUE}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║     ✅ INSTALACIÓN COMPLETADA                             ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${GREEN}📋 INFORMACIÓN DE TU INSTALACIÓN:${NC}"
echo ""
echo -e "   🌐 URL: ${YELLOW}http://${SERVER_IP}${NC}"
echo ""
echo -e "   🗄️ Base de datos:"
echo -e "      - Host: localhost"
echo -e "      - Puerto: 5432"
echo -e "      - Nombre: heyhey"
echo -e "      - Usuario: heyhey_user"
echo -e "      - Contraseña: ${YELLOW}${DB_PASSWORD}${NC}"
echo ""
echo -e "   📁 Archivos importantes:"
echo -e "      - Proyecto: /var/www/heyhey"
echo -e "      - Variables: /var/www/heyhey/.env"
echo -e "      - BD Password: /root/.heyhey_db_password"
echo ""
echo -e "${YELLOW}📝 PRÓXIMOS PASOS:${NC}"
echo ""
echo "   1. Configurar dominio en Hostinger DNS"
echo "   2. Editar .env con tu dominio:"
echo "      nano /var/www/heyhey/.env"
echo ""
echo "   3. Instalar SSL (después de configurar dominio):"
echo "      sudo certbot --nginx -d tudominio.com"
echo ""
echo "   4. Configurar email SMTP en .env"
echo ""
echo -e "${GREEN}🔧 COMANDOS ÚTILES:${NC}"
echo "   pm2 logs heyhey     - Ver logs"
echo "   pm2 restart heyhey  - Reiniciar"
echo "   pm2 status          - Ver estado"
echo ""
echo -e "${GREEN}¡Gracias por usar HeyHey! 🎉${NC}"
