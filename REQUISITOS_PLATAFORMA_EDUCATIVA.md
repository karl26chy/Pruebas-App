# Plataforma Educativa Multi-Institucion

## Requisitos del Sistema

---

### 1. ARQUITECTURA GENERAL

**Backend:** Node.js + Express / Python Django
**Base de datos:** PostgreSQL (relacional)
**Frontend:** React / Next.js (con subdominios)
**Autenticacion:** JWT + cookies
**Despliegue:** VPS con Nginx (reverse proxy + subdominios)

---

### 2. MODELO DE DATOS (Entidades principales)

#### 2.1 Usuarios
| Campo | Tipo |
|---|---|
| id | UUID |
| email | string (unico) |
| password_hash | string |
| rol | enum: super_admin, admin, teacher, student |
| nombre | string |
| apellido | string |
| institucion_id | FK (nullable para super_admin) |
| activo | boolean |

#### 2.2 Instituciones
| Campo | Tipo |
|---|---|
| id | UUID |
| nombre | string |
| subdominio | string (unico) |
| tipo | enum: colegio, universidad |
| nota_minima_aprobacion | decimal (configurable) |
| activa | boolean |

#### 2.3 Grados / Cursos
| Campo | Tipo |
|---|---|
| id | UUID |
| institucion_id | FK |
| nombre | string (ej: "6to", "10mo") |
| tipo_grado | string (A, B, C...) |

#### 2.4 Materias
| Campo | Tipo |
|---|---|
| id | UUID |
| nombre | string |
| descripcion | text |

#### 2.5 Asignacion Profesor-Materia-Grado
| Campo | Tipo |
|---|---|
| id | UUID |
| profesor_id | FK (users) |
| materia_id | FK |
| grado_id | FK |
| institucion_id | FK |

*Un profesor puede tener multiples registros aqui (ej: Luis -> Sociales+Grado6, Naturales+Grado6, Naturales+Grado10)*

#### 2.6 Estudiantes por Grado
| Campo | Tipo |
|---|---|
| id | UUID |
| estudiante_id | FK (users) |
| grado_id | FK |

#### 2.7 Asistencias
| Campo | Tipo |
|---|---|
| id | UUID |
| estudiante_id | FK |
| materia_id | FK |
| grado_id | FK |
| fecha | date |
| estado | enum: presente, ausente, tardanza |
| registrado_por | FK (profesor_id) |

#### 2.8 Notas
| Campo | Tipo |
|---|---|
| id | UUID |
| estudiante_id | FK |
| materia_id | FK |
| grado_id | FK |
| tipo_evaluacion | string (parcial, final, tarea, etc) |
| nota | decimal |
| periodo | string (periodo1, periodo2...) |
| registrado_por | FK (profesor_id) |

#### 2.9 Citaciones
| Campo | Tipo |
|---|---|
| id | UUID |
| estudiante_id | FK |
| materia_id | FK |
| fecha_citacion | datetime |
| motivo | text |
| estado | enum: pendiente, realizada, cancelada |
| creado_por | FK (profesor_id) |

#### 2.10 Mensajes
| Campo | Tipo |
|---|---|
| id | UUID |
| remitente_id | FK |
| destinatario_id | FK |
| materia_id | FK (nullable) |
| asunto | string |
| cuerpo | text |
| leido | boolean |
| created_at | datetime |

---

### 3. ROLES Y PERMISOS

#### SUPER ADMIN
- Crear instituciones (colegios/universidades)
- Asignar subdominios
- Crear admins para cada institucion
- Ver metricas globales
- Desactivar instituciones

#### ADMIN (Institucion)
- CRUD de grados, materias
- Crear profesores y estudiantes
- Asignar materias a profesores por grado
- Asignar estudiantes a grados
- Dashboard general:
  - Cantidad de estudiantes por grado/salon
  - Materias con deficit (bajo rendimiento)
  - Reportes exportables

#### PROFESOR
- Tomar asistencia por materia/grado
- Ingresar notas por materia/grado
- Enviar citaciones a estudiantes
- Enviar mensajes privados a estudiantes
- Ver su horario/materias asignadas

#### ESTUDIANTE
- Ver historial de asistencias (por materia)
- Ver notas por materia con grafica de rendimiento
- Linea minima (configurada por la institucion) en la grafica
- Ver citaciones pendientes
- Mensajeria privada con profesores

---

### 4. VISTAS / PANTALLAS

#### 4.1 Login (`/`)
- Login unico con email + password
- Redireccion por rol al dashboard correspondiente
- Deteccion automatica del subdominio

