import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  
  // Production optimizations
  build: {
    // Generate source maps for production debugging
    sourcemap: false, // Set to true if you need debugging in production
    
    // Optimize bundle size
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunks for better caching
          vendor: ['react', 'react-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/database'],
          utils: ['qrcode', 'html2canvas', 'jspdf', 'file-saver']
        }
      }
    },
    
    // Minify for production
    minify: 'esbuild',
    target: 'esnext',
    
    // Asset optimization
    assetsInlineLimit: 4096, // 4kb
    
    // Chunk size warnings
    chunkSizeWarningLimit: 1000
  },
  
  // Development server configuration
  server: {
    port: 3000,
    open: true,
    host: true
  },
  
  // Preview server configuration
  preview: {
    port: 3000,
    open: true,
    host: true
  },
  
  // Environment variables prefix
  envPrefix: 'VITE_',
  
  // Define global constants
  define: {
    // Remove console statements in production
    __PROD__: JSON.stringify(process.env.NODE_ENV === 'production')
  }
})
