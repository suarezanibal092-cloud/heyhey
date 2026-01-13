# 🖥️ Comandos para Cargar Proyecto a VPS Ubuntu - Hostinger

## 📋 Resumen Rápido de Comandos

Copia y pega estos comandos en orden para desplegar tu proyecto.

---

## 1️⃣ CONECTAR AL VPS

```bash
# Conectar por SSH (reemplaza con tu IP)
ssh root@TU_IP_DEL_VPS
```

**Ejemplo:**
```bash
ssh root@185.199.108.153
```

---

## 2️⃣ ACTUALIZAR SISTEMA

```bash
# Actualizar todo el sistema
sudo apt update && sudo apt upgrade -y

# Instalar herramientas esenciales
sudo apt install -y curl wget git build-essential unzip
```

---

## 3️⃣ INSTALAR NODE.JS

### Opción A: Con NVM (Recomendado)
```bash
# Instalar NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Cargar NVM
source ~/.bashrc

# Instalar Node.js LTS
nvm install --lts

# Verificar
node --version
npm --version
```

### Opción B: Directamente
```bash
# Agregar repositorio Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Instalar
sudo apt install -y nodejs

# Verificar
node --version
npm --version
```

---

## 4️⃣ INSTALAR PM2 (Gestor de Procesos)

```bash
npm install -g pm2
```

---

## 5️⃣ CREAR DIRECTORIO Y CLONAR PROYECTO

```bash
# Crear directorio
sudo mkdir -p /var/www
cd /var/www

# Dar permisos
sudo chown -R $USER:$USER /var/www

# Clonar tu repositorio (REEMPLAZA CON TU URL)
git clone https://github.com/TU_USUARIO/TU_REPOSITORIO.git

# Entrar al proyecto
cd TU_REPOSITORIO
```

**Tu proyecto específico:**
```bash
cd /var/www
git clone https://github.com/suarezanibal092-cloud/heyhey.git
cd heyhey
```

---

## 6️⃣ INSTALAR DEPENDENCIAS

```bash
# Con npm
npm install

# O con yarn
npm install -g yarn
yarn install
```

---

## 7️⃣ CONFIGURAR VARIABLES DE ENTORNO

```bash
# Crear archivo .env
nano .env
```

**Contenido ejemplo:**
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=mysql://user:password@localhost:3306/database
```

Guardar: `Ctrl + X`, luego `Y`, luego `Enter`

---

## 8️⃣ CONSTRUIR PROYECTO (Si aplica)

```bash
# Para Next.js, React, Vue, etc.
npm run build
```

---

## 9️⃣ INSTALAR Y CONFIGURAR NGINX

```bash
# Instalar Nginx
sudo apt install nginx -y

# Iniciar y habilitar
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Crear configuración del sitio:

```bash
sudo nano /etc/nginx/sites-available/heyhey
```

**Pegar esta configuración (cambia `tudominio.com` por tu dominio o IP):**

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

Guardar: `Ctrl + X`, luego `Y`, luego `Enter`

### Activar sitio:

```bash
# Crear enlace
sudo ln -s /etc/nginx/sites-available/heyhey /etc/nginx/sites-enabled/

# Eliminar default
sudo rm /etc/nginx/sites-enabled/default

# Verificar configuración
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

---

## 🔟 INICIAR APLICACIÓN CON PM2

```bash
cd /var/www/heyhey

# Iniciar con PM2
pm2 start npm --name "heyhey" -- start

# O para archivo específico
pm2 start server.js --name "heyhey"

# O para Next.js
pm2 start npm --name "heyhey" -- run start

# Guardar configuración
pm2 save

# Iniciar con el sistema
pm2 startup systemd
```

---

## 1️⃣1️⃣ INSTALAR SSL (HTTPS)

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtener certificado (cambia tudominio.com)
sudo certbot --nginx -d tudominio.com -d www.tudominio.com

# Verificar renovación automática
sudo certbot renew --dry-run
```

---

## 1️⃣2️⃣ CONFIGURAR FIREWALL

```bash
# Instalar y configurar UFW
sudo apt install ufw -y

# Permitir conexiones
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 3000

# Activar firewall
sudo ufw enable

# Ver estado
sudo ufw status
```

---

## 🔄 ACTUALIZAR PROYECTO (Después de cambios)

```bash
cd /var/www/heyhey

# Obtener cambios
git pull origin main

# Reinstalar dependencias (si hay nuevas)
npm install

# Reconstruir (si aplica)
npm run build

# Reiniciar aplicación
pm2 restart heyhey
```

---

## 📜 SCRIPT DE DESPLIEGUE AUTOMÁTICO

Crea este script para actualizar fácilmente:

```bash
nano /var/www/heyhey/deploy.sh
```

**Contenido:**
```bash
#!/bin/bash
echo "🚀 Iniciando despliegue..."
cd /var/www/heyhey
echo "📥 Descargando cambios..."
git pull origin main
echo "📦 Instalando dependencias..."
npm install
echo "🔨 Construyendo..."
npm run build
echo "🔄 Reiniciando..."
pm2 restart heyhey
echo "✅ ¡Listo!"
```

```bash
# Dar permisos
chmod +x deploy.sh

# Ejecutar cuando quieras actualizar
./deploy.sh
```

---

## 🛠️ COMANDOS ÚTILES

### PM2
```bash
pm2 list              # Ver procesos
pm2 logs heyhey       # Ver logs
pm2 restart heyhey    # Reiniciar
pm2 stop heyhey       # Detener
pm2 delete heyhey     # Eliminar
pm2 monit             # Monitor en tiempo real
```

### Nginx
```bash
sudo systemctl status nginx    # Estado
sudo systemctl restart nginx   # Reiniciar
sudo systemctl reload nginx    # Recargar config
sudo nginx -t                  # Verificar config
sudo tail -f /var/log/nginx/error.log  # Ver errores
```

### Sistema
```bash
df -h          # Espacio en disco
free -m        # Memoria RAM
htop           # Monitor de procesos (instalar: sudo apt install htop)
```

---

## ⚡ COMANDO TODO-EN-UNO (Primera instalación)

Copia todo esto y pégalo en tu VPS:

```bash
# === INSTALACIÓN COMPLETA ===
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git build-essential unzip nginx

# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar PM2
npm install -g pm2

# Crear directorio
sudo mkdir -p /var/www
sudo chown -R $USER:$USER /var/www
cd /var/www

# Clonar proyecto (CAMBIA LA URL)
git clone https://github.com/suarezanibal092-cloud/heyhey.git
cd heyhey

# Instalar dependencias
npm install

# Mostrar siguiente paso
echo "✅ Instalación base completa"
echo "📝 Ahora configura tu .env y ejecuta: pm2 start npm --name heyhey -- start"
```

---

## 📞 SOLUCIÓN RÁPIDA DE ERRORES

| Error | Solución |
|-------|----------|
| Permission denied | `sudo chown -R $USER:$USER /var/www/heyhey` |
| Port in use | `sudo lsof -i :3000` luego `sudo kill -9 PID` |
| Nginx error | `sudo nginx -t` para ver el error |
| npm error | `rm -rf node_modules && npm install` |
| PM2 no inicia | `pm2 logs heyhey` para ver errores |

---

**Última actualización:** Enero 2026
