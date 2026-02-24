import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-router': ['react-router-dom'],
          'vendor-chakra': [
            '@chakra-ui/react',
            '@chakra-ui/icons',
            '@emotion/react',
            '@emotion/styled',
            'framer-motion',
          ],
          'vendor-i18n': ['i18next', 'react-i18next'],
        },
      },
    },
  },
})
