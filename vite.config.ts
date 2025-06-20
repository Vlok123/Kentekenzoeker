import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: 'https://www.carintel.nl',
        changeOrigin: true,
        secure: true,
        headers: {
          'Origin': 'https://www.carintel.nl'
        }
      }
    }
  },
}) 