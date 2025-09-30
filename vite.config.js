import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  
  build: {
    sourcemap: false, 
    
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/database'],
          utils: ['qrcode', 'html2canvas', 'jspdf', 'file-saver']
        }
      }
    },
    
    minify: 'esbuild',
    target: 'esnext',
    assetsInlineLimit: 4096,
    chunkSizeWarningLimit: 1000
  },
  server: {
    port: 3000,
    open: true,
    host: true,
    historyApiFallback: true
  },
  preview: {
    port: 3000,
    open: true,
    host: true,
    historyApiFallback: true
  },
  envPrefix: 'VITE_',
  define: {
    __PROD__: JSON.stringify(process.env.NODE_ENV === 'production')
  }
})
