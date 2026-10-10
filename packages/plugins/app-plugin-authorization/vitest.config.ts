import { createReactVitestConfig } from '@nocobase/dev-config/vitest/react';

// Server tests run in Node; the client tests opt into jsdom per file.
export default createReactVitestConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.{ts,tsx}'],
    passWithNoTests: true,
  },
});
