# Plataforma Educativa Multi-Institución

Sistema integral de gestión académica para colegios y universidades, con soporte multi-institucional basado en subdominios. Inspirado en Q10.

## Arquitectura

```
/
├── api/                      # API (Express + PostgreSQL + JWT)
│   ├── src/                  # Rutas, auth, middleware
│   ├── schema.sql            # Esquema de tablas
│   ├── scripts/setup.js      # Crea esquema y siembra datos iniciales (db.json)
│   └── db.json               # Datos iniciales de seed
├── client/                   # Frontend (React + Vite + TypeScript + Tailwind)
└── docker-compose.yml        # Despliegue: PostgreSQL + API + Nginx
```

## Tecnologías

| Capa | Tecnología |
|---|---|
| Frontend | React 19 + Vite 8 + TypeScript 6 |
| Estilos | Tailwind CSS 4 |
| Gráficas | Recharts |
| Backend | Express + PostgreSQL 16 |
| Auth | JWT + bcrypt (passwords hasheadas) |
| Exportación | jsPDF, SheetJS (xlsx) |
| Despliegue | Docker Compose + Nginx + Let's Encrypt |

## Inicio Rápido (Docker - recomendado)

```bash
# 1. Configura las variables (opcional; hay defaults)
cp .env.example .env

# 2. Construye e inicia todo
docker compose up -d --build

# 3. Abre el frontend
#    http://localhost:8080
```

El primer arranque crea el esquema en PostgreSQL y siembra los datos de `api/db.json` automáticamente. Los datos persisten en el volumen `pgdata`.

## Desarrollo Local

### 1. API

Necesitas PostgreSQL corriendo. Luego:

```bash
cd api
cp .env.example .env      # ajusta DATABASE_URL si es necesario
npm install
npm run setup             # crea tablas + seed inicial (solo si la DB está vacía)
npm run dev               # http://localhost:5000
```

### 2. Cliente

```bash
cd client
npm install
npm run dev               # http://localhost:5173 (proxya /api → localhost:5000)
```

## Despliegue a Producción

### 1. VPS con Docker

```bash
git clone <tu-repo> && cd <carpeta>
cp .env.example .env
# Edita .env: JWT_SECRET obligatorio, POSTGRES_PASSWORD fuerte
docker compose up -d --build
```

### 2. DNS

Crea un registro **wildcard** y el subdominio del portal admin apuntando a tu VPS:

- `*.tudominio.com` → IP del VPS
- `admin.tudominio.com` → IP del VPS

### 3. Nginx + dominio real

El archivo `client/nginx.conf` usa el placeholder `TU_DOMINIO`. Reemplázalo por tu dominio real:

```nginx
server_name ~^(?<subdomain>.+)\.tudominio\.com$;   # instituciones
server_name admin.tudominio.com;                    # portal super admin
```

Luego reconstruye el contenedor del cliente: `docker compose up -d --build client`.

### 4. SSL (Let's Encrypt)

Con `certbot` en el host, apuntando a los contenedores:

```bash
# opción 1: certbot standalone + recargar nginx del contenedor
docker compose run --rm --service-ports certbot certonly --standalone \
  -d tudominio.com -d '*.tudominio.com' -d admin.tudominio.com \
  --preferred-challenges http
```

> Recomendado: añadir un contenedor `certbot` + `certbot.timer` para renovación automática, y redirigir HTTP→HTTPS en `nginx.conf`.

### 5. Backups

```bash
docker compose exec db pg_dump -U platform platform > backup_$(date +%F).sql
```

## Credenciales de Prueba (seed inicial)

> La base de datos se despliega vacía con un único super administrador.
> Inicia sesión y desde el dashboard crea instituciones, usuarios, grados y materias.

### Super Admin (sin subdominio)
- `karl26chy@gmail.com` / `olafo1234`

## Funcionalidades

- **Super Admin:** CRUD de instituciones, activar/desactivar
- **Admin:** Gestión de usuarios, grados, materias, asignaciones profesor-materia-grado, dashboard con métricas y materias deficientes
- **Profesor:** Toma de asistencia, ingreso de notas, citaciones, mensajería privada
- **Estudiante:** Gráfico de rendimiento con nota mínima, historial de asistencias, citaciones, mensajería

## Seguridad

- Contraseñas hasheadas con bcrypt (nunca se devuelven por el API)
- Autenticación JWT con expiración; las rutas de escritura y lectura están protegidas
- Lecturas públicas: solo `GET /institutions` (necesario para el login; si va con token válido, se acota a la institución del usuario)
- **Aislamiento multi-institucional:** cada usuario solo lee datos de su institución; los estudiantes solo ven SUS notas/asistencias/citaciones
- **RBAC de escritura:** solo el Super Admin gestiona instituciones; solo los admins crean usuarios/grados/materias; los profesores solo registran notas/asistencia/evaluaciones de su materia-grado asignada; los estudiantes no escriben datos académicos
- **Validación de notas server-side:** rango 0–10 (colegio) o 0–5 (universidad), según la institución; una nota por estudiante y evaluación (duplicados → 409)
- Rate limiting en `/auth/login` (anti fuerza bruta)
- Security headers (CSP, X-Frame-Options, nosniff) en Nginx

## Módulo de Notas

- **Upsert:** al guardar calificaciones se actualiza la nota existente del estudiante en esa evaluación (no crea duplicados)
- **Prefill:** al seleccionar una evaluación ya calificada se muestran las notas guardadas para editar
- **Escala por institución:** `0–10` colegios, `0–5` universidades
- **Promedios ponderados:** el rendimiento por materia usa `Σ(nota × porcentaje) / Σ(porcentaje)` (gráfica del estudiante, métricas y boletín del admin)

## Fases

- [x] FASE 1: Setup del proyecto
- [x] FASE 2: Super Admin
- [x] FASE 3: Admin Institución
- [x] FASE 4: Profesor
- [x] FASE 5: Estudiante
- [x] FASE 6: Exportación PDF/Excel
- [ ] FASE 7: Pruebas automatizadas
- [ ] FASE 8: Despliegue producción (SSL + dominio)
