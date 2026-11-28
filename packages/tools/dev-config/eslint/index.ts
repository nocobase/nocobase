import js from '@eslint/js';
import eslintReact from '@eslint-react/eslint-plugin';
import vitestPlugin from '@vitest/eslint-plugin';
import type { ESLint, Linter } from 'eslint';
import eslintConfigPrettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

import {
  additionalTestBlockFunctions,
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

const allFiles: string[] = ['**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}'];

const scopeConfigs = (
  configs: Linter.Config[],
  files: string[],
): Linter.Config[] => configs.map((config) => ({ ...config, files }));

const nameConfigs = (
  configs: Linter.Config[],
  namespace: string,
  files: string[] = allFiles,
): Linter.Config[] =>
  configs.map((config, index) => ({
    ...config,
    name: `${namespace}/${index + 1}`,
    files: config.files ?? files,
  }));

interface ConfigWithLanguageOptions extends Linter.Config {
  languageOptions?: Linter.LanguageOptions;
}

const reactRecommended: ConfigWithLanguageOptions =
  eslintReact.configs.recommended;
const hooksRecommended: Linter.Config =
  reactHooks.configs.flat?.recommended ?? reactHooks.configs.recommended;
const reactHooksPlugin: ESLint.Plugin = {
  meta: reactHooks.meta,
  rules: reactHooks.rules,
};
const reactRefreshPlugin: ESLint.Plugin = {
  rules: reactRefresh.rules,
};
const vitestRecommended: ConfigWithLanguageOptions =
  vitestPlugin.configs.recommended;
const vitestEnvironment: ConfigWithLanguageOptions = vitestPlugin.configs.env;

export interface SharedConfigOptions {
  tsconfigRootDir?: string;
  ignores?: string[];
  rules?: Linter.Config['rules'];
  overrides?: Linter.Config[];
  environment?: Linter.Config[];
}

export const base: Linter.Config[] = [
  {
    ...js.configs.recommended,
    name: '@nocobase/dev-config/base',
    files: allFiles,
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.es2024,
    },
  },
];

export const typescript: Linter.Config[] = nameConfigs(
  tseslint.configs.recommended,
  '@nocobase/dev-config/typescript',
  typescriptFiles,
);

export const typeChecked: Linter.Config[] = [
  ...nameConfigs(
    tseslint.configs.recommendedTypeChecked,
    '@nocobase/dev-config/type-checked',
    typescriptFiles,
  ),
  {
    name: '@nocobase/dev-config/project-service',
    files: typescriptFiles,
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
  },
  {
    name: '@nocobase/dev-config/typescript-rules',
    files: typescriptFiles,
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/require-await': 'off',
    },
  },
];

export const node: Linter.Config[] = [
  {
    name: '@nocobase/dev-config/node',
    files: allFiles,
    languageOptions: {
      globals: {
        ...globals.es2024,
        ...globals.node,
      },
    },
  },
];

export const react: Linter.Config[] = [
  {
    ...reactRecommended,
    name: '@nocobase/dev-config/react',
    files: reactFiles,
    languageOptions: {
      ...reactRecommended.languageOptions,
      globals: {
        ...reactRecommended.languageOptions?.globals,
        ...globals.browser,
      },
    },
    plugins: {
      ...reactRecommended.plugins,
      'react-hooks': reactHooksPlugin,
      'react-refresh': reactRefreshPlugin,
    },
    rules: {
      ...reactRecommended.rules,
      ...hooksRecommended.rules,
      '@eslint-react/no-context-provider': 'off',
      '@eslint-react/no-use-context': 'off',
      'react-refresh/only-export-components': [
        'error',
        { allowConstantExport: true },
      ],
    },
  },
  {
    name: '@nocobase/dev-config/client-env',
    files: reactFiles,
    rules: {
      'no-restricted-syntax': ['error', ...clientEnvRestrictions],
    },
  },
];

/** Browser source must work on plain HTTP as well as secure origins. */
export const browserApis: Linter.Config[] = [
  {
    name: '@nocobase/dev-config/browser-apis',
    files: browserApiFiles,
    ignores: nonBrowserApiFiles,
    rules: {
      'no-restricted-properties': ['error', ...browserApiRestrictions],
    },
  },
];

export const vitest: Linter.Config[] = [
  {
    ...vitestRecommended,
    name: '@nocobase/dev-config/vitest',
    files: testFiles,
    languageOptions: {
      ...vitestEnvironment.languageOptions,
      ...vitestRecommended.languageOptions,
      globals: {
        ...vitestEnvironment.languageOptions?.globals,
        ...vitestRecommended.languageOptions?.globals,
      },
    },
    rules: {
      ...vitestRecommended.rules,
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      'vitest/expect-expect': 'off',
      'vitest/no-conditional-expect': 'off',
      // A `test` built with `test.extend()` — `createDatabaseTest()` from @nocobase/db-testing, or one a package
      // exports from its own fixtures module — is not imported from vitest, and `describeMigration` runs its `up` and
      // `down` callbacks inside a test it declares; the rule would otherwise treat every expect in them as standalone.
      'vitest/no-standalone-expect': [
        'error',
        { additionalTestBlockFunctions },
      ],
    },
  },
];

