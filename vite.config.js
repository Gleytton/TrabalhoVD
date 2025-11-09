// vite.config.js
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  // Mapeia a pasta 'data' como a pasta pública para assets (arquivos .parquet)
  publicDir: path.resolve(__dirname, './data'), 
});