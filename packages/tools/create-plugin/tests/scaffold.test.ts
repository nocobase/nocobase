import { spawnSync } from 'node:child_process';
import {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { PluginCapability } from '../src/lib/capabilities.ts';
import { createPlugin } from '../src/lib/scaffold.ts';

const createdDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    createdDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

async function createTestRepo(): Promise<string> {
  const repoRoot = await mkdtemp(
    path.join(os.tmpdir(), 'nocobase-create-plugin-'),
  );
  createdDirectories.push(repoRoot);
  await mkdir(path.join(repoRoot, 'packages', 'plugins'), { recursive: true });
  return repoRoot;
}

async function createWith(
  capabilities: readonly PluginCapability[],
): ReturnType<typeof createPlugin> {
  const repoRoot = await createTestRepo();
  return createPlugin({
    capabilities,
    install: false,
    name: 'audit-log',
    now: new Date(2026, 7, 22),
    repoRoot,
  });
}

async function listFiles(
  directory: string,
  relativeDirectory = '',
): Promise<string[]> {
  const entries = await readdir(path.join(directory, relativeDirectory), {
    withFileTypes: true,
  });
  const files: string[] = [];
  for (const entry of entries) {
    const relativePath = path.join(relativeDirectory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFiles(directory, relativePath)));
    } else {
      files.push(relativePath);
    }
  }
  return files.sort((left, right) => left.localeCompare(right));
}

