# Guía de Despliegue — Las Togas

Stack: Backend en Render · Base de datos en Neon (PostgreSQL) · Frontend en Vercel

---

## 1. Base de datos — Neon.tech (gratis, 24/7)

1. Crear cuenta en https://neon.tech
2. Crear nuevo proyecto → nombre: `las-togas`
3. Copiar la **Connection string** que tiene este formato:
   ```
   postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```
4. Guardarla, la necesitas en el paso 2.

---

## 2. Backend — Render.com (gratis, se duerme tras 15min sin uso)

1. Crear cuenta en https://render.com
2. New → Web Service → conectar tu repositorio de GitHub
3. Configuración:
   - **Root Directory:** `backend`
   - **Build Command:** `npm ci --omit=dev`
   - **Start Command:** `node src/index.js`
   - **Instance Type:** Free
4. Variables de entorno (en la sección Environment):
   ```
   DATABASE_URL    = [la connection string de Neon]
   DB_SSL          = true
   JWT_SECRET      = [genera una cadena aleatoria larga]
   ADMIN_EMAIL     = admin@rental.com
   ADMIN_PASSWORD  = [tu contraseña segura]
   FRONTEND_URL    = https://[tu-app].vercel.app
   BACKEND_URL     = https://[tu-backend].onrender.com
   ```
5. Deploy → esperar que diga "Live"
6. Copiar la URL del backend: `https://las-togas-backend.onrender.com`

---

## 3. Frontend — Vercel (gratis, 24/7, CDN global)

1. Crear cuenta en https://vercel.com
2. New Project → importar repositorio
3. Configuración:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Variables de entorno:
   ```
   VITE_API_URL = https://[tu-backend].onrender.com
   ```
5. Deploy

---

## 4. Verificar que todo funciona

1. Abrir `https://[tu-app].vercel.app`
2. Login con `admin@rental.com` y la contraseña que pusiste
3. Crear una prenda de prueba
4. Si algo falla, revisar logs en Render → tu servicio → Logs

---

## Notas importantes

- **Imágenes subidas:** En el free tier de Render el sistema de archivos es efímero (se borra al redeploy). Para producción real, migrar uploads a Cloudinary o AWS S3. Por ahora funciona entre reinicios normales.
- **Sleep en Render free:** El backend se duerme tras 15 minutos sin peticiones. La primera visita tarda ~30 segundos en despertar. Para evitarlo, usar un servicio de ping como https://uptimerobot.com (gratis) que haga una petición a `/api/health` cada 10 minutos.
- **Neon free tier:** 0.5GB de almacenamiento, suficiente para miles de registros.

---

## Desarrollo local (con Docker)

```bash
docker compose up -d
```

Acceder en http://localhost
