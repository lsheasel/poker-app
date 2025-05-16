import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite Konfiguration
export default defineConfig({
  base: './', // Hier die Basis auf './' setzen
  plugins: [react()],
});
