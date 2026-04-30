# SALUDCARIBE SHOPPING

Aplicación de compras para SALUDCARIBE con backend en Java Spring Boot y frontend en React + Vite.

## Estructura del Proyecto

- `backend/`: API REST con Spring Boot, JPA y H2 (base de datos en memoria).
- `frontend/`: Aplicación React + Vite con datos en localStorage del navegador.

## Requisitos

- Java 17 o superior
- Maven
- Node.js 18 o superior
- npm o bun

## Instalación y Ejecución

### Backend

1. Navega a la carpeta `backend`:
   ```
   cd backend
   ```

2. Instala dependencias y ejecuta:
   ```
   mvn spring-boot:run
   ```

   El backend estará disponible en `http://localhost:8080`.

   - API de categorías: `GET/POST/PUT/DELETE /api/categories`
   - API de productos: `GET/POST/PUT/DELETE /api/products`
   - API de usuarios: `GET/POST/PUT/DELETE /api/users`
   - API de pedidos: `GET/POST/PUT/DELETE /api/orders`

   Base de datos H2: Accede a `http://localhost:8080/h2-console` con JDBC URL `jdbc:h2:mem:testdb`, usuario `sa`, contraseña `password`.

### Frontend

1. Navega a la carpeta `frontend`:
   ```
   cd frontend
   ```

2. Instala dependencias:
   ```
   npm install
   # o bun install
   ```

3. Ejecuta en modo desarrollo:
   ```
   npm run dev
   # o bun run dev
   ```

   La aplicación estará disponible en `http://localhost:5173`.

   - Los datos se almacenan en localStorage del navegador.
   - Autenticación simulada (usuario admin por defecto).
   - Funcionalidades: ver productos, agregar al carrito, admin de categorías y productos.

## Despliegue

### Frontend en Vercel

1. Ve a [Vercel.com](https://vercel.com), conecta tu cuenta de GitHub.
2. Importa el repo `SALUDCARIBE-SOPPPING`.
3. En la configuración del proyecto:
   - **Root Directory**: Establece como `frontend`.
   - **Build Command**: `npm run build` (o `bun run build`).
   - **Output Directory**: deja el valor por defecto.
4. Asegúrate de que la configuración de Vercel lea los archivos en `frontend/vercel.json`.
5. Agrega las variables de entorno en Vercel si no están definidas:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_SUPABASE_PROJECT_ID`

Si el sitio muestra 404 después del deploy, fuerza un nuevo deploy en Vercel después de aplicar estos ajustes.

### Backend

El backend está diseñado para ejecución local. Para producción, despliega en un servidor con Java (ej. Heroku, AWS, etc.), cambiando la configuración de H2 a una base de datos persistente como PostgreSQL.

## Notas

- Los datos del frontend están en localStorage, por lo que se pierden al limpiar el navegador.
- El backend usa H2 en memoria, datos se pierden al reiniciar.
- Para persistencia, modifica las configuraciones a una base de datos real.

## Tecnologías

- Backend: Java, Spring Boot, JPA, H2
- Frontend: React, TypeScript, Vite, Tailwind CSS, shadcn/ui