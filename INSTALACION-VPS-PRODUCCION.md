# 🚀 INSTALACIÓN EN PRODUCCIÓN - VPS HOSTINGER

## Guía Paso a Paso para HeyHey WhatsApp Portal

---

## 📋 ANTES DE EMPEZAR

Necesitas:
- ✅ VPS de Hostinger con Ubuntu 22.04 o 24.04
- ✅ IP del servidor
- ✅ Acceso root (usuario y contraseña)
- ✅ Dominio apuntando a tu VPS (opcional pero recomendado)

---

## PASO 1: CONECTAR AL VPS

Abre tu terminal (o PuTTY en Windows) y ejecuta:

```bash
ssh root@TU_IP_DEL_VPS
```

Ejemplo:
```bash
ssh root@185.199.108.153
```

Escribe tu contraseña cuando la pida.

---

## PASO 2: ACTUALIZAR SISTEMA

```bash
sudo apt update && sudo apt upgrade -y
```

---

## PASO 3: INSTALAR HERRAMIENTAS BÁSICAS

```bash
sudo apt install -y curl wget git build-essential unzip nginx
```

---

## PASO 4: INSTALAR NODE.JS 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

Verificar:
```bash
node --version
npm --version
```

---

## PASO 5: INSTALAR PM2

```bash
npm install -g pm2
```

---

## PASO 6: INSTALAR POSTGRESQL

```bash
# Instalar PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Iniciar servicio
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

---

## PASO 7: CREAR BASE DE DATOS

```bash
# Acceder a PostgreSQL
sudo -u postgres psql
```

Dentro de PostgreSQL, ejecuta estos comandos (copia uno por uno):

```sql
CREATE DATABASE heyhey;
CREATE USER heyhey_user WITH ENCRYPTED PASSWORD 'TuPasswordSeguro123!';
GRANT ALL PRIVILEGES ON DATABASE heyhey TO heyhey_user;
ALTER DATABASE heyhey OWNER TO heyhey_user;
\c heyhey
GRANT ALL ON SCHEMA public TO heyhey_user;
\q
```

⚠️ **IMPORTANTE**: Cambia `TuPasswordSeguro123!` por tu propia contraseña.

---

## PASO 8: CREAR DIRECTORIO Y CLONAR PROYECTO

```bash
# Crear directorio
sudo mkdir -p /var/www
sudo chown -R $USER:$USER /var/www
cd /var/www

# Clonar proyecto
git clone https://github.com/suarezanibal092-cloud/heyhey.git
cd heyhey
```

---

## PASO 9: INSTALAR DEPENDENCIAS

```bash
npm install
```

---

## PASO 10: CONFIGURAR VARIABLES DE ENTORNO

```bash
# Crear archivo .env
nano .env
```

**Copia y pega esto (modifica los valores):**

```env
# ===========================================
# DATABASE - PostgreSQL
# ===========================================
DATABASE_URL="postgresql://heyhey_user:TuPasswordSeguro123!@localhost:5432/heyhey?schema=public"

# ===========================================
# NEXTAUTH
# ===========================================
NEXTAUTH_SECRET="GENERA_UNA_CLAVE_SECRETA_AQUI"
NEXTAUTH_URL="https://tudominio.com"

# ===========================================
# META / FACEBOOK
# ===========================================
NEXT_PUBLIC_META_APP_ID="843644315059004"
NEXT_PUBLIC_META_CONFIG_ID="843644315059004"

# ===========================================
# WHATSAPP
# ===========================================
WHATSAPP_VERIFY_TOKEN="heyhey_webhook_secret_2024"
NEXT_PUBLIC_WHATSAPP_SUPPORT="+573238261825"

# ===========================================
# EMAIL SMTP (Gmail)
# ===========================================
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="tu-email@gmail.com"
SMTP_PASS="tu-contraseña-app"
SMTP_FROM="HeyHey <noreply@tudominio.com>"

