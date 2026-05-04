import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
     
  ],
  build:{
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rolldownOptions:{
      output:{
        manualChunks:{
           vendor:  ['react', 'react-dom', 'react-router-dom'],
          charts:  ['recharts', 'chart.js', 'react-chartjs-2', 'react-gauge-chart', 'react-is', 'prop-types'],
          socket:  ['socket.io-client'],
        }
      }
    }

  },
  optimizeDeps:{
    include:[
      'react-gauge-chart',
      'react-is',
       'prop-types',
    ]
  },
   commonjsOptions: {
    include: [/node_modules/],
  },
});
