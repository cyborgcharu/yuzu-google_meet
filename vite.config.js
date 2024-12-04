// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';
  
  return {
    plugins: [react()],
    
    // Production build settings
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: true
    },
    
    // Base URL configuration
    base: '/',
    
    // Development server configuration
    server: {
      port: 8080,
      proxy: isProduction ? {} : {
        '/meetings': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('proxy error', err);
            });
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log('Sending Request:', req.method, req.url);
            });
            proxy.on('proxyRes', (proxyRes, req, _res) => {
              console.log('Received Response:', proxyRes.statusCode, req.url);
            });
          }
        },
        '/auth': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
          ws: true,
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('proxy error', err);
            });
          }
        },
        '/socket.io': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          ws: true
        }
      }
    },
    
    // Path aliases
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    },
    
    // Optimization settings
    optimizeDeps: {
      include: ['react', 'react-dom'],
      exclude: ['@/components/ui']
    },
    
    // Environment variable handling
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode)
    },
    
    // CSS settings
    css: {
      devSourcemap: true,
      modules: {
        scopeBehaviour: 'local'
      }
    },
    
    // Esbuild settings
    esbuild: {
      jsxInject: `import React from 'react'`,
      target: 'es2020'
    }
  };
});