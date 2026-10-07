import { createReactVitestConfig } from '@nocobase/dev-config/vitest/react';

// Client tests run in jsdom; server tests declare `@vitest-environment node` themselves.
export default createReactVitestConfig({
  test: {
    include: ['tests/**/*.test.{ts,tsx}'],
    passWithNoTests: true,
  },
});
