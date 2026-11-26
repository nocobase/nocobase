import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import path from 'node:path';
import { test } from 'node:test';

const root = path.resolve(import.meta.dirname, '../..');
const setupRequire = createRequire(
  path.join(root, 'packages/tools/dev-config/package.json'),
);
const matchers = createRequire(
  setupRequire.resolve('@testing-library/jest-dom/vitest'),
);

for (const directory of ['.', 'packages/plugins/app-plugin-agents']) {
  test(`${directory}: jest-dom extends the test runner's Vitest instance`, () => {
    const require = createRequire(path.join(root, directory, 'package.json'));
    // Different Vite optional peers can produce two copies of the same Vitest version.
    // Registering snapshot matchers through the other copy loses the runner's snapshot state.
    assert.equal(
      matchers.resolve('vitest/package.json'),
      require.resolve('vitest/package.json'),
      'jest-dom and the test runner must share the same resolved Vitest peer context',
    );
  });
}