describe('createPlugin', () => {
  it('resolves package imports to development sources without compiler aliases', async () => {
    const result = await createWith(['client.components', 'registry']);
    const root = result.targetDirectory;
    const source = path.join(root, 'client/components/probe.ts');
    await writeFile(source, 'export const probe: string = "local";\n');

    const config = JSON.parse(
      await readFile(path.join(root, 'tsconfig.json'), 'utf8'),
    ) as { compilerOptions: { customConditions: string[]; paths?: unknown } };
    expect(config.compilerOptions.paths).toBeUndefined();
    expect(
      ts.resolveModuleName(
        '#components/probe',
        path.join(root, 'client/index.ts'),
        {
          module: ts.ModuleKind.NodeNext,
          moduleResolution: ts.ModuleResolutionKind.NodeNext,
          customConditions: config.compilerOptions.customConditions,
        },
        ts.sys,
      ).resolvedModule?.resolvedFileName,
    ).toBe(source);
    const shadcn = JSON.parse(
      await readFile(path.join(root, 'components.json'), 'utf8'),
    ) as { aliases: { ui: string } };
    expect(shadcn.aliases.ui).toBe('#components/ui');
  });

  it.each([
    ['database', 'database/README.md', 'client/'],
    ['server.service-providers', 'server/providers/index.ts', 'server/routes/'],
    ['server.routes', 'server/routes/index.ts', 'server/providers/'],
    ['server.jobs', 'server/jobs/audit-log.ts', 'client/'],
    ['server.locales', 'server/locales/index.ts', 'client/'],
    ['client.routes', 'client/routes.ts', 'server/'],
    ['client.components', 'client/components/plugin-component.tsx', 'server/'],
    ['client.react-providers', 'client/react-providers/index.ts', 'server/'],
    ['client.service-providers', 'client/providers/index.ts', 'server/'],
    ['client.locales', 'client/locales/index.ts', 'server/'],
    ['registry', 'registry.config.json', 'database/'],
    ['cli', 'cli/info.ts', 'server/'],
    ['skills', 'skills/nocobase-app-plugin-audit-log/SKILL.md', 'client/'],
  ] as const)(
    '%s creates only its owned file surface',
    async (capability, ownedFile, unrelatedPrefix) => {
      const result = await createWith([capability]);

      expect(result.files).toContain(ownedFile);
      expect(
        result.files.some((file) => file.startsWith(unrelatedPrefix)),
      ).toBe(false);
    },
  );

  it.each([
    [
      'database',
      ['./package.json', './server'],
      [],
      ['@nocobase/app-server', '@nocobase/db'],
    ],
    [
      'server.service-providers',
      ['./package.json', './server', './server/tokens'],
      [],
      ['@nocobase/app-server', '@nocobase/service-provider'],
    ],
    [
      'server.routes',
      ['./package.json', './server'],
      ['hono'],
      ['@nocobase/app-server'],
    ],
    [
      'server.jobs',
      ['./package.json', './server'],
      [],
      ['@nocobase/app-server', '@nocobase/jobs', '@nocobase/service-provider'],
    ],
    [
      'server.locales',
      ['./package.json', './server'],
      [],
      ['@nocobase/app-server', '@nocobase/i18n'],
    ],
    [
      'client.routes',
      ['./client', './client/plugin', './client/routes', './package.json'],
      [],
      ['@nocobase/app-client'],
    ],
    [
      'client.components',
      ['./client/components/plugin-component', './package.json'],
      [],
      ['react'],
    ],
    [
      'client.react-providers',
      [
        './client',
        './client/plugin',
        './client/react-providers',
        './package.json',
      ],
      [],
      ['@nocobase/app-client', 'react'],
    ],
    [
      'client.service-providers',
      ['./client', './client/plugin', './client/providers', './package.json'],
      [],
      ['@nocobase/app-client', '@nocobase/service-provider'],
    ],
    [
      'client.locales',
      ['./client', './client/plugin', './package.json'],
      [],
      ['@nocobase/app-client', '@nocobase/i18n'],
    ],
    ['registry', ['./package.json'], [], ['react']],
    [
      'cli',
      ['./cli', './package.json'],
      [],
      ['@nocobase/app-cli', '@oclif/core'],
    ],
    ['skills', ['./package.json'], [], []],
  ] as const)(
    '%s derives exact runtime dependencies and aligned exports',
    async (capability, exportNames, dependencyNames, peerDependencyNames) => {
      const result = await createWith([capability]);
      const manifest = JSON.parse(
        await readFile(
          path.join(result.targetDirectory, 'package.json'),
          'utf8',
        ),
      ) as {
        dependencies?: Record<string, string>;
        exports: Record<string, unknown>;
        devDependencies?: Record<string, string>;
        peerDependencies?: Record<string, string>;
        publishConfig: { exports: Record<string, unknown> };
      };

      expect(Object.keys(manifest.exports).sort()).toEqual(exportNames);
      expect(Object.keys(manifest.publishConfig.exports).sort()).toEqual(
        exportNames,
      );
      expect(Object.keys(manifest.dependencies ?? {}).sort()).toEqual(
        dependencyNames,
      );
      expect(Object.keys(manifest.peerDependencies ?? {}).sort()).toEqual(
        peerDependencyNames,
      );

      // Each peer is declared once: pnpm resolves a `workspace:` peer to this repository's copy on its own, so a
      // duplicate devDependency would only be a second line to keep in step.
      for (const packageName of Object.keys(manifest.peerDependencies ?? {})) {
        expect(manifest.devDependencies ?? {}).not.toHaveProperty(packageName);
      }
    },
  );

  it.each([
    // Compiled plugins resolve database resources from baseDir inside dist.
    ['database', ['dist', 'README.md', 'CHANGELOG.md']],
    ['server.jobs', ['dist', 'README.md', 'CHANGELOG.md']],
    ['client.react-providers', ['dist', 'README.md', 'CHANGELOG.md']],
    ['skills', ['dist', 'README.md', 'CHANGELOG.md', 'skills']],
  ] as const)(
    '%s publishes only its declared package files',
    async (capability, packageFiles) => {
      const result = await createWith([capability]);
      const manifest = JSON.parse(
        await readFile(
          path.join(result.targetDirectory, 'package.json'),
          'utf8',
        ),
      ) as {
        files: string[];
        scripts: Record<string, string>;
      };

      expect(manifest.files).toEqual(packageFiles);
      expect(manifest.scripts.prepack).toBeUndefined();
    },
  );

  it('publishes the complete Registry ownership and build surface', async () => {
    const result = await createWith(['client.components', 'registry']);
    const manifest = JSON.parse(
      await readFile(path.join(result.targetDirectory, 'package.json'), 'utf8'),
    ) as {
      files: string[];
      nocobase?: unknown;
      scripts: Record<string, string>;
    };

    expect(manifest.files).toEqual([
      'dist',
      'README.md',
      'CHANGELOG.md',
      'components.json',
      'registry',
      'registry.config.json',
      'public/r',
    ]);
    expect(manifest.nocobase).toEqual({
      registry: { items: { 'component-ui': './registry/component-ui' } },
    });
    expect(manifest.scripts).toMatchObject({
      'registry:build': 'node ../../../scripts/registry.mjs build --package .',
      'registry:materialize':
        'node ../../../scripts/registry.mjs materialize --package .',
      prepack: 'pnpm registry:build',
    });
  });

  it('uses the same file plan for dry-run and real creation', async () => {
    const dryRunRepo = await createTestRepo();
    const dryRun = await createPlugin({
      capabilities: ['database', 'client.routes', 'skills'],
      dryRun: true,
      install: false,
      name: 'plan-check',
      now: new Date(2026, 7, 22),
      repoRoot: dryRunRepo,
    });

    const realRepo = await createTestRepo();
    const real = await createPlugin({
      capabilities: ['database', 'client.routes', 'skills'],
      install: false,
      name: 'plan-check',
      now: new Date(2026, 7, 22),
      repoRoot: realRepo,
    });

    expect(real.files).toEqual(dryRun.files);
    expect(real.capabilities).toEqual(dryRun.capabilities);
    await expect(listFiles(real.targetDirectory)).resolves.toEqual(real.files);
  });

  it.each([
    [
      'client-only',
      ['client.routes', 'client.components'],
      '@nocobase/dev-config/tsconfig/client-library.json',
      'createClientLibraryConfig',
      false,
      false,
    ],
    [
      'server-only',
      ['server.service-providers', 'server.routes'],
      '@nocobase/dev-config/tsconfig/server-library.json',
      'createNodeLibraryConfig',
      true,
      true,
    ],
    [
      'full-stack',
      ['client.routes', 'server.service-providers', 'server.routes'],
      '@nocobase/dev-config/tsconfig/server-library.json',
      'createClientLibraryConfig',
      true,
      true,
    ],
    [
      'registry-only',
      ['registry'],
      '@nocobase/dev-config/tsconfig/client-library.json',
      'createClientLibraryConfig',
      false,
      false,
    ],
    [
      'skills-only',
      ['skills'],
      '@nocobase/dev-config/tsconfig/server-library.json',
      'createNodeLibraryConfig',
      false,
      true,
    ],
  ] as const)(
    'selects runtime-aware development configuration for %s plugins',
    async (
      _name,
      capabilities,
      tsconfigPreset,
      eslintFactory,
      expectsNodeEngine,
      expectsNodeTypes,
    ) => {
      const result = await createWith(capabilities);
      const manifest = JSON.parse(
        await readFile(
          path.join(result.targetDirectory, 'package.json'),
          'utf8',
        ),
      ) as {
        engines?: { node?: string };
        devDependencies: Record<string, string>;
      };
      const tsconfig = JSON.parse(
        await readFile(
          path.join(result.targetDirectory, 'tsconfig.json'),
          'utf8',
        ),
      ) as {
        extends: string;
        compilerOptions: { lib?: string[] };
      };
      const eslintConfig = await readFile(
        path.join(result.targetDirectory, 'eslint.config.js'),
        'utf8',
      );

      expect(tsconfig.extends).toBe(tsconfigPreset);
      expect(eslintConfig).toContain(eslintFactory);
      expect(manifest.engines?.node !== undefined).toBe(expectsNodeEngine);
      expect('@types/node' in manifest.devDependencies).toBe(expectsNodeTypes);
      if (_name === 'full-stack') {
        expect(tsconfig.compilerOptions.lib).toEqual([
          'ES2022',
          'DOM',
          'DOM.Iterable',
        ]);
      }
    },
  );

  it('creates only a package foundation when --empty is explicit', async () => {
    const repoRoot = await createTestRepo();
    const result = await createPlugin({
      empty: true,
      install: false,
      name: 'audit-log',
      repoRoot,
    });
    const manifest = JSON.parse(
      await readFile(path.join(result.targetDirectory, 'package.json'), 'utf8'),
    ) as {
      dependencies?: unknown;
      devDependencies?: Record<string, string>;
      engines?: { node?: string };
      exports?: Record<string, unknown>;
      files?: string[];
    };
    expect(result.files).toEqual([
      '.gitignore',
      '.prettierignore',
      'AGENTS.md',
      'CHANGELOG.md',
      'CLAUDE.md',
      'eslint.config.js',
      'package.json',
      'package.ts',
      'README.md',
      'tsconfig.json',
    ]);
    expect(manifest.dependencies).toBeUndefined();
    expect(manifest.engines).toBeUndefined();
    expect(manifest.devDependencies).toHaveProperty('@types/node', 'catalog:');
    expect(manifest.exports).toEqual({ './package.json': './package.json' });
    expect(manifest.files).toEqual(['dist', 'README.md', 'CHANGELOG.md']);
  });

  it('tests the database capability with app-testing', async () => {
    const result = await createWith(['database']);
    const manifest = JSON.parse(
      await readFile(path.join(result.targetDirectory, 'package.json'), 'utf8'),
    ) as { devDependencies?: Record<string, string> };
    const test = await readFile(
      path.join(result.targetDirectory, 'tests/database/migrations.test.ts'),
      'utf8',
    );
    expect(manifest.devDependencies).toHaveProperty(
      '@nocobase/app-testing',
      'workspace:*',
    );
    expect(manifest.devDependencies).not.toHaveProperty('@nocobase/db-testing');
    expect(test).toContain("from '@nocobase/app-testing/server'");
    expect(test).not.toMatch(/@nocobase\/db-sqlite|dialect:|:memory:/);
  });

  it('prepares a plugin with client code for page tests under jsdom', async () => {
    const result = await createWith(['client.routes']);
    const manifest = JSON.parse(
      await readFile(path.join(result.targetDirectory, 'package.json'), 'utf8'),
    ) as {
      devDependencies: Record<string, string>;
      peerDependencies: Record<string, string>;
    };
    const vitestConfig = await readFile(
      path.join(result.targetDirectory, 'vitest.config.ts'),
      'utf8',
    );

    expect(manifest.devDependencies).toMatchObject({
      '@nocobase/app-testing': 'workspace:*',
      '@nocobase/i18n': 'workspace:*',
      '@nocobase/service-provider': 'workspace:*',
      '@testing-library/jest-dom': 'catalog:',
      '@testing-library/react': 'catalog:',
      '@vitejs/plugin-react': 'catalog:',
      jsdom: 'catalog:',
      react: 'catalog:',
      'react-dom': 'catalog:',
      'react-router': 'catalog:',
    });
    // A runtime peer satisfies the page test; it is not declared a second time.
    expect(manifest.peerDependencies).toHaveProperty('@nocobase/app-client');
    expect(manifest.devDependencies).not.toHaveProperty('@nocobase/app-client');
    expect(vitestConfig).toContain(
      "include: ['tests/client/**/*.test.{ts,tsx}']",
    );
    expect(vitestConfig).toContain("exclude: ['tests/client/**']");
  });

  it('runs a plugin without client code on the Node preset alone', async () => {
    const result = await createWith(['server.routes']);
    const manifest = JSON.parse(
      await readFile(path.join(result.targetDirectory, 'package.json'), 'utf8'),
    ) as { devDependencies: Record<string, string> };
    const vitestConfig = await readFile(
      path.join(result.targetDirectory, 'vitest.config.ts'),
      'utf8',
    );

    expect(manifest.devDependencies).not.toHaveProperty(
      '@testing-library/react',
    );
    expect(manifest.devDependencies).not.toHaveProperty('jsdom');
    // The Node preset carries the shared timeouts a database test needs; Vitest's own 5-second default is too short.
    expect(vitestConfig).toContain('createNodeVitestConfig');
    expect(vitestConfig).not.toContain('createReactVitestConfig');
    expect(vitestConfig).toContain("include: ['tests/**/*.test.{ts,tsx}']");
  });

  it('executes TSX tests in a generated Node-only plugin', async () => {
    const result = await createWith(['server.routes']);
    await symlink(
      fileURLToPath(new URL('../node_modules', import.meta.url)),
      path.join(result.targetDirectory, 'node_modules'),
      'junction',
    );
    const testPath = 'tests/project/node-discovery.test.tsx';
    await mkdir(path.join(result.targetDirectory, 'tests/project'));
    await writeFile(
      path.join(result.targetDirectory, testPath),
      `import { expect, it } from 'vitest';
it('runs TSX tests under Node', () => {
  expect(typeof process.versions.node).toBe('string');
  expect(typeof document).toBe('undefined');
});
`,
    );
    const require = createRequire(import.meta.url);
    const run = spawnSync(
      process.execPath,
      [
        path.join(
          path.dirname(require.resolve('vitest/package.json')),
          'vitest.mjs',
        ),
        'run',
        testPath,
        '--reporter=json',
      ],
      { cwd: result.targetDirectory, encoding: 'utf8', timeout: 20_000 },
    );

    expect(run.error).toBeUndefined();
    expect({ status: run.status, stderr: run.stderr }).toEqual({
      status: 0,
      stderr: '',
    });
    expect(JSON.parse(run.stdout)).toMatchObject({
      numTotalTests: 1,
      numPassedTests: 1,
    });
  });

  it('adds no Vitest configuration to a plugin without tests', async () => {
    const result = await createWith(['skills']);

    await expect(
      readFile(path.join(result.targetDirectory, 'vitest.config.ts'), 'utf8'),
    ).rejects.toThrow();
  });

  it('keeps Server routes independent from providers and database', async () => {
    const result = await createWith(['server.routes']);
    const manifest = JSON.parse(
      await readFile(path.join(result.targetDirectory, 'package.json'), 'utf8'),
    ) as {
      dependencies?: Record<string, string>;
      exports?: Record<string, unknown>;
      peerDependencies?: Record<string, string>;
    };
    const plugin = await readFile(
      path.join(result.targetDirectory, 'server/plugin.ts'),
      'utf8',
    );
    expect(result.files).toContain('server/routes/index.ts');
    expect(result.files).not.toContain('server/tokens.ts');
    expect(result.files).not.toContain('database/README.md');
    expect(plugin).toContain('routes,');
    expect(plugin).not.toContain('providers,');
    expect(plugin).not.toContain('database:');
    expect(manifest.dependencies).toEqual({ hono: 'catalog:' });
    expect(manifest.peerDependencies).toEqual({
      '@nocobase/app-server': 'workspace:^',
    });
    expect(manifest.exports).toHaveProperty('./server');
    expect(manifest.exports).not.toHaveProperty('./server/tokens');
  });

  it('generates a JobExecutor job with a stable name and the provider that owns it', async () => {
    const jobsOnly = await createWith(['server.jobs']);
    const job = await readFile(
      path.join(jobsOnly.targetDirectory, 'server/jobs/audit-log.ts'),
      'utf8',
    );
    const provider = await readFile(
      path.join(jobsOnly.targetDirectory, 'server/jobs/provider.ts'),
      'utf8',
    );
    const plugin = await readFile(
      path.join(jobsOnly.targetDirectory, 'server/plugin.ts'),
      'utf8',
    );
    expect(job).toContain("from '@nocobase/jobs'");
    expect(job).toContain('public static readonly jobName: string');
    expect(job).toContain("'@nocobase/app-plugin-audit-log/audit-log'");
    expect(provider).toContain(
      "getJobExecutor('@nocobase/app-plugin-audit-log')",
    );
    expect(plugin).toContain('serviceProviders: [AuditLogJobsProvider],');
    expect(plugin).not.toContain('queue');

    const withServices = await createWith([
      'server.service-providers',
      'server.jobs',
    ]);
    expect(
      await readFile(
        path.join(withServices.targetDirectory, 'server/plugin.ts'),
        'utf8',
      ),
    ).toContain(
      'serviceProviders: [...serviceProviders, AuditLogJobsProvider],',
    );
  });

  it('maps selected Client entries without inventing routes or providers', async () => {
    const result = await createWith([
      'client.service-providers',
      'client.components',
    ]);
    const plugin = await readFile(
      path.join(result.targetDirectory, 'client/plugin.ts'),
      'utf8',
    );
    expect(result.files).toContain('client/providers/index.ts');
    expect(result.files).toContain('client/components/plugin-component.tsx');
    expect(result.files).not.toContain('client/routes.ts');
    expect(result.files).not.toContain('client/react-providers/index.ts');
    expect(plugin).toContain('serviceProviders,');
    expect(plugin).not.toContain('locales:');
    expect(plugin).not.toContain('routes:');
    expect(plugin).not.toContain('reactProviders:');
  });

  it('generates metadata for all explicitly selected capabilities', async () => {
    const result = await createWith([
      'database',
      'server.service-providers',
      'server.routes',
      'server.jobs',
      'server.locales',
      'client.routes',
      'client.components',
      'client.service-providers',
      'client.react-providers',
      'client.locales',
      'registry',
      'skills',
    ]);
    const manifest = JSON.parse(
      await readFile(path.join(result.targetDirectory, 'package.json'), 'utf8'),
    ) as {
      dependencies?: Record<string, string>;
      files?: string[];
      peerDependencies?: Record<string, string>;
      scripts?: Record<string, string>;
    };
    expect(result.files).toContain(
      'database/migrations/202608220001_audit_log_create_records.ts.example',
    );
    expect(result.files).toContain('server/jobs/audit-log.ts');
    expect(result.files).toContain(
      'skills/nocobase-app-plugin-audit-log/SKILL.md',
    );
    expect(result.files).toContain('registry.config.json');
    expect(manifest.dependencies).toMatchObject({ hono: 'catalog:' });
    expect(manifest.peerDependencies).toMatchObject({
      '@nocobase/app-server': 'workspace:^',
      '@nocobase/db': 'workspace:^',
      '@nocobase/i18n': 'workspace:^',
      '@nocobase/jobs': 'workspace:^',
      '@nocobase/service-provider': 'workspace:^',
    });
    expect(manifest.files).toEqual(
      expect.arrayContaining(['skills', 'registry', 'public/r']),
    );
    expect(manifest.scripts?.prepack).toBe('pnpm registry:build');
  });

  it('generates an AppCommand that returns its result, with a test that binds it', async () => {
    const result = await createWith(['cli']);
    const command = await readFile(
      path.join(result.targetDirectory, 'cli/info.ts'),
      'utf8',
    );
    const test = await readFile(
      path.join(result.targetDirectory, 'tests/cli/info.test.ts'),
      'utf8',
    );

    expect(command).toContain(
      "import { AppCommand } from '@nocobase/app-cli';",
    );
    expect(command).toContain('extends AppCommand');
    expect(command).toContain('Promise<PluginInfoResult>');
    // `--json` belongs to AppCommand; a command that declares or branches on it prints a second document.
    expect(command).not.toContain('json: Flags.boolean');
    expect(command).not.toContain('flags.json');
    expect(command).not.toContain('logJson');
    expect(test).toContain(
      "import { bindAppCommand, runAppCommand } from '@nocobase/app-testing/cli';",
    );
    expect(test).toContain("describe('@nocobase/app-plugin-audit-log'");
    expect(test).not.toMatch(/__NOCOBASE_[A-Z0-9_]+__/u);
  });

  it('generates a capability-aware App-facing Skill draft', async () => {
    const result = await createWith([
      'client.components',
      'server.service-providers',
      'server.routes',
      'skills',
    ]);
    const skill = await readFile(
      path.join(
        result.targetDirectory,
        'skills/nocobase-app-plugin-audit-log/SKILL.md',
      ),
      'utf8',
    );

    expect(skill).toContain('## Use this Skill when');
    expect(skill).toContain('## Public surfaces');
    expect(skill).toContain('## App workflow');
    expect(skill).toContain('## Ownership');
    expect(skill).toContain('## Permissions and constraints');
    expect(skill).toContain('## Verification');
    expect(skill).toContain('public package export');
    expect(skill).toContain('public `ServiceToken` export');
    expect(skill).toContain('authentication and authorization boundary');
    expect(skill).toContain('Development draft');
    expect(skill).not.toContain('/api/example');
    expect(skill).not.toContain('/settings/example');
  });

  it('does not write or synchronize during a dry run', async () => {
    const repoRoot = await createTestRepo();
    const synchronize = vi.fn();
    const result = await createPlugin({
      capabilities: ['client.routes'],
      dryRun: true,
      name: 'audit-log',
      repoRoot,
      synchronize,
    });
    expect(result.files).toContain('client/routes.ts');
    await expect(
      readFile(result.targetDirectory, 'utf8'),
    ).rejects.toMatchObject({ code: 'ENOENT' });
    expect(synchronize).not.toHaveBeenCalled();
  });

  it('does not overwrite an existing plugin', async () => {
    const repoRoot = await createTestRepo();
    const target = path.join(repoRoot, 'packages/plugins/app-plugin-audit-log');
    await mkdir(target);
    await writeFile(path.join(target, 'marker.txt'), 'keep\n');
    await expect(
      createPlugin({
        empty: true,
        install: false,
        name: 'audit-log',
        repoRoot,
      }),
    ).rejects.toThrow('Target already exists');
    await expect(
      readFile(path.join(target, 'marker.txt'), 'utf8'),
    ).resolves.toBe('keep\n');
  });
});
