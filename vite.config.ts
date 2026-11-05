import { defineConfig } from 'vitest/config';
// @ts-expect-error JavaScript Vite middleware is development-only.
import privateHistory from './scripts/local-history-plugin.mjs';
import react from '@vitejs/plugin-react';
export default defineConfig({plugins:[react(), privateHistory], server: { cors: false, fs: { deny: ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', '**/local/**'] } }, test:{environment:'jsdom'}});
