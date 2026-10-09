import { createClientLibraryConfig } from '@nocobase/dev-config/eslint';

export default createClientLibraryConfig({
  tsconfigRootDir: import.meta.dirname,
  overrides: [
    {
      name: 'notification-plugin/database-migrations',
      files: ['database/migrations/*.ts'],
      languageOptions: {
        parserOptions: {
          project: './tsconfig.migrations.json',
          projectService: false,
          tsconfigRootDir: import.meta.dirname,
        },
      },
    },
  ],
  // Registry source is compiled after installation by the consuming app.
  ignores: ['registry/**', '.registry-test-app/**'],
});
