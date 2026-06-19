import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@691sim/core',
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
