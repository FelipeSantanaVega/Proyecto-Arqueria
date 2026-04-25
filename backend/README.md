# Archery Training API

API FastAPI para gestionar ejercicios, deportistas, rutinas, asignaciones, usuarios y autenticacion JWT.

## Requisitos
- Python 3.10-3.12
- Poetry
- PostgreSQL local o remoto

## Configuracion
1. Copia el `.env.example` de la raiz a `.env`.
2. Ajusta `DATABASE_URL` y `DB_ENGINE`.
3. Instala dependencias:

```sh
poetry install
```

## Ejecucion local

### Opcion recomendada: con Docker
Desde la raiz del proyecto:

```sh
docker compose -f docker-compose.local.yml up -d --build
```

El backend queda expuesto en:
- `http://127.0.0.1:8000`
- Swagger: `http://127.0.0.1:8000/docs`

### Opcion manual
Desde `backend/`:

```sh
poetry run uvicorn app.main:app --reload --port 8000
```

## Variables importantes
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

## Autenticacion
- `POST /auth/login`: devuelve `access_token` y `refresh_token`
- `POST /auth/refresh`: rota tokens usando el refresh token vigente
- `POST /auth/logout`: invalida la sesion incluso si el access token ya vencio, siempre que se envie el refresh token
- `GET /auth/me`: datos del usuario autenticado
- `POST /auth/change-password`: cambia contrasena e invalida la sesion activa

Usar:
```http
Authorization: Bearer <access_token>
```

## Modulos

### Users
- `GET /users`
- `POST /users`
- `PUT /users/{user_id}`

Reglas:
- `admin` puede listar y administrar usuarios
- `admin` y `professor` pueden crear usuarios
- `professor` solo puede crear usuarios `student`

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

## Comportamiento relevante del backend
- Aplica visibilidad por propietario en ejercicios, rutinas y deportistas.
- Ejecuta mantenimiento de esquema al iniciar:
  - auth schema
  - ownership schema
  - ajustes de ejercicios/rutinas
  - retencion de deportistas
- Genera PDF de rutinas activas.
- Mantiene historial de rutinas finalizadas.

## Testing
Ejemplo de test puntual:

```sh
poetry run pytest tests/test_auth_logout.py
```

## Notas
- El entorno local actual del proyecto usa PostgreSQL, aunque algunos ejemplos heredados del repo todavia mencionen MySQL.
- El pool SQLAlchemy usa `pool_pre_ping` para reconexion.
- CORS esta preparado para `http://localhost:5173` y `http://127.0.0.1:5173`.
