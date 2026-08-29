import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // worker/ is a separate package with its own vitest run (`npm test` inside worker/) —
    // keep the two suites from colliding when running from the repo root.
    exclude: ['**/node_modules/**', '**/dist/**', 'worker/**'],
  },
});
