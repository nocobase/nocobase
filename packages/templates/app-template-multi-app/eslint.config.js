import { createNodeLibraryConfig } from '@nocobase/dev-config/eslint';

export default createNodeLibraryConfig({
  tsconfigRootDir: import.meta.dirname,
  // Each App owns its application-aware lint and TypeScript configuration.
  ignores: ['template/**'],
});
