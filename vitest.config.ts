import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      'pdf-lib': path.resolve(__dirname, 'node_modules/pdf-lib/cjs/index.js'),
    },
  },
  test: {
    include: [
      'tests/unit/**/*.test.ts',
      'tests/unit/**/*.test.tsx',
      'tests/integration/**/*.test.ts',
      'tests/integration/**/*.test.tsx',
    ],
    environment: 'node',
    globals: true,
    // Integration tests use @vitest-environment happy-dom docblock per-file
    coverage: {
      reporter: ['text', 'html'],
      include: ['lib/**/*.ts'],
      exclude: ['**/*.d.ts'],
    },
  },
})
