import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/691SIM/',
  plugins: [react()],
  server: {
    port: 5173,
    open: false,
  },
});
