# SALUDCARIBE SHOPPING - Guía de Desarrollo

## 🏗️ Arquitectura

```
Frontend (React/TanStack)     Backend (Spring Boot)     Database (MySQL)
    ↓                              ↓                          ↓
Port 3000                      Port 8081/api               Port 3306
Vercel (Producción)        Docker/XAMPP (Producción)   XAMPP/Docker
```

## 📦 Stack Tecnológico

### Frontend
- **Framework**: React 19 + TanStack Router (Full-stack TypeScript)
- **Build Tool**: Vite + @lovable.dev config
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/ui (Radix UI)
- **State Management**: TanStack Query + Context API
- **Package Manager**: Bun
- **Deployment**: Vercel

### Backend
- **Framework**: Spring Boot 3.2.0
- **Java Version**: 17
- **Database**: MySQL 8.0
- **ORM**: JPA/Hibernate
- **API Style**: REST
- **Deployment**: Docker

### Database
- **Engine**: MySQL 8.0
- **Tables**: 
  - `profiles` - Perfiles de usuarios
  - `user_roles` - Roles asignados
  - `categories` - Categorías de productos
  - `products` - Catálogo de productos
  - `cart_items` - Items del carrito
  - `orders` - Pedidos
  - `order_items` - Items de pedidos
  - `roles_catalog` - Catálogo de roles

## 🚀 Quick Start - Desarrollo Local

### Opción 1: Docker Compose (Recomendado)

```bash
# Clonar repo
git clone https://github.com/Luistorres1221/SALUDCARIBE-SOPPPING.git
cd SALUDCARIBE-SOPPPING

# Iniciar todo con Docker
docker-compose up -d

# Ver logs
docker-compose logs -f

# Acceso
- Frontend: http://localhost:3000
- Backend: http://localhost:8081/api
- MySQL: localhost:3306 (salud_user / salud_password)
```

### Opción 2: Desarrollo Manual

#### Backend
```bash
cd backend

# Instalar Maven (si no lo tienes)
# Windows: https://maven.apache.org/download.cgi

# Compilar y ejecutar
mvn clean install
mvn spring-boot:run

# El backend estará en http://localhost:8081/api
```

#### Frontend
```bash
cd frontend

# Instalar Bun (si no lo tienes)
# curl -fsSL https://bun.sh/install | bash

# Instalar dependencias
bun install

# Desarrollo
bun run dev

# El frontend estará en http://localhost:5173 o 3000
```

#### Database
```bash
# Opción 1: Con XAMPP
1. Abre phpMyAdmin (http://localhost/phpmyadmin)
2. Crea nueva BD: salud_caribe_db
3. Import → database/init.sql

# Opción 2: Con Docker
docker run --name salud_mysql \
  -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=salud_caribe_db \
  -e MYSQL_USER=salud_user \
  -e MYSQL_PASSWORD=salud_password \
  -p 3306:3306 \
  -v $(pwd)/database:/docker-entrypoint-initdb.d \
  mysql:8.0-alpine

# Opción 3: Con MySQL CLI
mysql -u root -p < database/init.sql
```

---

## 🔄 Flujo de Desarrollo

### 1. Crear una rama feature
```bash
git checkout -b feature/tu-feature-name
git pull origin master
```

### 2. Hacer cambios

#### Frontend
```bash
cd frontend
bun run dev

# Editar archivos en src/
# Los cambios se reflejan en tiempo real
```

#### Backend
```bash
cd backend
mvn spring-boot:run

# Editar archivos en src/
# Maven recarga automáticamente (en algunos IDEs)
```

### 3. Probar cambios
```bash
# Frontend
cd frontend
bun run build
bun run preview

# Backend
mvn test
```

### 4. Commit y Push
```bash
git add .
git commit -m "feat: descripción de cambios"
git push origin feature/tu-feature-name
```

### 5. Pull Request
- Ir a GitHub
- Crear PR contra `master`
- Esperar review y merge

---

## 📁 Estructura del Código

