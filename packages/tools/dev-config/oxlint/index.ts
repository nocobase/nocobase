import { fileURLToPath } from 'node:url';
import eslintReact from '@eslint-react/eslint-plugin';
import { resolve } from 'import-meta-resolve';
import type { DummyRuleMap, OxlintConfig, OxlintOverride } from 'oxlint';

import {
  applicationBrowserApiFiles,
  applicationClientFiles,
  applicationNodeFiles,
  browserApiFiles,
  browserApiRestrictions,
  clientEnvRestrictions,
  commandFiles,
  commandImportRestrictions,
  commandPropertyRestrictions,
  commandSyntaxRestrictions,
  defaultIgnores,
  nonBrowserApiFiles,
  reactFiles,
  testFiles,
  toolingFiles,
  typescriptFiles,
} from '../lint/policy.js';
import {
  baseRules,
  reactRules,
  typeAwareRules,
  typescriptRules,
  untypedRules,
  vitestRules,
} from './native-rules.js';

const allFiles: string[] = ['**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}'];
const nodeTestFiles: string[] = ['**/tests/build/**/*.test.mjs'];
const reactRecommended = eslintReact.configs.recommended;

export interface SharedConfigOptions {
  ignores?: string[];
  rules?: DummyRuleMap;
  overrides?: OxlintOverride[];
  /** Files using node:test get Node globals and skip the Vitest preset. */
  nodeTestFiles?: string[];
}

export const node: OxlintOverride[] = [
  { files: allFiles, env: { node: true } },
];

export const react: OxlintOverride[] = [
  {
    files: reactFiles,
    env: { browser: true },
    jsPlugins: [
      {
        name: '@eslint-react',
        specifier: fileURLToPath(
          resolve('@eslint-react/eslint-plugin', import.meta.url),
        ),
      },
    ],
    rules: {
      ...reactRules,
      ...reactRecommended.rules,
      '@eslint-react/no-context-provider': 'off',
      '@eslint-react/no-use-context': 'off',
      'nocobase/no-restricted-syntax': ['error', ...clientEnvRestrictions],
    },
  },
];

const createBrowserApiOverride = (files: string[]): OxlintOverride => ({
  files,
  excludeFiles: nonBrowserApiFiles,
  rules: {
    'no-restricted-properties': ['error', ...browserApiRestrictions],
  },
});

const createTestOverrides = (nodeTests: string[]): OxlintOverride[] => [
  { files: nodeTests, env: { node: true } },
  {
    files: testFiles,
    excludeFiles: nodeTests,
    env: { vitest: true },
    rules: vitestRules,
  },
];

const createConfig = (
  options: SharedConfigOptions,
  environment: OxlintOverride[],
): OxlintConfig => ({
  plugins: ['eslint', 'typescript', 'react', 'vitest'],
  categories: { correctness: 'off' },
  env: { es2024: true },
  options: { typeAware: true, reportUnusedDisableDirectives: 'warn' },
  settings: reactRecommended.settings,
  jsPlugins: [
    {
      name: 'nocobase',
      specifier: fileURLToPath(new URL('./eslint-rules.js', import.meta.url)),
    },
  ],
  ignorePatterns: [
    ...defaultIgnores,
    // Node's build tests are sources, unlike the build output that the shared ignore covers.
    '!**/tests/build/**',
    '**/.claude/worktrees/**',
    '**/.pnpm-store/**',
    '**/vendor/**',
    ...(options.ignores ?? []),
  ],
  rules: {
    ...baseRules,
    'nocobase/quotes': [
      'error',
      'single',
      { avoidEscape: true, allowTemplateLiterals: true },
    ],
    'nocobase/jsx-quotes': ['error', 'prefer-single'],
    'nocobase/no-dupe-args': 'error',
    'nocobase/no-octal': 'error',
  },
  overrides: [
    {
      files: typescriptFiles,
      rules: { ...typescriptRules, ...typeAwareRules },
    },
    ...environment,
    ...createTestOverrides([
      ...nodeTestFiles,
      ...(options.nodeTestFiles ?? []),
    ]),
    {
      files: testFiles,
      rules: {
        'typescript/no-explicit-any': 'off',
        'no-unused-expressions': 'off',
      },
    },
    { files: [...testFiles, ...toolingFiles], rules: untypedRules },
    {
      files: commandFiles,
      excludeFiles: testFiles,
      rules: {
        'no-restricted-properties': ['error', ...commandPropertyRestrictions],
        // Native no-restricted-imports also reports dynamic imports. Use the
        // original static rule so each dynamic import is reported once by its selector.
        'nocobase/no-restricted-imports': ['error', commandImportRestrictions],
        'nocobase/no-restricted-syntax': [
          'error',
          ...commandSyntaxRestrictions,
        ],
      },
    },
    { files: allFiles, rules: options.rules },
    ...(options.overrides ?? []),
  ],
});

export const createUniversalLibraryConfig = (
  options: SharedConfigOptions = {},
): OxlintConfig => createConfig(options, []);

export const createNodeLibraryConfig = (
  options: SharedConfigOptions = {},
): OxlintConfig => createConfig(options, node);

export const createClientLibraryConfig = (
  options: SharedConfigOptions = {},
): OxlintConfig =>
  createConfig(options, [
    ...react,
    createBrowserApiOverride(browserApiFiles),
    { files: applicationNodeFiles, env: { node: true } },
  ]);

export const createShadcnRegistryConfig = (
  root = 'client',
): OxlintOverride[] => [
  {
    files: [`${root}/components/ui/**/*.tsx`, `${root}/hooks/use-mobile.ts`],
    rules: {
      'react/only-export-components': 'off',
      'react/set-state-in-effect': 'off',
      '@eslint-react/set-state-in-effect': 'off',
      '@eslint-react/no-nested-component-definitions': 'off',
      '@eslint-react/no-array-index-key': 'off',
      '@eslint-react/dom-no-dangerously-set-innerhtml': 'off',
      '@eslint-react/use-state': 'off',
    },
  },
  {
    files: [`${root}/components/ui/chart.tsx`],
    rules: {
      'typescript/no-unsafe-assignment': 'off',
      'typescript/no-unsafe-member-access': 'off',
      'typescript/no-unsafe-argument': 'off',
      'typescript/restrict-template-expressions': 'off',
    },
  },
];

export const createApplicationConfig = (
  options: SharedConfigOptions = {},
): OxlintConfig =>
  createConfig(options, [
    ...react.map((config) => ({ ...config, files: applicationClientFiles })),
    createBrowserApiOverride(applicationBrowserApiFiles),
    { files: applicationNodeFiles, env: { node: true } },
    ...createShadcnRegistryConfig(),
  ]);
