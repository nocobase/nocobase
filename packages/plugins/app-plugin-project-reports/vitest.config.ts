import { createNodeVitestConfig } from '@nocobase/dev-config/vitest';

export default createNodeVitestConfig({ test: { include: ['tests/**/*.test.ts'] } });
