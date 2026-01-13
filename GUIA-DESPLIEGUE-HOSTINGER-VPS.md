# 🚀 Guía de Despliegue en Hostinger VPS

## Índice
1. [Requisitos Previos](#requisitos-previos)
2. [Configuración Inicial del VPS](#configuración-inicial-del-vps)
3. [Conexión SSH](#conexión-ssh)
4. [Instalación del Entorno](#instalación-del-entorno)
5. [Configuración de Node.js](#configuración-de-nodejs)
6. [Clonar el Proyecto](#clonar-el-proyecto)
7. [Configuración de Nginx](#configuración-de-nginx)
8. [Certificado SSL con Let's Encrypt](#certificado-ssl-con-lets-encrypt)
9. [PM2 - Gestión de Procesos](#pm2---gestión-de-procesos)
10. [Configuración del Dominio](#configuración-del-dominio)
11. [Comandos Útiles](#comandos-útiles)
12. [Solución de Problemas](#solución-de-problemas)

---

## Requisitos Previos

Antes de comenzar, asegúrate de tener:

- [ ] Una cuenta en Hostinger con VPS activo
- [ ] Un dominio configurado (opcional pero recomendado)
- [ ] Tu proyecto listo en un repositorio Git
- [ ] Cliente SSH instalado (Terminal en Mac/Linux, PuTTY en Windows)

---

## Configuración Inicial del VPS

### Paso 1: Acceder al Panel de Hostinger

1. Inicia sesión en [hPanel de Hostinger](https://hpanel.hostinger.com)
2. Ve a **VPS** → Selecciona tu servidor
3. Anota la siguiente información:
   - **IP del servidor**: `xxx.xxx.xxx.xxx`
   - **Usuario**: `root`
   - **Contraseña**: (la que configuraste o la proporcionada)

### Paso 2: Configurar Sistema Operativo

Si es un VPS nuevo, selecciona el sistema operativo:
- **Recomendado**: Ubuntu 22.04 LTS o Ubuntu 24.04 LTS
- Alternativa: Debian 12

---

## Conexión SSH

### Desde Terminal (Mac/Linux)

```bash
ssh root@TU_IP_DEL_VPS
```

### Desde Windows (PuTTY)

1. Abre PuTTY
2. Host Name: `TU_IP_DEL_VPS`
3. Port: `22`
4. Connection type: `SSH`
5. Click en **Open**

### Desde Windows (PowerShell/CMD)

```bash
ssh root@TU_IP_DEL_VPS
```

---

## Instalación del Entorno

### Paso 1: Actualizar el Sistema

```bash
# Actualizar lista de paquetes
sudo apt update

# Actualizar paquetes instalados
sudo apt upgrade -y

# Instalar herramientas esenciales
sudo apt install -y curl wget git build-essential
```

### Paso 2: Crear Usuario No-Root (Recomendado)

```bash
# Crear nuevo usuario
adduser tu_usuario

# Dar permisos sudo
usermod -aG sudo tu_usuario

# Cambiar a nuevo usuario
su - tu_usuario
```

### Paso 3: Configurar Firewall (UFW)

```bash
# Instalar UFW
sudo apt install ufw -y

# Configurar reglas básicas
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Permitir SSH
sudo ufw allow ssh
sudo ufw allow 22

# Permitir HTTP y HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Permitir puerto de tu aplicación (ejemplo: 3000)
sudo ufw allow 3000

# Activar firewall
sudo ufw enable

# Verificar estado
sudo ufw status
```

---

## Configuración de Node.js

### Opción A: Usando NVM (Recomendado)

```bash
# Instalar NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Cargar NVM
source ~/.bashrc
# o
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Instalar Node.js LTS
nvm install --lts

# Verificar instalación
node --version
npm --version
```

### Opción B: Usando NodeSource

```bash
# Agregar repositorio de Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Instalar Node.js
sudo apt install -y nodejs

# Verificar instalación
node --version
npm --version
```

### Instalar Yarn o PNPM (Opcional)

```bash
# Instalar Yarn
npm install -g yarn

# O instalar PNPM
npm install -g pnpm

# O instalar Bun
curl -fsSL https://bun.sh/install | bash
```

---

## Clonar el Proyecto

### Paso 1: Crear Directorio para Proyectos

```bash
# Crear directorio
sudo mkdir -p /var/www
sudo chown -R $USER:$USER /var/www
cd /var/www
```

### Paso 2: Clonar Repositorio

```bash
# Clonar tu repositorio
git clone https://github.com/suarezanibal092-cloud/heyhey.git
cd heyhey
```

### Paso 3: Instalar Dependencias

```bash
# Con npm
npm install

# O con yarn
yarn install

# O con pnpm
pnpm install

# O con bun
bun install
```

### Paso 4: Configurar Variables de Entorno

```bash
# Crear archivo .env
nano .env
```

Ejemplo de contenido `.env`:
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=tu_url_de_base_de_datos
API_KEY=tu_api_key
```

### Paso 5: Construir el Proyecto (Si es necesario)

```bash
# Para proyectos Next.js
npm run build

# Para proyectos React/Vite
npm run build

# Para proyectos NestJS
npm run build
```

---

## Configuración de Nginx

### Paso 1: Instalar Nginx

```bash
sudo apt install nginx -y

# Iniciar Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Verificar estado
sudo systemctl status nginx
```

### Paso 2: Crear Configuración del Sitio

```bash
# Crear archivo de configuración
sudo nano /etc/nginx/sites-available/heyhey
```

### Configuración para Aplicación Node.js (API/Backend)

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

### Configuración para Sitio Estático (React/Vue Build)

```nginx
server {
    listen 80;
    server_name tudominio.com www.tudominio.com;

    root /var/www/heyhey/dist;  # o /var/www/heyhey/build para React
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache para archivos estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Configuración para Next.js

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

    location /_next/static {
        alias /var/www/heyhey/.next/static;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Paso 3: Activar el Sitio

```bash
# Crear enlace simbólico
sudo ln -s /etc/nginx/sites-available/heyhey /etc/nginx/sites-enabled/

# Eliminar configuración por defecto (opcional)
sudo rm /etc/nginx/sites-enabled/default

# Verificar configuración
sudo nginx -t

# Recargar Nginx
sudo systemctl reload nginx
```

---

## Certificado SSL con Let's Encrypt

### Paso 1: Instalar Certbot

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y
```

### Paso 2: Obtener Certificado SSL

```bash
# Obtener e instalar certificado
sudo certbot --nginx -d tudominio.com -d www.tudominio.com
```

### Paso 3: Verificar Renovación Automática

```bash
# Probar renovación
sudo certbot renew --dry-run

# El certificado se renovará automáticamente
```

### Configuración Final con SSL (Automática)

Certbot modificará tu archivo de Nginx automáticamente. El resultado será similar a:

```nginx
server {
    listen 80;
    server_name tudominio.com www.tudominio.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tudominio.com www.tudominio.com;

    ssl_certificate /etc/letsencrypt/live/tudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tudominio.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

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

---

## PM2 - Gestión de Procesos

PM2 mantiene tu aplicación Node.js ejecutándose 24/7 y la reinicia automáticamente si falla.

### Paso 1: Instalar PM2

```bash
npm install -g pm2
```

### Paso 2: Iniciar Aplicación con PM2

```bash
cd /var/www/heyhey

# Iniciar aplicación
pm2 start npm --name "heyhey" -- start

# O para un archivo específico
pm2 start server.js --name "heyhey"

# O para Next.js
pm2 start npm --name "heyhey" -- run start

# O con ecosystem file
pm2 start ecosystem.config.js
```

### Paso 3: Crear Archivo de Configuración (Opcional)

```bash
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'heyhey',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/heyhey',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

### Paso 4: Configurar Inicio Automático

```bash
# Guardar lista de procesos
pm2 save

# Configurar inicio con el sistema
pm2 startup systemd

# Ejecutar el comando que te muestre PM2
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u tu_usuario --hp /home/tu_usuario
```

### Comandos Útiles de PM2

```bash
# Ver procesos
pm2 list

# Ver logs
pm2 logs heyhey

# Reiniciar aplicación
pm2 restart heyhey

# Detener aplicación
pm2 stop heyhey

# Eliminar aplicación
pm2 delete heyhey

# Monitorear en tiempo real
pm2 monit

# Ver información detallada
pm2 show heyhey
```

---

## Configuración del Dominio

### En el Panel de Hostinger

1. Ve a **Dominios** → Tu dominio
2. Accede a **DNS Zone**
3. Configura los siguientes registros:

| Tipo | Nombre | Contenido | TTL |
|------|--------|-----------|-----|
| A | @ | TU_IP_DEL_VPS | 3600 |
| A | www | TU_IP_DEL_VPS | 3600 |

### Verificar Propagación DNS

```bash
# Desde tu computadora local
nslookup tudominio.com

# O usando dig
dig tudominio.com
```

> ⏱️ **Nota**: La propagación DNS puede tardar hasta 48 horas, aunque generalmente es más rápida (15 min - 2 horas).

---

## Comandos Útiles

### Gestión del Servidor

```bash
# Reiniciar servidor
sudo reboot

# Ver uso de disco
df -h

# Ver uso de memoria
free -m

# Ver procesos
htop  # (instalar con: sudo apt install htop)

# Ver puertos en uso
sudo netstat -tulpn
```

### Gestión de Git

```bash
# Actualizar proyecto
cd /var/www/heyhey
git pull origin main

# Reinstalar dependencias
npm install

# Reconstruir (si es necesario)
npm run build

# Reiniciar aplicación
pm2 restart heyhey
```

### Script de Despliegue Automático

Crea un script para actualizar fácilmente:

```bash
nano /var/www/heyhey/deploy.sh
```

```bash
#!/bin/bash

echo "🚀 Iniciando despliegue..."

cd /var/www/heyhey

echo "📥 Obteniendo últimos cambios..."
git pull origin main

echo "📦 Instalando dependencias..."
npm install

echo "🔨 Construyendo proyecto..."
npm run build

echo "🔄 Reiniciando aplicación..."
pm2 restart heyhey

echo "✅ Despliegue completado!"
```

```bash
# Dar permisos de ejecución
chmod +x deploy.sh

# Ejecutar despliegue
./deploy.sh
```

---

## Solución de Problemas

### Error: "Permission denied"

```bash
# Cambiar propietario de archivos
sudo chown -R $USER:$USER /var/www/heyhey
```

### Error: Nginx no inicia

```bash
# Verificar errores de configuración
sudo nginx -t

# Ver logs de error
sudo tail -f /var/log/nginx/error.log
```

### Error: Aplicación no responde

```bash
# Ver logs de PM2
pm2 logs heyhey

# Verificar que el puerto esté disponible
sudo lsof -i :3000

# Reiniciar la aplicación
pm2 restart heyhey
```

### Error: "EACCES: permission denied" en npm

```bash
# Arreglar permisos de npm
sudo chown -R $(whoami) ~/.npm
```

### Error: Puerto ya en uso

```bash
# Encontrar proceso usando el puerto
sudo lsof -i :3000

# Matar proceso
sudo kill -9 PID_DEL_PROCESO
```

### Error: Certificado SSL no funciona

```bash
# Verificar certificado
sudo certbot certificates

# Renovar manualmente
sudo certbot renew

# Reiniciar Nginx
sudo systemctl restart nginx
```

---

## 📋 Checklist de Despliegue

- [ ] VPS configurado con Ubuntu
- [ ] Conexión SSH funcionando
- [ ] Sistema actualizado
- [ ] Firewall configurado
- [ ] Node.js instalado
- [ ] Proyecto clonado
- [ ] Dependencias instaladas
- [ ] Variables de entorno configuradas
- [ ] Proyecto construido (build)
- [ ] Nginx configurado
- [ ] SSL configurado
- [ ] PM2 configurado
- [ ] Dominio apuntando al VPS
- [ ] Aplicación funcionando en producción

---

## 🆘 Soporte

Si tienes problemas:

1. **Hostinger**: Contacta soporte en [hostinger.com/contacts](https://www.hostinger.com/contacts)
2. **Documentación**: [Tutoriales de Hostinger](https://www.hostinger.com/tutorials)
3. **Comunidad**: [Stack Overflow](https://stackoverflow.com)

---

## 📚 Recursos Adicionales

- [Documentación de Nginx](https://nginx.org/en/docs/)
- [Documentación de PM2](https://pm2.keymetrics.io/docs/)
- [Let's Encrypt](https://letsencrypt.org/docs/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

---

**Última actualización**: Enero 2026

**Autor**: Guía generada para el proyecto HeyHey
