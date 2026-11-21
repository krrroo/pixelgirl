// Vitest: unit tests for the logic modules (like pytest).
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.js'],
    environment: 'jsdom', // a fake browser DOM, so modules using document/localStorage load
    setupFiles: ['tests/unit/setup.js'],
  },
});
