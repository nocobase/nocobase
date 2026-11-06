import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  chmod,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { parse } from 'yaml';
import {
  PLUGIN_CAPABILITIES,
  type PluginCapability,
} from '../src/lib/capabilities.ts';
import { createPlugin } from '../src/lib/scaffold.ts';
import { runCreatePluginCli } from '../src/create.ts';

const directories: string[] = [];
const versions = {
  '@nocobase/app-cli': '1.0.0-beta.2',
  '@nocobase/app-server': '1.0.0-beta.2',
  '@nocobase/app-client': '1.0.0-beta.2',
  '@nocobase/app-testing': '0.1.0-beta.2',
  '@nocobase/dev-config': '0.1.0-beta.2',
  '@nocobase/service-provider': '0.1.0-beta.2',
  '@nocobase/db': '1.0.0-beta.2',
  '@nocobase/jobs': '0.1.0-beta.2',
  '@oclif/core': '4.14.0',
  '@types/node': '24.0.0',
  '@types/react': '19.0.0',
  '@testing-library/jest-dom': '6.0.0',
  '@testing-library/react': '16.0.0',
  '@vitejs/plugin-react': '5.0.0',
  '@nocobase/i18n': '0.1.0-beta.2',
  jsdom: '28.0.0',
  react: '19.0.0',
  'react-dom': '19.0.0',
  'react-router': '7.0.0',
  shadcn: '4.0.0',
  tailwindcss: '4.0.0',
  'tw-animate-css': '1.0.0',
  hono: '4.0.0',
  eslint: '10.0.0',
  prettier: '3.0.0',
  typescript: '6.0.0',
  vitest: '4.0.0',
};

