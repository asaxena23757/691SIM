import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@691sim/verifier',
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
