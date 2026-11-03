import { createReactVitestConfig } from '@nocobase/dev-config/vitest/react';

export default createReactVitestConfig({
  test: { include: ['tests/**/*.test.{ts,tsx}'] },
});
