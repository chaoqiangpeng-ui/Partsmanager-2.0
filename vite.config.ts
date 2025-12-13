import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    server: {
      host: true, // This exposes the app to the LAN (0.0.0.0)
      port: 5173
    },
    define: {
      // Polyfill process.env.API_KEY so the SDK code works without modification
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      // Prevent other process.env access from crashing
      'process.env': {}
    }
  }
})