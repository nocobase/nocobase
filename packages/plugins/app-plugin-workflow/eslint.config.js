import { createClientLibraryConfig } from '@nocobase/dev-config/eslint';

export default createClientLibraryConfig({
  tsconfigRootDir: import.meta.dirname,
  overrides: [
    {
      name: 'workflow-plugin/intentional-invalid-eval-fixture',
      ignores: [
        'skill-evals/nocobase3-workflow-manage/fixtures/workflows/unsupported-approval/**',
      ],
    },
    {
      name: 'workflow-plugin/database-migrations',
      files: ['database/migrations/*.ts'],
      languageOptions: {
        parserOptions: {
          project: './tsconfig.migrations.json',
          projectService: false,
          tsconfigRootDir: import.meta.dirname,
        },
      },
    },
    {
      name: 'workflow-plugin/skill-evals',
      files: ['skill-evals/**/*.ts'],
      languageOptions: {
        parserOptions: {
          project: './tsconfig.skill-evals.json',
          projectService: false,
          tsconfigRootDir: import.meta.dirname,
        },
      },
    },
    {
      name: 'workflow-plugin/database-row-normalization',
      files: [
        'server/engine/{inspector,utils,value-resolver}.ts',
        'server/instructions/run/instruction.ts',
        'server/loader/{source-materializer,synchronizer}.ts',
        'server/repositories/{mappers,workflow-repository,workflow-run-repository}.ts',
      ],
      rules: {
        // These adapters receive unknown-valued database/configuration records
        // and normalize their scalar fields at an explicit boundary.
        '@typescript-eslint/no-base-to-string': 'off',
      },
    },
    {
      name: 'workflow-plugin/dynamic-module-boundaries',
      files: [
        'server/engine/{processor,utils}.ts',
        'server/instructions/run/instruction.ts',
        'build/source-validator.ts',
      ],
      rules: {
        // Workflow modules and JSON Logic values cross runtime-validated
        // dynamic boundaries whose upstream libraries expose `any`.
        '@typescript-eslint/no-unsafe-argument': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
      },
    },
    {
      name: 'workflow-plugin/literal-declaration-contracts',
      files: [
        'server/engine/invocation.ts',
        'server/instructions/{condition/instruction,run/instruction}.ts',
        'tests/source.test.ts',
      ],
      rules: {
        // Explicit literal annotations are required for isolated declarations.
        '@typescript-eslint/prefer-as-const': 'off',
      },
    },
    {
      name: 'workflow-plugin/instruction-dispatch',
      files: ['server/engine/{dispatcher,processor}.ts'],
      rules: {
        '@typescript-eslint/no-redundant-type-constituents': 'off',
        '@typescript-eslint/unbound-method': 'off',
        'no-empty': 'off',
      },
    },
    {
      name: 'workflow-plugin/expression-method-contract',
      files: ['dsl/definition.ts'],
      rules: {
        '@typescript-eslint/unbound-method': 'off',
      },
    },
    {
      name: 'workflow-plugin/synchronization-error-flow',
      files: ['server/loader/synchronizer.ts'],
      rules: {
        'no-useless-assignment': 'off',
        'preserve-caught-error': 'off',
      },
    },
    {
      name: 'workflow-plugin/workflow-context-schema',
      files: ['build/source-parser.ts'],
      rules: {
        // This is a parsed workflow property, not a React context declaration.
        '@eslint-react/naming-convention-context-name': 'off',
      },
    },
  ],
});