### Frontend (`frontend/src`)
```
src/
├── routes/           # TanStack Router pages
│   ├── __root.tsx    # Layout raíz
│   ├── index.tsx     # Página inicio
│   ├── auth.tsx      # Autenticación
│   ├── productos.tsx # Catálogo
│   └── admin.*       # Dashboard admin
├── components/       # Componentes reutilizables
│   ├── Header.tsx
│   ├── ui/           # Componentes shadcn/ui
│   └── ...
├── lib/              # Utilities y contextos
│   ├── auth-context.tsx
│   ├── cart-context.tsx
│   └── utils.ts
├── integrations/     # Integraciones externas
│   └── supabase/     # Auth y BD de Supabase
├── hooks/            # Custom React hooks
├── styles/           # CSS global
└── assets/           # Imágenes, fuentes, etc
```

### Backend (`backend/src/main/java/com/example`)
```
src/
├── controller/       # Endpoints REST
├── service/          # Lógica de negocio
├── repository/       # Acceso a datos (JPA)
├── entity/           # Modelos JPA
├── config/           # Configuración Spring
└── exception/        # Excepciones personalizadas
```

---

## 🔐 Variables de Entorno

### Frontend (`.env.local`)
```env
VITE_API_URL=http://localhost:8080/api
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Backend (`application-dev.properties`)
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/salud_caribe_db
spring.datasource.username=salud_user
spring.datasource.password=salud_password
spring.jpa.hibernate.ddl-auto=update
```

---

## 🧪 Testing

### Frontend
```bash
cd frontend
# Configurar Jest/Vitest según tu setup
npm test
```

### Backend
```bash
cd backend
mvn test

# Test específico
mvn test -Dtest=NombreDelTest
```

---

## 📤 Deployment

### Frontend en Vercel
1. Connect GitHub repo en Vercel
2. Select `frontend` directory
3. Environment variables:
   - `VITE_API_URL`: Tu backend URL
4. Deploy

### Backend en Heroku/Railway/etc
```bash
# Crear JAR
cd backend
mvn clean package

# Desplegar tu JAR a tu plataforma
```

### Database en XAMPP
Ver sección de importación en `DEPLOYMENT.md`

---

## 🐛 Debugging

### Frontend
```bash
# Acceder DevTools en navegador
F12 en http://localhost:3000

# Ver logs en consola
console.log() en components
```

### Backend
```bash
# Configurar logs
logging.level.com.example=DEBUG

# Debugger en IDE (VS Code / IntelliJ)
# F5 para start debugging
# Breakpoints en el código
```

### Database
```bash
# Acceder phpMyAdmin
http://localhost/phpmyadmin

# O vía CLI
mysql -u salud_user -p salud_password salud_caribe_db
SELECT * FROM products;
```

---

## 📝 Convenciones de Código

### Commits
```
feat: nueva funcionalidad
fix: corrección de bug
docs: documentación
style: formato/estilo
refactor: restructuración
perf: mejora de rendimiento
test: agregar/modificar tests
chore: tareas de mantenimiento
```

### Nombrado de Ramas
```
feature/auth-system
bugfix/cart-calculation
docs/update-readme
```

### TypeScript/React
- Usar componentes funcionales
- Type everything with TypeScript
- Usar hooks personalizados para lógica reutilizable
- Props bien tipados

### Java/Spring Boot
- Usar @RestController y @RequestMapping
- Inyección de dependencias
- Separación de capas (Controller → Service → Repository)
- Manejo de excepciones con @ControllerAdvice

---

## 🆘 Troubleshooting Común

| Problema | Solución |
|----------|----------|
| Puerto en uso | Cambiar puerto o matar proceso en ese puerto |
| BD no se conecta | Verificar credenciales y que MySQL esté corriendo |
| Build error | `mvn clean install` o `bun install --force` |
| Hot reload no funciona | Reiniciar servidor (Ctrl+C y volver a iniciar) |
| Error CORS | Verificar `SPRING_WEB_CORS_ALLOWED_ORIGINS` |

---

## 📚 Recursos Útiles

- [Spring Boot Docs](https://spring.io/projects/spring-boot)
- [React Docs](https://react.dev)
- [TanStack Router](https://tanstack.com/router)
- [MySQL Docs](https://dev.mysql.com/doc)
- [Docker Docs](https://docs.docker.com)
- [Tailwind CSS](https://tailwindcss.com)

---

¡Happy coding! 🚀
