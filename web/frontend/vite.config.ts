import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    // Monorepo: the Expo app hoists a different React to the root node_modules.
    // Force every import (incl. hoisted libs like lucide-react) to one React copy.
    dedupe: ['react', 'react-dom', 'react-router', 'react-router-dom'],
  },
})
