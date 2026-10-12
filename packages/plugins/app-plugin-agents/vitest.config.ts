import { createReactVitestConfig } from '@nocobase/dev-config/vitest/react';

// Server tests run in Node; client tests (tests/client) declare `@vitest-environment jsdom` themselves.
export default createReactVitestConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.{ts,tsx}'],
  },
});
