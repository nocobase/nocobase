import { createNodeVitestConfig } from '@nocobase/dev-config/vitest/node';

export default createNodeVitestConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    restoreMocks: true,
  },
});
