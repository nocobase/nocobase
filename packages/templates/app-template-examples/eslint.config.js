import { createApplicationConfig } from '@nocobase/dev-config/eslint';

export default createApplicationConfig({
  tsconfigRootDir: import.meta.dirname,
  ignores: [
    '.extension-state/**',
    'client-old/**',
    'public/r/**',
    'storage/**',
  ],
  overrides: [
    {
      // Top-level workflow definitions and handlers use the server project.
      files: ['workflows/**/*.ts'],
      ignores: ['workflows/*/client/**'],
      languageOptions: {
        parserOptions: {
          projectService: false,
          project: './tsconfig.server.json',
        },
      },
    },
  ],
});
