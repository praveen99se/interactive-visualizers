import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
export default defineConfig({
    base: '/interactivevisualizers/',
    plugins: [react()],
    build: {
        sourcemap: false,
    },
    server: {
        host: '::',
        port: 5173,
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
});
