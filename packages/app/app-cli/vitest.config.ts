import { createNodeVitestConfig } from '@nocobase/dev-config/vitest/node';
export default createNodeVitestConfig({
  // CLI tests spawn subprocesses; keep their load bounded during workspace test runs.
  test: { fileParallelism: false },
});
