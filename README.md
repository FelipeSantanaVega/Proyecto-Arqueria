# Proyecto Arqueria

Aplicacion web para gestionar entrenamientos de tiro con arco: ejercicios, deportistas, rutinas, asignaciones semanales, historial, exportacion PDF y cuentas vinculadas para deportistas.

## Stack
- Backend: FastAPI + SQLAlchemy + Poetry
- Frontend: React 19 + Vite + TypeScript + Chakra UI + pnpm
- Base de datos local: PostgreSQL 16 en Docker
- Auth: JWT con `access_token` + `refresh_token`

## Estructura
- `backend`: API, modelos, seguridad, reglas de negocio
- `frontend`: interfaz web
- `db`: esquemas SQL base
- `Backup DB`: backup SQL usado para bootstrap local
- `docker-compose.local.yml`: stack local de DB + backend

## Requisitos
- Python 3.10-3.12
- Poetry
- Node.js 20+
- pnpm
- Docker Desktop

## Variables de entorno
- Raiz: `.env.example` -> `.env`
- Frontend: `frontend/.env.example` -> `frontend/.env`

## Entorno local recomendado

### 1. Levantar PostgreSQL y backend con Docker
```bash
docker compose -f docker-compose.local.yml up -d --build
```

Servicios esperados:
- DB local: `127.0.0.1:5432`
- API local: `http://127.0.0.1:8000`
- Swagger: `http://127.0.0.1:8000/docs`

La base local se inicializa con el backup de `Backup DB/archery_training_full_backup.sql`.

### 2. Levantar frontend
Desde `frontend/`:

```bash
pnpm install
pnpm dev
```

App:
- `http://localhost:5173`

## Configuracion local sugerida

### `.env`
Para usar la DB local de Docker:

```env
APP_ENV=local
APP_DEBUG=true
DATABASE_URL=postgresql+psycopg://archery_user:archery_pass@127.0.0.1:5432/archery_training
DB_ENGINE=postgresql
JWT_SECRET=change_me
JWT_ALGORITHM=HS256
JWT_EXPIRES_MIN=30
JWT_REFRESH_EXPIRES_MIN=43200
```

### `frontend/.env`
```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

## Funcionalidades actuales
- Login con JWT, refresh token y cierre de sesion robusto.
- Cambio de contrasena con invalidacion de sesion.
- Persistencia de sesion en `localStorage` o `sessionStorage`.
- Auto-refresh de access token en frontend cuando vence.
- Vista responsive para:
  - escritorio
  - tablet como escritorio compacto
  - movil con navegacion y flujos dedicados
- Inicio del profesor con resumen, accesos rapidos y rutinas en curso.
- Gestion de ejercicios:
  - crear, editar, eliminar
  - logica de rondas y flechas por ronda
- Gestion de deportistas:
  - crear, editar, activar/desactivar
  - creacion unificada de cuenta + ficha de deportista
  - vinculacion opcional entre `students` y `users`
  - purga de inactivos segun reglas del backend
- Gestion de rutinas:
  - plantillas y rutinas temporales
  - dias numerados del 1 al 7
  - ejercicios por dia con overrides
- Asignaciones:
  - una rutina activa por semana para cada deportista
  - historial de rutinas finalizadas
  - exportacion PDF
- Gestion de usuarios:
  - admin y professor pueden crear cuentas
  - professor solo puede crear usuarios `student`
- Aislamiento por propietario en ejercicios, rutinas y deportistas.
- Exportacion PDF de rutinas activa en escritorio y movil.

## Endpoints principales

### Auth
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me`
- `POST /auth/change-password`

### Users
- `GET /users`
- `POST /users`
- `PUT /users/{user_id}`

### Exercises
- `GET /exercises`
- `GET /exercises/{exercise_id}`
- `POST /exercises`
- `PUT /exercises/{exercise_id}`
- `DELETE /exercises/{exercise_id}`

### Students
- `GET /students`
- `GET /students/{student_id}`
- `POST /students`
- `PUT /students/{student_id}`
- `PATCH /students/{student_id}/status`

### Routines
- `GET /routines`
- `GET /routines/{routine_id}`
- `POST /routines`
- `PUT /routines/{routine_id}`
- `DELETE /routines/{routine_id}`

### Assignments
- `GET /assignments`
- `GET /assignments/history`
- `POST /assignments`
- `PATCH /assignments/{id}/status`
- `DELETE /assignments/{id}`
- `GET /assignments/{id}/pdf`
- `POST /assignments/{id}/pdf`
- `GET /assignments/{id}/pdf-download`

## Vista movil y prueba en telefono real

### Desde la PC
1. Levanta backend y frontend.
2. Abre `http://localhost:5173`.
3. Usa DevTools responsive.

### Desde un telefono en la misma red
1. Asegura que Vite escuche en LAN.
2. Configura `frontend/.env` o `frontend/.env.local`:

```env
VITE_API_BASE_URL=http://TU_IP_LOCAL:8000
```

3. Agrega el origen LAN del frontend a `CORS_ORIGINS` del backend.
4. Reinicia backend y frontend.
5. Abre en el telefono:

```text
http://TU_IP_LOCAL:5173
```

## Base de datos y migracion

### Esquema actual relevante
- `students.user_id` enlaza deportistas con cuentas de usuario.
- `created_by_user_id` se usa para aislamiento por profesor en:
  - `students`
  - `routines`
  - `exercises`
  - `student_routine_assignments`
  - `student_routine_history`
- Las restricciones unicas principales ya no son globales:
  - `uq_students_owner_document`
  - `uq_routines_owner_name`

### SQL base
- Esquema PostgreSQL actual:
  - `db/schema_postgres.sql`

### Migracion de datos del servidor al esquema nuevo
- Archivo generado:
  - [archery_training_server_merge_2026-05-11.sql](E:/Proyecto%20Arqueria/Backup%20DB/archery_training_server_merge_2026-05-11.sql)

Ese script:
- recrea las tablas principales
- crea la estructura nueva
- vuelve a insertar los datos del dump del servidor
- intenta vincular `students.user_id` con `users.id` cuando `users.username = students.document_number`

Importante:
- el script mantiene los datos del dump usado como origen
- no debe ejecutarse sin backup previo
- si hubo cambios nuevos en produccion despues de ese dump, no estaran incluidos

## Despliegue recomendado
1. Sacar un dump fresco de produccion.
2. Crear o preparar una base con el esquema nuevo.
3. Aplicar el SQL de migracion basado en el dump mas reciente.
4. Subir backend nuevo.
5. Probar:
   - login
   - deportistas
   - creacion de cuenta de deportista
   - asignacion de rutina
   - exportacion PDF
6. Subir frontend.
7. Mantener rollback listo con dump y backend anterior.

## Notas
- El backend corre tareas de mantenimiento al iniciar para ajustar esquema y retencion.
- El `.env.example` todavia conserva ejemplos MySQL y PostgreSQL, pero el flujo local actual usa PostgreSQL.
- Si Docker ya tenia volumen persistido, el backup inicial no se vuelve a importar automaticamente.
