import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@691sim/serialization',
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
