import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Change the object to this function syntax
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor';
            }
            if (
              id.includes('recharts') || 
              id.includes('chart.js') || 
              id.includes('react-chartjs-2') || 
              id.includes('react-gauge-chart')
            ) {
              return 'charts';
            }
            if (id.includes('socket.io-client')) {
              return 'socket';
            }
          }
        }
      }
    }
  },
});