# ===========================================
# OPENAI (Opcional)
# ===========================================
OPENAI_API_KEY=""
```

**Guardar:** `Ctrl + X`, luego `Y`, luego `Enter`

---

## PASO 11: GENERAR CLAVE SECRETA

Ejecuta este comando y copia el resultado:

```bash
openssl rand -base64 32
```

Ejemplo de resultado: `aB3dE5fG7hI9jK1lM3nO5pQ7rS9tU1vW3xY5zA7bC9dE=`

Edita el .env y pega la clave en `NEXTAUTH_SECRET`:
```bash
nano .env
```

---

## PASO 12: CONFIGURAR PRISMA PARA POSTGRESQL

```bash
# Copiar schema de PostgreSQL
cp prisma/schema.postgresql.prisma prisma/schema.prisma
```

---

## PASO 13: EJECUTAR MIGRACIONES DE BASE DE DATOS

```bash
# Generar cliente Prisma
npx prisma generate

# Crear tablas en la base de datos
npx prisma db push

# (Opcional) Sembrar datos iniciales
npx prisma db seed
```

---

## PASO 14: CONSTRUIR PROYECTO

```bash
npm run build
```

---

## PASO 15: CONFIGURAR NGINX

```bash
# Crear configuración
sudo nano /etc/nginx/sites-available/heyhey
```

**Pega esta configuración (cambia `tudominio.com` por tu dominio o IP):**

```nginx
server {
    listen 80;
    server_name tudominio.com www.tudominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
}
```

**Si no tienes dominio, usa tu IP:**
```nginx
server {
    listen 80;
    server_name TU_IP_DEL_VPS;
    # ... resto igual
}
```

**Guardar:** `Ctrl + X`, luego `Y`, luego `Enter`

---

## PASO 16: ACTIVAR SITIO EN NGINX

```bash
# Crear enlace
sudo ln -s /etc/nginx/sites-available/heyhey /etc/nginx/sites-enabled/

# Eliminar default
sudo rm -f /etc/nginx/sites-enabled/default

# Verificar configuración
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

---

## PASO 17: INICIAR APLICACIÓN CON PM2

```bash
cd /var/www/heyhey

# Iniciar aplicación
pm2 start npm --name "heyhey" -- start

# Guardar configuración
pm2 save

# Configurar inicio automático
pm2 startup systemd

# Ejecuta el comando que te muestre (copia y pega)
```

---

## PASO 18: CONFIGURAR FIREWALL

```bash
# Instalar UFW
sudo apt install ufw -y

# Configurar reglas
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443

# Activar
sudo ufw enable
```

---

## PASO 19: INSTALAR SSL (HTTPS)

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtener certificado (cambia tudominio.com)
sudo certbot --nginx -d tudominio.com -d www.tudominio.com
```

Sigue las instrucciones en pantalla.

---

## PASO 20: VERIFICAR INSTALACIÓN

```bash
# Ver estado de PM2
pm2 status

# Ver logs
pm2 logs heyhey

# Probar en navegador
# http://TU_IP o https://tudominio.com
```

---

## ✅ ¡LISTO!

Tu aplicación debería estar funcionando en:
- `http://TU_IP_DEL_VPS` (sin SSL)
- `https://tudominio.com` (con SSL)

---

## 🔧 COMANDOS ÚTILES

```bash
# Ver logs en tiempo real
pm2 logs heyhey

# Reiniciar aplicación
pm2 restart heyhey

# Detener aplicación
pm2 stop heyhey

# Ver estado
pm2 status

# Actualizar proyecto
cd /var/www/heyhey
git pull origin main
npm install
npm run build
pm2 restart heyhey
```

---

## ❌ SOLUCIÓN DE PROBLEMAS

### Error: "Cannot connect to database"
```bash
# Verificar PostgreSQL
sudo systemctl status postgresql

# Probar conexión
sudo -u postgres psql -c "SELECT 1"
```

### Error: "Port 3000 already in use"
```bash
# Ver qué usa el puerto
sudo lsof -i :3000

# Matar proceso
sudo kill -9 PID
```

### Error: "Permission denied"
```bash
sudo chown -R $USER:$USER /var/www/heyhey
```

### Ver errores de la aplicación
```bash
pm2 logs heyhey --lines 100
```

---

## 📞 CONFIGURAR DOMINIO EN HOSTINGER

1. Ve a hPanel → **Dominios** → Tu dominio
2. Ve a **DNS Zone**
3. Agrega/edita registros:

| Tipo | Nombre | Contenido |
|------|--------|-----------|
| A | @ | TU_IP_DEL_VPS |
| A | www | TU_IP_DEL_VPS |

4. Espera 15 min - 48 horas para propagación

---

**Última actualización:** Enero 2026
