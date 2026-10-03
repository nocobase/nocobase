import { constants } from 'node:fs';
import { access, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import prettierConfig from '@nocobase/dev-config/prettier';
import { format } from 'prettier';

import type { PluginNames } from './names.ts';
import type { PluginCapabilities } from './capabilities.ts';

export const DEFAULT_TEMPLATE_DIRECTORY = fileURLToPath(
  new URL('../../template/', import.meta.url),
);

const placeholderPattern = /__NOCOBASE_[A-Z0-9_]+__/gu;

export interface PluginTemplateContext extends PluginNames {
  readonly datePrefix: string;
  readonly description: string;
  readonly displayName: string;
  readonly migrationName: string;
  readonly seedName: string;
}

interface TemplateFile {
  readonly sourcePath: string;
  readonly outputPath: string;
}

const BASE_TEMPLATE_FILES = new Set([
  '.gitignore.template',
  '.prettierignore.template',
  'AGENTS.md',
  'CHANGELOG.md',
  'CLAUDE.md',
  'README.md',
  'eslint.config.template.js',
  'package.template.json',
  'package.ts',
  'tsconfig.json',
]);

function hasClientPlugin(capabilities: PluginCapabilities): boolean {
  return (
    capabilities.client.serviceProviders ||
    capabilities.client.locales ||
    capabilities.client.reactProviders ||
    capabilities.client.routes
  );
}

function hasServerPlugin(capabilities: PluginCapabilities): boolean {
  return (
    capabilities.database ||
    capabilities.server.jobs ||
    capabilities.server.locales ||
    capabilities.server.serviceProviders ||
    capabilities.server.routes
  );
}

function hasBrowserCode(capabilities: PluginCapabilities): boolean {
  return (
    capabilities.client.serviceProviders ||
    capabilities.client.components ||
    capabilities.client.locales ||
    capabilities.client.reactProviders ||
    capabilities.client.routes ||
    capabilities.registry
  );
}

function includeTemplateFile(
  relativePath: string,
  capabilities: PluginCapabilities,
): boolean {
  if (BASE_TEMPLATE_FILES.has(relativePath)) return true;
  if (
    relativePath === 'client/index.ts' ||
    relativePath === 'client/plugin.ts'
  ) {
    return hasClientPlugin(capabilities);
  }
  if (relativePath.startsWith('client/locales/')) {
    return capabilities.client.locales;
  }
  if (
    relativePath.startsWith('client/providers/') ||
    relativePath === 'tests/client-service-provider.test.ts'
  ) {
    return capabilities.client.serviceProviders;
  }
  if (
    relativePath === 'client/routes.ts' ||
    relativePath === 'tests/client.test.ts'
  ) {
    return capabilities.client.routes;
  }
  if (
    relativePath.startsWith('client/react-providers/') ||
    relativePath === 'client/contexts.ts' ||
    relativePath === 'client/components/provider.tsx' ||
    relativePath === 'tests/client-react-provider.test.tsx'
  ) {
    return capabilities.client.reactProviders;
  }
  if (
    relativePath === 'client/components/plugin-component.tsx' ||
    relativePath === 'tests/component.test.tsx'
  ) {
    return capabilities.client.components;
  }
  if (relativePath.startsWith('client/pages/')) return false;
  if (
    relativePath === 'server/index.ts' ||
    relativePath === 'server/plugin.ts' ||
    relativePath === 'tests/plugin.test.ts'
  ) {
    return hasServerPlugin(capabilities);
  }
  if (relativePath.startsWith('server/locales/')) {
    return capabilities.server.locales;
  }
  if (
    relativePath.startsWith('server/providers/') ||
    relativePath.startsWith('server/services/') ||
    relativePath === 'server/tokens.ts' ||
    relativePath === 'tests/server-provider.test.ts'
  ) {
    return capabilities.server.serviceProviders;
  }
  if (
    relativePath === 'server/routes/index.ts' ||
    relativePath === 'tests/routes.test.ts'
  ) {
    return capabilities.server.routes;
  }
  if (
    relativePath.startsWith('server/jobs/') ||
    relativePath === 'tests/jobs.test.ts'
  ) {
    return capabilities.server.jobs;
  }
  if (
    relativePath.startsWith('database/') ||
    relativePath === 'tests/database.test.ts'
  ) {
    return capabilities.database;
  }
  if (
    relativePath === 'components.json' ||
    relativePath === 'client/styles.css' ||
    relativePath === 'registry.config.json' ||
    relativePath.startsWith('registry/')
  ) {
    return capabilities.registry;
  }
  if (relativePath.startsWith('cli/') || relativePath === 'tests/cli.test.ts') {
    return capabilities.cli;
  }
  if (relativePath.startsWith('skills/')) return capabilities.skills;
  return true;
}

function outputPathForTemplateFile(relativePath: string): string {
  switch (relativePath) {
    case '.gitignore.template':
      return '.gitignore';
    case '.prettierignore.template':
      return '.prettierignore';
    case 'eslint.config.template.js':
      return 'eslint.config.js';
    case 'package.template.json':
      return 'package.json';
    default:
      return relativePath;
  }
}

function literal(value: string): string {
  return `'${JSON.stringify(value)
    .slice(1, -1)
    .replaceAll("'", "\\'")
    .replaceAll('\u2028', '\\u2028')
    .replaceAll('\u2029', '\\u2029')}'`;
}

function jsonStringContent(value: string): string {
  return JSON.stringify(value).slice(1, -1);
}

function replacementEntries(
  context: PluginTemplateContext,
): readonly (readonly [string, string])[] {
  return [
    [
      '__NOCOBASE_CLI_DESCRIPTION_LITERAL__',
      literal(`Commands contributed by ${context.packageName}.`),
    ],
    ['__NOCOBASE_COLLECTION_NAME_LITERAL__', literal(context.collectionName)],
    ['__NOCOBASE_DESCRIPTION__', context.description],
    ['__NOCOBASE_DISPLAY_NAME__', jsonStringContent(context.displayName)],
    ['__NOCOBASE_DISPLAY_NAME_LITERAL__', literal(context.displayName)],
    [
      '__NOCOBASE_HELLO_MESSAGE_LITERAL__',
      literal(`Hello from ${context.displayName}`),
    ],
    [
      '__NOCOBASE_JOB_NAME_LITERAL__',
      literal(`${context.packageName}/${context.shortName}`),
    ],
    [
      '__NOCOBASE_JOBS_PROVIDER_NAME_LITERAL__',
      literal(`${context.packageName}/jobs`),
    ],
    ['__NOCOBASE_MIGRATION_NAME_LITERAL__', literal(context.migrationName)],
    ['__NOCOBASE_MIGRATION_NAME__', context.migrationName],
    ['__NOCOBASE_MODULE_NAME__', context.moduleName],
    ['__NOCOBASE_PACKAGE_NAME_LITERAL__', literal(context.packageName)],
    ['__NOCOBASE_PACKAGE_NAME__', context.packageName],
    ['__NOCOBASE_ROUTE_PATH_LITERAL__', literal(`/${context.shortName}`)],
    ['__NOCOBASE_SEED_NAME_LITERAL__', literal(context.seedName)],
    ['__NOCOBASE_SEED_NAME__', context.seedName],
    [
      '__NOCOBASE_SERVICE_TOKEN_NAME_LITERAL__',
      literal(`${context.packageName}/service`),
    ],
    ['__NOCOBASE_SHORT_NAME_LITERAL__', literal(context.shortName)],
    ['__NOCOBASE_SHORT_NAME__', context.shortName],
    ['__NOCOBASE_SYMBOL_NAME__', context.symbolName],
    [
      '__NOCOBASE_WELCOME_MESSAGE_LITERAL__',
      literal(`Welcome from ${context.packageName}`),
    ],
  ];
}

export function renderTemplateValue(
  value: string,
  context: PluginTemplateContext,
): string {
  const replacements = new Map(replacementEntries(context));

  return value.replace(placeholderPattern, (placeholder) => {
    const replacement = replacements.get(placeholder);
    if (replacement === undefined) {
      throw new Error(`Unknown template placeholder: ${placeholder}`);
    }
    return replacement;
  });
}

async function collectTemplateFiles(
  templateDirectory: string,
  capabilities?: PluginCapabilities,
  directory = templateDirectory,
): Promise<TemplateFile[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: TemplateFile[] = [];

  for (const entry of entries.sort((left, right) =>
    left.name.localeCompare(right.name),
  )) {
    const sourcePath = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) {
      throw new Error(
        `Template entries must not be symbolic links: ${sourcePath}`,
      );
    }
    if (entry.isDirectory()) {
      files.push(
        ...(await collectTemplateFiles(
          templateDirectory,
          capabilities,
          sourcePath,
        )),
      );
      continue;
    }
    if (!entry.isFile()) {
      throw new Error(`Unsupported template entry: ${sourcePath}`);
    }

    const relativePath = path.relative(templateDirectory, sourcePath);
    if (capabilities && !includeTemplateFile(relativePath, capabilities)) {
      continue;
    }
    files.push({
      sourcePath,
      outputPath: outputPathForTemplateFile(relativePath),
    });
  }

  return files;
}

