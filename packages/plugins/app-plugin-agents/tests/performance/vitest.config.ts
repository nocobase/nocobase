import { createReactVitestConfig } from '@nocobase/dev-config/vitest/react';

/** Explicit local benchmark, separate from normal correctness tests. */
export default createReactVitestConfig({
  test: {
    environment: 'node',
    include: ['tests/performance/*.benchmark.ts'],
    testTimeout: 600_000,
    fileParallelism: false,
  },
});
