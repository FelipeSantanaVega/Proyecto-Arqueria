# Frontend - Archery Training

Stack: React + Vite + TypeScript + Chakra UI (+ i18n listo para es/en).

## Requisitos
- Node 22+
- pnpm (se usa el bin local: `npx pnpm ...` si no está global)

## Configuración
1. Copia `.env.example` a `.env` y ajusta la URL de la API:
   ```
   VITE_API_BASE_URL=http://127.0.0.1:8000
   ```
2. Instala dependencias:
   ```sh
   cd frontend
   npx pnpm install
   ```
3. Ejecuta en desarrollo:
   ```sh
   npx pnpm dev -- --host --port 5173
   ```

## Qué hace esta maqueta
- Consume `/health`, `/exercises`, `/routines` del backend y muestra estado, ejercicios y rutinas semanales.
- Usa Chakra UI para el layout y `i18next` preparado para es/en (actualmente fijo en es).

## Notas
- El package manager está fijado a pnpm en `package.json` (`packageManager`).
- Si ya tienes pnpm global, puedes usar `pnpm dev` directamente.