async function json(file: string, value: unknown): Promise<void> {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`);
}
async function app(
  workspace = '# Keep settings\nallowBuilds:\n  esbuild: true\n',
): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), 'create-plugin-app-'));
  directories.push(root);
  await json(path.join(root, 'package.json'), {
    name: 'my-app',
    private: true,
    nocobase: { templateKind: 'app' },
    dependencies: { '@nocobase/app-cli': versions['@nocobase/app-cli'] },
  });
  await writeFile(path.join(root, 'pnpm-workspace.yaml'), workspace);
  for (const [name, version] of Object.entries(versions))
    await json(path.join(root, 'node_modules', name, 'package.json'), {
      name,
      version,
    });
  return root;
}

async function runtimeDependency(
  root: string,
  runtime: string,
  version: string,
): Promise<void> {
  const modules = path.join(
    root,
    'node_modules/.pnpm',
    runtime.split('/').at(-1)!,
    'node_modules',
  );
  await json(path.join(modules, runtime, 'package.json'), {
    name: runtime,
    version: versions[runtime as keyof typeof versions],
  });
  await json(path.join(modules, '@oclif/core/package.json'), {
    name: '@oclif/core',
    version,
  });
  const runtimeLink = path.join(root, 'node_modules', runtime);
  await rm(runtimeLink, { recursive: true, force: true });
  await symlink(path.join(modules, runtime), runtimeLink, 'dir');
}

function runCliPlugin(root: string): ReturnType<typeof spawnSync> {
  // Use the application's Node resolution without pnpm's injected workspace NODE_PATH.
  return spawnSync(
    process.execPath,
    [
      fileURLToPath(new URL('../bin/run.js', import.meta.url)),
      'demo',
      '--dir',
      root,
      '--with',
      'cli',
      '--no-install',
      '--json',
    ],
    {
      cwd: root,
      encoding: 'utf8',
      env: {
        ...process.env,
        NODE_PATH: '',
        NOCOBASE_CREATE_PLUGIN_USE_DIST: '0',
      },
    },
  );
}

afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all(
    directories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

describe('creating plugins in an application', () => {
  it.each(['dependencies', 'devDependencies', 'optionalDependencies'])(
    'rejects a plugin already declared in %s without changing the app',
    async (field) => {
      const root = await app();
      const manifestPath = path.join(root, 'package.json');
      const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
      manifest[field] = {
        ...manifest[field],
        '@my-app/app-plugin-demo': '^2.0.0',
      };
      await json(manifestPath, manifest);
      const before = await readFile(manifestPath, 'utf8');
      const workspaceBefore = await readFile(
        path.join(root, 'pnpm-workspace.yaml'),
        'utf8',
      );
      const synchronize = vi.fn();
      await expect(
        createPlugin({
          directory: root,
          name: '@my-app/app-plugin-demo',
          empty: true,
          synchronize,
        }),
      ).rejects.toMatchObject({ code: 'PACKAGE_ALREADY_DECLARED' });
      expect(await readFile(manifestPath, 'utf8')).toBe(before);
      expect(
        await readFile(path.join(root, 'pnpm-workspace.yaml'), 'utf8'),
      ).toBe(workspaceBefore);
      expect(await readdir(root)).not.toContain('packages');
      expect(synchronize).not.toHaveBeenCalled();
    },
  );

  it('resolves CLI dependencies from a symlinked pnpm runtime', async () => {
    const root = await app();
    await rm(path.join(root, 'node_modules/@oclif/core'), { recursive: true });
    await runtimeDependency(root, '@nocobase/app-cli', versions['@oclif/core']);
    // A missing runtime must not prevent resolution from the installed one.
    await rm(path.join(root, 'node_modules/@nocobase/app-server'), {
      recursive: true,
    });
    const run = runCliPlugin(root);
    expect({ status: run.status, stderr: run.stderr }).toEqual({
      status: 0,
      stderr: '',
    });
    const manifest = JSON.parse(
      await readFile(
        path.join(root, 'packages/app-plugin-demo/package.json'),
        'utf8',
      ),
    );
    expect(manifest.peerDependencies['@oclif/core']).toBe(
      versions['@oclif/core'],
    );
  });

  it('rejects conflicting dependency versions supplied by symlinked runtimes', async () => {
    const root = await app();
    await rm(path.join(root, 'node_modules/@oclif/core'), { recursive: true });
    await runtimeDependency(root, '@nocobase/app-cli', versions['@oclif/core']);
    await runtimeDependency(root, '@nocobase/app-server', '4.15.0');
    const run = runCliPlugin(root);
    expect(run.status).toBe(1);
    expect(JSON.parse(String(run.stdout))).toMatchObject({
      ok: false,
      error: { code: 'AMBIGUOUS_DEPENDENCY' },
    });
    expect(await readdir(root)).not.toContain('packages');
  });

  it('plans from a child directory without writing, then connects the same package to the app', async () => {
    const root = await app();
    await mkdir(path.join(root, 'client'));
    const synchronize = vi.fn();
    const before = await readFile(path.join(root, 'package.json'), 'utf8');
    const options = {
      directory: path.join(root, 'client'),
      name: '@my-app/app-plugin-demo-tools',
      capabilities: ['cli'] as const,
      synchronize,
    };
    const plan = await createPlugin({ ...options, dryRun: true });
    expect(plan.targetDirectory).toBe(
      path.join(root, 'packages/app-plugin-demo-tools'),
    );
    expect(plan.project).toEqual({ kind: 'application', root });
    expect(await readdir(root)).not.toContain('packages');
    expect(await readFile(path.join(root, 'package.json'), 'utf8')).toBe(
      before,
    );
    expect(synchronize).not.toHaveBeenCalled();
    const result = await createPlugin(options);
    expect(result.dependencies).toEqual(plan.dependencies);
    expect(synchronize).toHaveBeenCalledWith(root, result.targetDirectory);
    const plugin = JSON.parse(
      await readFile(path.join(result.targetDirectory, 'package.json'), 'utf8'),
    );
    expect(plugin).toMatchObject({
      private: true,
      name: '@my-app/app-plugin-demo-tools',
      peerDependencies: { '@nocobase/app-cli': versions['@nocobase/app-cli'] },
      devDependencies: {
        '@nocobase/app-testing': versions['@nocobase/app-testing'],
        typescript: versions.typescript,
      },
    });
    expect(JSON.stringify(plugin)).not.toMatch(/workspace:|catalog:/u);
    expect(
      JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'))
        .dependencies,
    ).toMatchObject({
      '@nocobase/app-cli': versions['@nocobase/app-cli'],
      '@my-app/app-plugin-demo-tools': 'workspace:*',
    });
    const workspace = await readFile(
      path.join(root, 'pnpm-workspace.yaml'),
      'utf8',
    );
    expect(workspace).toContain('# Keep settings');
    expect(parse(workspace)).toMatchObject({
      packages: ['packages/*'],
      allowBuilds: { esbuild: true },
    });
    expect(
      await readFile(path.join(result.targetDirectory, 'cli/index.ts'), 'utf8'),
    ).toContain('@my-app/app-plugin-demo-tools');
  });

  it.each(
    [
      ['client.routes'],
      ['server.routes', 'database'],
      ['skills'],
      [...PLUGIN_CAPABILITIES],
      [],
    ].map((capabilities) => ({ capabilities })),
  )('resolves dependencies for $capabilities', async ({ capabilities }) => {
    const root = await app('packages: [packages/*]\n');
    const result = await createPlugin({
      directory: root,
      name: 'demo',
      capabilities: capabilities as PluginCapability[],
      empty: capabilities.length === 0,
      install: false,
    });
    expect(result.projectEdits).toHaveLength(1);
    expect(JSON.stringify(result.dependencies)).not.toMatch(
      /workspace:|catalog:/u,
    );
    expect(result.files).toContain('package.json');
  });

  it('names an application-scoped integration Skill after its owner', async () => {
    const root = await app();
    const result = await createPlugin({
      directory: root,
      name: '@my-app/app-plugin-demo',
      capabilities: ['skills'],
      install: false,
    });
    const skill = await readFile(
      path.join(
        result.targetDirectory,
        'skills/my-app-app-plugin-demo/SKILL.md',
      ),
      'utf8',
    );
    expect(skill).toContain('name: my-app-app-plugin-demo');
    expect(skill).toContain('UI Library items');
    expect(skill).not.toContain('registry assets');
  });

  it('uses workspace ranges only for packages actually in the workspace', async () => {
    const root = await app('packages: [packages/*]\n');
    await json(path.join(root, 'packages/local-cli/package.json'), {
      name: '@nocobase/app-cli',
      version: versions['@nocobase/app-cli'],
    });
    const result = await createPlugin({
      directory: root,
      name: 'demo',
      capabilities: ['cli'],
      dryRun: true,
    });
    expect(result.dependencies.peerDependencies?.['@nocobase/app-cli']).toBe(
      'workspace:^',
    );
  });

  it.each(['!packages/app-plugin-demo', '!./packages/app-plugin-demo/'])(
    'preserves custom patterns and rejects exclusion %s',
    async (pattern) => {
      const root = await app(`packages: [shared/*, "${pattern}"]\n`);
      await expect(
        createPlugin({ directory: root, name: 'demo', empty: true }),
      ).rejects.toMatchObject({ code: 'WORKSPACE_EXCLUDES_PLUGIN' });
      expect(await readdir(root)).not.toContain('packages');
    },
  );

  it('accepts recursive workspace patterns containing source files', async () => {
    const root = await app('packages: [packages/**]\n');
    await json(path.join(root, 'packages/shared/package.json'), {
      name: '@my-app/shared',
      version: '1.0.0',
    });
    await writeFile(
      path.join(root, 'packages/shared/index.ts'),
      'export const value = 1;\n',
    );
    const result = await createPlugin({
      directory: root,
      name: 'demo',
      empty: true,
      install: false,
    });
    expect(result.projectEdits).toHaveLength(1);
  });

  it('detects another package with the requested name before writing', async () => {
    const root = await app('packages: [modules/*]\n');
    await json(path.join(root, 'modules/existing/package.json'), {
      name: '@nocobase/app-plugin-demo',
      version: '0.0.1',
    });
    await expect(
      createPlugin({ directory: root, name: 'demo', empty: true }),
    ).rejects.toMatchObject({ code: 'DUPLICATE_WORKSPACE_PACKAGE' });
  });

  it('fails before writing when a required dependency is missing or incompatible', async () => {
    const root = await app();
    await rm(path.join(root, 'node_modules/typescript'), { recursive: true });
    await expect(
      createPlugin({ directory: root, name: 'demo', capabilities: ['cli'] }),
    ).rejects.toMatchObject({ code: 'DEPENDENCY_NOT_INSTALLED' });
    expect(await readdir(root)).not.toContain('packages');
    await json(path.join(root, 'node_modules/typescript/package.json'), {
      name: 'typescript',
      version: versions.typescript,
    });
    await json(path.join(root, 'node_modules/@oclif/core/package.json'), {
      name: '@oclif/core',
      version: '3.0.0',
    });
    await expect(
      createPlugin({ directory: root, name: 'demo', capabilities: ['cli'] }),
    ).rejects.toMatchObject({ code: 'INCOMPATIBLE_DEPENDENCY' });
  });

  it('keeps generated files and application edits after an install failure', async () => {
    const root = await app();
    await expect(
      createPlugin({
        directory: root,
        name: 'demo',
        capabilities: ['cli'],
        synchronize: () => {
          throw new Error('installation failed');
        },
      }),
    ).rejects.toThrow('installation failed');
    expect(
      JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'))
        .dependencies['@nocobase/app-plugin-demo'],
    ).toBe('workspace:*');
    expect(
      await readFile(
        path.join(root, 'packages/app-plugin-demo/cli/index.ts'),
        'utf8',
      ),
    ).toContain('defineCliPlugin');
  });

  it('keeps install progress on stderr when the executable returns JSON', async () => {
    const root = await app();
    const bin = path.join(root, 'bin');
    await mkdir(bin);
    const pnpm = path.join(bin, 'pnpm');
    await writeFile(
      pnpm,
      '#!/usr/bin/env node\nconsole.log("install progress");\n',
    );
    await chmod(pnpm, 0o755);
    const run = spawnSync(
      process.execPath,
      [
        fileURLToPath(new URL('../bin/run.js', import.meta.url)),
        'demo',
        '--dir',
        root,
        '--with',
        'cli',
        '--json',
      ],
      {
        cwd: root,
        env: {
          ...process.env,
          PATH: `${bin}${path.delimiter}${process.env.PATH ?? ''}`,
        },
        encoding: 'utf8',
      },
    );
    expect({ status: run.status, stderr: run.stderr }).toEqual({
      status: 0,
      stderr: 'install progress\n',
    });
    expect(JSON.parse(run.stdout)).toMatchObject({
      ok: true,
      result: { mode: 'create', project: { kind: 'application', root } },
    });
  });

  it('reports application edits and registration instructions through the JSON CLI', async () => {
    const root = await app();
    const output: string[] = [];
    vi.spyOn(process.stdout, 'write').mockImplementation((chunk): boolean => {
      output.push(String(chunk));
      return true;
    });
    const status = await runCreatePluginCli({
      argv: ['demo', '--dir', root, '--with', 'cli', '--dry-run', '--json'],
      binary: 'create-plugin',
      version: '0.0.1',
    });
    expect(status).toBe(0);
    expect(output).toHaveLength(1);
    const envelope = JSON.parse(output.join(''));
    expect(envelope).toMatchObject({
      ok: true,
      status: 'success-noop',
      result: {
        project: { kind: 'application', root },
        writes: [],
        commands: [],
      },
    });
    expect(envelope.result.nextSteps).toContain(
      'pnpm nocobase plugin register @nocobase/app-plugin-demo --no-install',
    );
    expect(JSON.stringify(envelope)).not.toContain('app-template-default');
  });
});
