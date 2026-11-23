import {
  createClientLibraryConfig,
  createShadcnRegistryConfig,
} from '@nocobase/dev-config/eslint';

export default createClientLibraryConfig({
  tsconfigRootDir: import.meta.dirname,
  // Registry sources are typechecked and linted through the Default Template's
  // preinstalled snapshot rather than this package's declaration build.
  ignores: ['registry/**', 'ui/**'],
  // The primitives in client/components/ui are shadcn registry output.
  environment: createShadcnRegistryConfig(),
  overrides: [
    {
      name: 'app-plugin-authentication/database-task-project',
      files: ['database/{migrations,seeds}/*.ts'],
      languageOptions: {
        parserOptions: {
          project: './tsconfig.migrations.json',
          projectService: false,
          tsconfigRootDir: import.meta.dirname,
        },
      },
    },
    {
      // Better Auth and Knex intentionally exchange dynamic adapter rows and
      // comparison values at this boundary.
      files: ['server/better-auth/database-adapter.ts'],
      rules: {
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
        '@typescript-eslint/restrict-template-expressions': 'off',
      },
    },
  ],
});
