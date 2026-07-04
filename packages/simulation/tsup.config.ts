import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: false, // declarations are emitted by `tsc -b` via project references
  sourcemap: true,
  clean: true,
});
