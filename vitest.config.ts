import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './scripts/setupVitest.ts',
    css: true,
    alias: {
      '@nocobase/client': path.resolve('packages/core/client/src'),
      '@nocobase/sdk': path.resolve('packages/core/sdk/src'),
      '@nocobase/actions': path.resolve('packages/core/actions/src'),
      '@nocobase/acl': path.resolve('packages/core/acl/src'),
      '@nocobase/cache': path.resolve('packages/core/cache/src'),
      '@nocobase/database': path.resolve('packages/core/database/src'),
      '@nocobase/logger': path.resolve('packages/core/logger/src'),
      '@nocobase/resourcer': path.resolve('packages/core/resourcer/src'),
      '@nocobase/server': path.resolve('packages/core/server/src'),
      '@nocobase/utils': path.resolve('packages/core/utils/src'),
      '@nocobase/cli': path.resolve('packages/cli/src'),
      '@nocobase/test': path.resolve('packages/test/src'),
    },
    include: ['packages/**/src/**/*.test.(tsx|ts)'],
    exclude: ['packages/**/node_modules', 'packages/**/lib', 'packages/**/dist', 'packages/**/es'],
    testTimeout: 300000,
  },
});
