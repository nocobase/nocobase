import { createNodeLibraryConfig } from '@nocobase/dev-config/eslint';

export default createNodeLibraryConfig({
  tsconfigRootDir: import.meta.dirname,
  // The hand-written declarations for `node-guard.js`, which `tsconfig.json` leaves out because it compiles only
  // `src`; the type-aware rules have no project to read them in.
  ignores: ['node-guard.d.ts'],
});
