# Plataforma Educativa Multi-Institución

Sistema integral de gestión académica para colegios y universidades, con soporte multi-institucional basado en subdominios. Inspirado en Q10.

## Arquitectura

```
/
├── api/          # Mock API (json-server)
├── client/       # Frontend (React + Vite + TypeScript + Tailwind)
└── docker-compose.yml  # Despliegue con Nginx + SSL
```

## Tecnologías

| Capa | Tecnología |
|---|---|
| Frontend | React 19 + Vite 8 + TypeScript 6 |
| Estilos | Tailwind CSS 4 |
| Gráficas | Recharts |
| Backend | json-server (mock) |
| Exportación | jsPDF, SheetJS (xlsx) |
| Despliegue | Docker + Nginx + Let's Encrypt |

## Inicio Rápido

### 1. API (Mock)

```bash
cd api
npm install
npm run server    # http://localhost:5000
```

### 2. Cliente

```bash
cd client
npm install
npm run dev       # http://localhost:5173
```

### 3. Producción (Docker)

```bash
docker-compose up -d
```

## Credenciales de Prueba

### Super Admin (sin subdominio)
- `super@admin.com` / `password123`

### Colegio San Ignacio (`colegiosanignacio.plataforma.com`)
| Rol | Email |
|---|---|
| Admin | admin@sanignacio.com |
| Profesor | luis.sociales@sanignacio.com |
| Profesor | marta.mates@sanignacio.com |
| Estudiante | estudiante1@sanignacio.com |
| Estudiante | estudiante2@sanignacio.com |

### Universidad de Antioquia (`udea.plataforma.com`)
| Rol | Email |
|---|---|
| Admin | admin@udea.edu.co |
| Profesor | prof.calculo@udea.edu.co |
| Estudiante | estudiante.calculo@udea.edu.co |

## Funcionalidades

- **Super Admin:** CRUD de instituciones, activar/desactivar
- **Admin:** Gestión de usuarios, grados, materias, asignaciones profesor-materia-grado, dashboard con métricas y materias deficientes
- **Profesor:** Toma de asistencia, ingreso de notas, citaciones, mensajería privada
- **Estudiante:** Gráfico de rendimiento con nota mínima, historial de asistencias, citaciones, mensajería

## Fases

- [x] FASE 1: Setup del proyecto
- [x] FASE 2: Super Admin
- [x] FASE 3: Admin Institución
- [x] FASE 4: Profesor
- [x] FASE 5: Estudiante
- [x] FASE 6: Exportación PDF/Excel
- [ ] FASE 7: Pruebas automatizadas
- [ ] FASE 8: Despliegue producción