/**
 * Commands in an application's or a plugin's `cli/` run inside the `nocobase` command line, which owns stdout and puts
 * the application away after the command. Each rule names what to use instead of the thing it refuses.
 */
export const commandRules: Linter.Config[] = [
  {
    name: '@nocobase/dev-config/cli-commands',
    files: commandFiles,
    ignores: testFiles,
    rules: {
      'no-restricted-imports': ['error', commandImportRestrictions],
      'no-restricted-properties': ['error', ...commandPropertyRestrictions],
      'no-restricted-syntax': ['error', ...commandSyntaxRestrictions],
    },
  },
];

const createConfig = ({
  tsconfigRootDir = process.cwd(),
  ignores = [],
  environment = [],
  rules = {},
  overrides = [],
}: SharedConfigOptions): Linter.Config[] => [
  {
    name: '@nocobase/dev-config/ignores',
    ignores: [...defaultIgnores, ...ignores],
  },
  ...base,
  ...typeChecked,
  {
    name: '@nocobase/dev-config/project-root',
    files: typescriptFiles,
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir,
      },
    },
  },
  ...environment,
  ...vitest,
  {
    ...tseslint.configs.disableTypeChecked,
    name: '@nocobase/dev-config/untyped-support-files',
    files: [...testFiles, ...toolingFiles],
  },
  ...commandRules,
  {
    name: '@nocobase/dev-config/local-rules',
    files: allFiles,
    rules,
  },
  ...overrides,
  {
    ...eslintConfigPrettier,
    name: '@nocobase/dev-config/prettier-compatibility',
    rules: {
      ...eslintConfigPrettier.rules,
      quotes: [
        'error',
        'single',
        { avoidEscape: true, allowTemplateLiterals: true },
      ],
      'jsx-quotes': ['error', 'prefer-single'],
    },
  },
];

export const createNodeLibraryConfig: (
  options?: SharedConfigOptions,
) => Linter.Config[] = (options = {}) =>
  createConfig({
    ...options,
    environment: [...node, ...(options.environment ?? [])],
  });

export const createUniversalLibraryConfig: (
  options?: SharedConfigOptions,
) => Linter.Config[] = (options = {}) => createConfig(options);

export const createClientLibraryConfig: (
  options?: SharedConfigOptions,
) => Linter.Config[] = (options = {}) =>
  createConfig({
    ...options,
    environment: [
      ...react,
      ...browserApis,
      ...scopeConfigs(node, applicationNodeFiles),
      ...(options.environment ?? []),
    ],
  });

// shadcn/ui registry output is copied into an application verbatim by
// `shadcn add` so that `shadcn add <name> --diff` stays meaningful against
// upstream. The primitives export their `cva` variants, contexts and hooks
// alongside the component by design, and a few compose state the way the
// upstream source does, so the rules that object to those shapes are relaxed
// for the registry paths alone. Hand-written components in
// `client/components/` are still held to the full rule set.
//
// `root` is the directory holding the `components/ui/` and `hooks/` that
// `shadcn add` writes to. The application factory passes `client`; a package that
// keeps its primitives elsewhere, such as the UI Library's `website`, passes
// its own directory instead of copying the list.
export const createShadcnRegistryConfig: (root?: string) => Linter.Config[] = (
  root = 'client',
) => [
  {
    name: '@nocobase/dev-config/shadcn-registry',
    files: [`${root}/components/ui/**/*.tsx`, `${root}/hooks/use-mobile.ts`],
    rules: {
      'react-refresh/only-export-components': 'off',
      'react-hooks/set-state-in-effect': 'off',
      '@eslint-react/set-state-in-effect': 'off',
      '@eslint-react/no-nested-component-definitions': 'off',
      '@eslint-react/no-array-index-key': 'off',
      '@eslint-react/dom-no-dangerously-set-innerhtml': 'off',
      '@eslint-react/use-state': 'off',
    },
  },
  {
    // Recharts exposes loosely typed tooltip and legend payloads; the upstream
    // chart wrapper reads them as-is.
    name: '@nocobase/dev-config/shadcn-registry-chart',
    files: [`${root}/components/ui/chart.tsx`],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
    },
  },
];

export const createApplicationConfig: (
  options?: SharedConfigOptions,
) => Linter.Config[] = (options = {}) =>
  createConfig({
    ...options,
    environment: [
      ...scopeConfigs(react, applicationClientFiles),
      ...scopeConfigs(browserApis, applicationBrowserApiFiles),
      ...scopeConfigs(node, applicationNodeFiles),
      ...createShadcnRegistryConfig(),
      ...(options.environment ?? []),
    ],
  });
