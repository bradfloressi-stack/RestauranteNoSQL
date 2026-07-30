import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Sin este plugin, Vite no sabe compilar archivos .vue (los trata como
// texto plano y truena). Es obligatorio en cualquier proyecto Vite+Vue.
//
// root: 'view' le dice a Vite que tu index.html e src/ viven dentro de
// view/, aunque este archivo de configuración esté en la raíz del proyecto
// (junto al backend). Así puedes correr "vite" desde la raíz sin mover nada.
export default defineConfig({
  root: 'view',
  build: {
    outDir: '../dist',
    emptyOutDir: true
  },
  plugins: [vue()],
})
