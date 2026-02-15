# Archery Training API (FastAPI + Poetry)

## Requisitos
- Python 3.10-3.12
- Poetry
- Base de datos MySQL/MariaDB corriendo (local XAMPP por ahora)

## Configuración
1. Copia el `.env.example` de la raíz a `.env` y ajusta credenciales:
   ```sh
   cp ../.env.example ../.env
   ```
2. Instala dependencias:
   ```sh
   poetry install
   ```

3. Credenciales por defecto usadas en `.env` (ajusta luego para producción):
   - `DB_HOST=localhost`
   - `DB_PORT=3306`
   - `DB_USER=archery_user`
   - `DB_PASSWORD=archery_pass`
   - `DB_NAME=archery_training`

## Ejecutar en desarrollo
```sh
poetry run uvicorn app.main:app --reload --port 8000
```

Endpoints de prueba:
- `GET /health` comprueba conexión a DB.
- `GET /` mensaje simple.
- Autenticación JWT:
  - `POST /auth/login` recibe `{ "username": "...", "password": "..." }` y devuelve `access_token`.
  - Usa el token como `Authorization: Bearer <token>` en los POST/creación.
- Usuarios semilla:
  - `profesor` / `profesor123` (rol: professor).
- CRUD básico:
  - `GET /exercises` lista ejercicios.
  - `POST /exercises` crea ejercicio.
  - `GET /students` lista alumnos.
  - `POST /students` crea alumno.
  - `POST /routines` crea rutina con días y ejercicios anidados.
  - `GET /routines` lista rutinas con días/ejercicios.
  - `POST /assignments` asigna una rutina a un alumno.

Ejemplos rápidos (JSON):
```json
// Crear ejercicio
{
  "name": "Calentamiento 18m",
  "arrows_count": 30,
  "distance_m": 18,
  "description": "Serie suave"
}
```
```json
// Crear rutina semanal (día 1 con 2 ejercicios)
{
  "name": "Semana Base",
  "description": "Rutina introductoria",
  "days": [
    {
      "day_number": 1,
      "name": "Lunes",
      "exercises": [
        { "exercise_id": 1, "sort_order": 1, "arrows_override": 20 },
        { "exercise_id": 2, "sort_order": 2, "distance_override_m": 30.0 }
      ]
    }
  ]
}
```
```json
// Asignar rutina a alumno
{
  "student_id": 1,
  "routine_id": 1,
  "status": "active"
}
```

## Notas
- La cadena de conexión se arma desde `.env` o `DATABASE_URL`. Por defecto usa `mysql+pymysql://archery_user:archery_pass@localhost:3306/archery_training`.
- Pool `pre_ping` habilitado para reconexiones cuando Render/local corte conexiones o haya idle timeout.
- CORS habilitado para `http://localhost:5173` y `http://127.0.0.1:5173` (frontend Vite).
