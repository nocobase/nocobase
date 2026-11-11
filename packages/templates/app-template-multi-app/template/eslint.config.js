import { createApplicationConfig, node } from '@nocobase/dev-config/eslint';

export default [
  ...createApplicationConfig({
    tsconfigRootDir: import.meta.dirname,
    ignores: [
      '.extension-state/**',
      'client-old/**',
      'public/r/**',
      'storage/**',
      // Internal workspace packages own their lint and TypeScript configurations.
      'packages/**',
      // Child applications are independent lint targets.
      'apps/**',
    ],
  }),
  ...node.map((config) => ({
    ...config,
    files: ['tests/manual/**/*.mjs'],
  })),
  {
    files: ['tests/manual/**/*.mjs'],
    languageOptions: { globals: { document: 'readonly', window: 'readonly' } },
  },
];