export async function listTemplateFiles(
  templateDirectory: string = DEFAULT_TEMPLATE_DIRECTORY,
  context?: PluginTemplateContext,
  capabilities?: PluginCapabilities,
): Promise<string[]> {
  await access(templateDirectory, constants.R_OK);
  const files = await collectTemplateFiles(templateDirectory, capabilities);

  return files.map((file) =>
    context ? renderTemplateValue(file.outputPath, context) : file.outputPath,
  );
}

async function renderManifest(
  context: PluginTemplateContext,
  capabilities: PluginCapabilities,
): Promise<string> {
  const clientPlugin = hasClientPlugin(capabilities);
  const serverPlugin = hasServerPlugin(capabilities);
  const browserCode = hasBrowserCode(capabilities);
  const react =
    capabilities.client.components ||
    capabilities.client.reactProviders ||
    capabilities.registry;
  const exports: Record<string, unknown> = {};
  const publishExports: Record<string, unknown> = {};
  const addExport = (name: string, source: string, compiled: string): void => {
    exports[name] = { types: source, import: source };
    publishExports[name] = {
      types: compiled.replace(/\.js$/u, '.d.ts'),
      import: compiled,
    };
  };
  if (capabilities.cli)
    addExport('./cli', './cli/index.ts', './dist/cli/index.js');
  if (serverPlugin)
    addExport('./server', './server/index.ts', './dist/server/index.js');
  if (capabilities.server.serviceProviders)
    addExport(
      './server/tokens',
      './server/tokens.ts',
      './dist/server/tokens.js',
    );
  if (clientPlugin) {
    addExport('./client', './client/index.ts', './dist/client/index.js');
    addExport(
      './client/plugin',
      './client/plugin.ts',
      './dist/client/plugin.js',
    );
  }
  if (capabilities.client.serviceProviders)
    addExport(
      './client/providers',
      './client/providers/index.ts',
      './dist/client/providers/index.js',
    );
  if (capabilities.client.routes)
    addExport(
      './client/routes',
      './client/routes.ts',
      './dist/client/routes.js',
    );
  if (capabilities.client.reactProviders)
    addExport(
      './client/react-providers',
      './client/react-providers/index.ts',
      './dist/client/react-providers/index.js',
    );
  if (capabilities.client.components)
    addExport(
      './client/components/plugin-component',
      './client/components/plugin-component.tsx',
      './dist/client/components/plugin-component.js',
    );
  exports['./package.json'] = './package.json';
  publishExports['./package.json'] = './package.json';

  const scripts: Record<string, string> = {
    build: capabilities.database
      ? 'tsc -p tsconfig.json && nocobase-db-manifests'
      : 'tsc -p tsconfig.json',
    typecheck: 'tsc -p tsconfig.json --noEmit',
    test: 'vitest run --passWithNoTests',
    lint: 'eslint . --max-warnings 0',
    'lint:fix': 'eslint . --fix --max-warnings 0',
    format: 'prettier . --write',
    'format:check': 'prettier . --check',
    check:
      'pnpm lint && pnpm format:check && pnpm typecheck && pnpm test && pnpm build',
    fix: 'pnpm lint:fix && pnpm format',
  };
  if (capabilities.registry) {
    scripts['registry:build'] =
      'node ../../../scripts/registry.mjs build --package .';
    scripts['registry:materialize'] =
      'node ../../../scripts/registry.mjs materialize --package .';
    scripts.prepack = 'pnpm registry:build';
    scripts.check =
      'pnpm lint && pnpm format:check && pnpm typecheck && pnpm test && pnpm registry:build && pnpm build';
  }

  // Dependency keys are added in capability order, which varies with what the user selected. Sorting keeps the same
  // set of capabilities producing a byte-identical manifest.
  const sortByKey = (entries: Record<string, string>): Record<string, string> =>
    Object.fromEntries(
      Object.entries(entries).sort(([left], [right]) =>
        left.localeCompare(right),
      ),
    );

  const dependencies: Record<string, string> = {};
  if (capabilities.server.routes) dependencies.hono = 'catalog:';

  const peerDependencies: Record<string, string> = {};
  const devDependencies: Record<string, string> = {
    '@nocobase/dev-config': 'workspace:*',
    eslint: 'catalog:',
    prettier: 'catalog:',
    typescript: 'catalog:',
    vitest: 'catalog:',
  };

  // A plugin is loaded into an application that already provides the runtime, so anything carrying process-wide state
  // — service tokens, React contexts, host-owned services such as the queue — is declared as a peer and never installed by the
  // plugin itself. The matching devDependency pins this repository's copy for development and tests, which the wide
  // peer range deliberately does not. See AGENTS.md, "Depending on Identity-Sensitive Packages".
  // Declared once. pnpm resolves a `workspace:` peer to this repository's copy without a devDependency, so the
  // second declaration would only be another line to keep in step.
  const addRuntimePeer = (packageName: string): void => {
    peerDependencies[packageName] = 'workspace:^';
  };

  if (capabilities.client.locales || capabilities.server.locales)
    addRuntimePeer('@nocobase/i18n');
  if (serverPlugin) addRuntimePeer('@nocobase/app-server');
  if (capabilities.database) addRuntimePeer('@nocobase/db');
  // A plugin's tests take their fixtures from app-testing alone: the generated database test its database, on whichever
  // dialect the run selects, and the generated command test its command runner.
  if (capabilities.database || capabilities.cli)
    devDependencies['@nocobase/app-testing'] = 'workspace:*';
  if (
    capabilities.server.serviceProviders ||
    capabilities.server.jobs ||
    capabilities.client.serviceProviders
  )
    addRuntimePeer('@nocobase/service-provider');
  if (capabilities.server.jobs) addRuntimePeer('@nocobase/jobs');
  if (clientPlugin) addRuntimePeer('@nocobase/app-client');
  if (capabilities.cli) {
    addRuntimePeer('@nocobase/app-cli');
    // `@oclif/core` is a peer for a related but distinct reason from module identity: one shared version, so help
    // rendering and flag parsing behave the same in the plugin and in the application assembling its commands. The
    // range is explicit rather than `workspace:^` because whoever installs this plugin is outside this repository.
    peerDependencies['@oclif/core'] = '^4.14.0';
  }
  if (react) peerDependencies.react = '^19.0.0';

  if (serverPlugin || capabilities.cli || !browserCode)
    devDependencies['@types/node'] = 'catalog:';
  // `@types/react` is not a peer, so it stays. `react` itself is declared once, as a peer.
  if (react) devDependencies['@types/react'] = 'catalog:';
  if (capabilities.registry) {
    devDependencies.shadcn = 'catalog:';
    devDependencies.tailwindcss = 'catalog:';
    devDependencies['tw-animate-css'] = 'catalog:';
  }

  // Compiled plugins resolve resources from baseDir inside dist; only that runtime tree is published.
  const files = ['dist', 'README.md', 'CHANGELOG.md'];
  if (capabilities.skills) files.push('skills');
  if (capabilities.registry)
    files.push(
      'components.json',
      'registry',
      'registry.config.json',
      'public/r',
    );

  const manifest = {
    name: context.packageName,
    displayName: context.displayName,
    description: context.description,
    version: '0.0.1',
    type: 'module',
    prettier: '@nocobase/dev-config/prettier',
    ...(serverPlugin ? { engines: { node: '>=24.0.0' } } : {}),
    sideEffects: false,
    exports,
    files,
    ...(capabilities.registry
      ? {
          nocobase: {
            registry: { items: { 'component-ui': './registry/component-ui' } },
          },
        }
      : {}),
    publishConfig: { access: 'public', exports: publishExports },
    scripts,
    ...(Object.keys(dependencies).length > 0
      ? { dependencies: sortByKey(dependencies) }
      : {}),
    ...(Object.keys(peerDependencies).length > 0
      ? { peerDependencies: sortByKey(peerDependencies) }
      : {}),
    devDependencies: sortByKey(devDependencies),
  };
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

function renderEslintConfig(capabilities: PluginCapabilities): string {
  const factory = hasBrowserCode(capabilities)
    ? 'createClientLibraryConfig'
    : 'createNodeLibraryConfig';
  return `import { ${factory} } from '@nocobase/dev-config/eslint';

export default ${factory}({
  tsconfigRootDir: import.meta.dirname,
  // Registry source is compiled after installation by the consuming app.
  ignores: ['registry/**'],
});
`;
}

function renderTsconfig(capabilities: PluginCapabilities): string {
  const serverPlugin = hasServerPlugin(capabilities);
  const browserCode = hasBrowserCode(capabilities);
  const compilerOptions: Record<string, unknown> = {
    ...(browserCode && serverPlugin
      ? {
          jsx: 'react-jsx',
          lib: ['ES2022', 'DOM', 'DOM.Iterable'],
        }
      : {}),
    ...(browserCode ? { paths: { '@/*': ['./client/*'] } } : {}),
    rootDir: '.',
    outDir: 'dist',
  };
  const include = [
    'package.ts',
    ...(capabilities.database ? ['database/**/*.ts'] : []),
    ...(serverPlugin ? ['server/**/*.ts'] : []),
    ...(browserCode ? ['client/**/*.ts', 'client/**/*.tsx'] : []),
    // Compiled alongside the server: `exports['./cli']` publishes `./dist/cli/index.js`, so leaving it out of the
    // build would publish an entry that resolves to nothing.
    ...(capabilities.cli ? ['cli/**/*.ts'] : []),
  ];
  return `${JSON.stringify(
    {
      extends:
        browserCode && !serverPlugin && !capabilities.cli
          ? '@nocobase/dev-config/tsconfig/client-library.json'
          : '@nocobase/dev-config/tsconfig/server-library.json',
      compilerOptions,
      include,
    },
    null,
    2,
  )}\n`;
}

function renderClientPlugin(
  context: PluginTemplateContext,
  capabilities: PluginCapabilities,
): string {
  const entries = [
    capabilities.client.locales ? '  locales,' : undefined,
    capabilities.client.serviceProviders ? '  serviceProviders,' : undefined,
    capabilities.client.routes ? '  routes,' : undefined,
    capabilities.client.reactProviders ? '  reactProviders,' : undefined,
  ]
    .filter(Boolean)
    .join('\n');
  const imports = [
    capabilities.client.serviceProviders
      ? "import serviceProviders from './providers/index.js';"
      : undefined,
    capabilities.client.locales
      ? "import locales from './locales/index.js';"
      : undefined,
    capabilities.client.routes
      ? "import routes from './routes.js';"
      : undefined,
    capabilities.client.reactProviders
      ? "import reactProviders from './react-providers/index.js';"
      : undefined,
  ]
    .filter(Boolean)
    .join('\n');
  return `import { defineClientPlugin, type AppClientPluginFactory } from '@nocobase/app-client/plugins';\n${imports ? `\n${imports}\n` : ''}\nconst ${context.moduleName}: AppClientPluginFactory = defineClientPlugin({\n  packageName: ${literal(context.packageName)},\n${entries}\n});\n\nexport default ${context.moduleName};\n`;
}

function renderServerPlugin(
  context: PluginTemplateContext,
  capabilities: PluginCapabilities,
): string {
  const imports = [
    capabilities.server.locales
      ? "import locales from './locales/index.js';"
      : undefined,
    capabilities.server.serviceProviders
      ? "import serviceProviders from './providers/index.js';"
      : undefined,
    capabilities.server.routes
      ? "import routes from './routes/index.js';"
      : undefined,
    capabilities.server.jobs
      ? `import { ${context.symbolName}JobsProvider } from './jobs/provider.js';`
      : undefined,
  ]
    .filter(Boolean)
    .join('\n');
  const providers = capabilities.server.jobs
    ? capabilities.server.serviceProviders
      ? `  serviceProviders: [...serviceProviders, ${context.symbolName}JobsProvider],`
      : `  serviceProviders: [${context.symbolName}JobsProvider],`
    : capabilities.server.serviceProviders
      ? '  serviceProviders,'
      : undefined;
  const entries = [
    capabilities.server.locales ? '  locales,' : undefined,
    providers,
    capabilities.server.routes ? '  routes,' : undefined,
    capabilities.database
      ? "  database: {\n    migrations: './database/migrations',\n    seeds: './database/seeds',\n  },"
      : undefined,
  ]
    .filter(Boolean)
    .join('\n');
  return `import path from 'node:path';\n\nimport { defineServerPlugin, type AppServerPlugin } from '@nocobase/app-server/plugins';\n${imports ? `\n${imports}\n` : ''}\nconst ${context.moduleName}Plugin: AppServerPlugin = defineServerPlugin({\n  baseDir: path.resolve(import.meta.dirname, '..'),\n  packageName: ${literal(context.packageName)},\n${entries}\n});\n\nexport default ${context.moduleName}Plugin;\n`;
}

function renderPluginTest(
  context: PluginTemplateContext,
  capabilities: PluginCapabilities,
): string {
  const checks = [
    capabilities.server.locales
      ? "      locales: expect.objectContaining({ 'en-US': expect.any(Function) }),"
      : undefined,
    capabilities.server.serviceProviders || capabilities.server.jobs
      ? '      serviceProviders: expect.any(Array),'
      : undefined,
    capabilities.server.routes ? '      routes: expect.any(Array),' : undefined,
    capabilities.database
      ? "      database: { migrations: './database/migrations', seeds: './database/seeds' },"
      : undefined,
  ]
    .filter(Boolean)
    .join('\n');
  return `import { describe, expect, it } from 'vitest';\n\nimport plugin from '../server/index.js';\n\ndescribe(${literal(context.packageName)}, () => {\n  it('declares only its selected Server capabilities', () => {\n    expect(plugin).toMatchObject({\n      packageName: ${literal(context.packageName)},\n${checks}\n    });\n  });\n});\n`;
}

function renderReadme(
  context: PluginTemplateContext,
  capabilities: PluginCapabilities,
): string {
  const selected = [
    capabilities.database && 'database',
    capabilities.server.serviceProviders && 'server.service-providers',
    capabilities.server.routes && 'server.routes',
    capabilities.server.jobs && 'server.jobs',
    capabilities.server.locales && 'server.locales',
    capabilities.client.routes && 'client.routes',
    capabilities.client.components && 'client.components',
    capabilities.client.serviceProviders && 'client.service-providers',
    capabilities.client.reactProviders && 'client.react-providers',
    capabilities.client.locales && 'client.locales',
    capabilities.cli && 'cli',
    capabilities.registry && 'registry',
    capabilities.skills && 'skills',
  ].filter(Boolean);
  const list =
    selected.length > 0
      ? selected.map((value) => `- \`${value}\``).join('\n')
      : '- Package foundation only';
  return `# ${context.packageName}\n\n${context.description}\n\n## Generated capabilities\n\n${list}\n\nImplement only the public behavior this plugin owns. Keep declarations, exports, dependencies, tests, README, and Plugin Skills aligned when capabilities change. Every concrete Server Route must own and test its authentication and authorization boundary.\n\n## Verification\n\n\`\`\`bash\npnpm --filter ${context.packageName} lint\npnpm --filter ${context.packageName} typecheck\npnpm --filter ${context.packageName} test\npnpm --filter ${context.packageName} build\n\`\`\`\n`;
}

function renderSkill(
  context: PluginTemplateContext,
  capabilities: PluginCapabilities,
): string {
  const capabilityPrompts = [
    capabilities.client.components &&
      '- Client components: document each public package export, required props, and where the App should place it. Do not imply that a direct component import requires Client plugin registration.',
    capabilities.client.routes &&
      '- Client routes: document the implemented App or Settings path, navigation entry, and access conditions.',
    capabilities.client.serviceProviders &&
      '- Client ServiceProviders: document registered services, lifecycle side effects, and how an Agent can verify them.',
    capabilities.client.reactProviders &&
      '- Client React Providers: document the React context or UI behavior exposed to the App and any required composition order.',
    capabilities.server.serviceProviders &&
      '- Server ServiceProviders: document any public `ServiceToken` export and the supported Server-to-Server workflow.',
    capabilities.server.routes &&
      '- Server routes: document every implemented method and path, plus its authentication and authorization boundary.',
    capabilities.server.jobs &&
      '- Server jobs: document what submits each job, its payload, its retry and idempotency behavior, and its observable results.',
    capabilities.database &&
      '- Database: document only App-visible schema prerequisites and lifecycle constraints; do not copy migration implementation details.',
    capabilities.registry &&
      '- Registry: document which files the App materializes, who owns the resulting code, and how updates are applied.',
  ]
    .filter(Boolean)
    .join('\n');

  return `---\nname: nocobase-app-plugin-${context.shortName}\ndescription: Development draft for the App-facing capabilities of ${context.displayName}; replace this description with concrete Agent trigger conditions before synchronization.\n---\n\n# ${context.displayName}\n\n> Development draft: replace every instruction below with verified, implemented behavior before registering this plugin with an App. Do not synchronize placeholder claims.\n\n## Use this Skill when\n\nDescribe the App-level user outcome that should trigger this Skill. State when the Agent should not use it.\n\n## Public surfaces\n\nList only stable package exports, routes, services, jobs, schema requirements, or registry assets that actually exist.\n\n${capabilityPrompts || '- This plugin selected no runtime capability alongside `skills`. Document any real App-facing contract added during implementation.'}\n\n## Prerequisites\n\nList required plugin registration, authentication, permissions, configuration, and data.\n\n## App workflow\n\nGive the shortest ordered workflow an App Agent can execute. Identify which files or UI surfaces belong to the App and which belong to the plugin.\n\n## Ownership\n\nState what the plugin owns, what the App may customize, and whether generated or materialized files may be edited.\n\n## Permissions and constraints\n\nState authentication and authorization requirements separately. Document important unsupported behavior and failure modes.\n\n## Verification\n\nList observable checks that prove the integration works. Verify behavioral claims in the target App; Skill synchronization alone proves only that the files match.\n`;
}

async function formatRenderedSource(
  contents: string,
  outputPath: string,
): Promise<string> {
  const parser =
    outputPath === 'package.json'
      ? 'json-stringify'
      : /\.(?:ts|tsx)(?:\.example)?$/u.test(outputPath)
        ? 'typescript'
        : /\.(?:js|mjs)$/u.test(outputPath)
          ? 'babel'
          : /\.json$/u.test(outputPath)
            ? 'json'
            : /\.md$/u.test(outputPath)
              ? 'markdown'
              : undefined;

  return parser
    ? format(contents, { ...prettierConfig, filepath: outputPath, parser })
    : contents;
}

export async function renderTemplate(options: {
  readonly capabilities: PluginCapabilities;
  readonly context: PluginTemplateContext;
  readonly targetDirectory: string;
  readonly templateDirectory?: string;
}): Promise<string[]> {
  const templateDirectory =
    options.templateDirectory ?? DEFAULT_TEMPLATE_DIRECTORY;
  const files = await collectTemplateFiles(
    templateDirectory,
    options.capabilities,
  );
  const outputFiles: string[] = [];

  for (const file of files) {
    const outputPath = renderTemplateValue(file.outputPath, options.context);
    const targetPath = path.resolve(options.targetDirectory, outputPath);
    const relativeTarget = path.relative(options.targetDirectory, targetPath);
    if (
      relativeTarget.startsWith(`..${path.sep}`) ||
      path.isAbsolute(relativeTarget)
    ) {
      throw new Error(`Template output escapes the target: ${outputPath}`);
    }

    const renderedContents =
      file.outputPath === 'package.json'
        ? await renderManifest(options.context, options.capabilities)
        : file.outputPath === 'eslint.config.js'
          ? renderEslintConfig(options.capabilities)
          : file.outputPath === 'tsconfig.json'
            ? renderTsconfig(options.capabilities)
            : file.outputPath === 'README.md'
              ? renderReadme(options.context, options.capabilities)
              : file.outputPath === 'client/plugin.ts'
                ? renderClientPlugin(options.context, options.capabilities)
                : file.outputPath === 'server/plugin.ts'
                  ? renderServerPlugin(options.context, options.capabilities)
                  : file.outputPath === 'tests/plugin.test.ts'
                    ? renderPluginTest(options.context, options.capabilities)
                    : file.outputPath.startsWith('skills/')
                      ? renderSkill(options.context, options.capabilities)
                      : renderTemplateValue(
                          await readFile(file.sourcePath, 'utf8'),
                          options.context,
                        );
    const contents = await formatRenderedSource(renderedContents, outputPath);

    await mkdir(path.dirname(targetPath), { recursive: true });
    await writeFile(targetPath, contents, { encoding: 'utf8', flag: 'wx' });
    outputFiles.push(outputPath);
  }

  return outputFiles;
}
