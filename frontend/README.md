# Frontend - Archery Training

Frontend React para login, gestion de ejercicios, deportistas, rutinas, asignaciones y perfil.

## Stack
- React 19
- Vite
- TypeScript
- Chakra UI
- pnpm

## Requisitos
- Node.js 20+
- pnpm

## Configuracion
1. Copia `frontend/.env.example` a `frontend/.env`
2. Configura la URL de la API:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

3. Instala dependencias:

```sh
pnpm install
```

4. Ejecuta en desarrollo:

```sh
pnpm dev
```

App:
- `http://localhost:5173`

## Funcionalidades actuales
- Login con JWT.
- Persistencia de sesion con `localStorage` o `sessionStorage`.
- Refresh automatico de `access_token`.
- Logout con limpieza local y soporte para revocacion de refresh token.
- Cambio de contrasena.
- Toggle para ver/ocultar contrasenas en formularios.
- Panel de profesor/admin con secciones:
  - administrar rutinas activas
  - rutinas
  - ejercicios
  - alumnos
  - perfil
- Carga de datos desde la API:
  - ejercicios
  - rutinas
  - deportistas
  - asignaciones
  - usuarios

## Notas
- El proyecto usa `pnpm` como package manager fijo.
- Si el backend corre en Docker local, usa `http://127.0.0.1:8000` como `VITE_API_BASE_URL`.
