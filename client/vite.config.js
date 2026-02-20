import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        proxy: {
            '/api/loan': {
                target: 'http://127.0.0.1:8000',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api\/loan/, ''),
            },
            '/api': {
                target: 'http://127.0.0.1:5000',
                changeOrigin: true,
            },
            '/socket.io': {
                target: 'http://127.0.0.1:5000',
                ws: true,
            },
        },
    },
})
