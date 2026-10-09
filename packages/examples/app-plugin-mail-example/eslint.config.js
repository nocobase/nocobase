import { createNodeLibraryConfig } from '@nocobase/dev-config/eslint';

export default createNodeLibraryConfig({
  tsconfigRootDir: import.meta.dirname,
  // Registry source is compiled after installation by the consuming app.
  ignores: ['registry/**'],
});
