# Guía de Despliegue en Hostinger VPS

## Requisitos Previos

Tu proyecto necesita **Hostinger VPS** (NO hosting compartido) porque usa:
- Next.js con API Routes
- Base de datos (Prisma + SQLite/PostgreSQL)
- Autenticación con NextAuth

---

## Paso 1: Preparar tu VPS en Hostinger

### 1.1 Accede a tu VPS
```bash
ssh root@tu-ip-del-vps
```

### 1.2 Instala Node.js (v18 o superior)
```bash
# Actualizar sistema
apt update && apt upgrade -y

# Instalar Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt install -y nodejs

# Verificar instalación
node -v  # Debería mostrar v20.x.x
npm -v
```

### 1.3 Instala PM2 (gestor de procesos)
```bash
npm install -g pm2
```

### 1.4 Instala Nginx (proxy reverso)
```bash
apt install nginx -y
systemctl enable nginx
```

---

## Paso 2: Subir tu proyecto

### Opción A: Usando Git (Recomendado)
```bash
# En tu VPS
cd /var/www
git clone https://github.com/tu-usuario/heyhey-whatsapp-portal.git
cd heyhey-whatsapp-portal
```

### Opción B: Usando FileZilla/SFTP
1. Conecta FileZilla a tu VPS (Puerto 22, SFTP)
2. Sube el proyecto a `/var/www/heyhey-whatsapp-portal`

---

## Paso 3: Configurar el proyecto

### 3.1 Instala dependencias
```bash
cd /var/www/heyhey-whatsapp-portal
npm install
```

### 3.2 Configura variables de entorno
```bash
cp .env.example .env
nano .env
```

Edita el archivo `.env`:
```env
# Base de datos (SQLite para desarrollo)
DATABASE_URL="file:./prod.db"

# Para producción con PostgreSQL (recomendado):
# DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/heyhey"

# NextAuth
NEXTAUTH_SECRET="tu-clave-secreta-muy-larga-y-segura"
NEXTAUTH_URL="https://tudominio.com"

# Email (Nodemailer)
SMTP_HOST="smtp.hostinger.com"
SMTP_PORT="587"
SMTP_USER="tu-email@tudominio.com"
SMTP_PASS="tu-contraseña"
EMAIL_FROM="noreply@tudominio.com"
```

### 3.3 Genera la base de datos
```bash
npx prisma generate
npx prisma db push
```

### 3.4 Crea el usuario admin (opcional)
```bash
npm run db:seed
```

### 3.5 Compila el proyecto
```bash
npm run build
```

---

## Paso 4: Iniciar con PM2

```bash
# Iniciar la aplicación
pm2 start ecosystem.config.js

# Ver logs
pm2 logs heyhey-whatsapp

# Guardar configuración para reinicio automático
pm2 save
pm2 startup
```

---

## Paso 5: Configurar Nginx

### 5.1 Crea configuración de Nginx
```bash
nano /etc/nginx/sites-available/heyhey
```

Pega este contenido:
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
    }
}
```

### 5.2 Activa el sitio
```bash
ln -s /etc/nginx/sites-available/heyhey /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

---

## Paso 6: Configurar SSL (HTTPS)

```bash
# Instala Certbot
apt install certbot python3-certbot-nginx -y

# Obtén certificado SSL
certbot --nginx -d tudominio.com -d www.tudominio.com

# Renovación automática
certbot renew --dry-run
```

---

## Paso 7: Configurar Firewall

```bash
ufw allow 22      # SSH
ufw allow 80      # HTTP
ufw allow 443     # HTTPS
ufw enable
```

---

## Comandos útiles

```bash
# Ver estado de la app
pm2 status

# Reiniciar la app
pm2 restart heyhey-whatsapp

# Ver logs en tiempo real
pm2 logs heyhey-whatsapp --lines 100

# Actualizar el proyecto
cd /var/www/heyhey-whatsapp-portal
git pull
npm install
npm run build
pm2 restart heyhey-whatsapp
```

---

## Solución de problemas

### Error: "prisma generate failed"
```bash
npx prisma generate
```

### Error: "EACCES permission denied"
```bash
chown -R $USER:$USER /var/www/heyhey-whatsapp-portal
```

### Error: "Port 3000 already in use"
```bash
pm2 kill
pm2 start ecosystem.config.js
```

### Ver logs de errores
```bash
pm2 logs heyhey-whatsapp --err --lines 50
```

---

## Estructura de archivos en el servidor

```
/var/www/heyhey-whatsapp-portal/
├── .env                 # Variables de entorno
├── .next/               # Build de Next.js
├── node_modules/        # Dependencias
├── prisma/
│   └── prod.db         # Base de datos SQLite
├── ecosystem.config.js  # Configuración de PM2
└── ...
```

---

## Requisitos mínimos del VPS

- **RAM**: 1 GB mínimo (2 GB recomendado)
- **CPU**: 1 vCPU
- **Disco**: 20 GB SSD
- **SO**: Ubuntu 20.04 o 22.04

---

## Contacto de soporte

Si tienes problemas, contacta:
- WhatsApp: +57 323 826 1825
- Email: soporte@heyhey.com
