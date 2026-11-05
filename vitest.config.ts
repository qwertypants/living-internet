import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    // Keep the test renderer and app on the same ESM Three/Fiber instances.
    alias: {
      '@react-three/test-renderer': new URL('./node_modules/@react-three/test-renderer/dist/react-three-test-renderer.esm.js', import.meta.url).pathname,
      '@react-three/fiber': new URL('./node_modules/@react-three/fiber/dist/react-three-fiber.esm.js', import.meta.url).pathname,
      three: new URL('./node_modules/three/build/three.module.js', import.meta.url).pathname,
    },
    server: { deps: { inline: ['@react-three/test-renderer', '@react-three/fiber', 'three'] } },
  },
});
