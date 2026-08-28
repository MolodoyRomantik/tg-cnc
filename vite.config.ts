import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/tg-cnc/',
  plugins: [react()],
  // Allow Cloudflare quick-tunnel hostnames (random *.trycloudflare.com per run) so the
  // preview/dev server doesn't reject the forwarded Host header as a DNS-rebinding attempt.
  server: {
    allowedHosts: ['.trycloudflare.com'],
  },
  preview: {
    allowedHosts: ['.trycloudflare.com'],
  },
})
