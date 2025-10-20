import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: './vitest.setup.ts',
    include: ['src/__tests__/**/*.test.ts'],
    coverage: {
      reporter: ['text', 'html'],
    },
  },
  resolve: {
    alias: {
      '@shared': '../shared',
    },
  },
});
