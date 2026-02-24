# Proyecto Arquería

Aplicación web para gestionar entrenamientos de tiro con arco: ejercicios, alumnos, rutinas, asignaciones activas y exportación de rutina a PDF.

## Stack
- Backend: FastAPI + SQLAlchemy + Poetry
- Frontend: React + Vite + TypeScript + Chakra UI + pnpm
- Base de datos: MariaDB (actualmente local, compatible con migración a hosting)
- Auth: JWT

## Estructura
- `backend`: API, modelos, seguridad, generación de PDF
- `frontend`: interfaz web
- `db`: schema SQL y migraciones

## Requisitos
- Python 3.11+
- Poetry
- Node.js 18+ (recomendado 20+)
- pnpm
- MariaDB

## Variables de entorno
- Raíz: `.env.example` -> `.env`
- Frontend: `frontend/.env.example` -> `frontend/.env`

## Base de datos
Ejecutar:
```sql
SOURCE db/schema.sql;
```

Opcional (hardening):
```sql
SOURCE db/migrations/2026-02-13-db-hardening.sql;
```

## Backend
Desde `backend/`:

```bash
poetry install
poetry run uvicorn app.main:app --reload --port 8000
```

Swagger:
- `http://127.0.0.1:8000/docs`

## Frontend
Desde `frontend/`:

```bash
pnpm install
pnpm dev
```

App:
- `http://localhost:5173`

## Funcionalidades actuales
- Login JWT con persistencia de sesión.
- Panel profesor con secciones:
  - Administrar rutinas activas
  - Rutinas (plantillas)
  - Ejercicios
  - Alumnos
- Ejercicios:
  - crear, editar, eliminar
  - búsqueda y tarjetas desplegables
- Alumnos:
  - crear, editar, activar/desactivar
  - clasificación en activos/inactivos
  - asignación de rutina solo para alumnos activos
- Rutinas (plantillas):
  - crear, editar, eliminar
  - flujo por días numerados (`Día 1...Día 7`)
  - agregar/quitar días y ejercicios
- Asignaciones:
  - asignar rutina existente
  - crear rutina temporal para un alumno
  - edición temporal de ejercicios durante asignación
  - selección de fecha de inicio con calendario y fin automático semanal
  - una rutina activa por alumno por semana
- Rutinas activas:
  - listado por alumno
  - eliminación de asignación
  - exportación PDF
- PDF:
  - exporta la rutina activa con datos efectivos (incluyendo overrides temporales)
  - formato de nombre: `PLAN SEMANAL [Alumno] [DD]-[MM] a [DD]-[MM].pdf`

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
  - `PATCH /assignments/{id}/status`
  - `DELETE /assignments/{id}`
  - `GET /assignments/{id}/pdf`

## Notas
- Configurar secretos y credenciales seguras para producción.
- Si `poetry` o `pnpm` no están en PATH, usar ruta completa del ejecutable.
