import { createNodeLibraryConfig } from '@nocobase/dev-config/eslint';

export default createNodeLibraryConfig({
  tsconfigRootDir: import.meta.dirname,
  overrides: [
    {
      // Every command runs under a lock released in a `finally`, so a promise
      // returned from inside its try/catch has no handler while that `finally`
      // awaits, and a rejection in that window surfaces as unhandled.
      files: ['src/**/*.ts'],
      rules: {
        '@typescript-eslint/return-await': ['error', 'in-try-catch'],
      },
    },
  ],
});
