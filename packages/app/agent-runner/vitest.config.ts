import { createNodeVitestConfig } from '@nocobase/dev-config/vitest/node';

// Most of these tests start the runner daemon and fake servers as separate processes and wait on them. On a release
// runner, which runs every package's tests at once, several take 20 to 34 seconds while finishing in about 3 locally,
// so the shared 30-second floor fails them one at a time. A test that needs longer still sets its own timeout.
export default createNodeVitestConfig({
  test: {
    testTimeout: 90_000,
  },
});
