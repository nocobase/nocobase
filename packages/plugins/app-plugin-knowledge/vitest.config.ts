import { createReactVitestConfig } from '@nocobase/dev-config/vitest/react';

// Client tests run in jsdom; server tests declare `@vitest-environment node` themselves.
export default createReactVitestConfig({
  test: {
    include: ['tests/**/*.test.{ts,tsx}'],
    passWithNoTests: true,
    // Background jobs and real database I/O can outlive Vitest's 1s poll default on CI.
    expect: { poll: { timeout: 15000 } },
  },
});
