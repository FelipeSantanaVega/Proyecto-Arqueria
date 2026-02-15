# Proyecto Arqueria

Aplicación web para gestión de entrenamientos de tiro con arco.

Incluye:
- Gestión de ejercicios
- Gestión de alumnos
- Creación y edición de rutinas semanales
- Asignación de rutinas a alumnos
- Panel de administración de rutinas activas

## Stack

- Backend: FastAPI (Python, Poetry)
- Frontend: React + Chakra UI (Vite, pnpm)
- Base de datos: MariaDB (local con XAMPP)
- Auth: JWT

## Estructura del repo

- `backend`: API FastAPI, modelos, routers y seguridad
- `frontend`: aplicación React
- `db`: esquema SQL y migraciones

## Requisitos

- Python 3.11+
- Poetry
- Node.js 18+ (recomendado 20+)
- pnpm
- MariaDB (XAMPP u otra instalación local)

## Variables de entorno

- Base del proyecto: `.env.example`
- Frontend: `frontend/.env.example`

Crear tus archivos:
- `.env`
- `frontend/.env`

No subir credenciales reales al repositorio.

## Base de datos

1. Crear la DB y tablas:
```sql
SOURCE db/schema.sql;
```

2. (Opcional) aplicar hardening/migración:
```sql
SOURCE db/migrations/2026-02-13-db-hardening.sql;
```

## Backend (FastAPI)

Desde `backend/`:

1. Instalar dependencias:
```bash
poetry install
```

2. Levantar servidor:
```bash
poetry run uvicorn app.main:app --reload --port 8000
```

3. Documentación:
- Swagger UI: `http://127.0.0.1:8000/docs`

## Frontend (React)

Desde `frontend/`:

1. Instalar dependencias:
```bash
pnpm install
```

2. Levantar app:
```bash
pnpm dev
```

3. URL local:
- `http://localhost:5173`

## Flujo funcional actual

- Login con JWT
- Persistencia de sesión en frontend
- Roles soportados: `admin`, `professor`, `student`
- CRUD de ejercicios
- CRUD de alumnos + activar/desactivar
- Rutinas semanales:
  - crear
  - editar
  - eliminar
  - visualización por día con contador de flechas por día y total semanal
- Asignaciones:
  - asignar rutina existente
  - crear y asignar rutina
  - eliminar rutina activa asignada
  - restricción de 1 rutina activa por alumno por semana
- Dashboard:
  - estado API
  - listado de rutinas activas asignadas a alumnos

## Endpoints principales

- Auth:
  - `POST /auth/login`
- Health:
  - `GET /health`
- Exercises:
  - `GET /exercises`
  - `POST /exercises`
  - `PUT /exercises/{id}`
  - `DELETE /exercises/{id}`
- Students:
  - `GET /students`
  - `POST /students`
  - `PUT /students/{id}`
  - `PATCH /students/{id}/status`
- Routines:
  - `GET /routines`
  - `POST /routines`
  - `PUT /routines/{id}`
  - `DELETE /routines/{id}`
- Assignments:
  - `GET /assignments`
  - `POST /assignments`
  - `DELETE /assignments/{id}`

## Notas

- Para producción, configurar CORS, secretos JWT y credenciales seguras.
- Si `poetry` o `pnpm` no están en PATH, usar la ruta completa del ejecutable.
