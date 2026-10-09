import { createReactVitestConfig } from '@nocobase/dev-config/vitest/react';

// Package imports resolve registry sources and preview primitives in the owning package.
export default createReactVitestConfig({
  test: {
    include: ['tests/**/*.test.{ts,tsx}'],
  },
});
