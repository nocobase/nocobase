import {
  base,
  createClientLibraryConfig,
  createNodeLibraryConfig,
  createApplicationConfig,
  node,
  typescript,
} from '@nocobase/dev-config/eslint';

const supportedFiles = ['**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}'];
const rootNodeFiles = [
  '*.{js,mjs,cjs}',
  '.github/**/*.{js,mjs,cjs}',
  'scripts/**/*.{js,mjs,cjs}',
  'tools/**/*.{js,mjs,cjs}',
];
// These roots stay enumerated rather than collapsing into globs such as
// `packages/libs/*`, because the directory grouping does not match the
// configuration grouping: node libraries are split across `packages/libs` and
// `packages/app`, `packages/app` mixes node and client libraries, and
// `packages/libs` also holds packages this root configuration does not cover.
const nodeLibraryRoots = [
  'packages/app/app-server',
  'packages/libs/authorization',
  'packages/libs/caching',
  'packages/libs/db',
  'packages/libs/drive',
  'packages/app/app-host',
  'packages/libs/snowflake',
  'packages/libs/logging',
  'packages/libs/queue',
  'packages/libs/session',
  'dev/db',
];
const devConfigRoots = ['packages/tools/dev-config'];
const clientLibraryRoots = ['packages/app/app-client'];
const applicationRoots = [
  'packages/templates/app-template-default',
  'packages/templates/app-template-hub',
];
const prefixPatterns = (roots, patterns) =>
  roots.flatMap((root) => patterns.map((pattern) => `${root}/${pattern}`));

const scopePackageConfigs = (configs, roots, namespace, unignores = []) =>
  configs.map((config, index) => {
    const name = `root/${namespace}/${config.name ?? index + 1}`;

    if (config.ignores && !config.files) {
      return {
        ...config,
        name,
        ignores: [...prefixPatterns(roots, config.ignores), ...unignores],
      };
    }

    return {
      ...config,
      name,
      files: prefixPatterns(roots, config.files ?? supportedFiles),
    };
  });

const scopeRootNodeConfigs = (configs) =>
  configs.map((config, index) => ({
    ...config,
    name: `root/node-tooling/${config.name ?? index + 1}`,
    files: rootNodeFiles,
  }));

export default [
  ...scopeRootNodeConfigs([...base, ...node]),
  ...scopePackageConfigs(
    createNodeLibraryConfig({
      tsconfigRootDir: import.meta.dirname,
    }),
    nodeLibraryRoots,
    'node-libraries',
  ),
  ...scopePackageConfigs(
    [...base, ...typescript, ...node],
    devConfigRoots,
    'dev-config',
  ),
  ...scopePackageConfigs(
    createClientLibraryConfig({
      tsconfigRootDir: import.meta.dirname,
    }),
    clientLibraryRoots,
    'client-libraries',
  ),
  ...scopePackageConfigs(
    createClientLibraryConfig({
      tsconfigRootDir: import.meta.dirname,
      ignores: ['ui/**'],
    }),
    ['packages/plugins/app-plugin-authentication'],
    'app-plugin-authentication',
  ),
  ...scopePackageConfigs(
    createApplicationConfig({
      tsconfigRootDir: import.meta.dirname,
      ignores: [
        '.extension-state/**',
        'public/r/**',
        'public/storage/**',
        'src/extensions/**',
        'storage/**',
      ],
    }),
    applicationRoots,
    'applications',
  ),
];
