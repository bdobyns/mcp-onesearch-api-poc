import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/types.ts',
        'src/**/index.ts', // Export-only files
        'src/api/onesearchresponse.ts', // Type definitions only
        'deprecated/**/*'
      ],
      thresholds: {
        lines: 85,
        functions: 75, // Lower due to server-claude.ts module-level error handler
        branches: 85,
        statements: 85
      }
    }
  }
});
