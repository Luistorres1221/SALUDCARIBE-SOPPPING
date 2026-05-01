# SALUDCARIBE SHOPPING - Guía de Deployment

## 📋 Requisitos

- Docker y Docker Compose
- Git
- Node.js 20+ (para desarrollo local)
- Java 17+ (para desarrollo backend local)
- MySQL 8.0+ (para desarrollo local)

## 🚀 Deployment con Docker Compose (Local)

### 1. Clonar el repositorio

```bash
git clone https://github.com/Luistorres1221/SALUDCARIBE-SOPPPING.git
cd SALUDCARIBE-SOPPPING
```

### 2. Iniciar los servicios

```bash
docker-compose up -d
```

Esto iniciará:
- **MySQL**: Puerto 3306
- **Backend (Spring Boot)**: Puerto 8080 → http://localhost:8080/api
- **Frontend (Vite/React)**: Puerto 3000 → http://localhost:3000

### 3. Verificar que los servicios estén corriendo

```bash
docker-compose ps
```

### 4. Ver logs

```bash
# Todos los servicios
docker-compose logs -f

# Un servicio específico
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mysql
```

### 5. Detener los servicios

```bash
docker-compose down
```

---

## 🌐 Deployment en Vercel (Frontend)

### 1. Actualizar variables de entorno en Vercel

En el dashboard de Vercel:
- `VITE_API_URL`: URL de tu backend (ej: https://tu-backend.herokuapp.com/api)

### 2. Conectar repositorio

1. Ir a https://vercel.com
2. Click en "New Project"
3. Seleccionar tu repositorio de GitHub
4. Seleccionar la carpeta raíz: `frontend`
5. Configurar variables de entorno
6. Deploy

---

## 🗄️ Importar Base de Datos en XAMPP

### 1. Colocar el archivo SQL

Copiar `database/init.sql` a la carpeta de tu servidor XAMPP.

### 2. Crear la base de datos

```bash
# En Windows (XAMPP Control Panel)
1. Abre phpMyAdmin (http://localhost/phpmyadmin)
2. Click en "Import"
3. Selecciona "database/init.sql"
4. Click "Go"
```

O vía terminal:

```bash
mysql -u root -p < database/init.sql
```

### 3. Verificar la conexión

```bash
mysql -u salud_user -p salud_password salud_caribe_db
```

---

## 🛠️ Desarrollo Local

### Backend

```bash
cd backend

# Compilar
mvn clean install

# Correr en desarrollo
mvn spring-boot:run

# Acceso a H2 Console: http://localhost:8080/h2-console
```

### Frontend

```bash
cd frontend

# Instalar dependencias
bun install

# Correr en desarrollo
bun run dev

# Build para producción
bun run build

# Preview del build
bun run preview
```

---

## 📊 Estructura del Proyecto

```
.
├── backend/                 # Spring Boot API
│   ├── src/main/java/      # Código fuente Java
│   ├── pom.xml             # Dependencias Maven
│   └── Dockerfile          # Imagen Docker
├── frontend/               # React + TanStack Router
│   ├── src/                # Código fuente TypeScript/React
│   ├── package.json        # Dependencias npm/bun
│   ├── vite.config.ts      # Configuración Vite
│   └── Dockerfile          # Imagen Docker
├── database/               # Scripts SQL
│   └── init.sql           # Estructura de BD para XAMPP
├── docker-compose.yml      # Orquestación de servicios
└── README.md              # Este archivo
```

---

## 🔐 Variables de Entorno

### Backend (Docker)
```
SPRING_DATASOURCE_URL=jdbc:mysql://mysql:3306/salud_caribe_db
SPRING_DATASOURCE_USERNAME=salud_user
SPRING_DATASOURCE_PASSWORD=salud_password
```

### Frontend (Docker)
```
VITE_API_URL=http://localhost:8080/api
```

---

## ❌ Solución de Problemas

### Error 404 en Vercel
- Verificar que `vercel.json` esté configurado correctamente
- Asegurarse que el build genera la carpeta `dist`
- Verificar variables de entorno `VITE_API_URL`

### Problemas de conexión a BD
- Verificar que MySQL esté corriendo: `docker-compose ps`
- Verificar logs: `docker-compose logs mysql`
- Verificar credenciales en `application.properties`

### Puerto en uso
```bash
# Linux/Mac
lsof -i :3000  # Frontend
lsof -i :8080  # Backend
lsof -i :3306  # MySQL

# Windows
netstat -ano | findstr :3000
```

---

## 📝 Licencia

Copyright © 2026 SALUDCARIBE. Todos los derechos reservados.