#### 4.2 Dashboard SUPER ADMIN
- Lista de instituciones
- Formulario crear institucion
- Metricas globales (opcional)

#### 4.3 Dashboard ADMIN
- Cards: total estudiantes, por grado, por salon
- Tabla: materias con peor rendimiento (top 5)
- Accesos rapidos: crear usuario, asignar materias

#### 4.4 Dashboard PROFESOR
- Lista de materias/grados asignados
- Boton "Tomar Asistencia" por cada materia
- Boton "Ingresar Notas"
- Bandeja de mensajes

#### 4.5 Dashboard ESTUDIANTE
- Grafica de rendimiento general (chart.js o recharts)
  - Eje X: periodos/materias
  - Eje Y: nota
  - Linea roja punteada: nota minima institucion
- Lista de asistencias recientes
- Citaciones pendientes (destacadas)
- Bandeja de mensajes

---

### 5. SUBDOMINIOS

- `admin.plataforma.com` -> Login / Super Admin
- `colegioxyz.plataforma.com` -> Instituto especifico
- `universidadabc.plataforma.com` -> Otro instituto

**Nginx config:**
```
server {
    listen 80;
    server_name ~^(?<subdomain>.+)\.plataforma\.com$;
    # Pasar subdominio a la app
    proxy_set_header X-Subdomain $subdomain;
    proxy_pass http://localhost:3000;
}
```

**Frontend:** Detectar `window.location.hostname` -> extraer subdominio -> cargar datos de esa institucion.

---

### 6. TECNOLOGIAS RECOMENDADAS

| Capa | Opcion 1 | Opcion 2 |
|---|---|---|
| Frontend | Next.js 14 (App Router) | React + Vite |
| Estilos | Tailwind CSS | Shadcn/ui |
| Graficas | Recharts | Chart.js |
| Backend | Next.js API Routes | Express.js |
| ORM | Prisma | TypeORM / Sequelize |
| DB | PostgreSQL | MySQL |
| Auth | NextAuth.js / JWT | Lucia Auth |
| Hosting | VPS (DigitalOcean) | Railway / Render |

---

### 7. PLAN DE TRABAJO (Fases)

#### FASE 1: Fundacion (Semana 1-2)
- [ ] Setup del proyecto (Next.js + Tailwind + Prisma + PostgreSQL)
- [ ] Modelo de datos completo
- [ ] Autenticacion (login, JWT, roles)
- [ ] Middleware de subdominios

#### FASE 2: Super Admin (Semana 2-3)
- [ ] CRUD de instituciones
- [ ] Dashboard super admin

#### FASE 3: Admin Institucion (Semana 3-4)
- [ ] CRUD grados, materias
- [ ] CRUD usuarios (profesores, estudiantes)
- [ ] Asignacion profesor-materia-grado
- [ ] Asignacion estudiante-grado
- [ ] Dashboard admin con metricas

#### FASE 4: Profesor (Semana 4-5)
- [ ] Toma de asistencia
- [ ] Ingreso de notas
- [ ] Envio de citaciones
- [ ] Mensajeria

#### FASE 5: Estudiante (Semana 5-6)
- [ ] Vista de asistencias
- [ ] Vista de notas con grafica
- [ ] Citaciones pendientes
- [ ] Bandeja de mensajes

#### FASE 6: Pulido (Semana 6-7)
- [ ] Pruebas
- [ ] Responsive design
- [ ] Seguridad (rate limiting, XSS, SQL injection)
- [ ] Despliegue con Nginx + SSL

---

### 8. REGLAS DE NEGOCIO IMPORTANTES

1. **Sin registro publico:** Solo SUPER ADMIN y ADMIN crean usuarios
2. **Un estudiante pertenece a un solo grado** (por periodo academico)
3. **Un profesor puede dar multiples materias** en multiples grados
4. **Cada institucion define su nota minima** de aprobacion
5. **Las asistencias son por materia**, no por dia general
6. **Los mensajes son 1 a 1** entre profesor y estudiante (no chats grupales)
7. **El subdominio determina** que institucion se esta visualizando
8. **SUPER ADMIN no pertenece** a ninguna institucion

---

### 9. PREGUNTAS PENDIENTES (a definir)

- [ ] ¿Los profesores pueden tener su propio login o entran como tipo de usuario ADMIN?
- [ ] ¿Periodos academicos: semestres, trimestres o bimestres?
- [ ] ¿Exportar reportes a PDF/Excel?
- [ ] ¿Soporte para multiples idiomas?
- [ ] ¿Notificaciones por email?
