import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
export default defineConfig(function (_a) {
    var mode = _a.mode;
    // Load environment variables from client directory
    var env = loadEnv(mode, process.cwd(), '');
    // Load environment variables from server directory to align proxy with configured backend port
    var serverEnv = loadEnv(mode, path.resolve(__dirname, '../server'), '');
    // Determine backend URL for proxying
    var backendPort = env.VITE_BACKEND_PORT || serverEnv.PORT || '5000';
    var backendUrl = env.VITE_BACKEND_URL || "http://localhost:".concat(backendPort);
    // Determine client port
    var clientPort = parseInt(env.VITE_PORT || env.PORT || '5173', 10);
    return {
        plugins: [react()],
        resolve: {
            alias: {
                '@': path.resolve(__dirname, './src'),
            },
        },
        server: {
            port: clientPort,
            watch: {
                usePolling: true,
                interval: 300,
                ignored: ['**/node_modules/**', '**/dist/**', '**/.git/**'],
            },
            proxy: {
                '/api': {
                    target: backendUrl,
                    changeOrigin: true,
                },
                '/socket.io': {
                    target: backendUrl,
                    changeOrigin: true,
                    ws: true,
                },
            },
        },
        build: {
            outDir: 'dist',
            sourcemap: false,
            rollupOptions: {
                output: {
                    manualChunks: {
                        vendor: ['react', 'react-dom', 'react-router-dom'],
                        ui: ['lucide-react', 'recharts', 'clsx'],
                    },
                },
            },
        },
    };
});
