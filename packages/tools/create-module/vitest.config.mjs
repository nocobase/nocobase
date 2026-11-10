import { createNodeVitestConfig } from '@nocobase/dev-config/vitest/node';
export default createNodeVitestConfig({
  test: { include: ['tests/runtime.spec.mjs'], testTimeout: 30000 },
});
