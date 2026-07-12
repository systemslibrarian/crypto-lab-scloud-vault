import { defineConfig } from 'vitest/config';

// Unit tests for the hand-rolled crypto live in test/ (*.test.ts).
// The Playwright a11y suite lives in e2e/ and must NOT be collected by vitest
// (it uses @playwright/test, a different runner).
export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
    environment: 'node',
  },
});
