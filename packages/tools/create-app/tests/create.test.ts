import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/create.ts';
import { downloadTemplate } from '../src/lib/template.ts';
import {
  installDependencies,
  syncSkills,
  verifyDriver,
} from '../src/lib/install.ts';
vi.mock('../src/lib/template.ts', async (original) => ({
  ...(await original<typeof import('../src/lib/template.ts')>()),
  downloadTemplate: vi.fn(),
}));
vi.mock('../src/lib/install.ts', () => ({
  installDependencies: vi.fn(),
  syncSkills: vi.fn(),
  verifyDriver: vi.fn(),
}));
let root: string;
let stdout: string;
beforeEach(async () => {
  root = await mkdtemp(path.join(os.tmpdir(), 'create-flow-'));
  stdout = '';
  vi.spyOn(process, 'cwd').mockReturnValue(root);
  vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
    stdout += String(chunk);
    return true;
  });
  vi.spyOn(process.stderr, 'write').mockReturnValue(true);
  vi.mocked(installDependencies).mockResolvedValue(undefined);
  vi.mocked(verifyDriver).mockResolvedValue({ ok: true });
  vi.mocked(syncSkills).mockResolvedValue({ ok: true });
});
afterEach(async () => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  vi.clearAllMocks();
  await rm(root, { recursive: true, force: true });
});
async function template(): Promise<void> {
  const directory = await mkdtemp(path.join(root, 'template-'));
  await writeFile(
    path.join(directory, 'package.json'),
    JSON.stringify({
      name: '@test/template',
      version: '1.0.0',
      dependencies: {
        '@nocobase/db-postgres': '^1.0.0',
        '@nocobase/db-oracle': '^1.0.0',
        '@nocobase/db-sqlite': '^1.0.0',
      },
    }),
  );
  await writeFile(
    path.join(directory, 'config.example.yml'),
    'database:\n  connections:\n    main:\n      dialect: sqlite\n      database: database.sqlite\n',
  );
  vi.mocked(downloadTemplate).mockResolvedValue({
    directory,
    name: '@test/template',
    version: '1.0.0',
  });
}
const run = (argv: string[]) =>
  createApp({ argv, version: 'test', binary: 'create-app' });
describe('JSON creation flow', () => {
  it('installs by default and hands the configuration step to config init', async () => {
    await template();
    expect(await run(['crm', '--json'])).toBe(0);
    expect(JSON.parse(stdout)).toMatchObject({
      ok: true,
      command: 'create-app',
      status: 'success',
      result: {
        directory: path.join(root, 'crm'),
        projectCreated: true,
        dependenciesInstalled: true,
        configured: false,
        nextCommands: [
          'pnpm nocobase config init',
          'pnpm nocobase config check',
          'pnpm dev',
        ],
      },
      warnings: [],
    });
    expect(installDependencies).toHaveBeenCalledOnce();
    // Creation writes no configuration at all, so there is no secret for it to leak and nothing for `config init` to
    // refuse to overwrite.
    await expect(readFile(path.join(root, 'crm/config.yml'))).rejects.toThrow();
    expect(stdout).not.toContain('secret');
    await expect(readFile(path.join(root, 'crm/.env'))).rejects.toThrow();
    // Public npm needs no scoped override in the generated project.
    expect(await readFile(path.join(root, 'crm/.npmrc'), 'utf8')).not.toContain(
      '@nocobase:registry=',
    );
  });
  it.each(['flag', 'environment'])(
    'uses the selected commercial registry through %s for multi-portal',
    async (selection) => {
      await template();
      const registry = 'https://pkg-v3.nocobase.com/';
      const argv = [
        'crm',
        '--json',
        '--template=multi-portal',
        '--template-tag=beta',
      ];
      if (selection === 'flag') argv.push(`--registry=${registry}`);
      else vi.stubEnv('NOCOBASE_REGISTRY', registry);
      expect(await run(argv)).toBe(0);
      expect(downloadTemplate).toHaveBeenCalledWith({
        registry,
        source: '@nocobase/app-template-multi-portal@beta',
      });
      expect(
        vi.mocked(installDependencies).mock.calls[0][0],
      ).not.toHaveProperty('registry');
      expect(installDependencies).toHaveBeenCalledWith(
        expect.objectContaining({ directory: path.join(root, 'crm') }),
      );
      expect(await readFile(path.join(root, 'crm/.npmrc'), 'utf8')).toContain(
        `@nocobase:registry=${registry}`,
      );
    },
  );

  it('reports unavailable commercial templates without falling back or creating an app', async () => {
    vi.mocked(downloadTemplate).mockRejectedValueOnce(
      new Error('Template access denied'),
    );
    expect(
      await run([
        'crm',
        '--json',
        '--template=multi-portal',
        '--registry=https://pkg-v3.nocobase.com/',
      ]),
    ).toBe(1);
    expect(JSON.parse(stdout)).toMatchObject({
      ok: false,
      error: { code: 'TEMPLATE_DOWNLOAD_FAILED' },
    });
    expect(downloadTemplate).toHaveBeenCalledOnce();
    expect(installDependencies).not.toHaveBeenCalled();
    await expect(
      readFile(path.join(root, 'crm/package.json')),
    ).rejects.toThrow();
  });

  it('returns a nonzero install failure and retains the generated project', async () => {
    await template();
    vi.mocked(installDependencies).mockRejectedValue(
      new Error('installation failed'),
    );
    expect(await run(['crm', '--json'])).toBe(1);
    expect(JSON.parse(stdout)).toMatchObject({
      ok: false,
      status: 'failure',
      error: {
        code: 'INSTALL_FAILED',
        message: 'installation failed',
        // Runs as given from wherever the caller is: the project is named rather than assumed to be the cwd.
        suggestions: [
          {
            run: {
              command: 'pnpm',
              args: ['--dir', path.join(root, 'crm'), 'install'],
            },
          },
        ],
        details: {
          stage: 'install',
          directory: path.join(root, 'crm'),
          projectCreated: true,
          dependenciesInstalled: false,
        },
      },
    });
    expect(
      await readFile(path.join(root, 'crm/package.json'), 'utf8'),
    ).toContain('"name": "crm"');
  });
  it('prints the document on one line, which app-installer reads by line', async () => {
    await template();
    expect(await run(['crm', '--json'])).toBe(0);
    // `pnpm create` prints pnpm's own notices around the document, so app-installer's `parseCreateResult` takes the
    // last line of stdout that parses; an indented document would leave it nothing to read.
    expect(stdout.trim()).not.toContain('\n');
    expect(JSON.parse(stdout)).toMatchObject({ ok: true });
  });
  it('supports no-install and lists the install step first', async () => {
    await template();
    expect(
      await run(['crm', '--template', 'examples', '--json', '--no-install']),
    ).toBe(0);
    expect(JSON.parse(stdout)).toMatchObject({
      result: {
        dependenciesInstalled: false,
        nextCommands: [
          'pnpm install',
          'pnpm nocobase config init',
          'pnpm nocobase config check',
          'pnpm dev',
        ],
      },
    });
    expect(installDependencies).not.toHaveBeenCalled();
  });
  it.each([['--json'], ['crm', '--json', '--template-tag', 'invalid']])(
    'rejects invalid input before download: %s',
    async (...argv) => {
      expect(await run(argv)).toBe(2);
      expect(JSON.parse(stdout)).toMatchObject({
        ok: false,
        status: 'failure',
        error: {
          code: 'INVALID_USAGE',
          suggestions: [],
          details: { stage: 'input', projectCreated: false },
        },
      });
      expect(downloadTemplate).not.toHaveBeenCalled();
    },
  );
  it('reports an occupied target as a scaffold failure without changing its contents', async () => {
    await mkdir(path.join(root, 'crm'));
    await writeFile(path.join(root, 'crm/keep.txt'), 'existing content');
    expect(await run(['crm', '--json'])).toBe(1);
    expect(JSON.parse(stdout)).toMatchObject({
      status: 'failure',
      error: {
        code: 'SCAFFOLD_FAILED',
        details: { stage: 'scaffold', projectCreated: false },
      },
    });
    expect(downloadTemplate).not.toHaveBeenCalled();
    expect(await readFile(path.join(root, 'crm/keep.txt'), 'utf8')).toBe(
      'existing content',
    );
  });
  /** The one native addon every application gets, through the SQLite driver the templates depend on. */
  it('verifies the native driver after installing', async () => {
    await template();
    expect(await run(['crm', '--json'])).toBe(0);
    expect(JSON.parse(stdout)).toMatchObject({
      status: 'success',
      result: { dependenciesInstalled: true },
    });
    expect(verifyDriver).toHaveBeenCalledWith(path.join(root, 'crm'));
  });
  it('returns help and the version as JSON', async () => {
    expect(await run(['--json', '--help'])).toBe(0);
    expect(JSON.parse(stdout)).toMatchObject({
      ok: true,
      status: 'success',
      result: { help: expect.stringContaining('nocobase config init') },
    });
    stdout = '';
    expect(await run(['--version', '--json'])).toBe(0);
    expect(JSON.parse(stdout)).toStrictEqual({
      schemaVersion: 1,
      ok: true,
      command: 'create-app',
      status: 'success',
      result: { version: 'test' },
      warnings: [],
    });
  });
});

async function workspaceTemplate(): Promise<void> {
  const directory = await mkdtemp(path.join(root, 'workspace-template-'));
  await writeFile(
    path.join(directory, 'package.json'),
    JSON.stringify({
      name: '@test/workspace',
      version: '1.0.0',
      nocobase: {
        templateKind: 'workspace',
        appDirectories: ['apps/main', 'apps/sub'],
      },
    }),
  );
  for (const name of ['main', 'sub']) {
    const app = path.join(directory, 'apps', name);
    await mkdir(app, { recursive: true });
    await writeFile(
      path.join(app, 'package.json'),
      JSON.stringify({
        name: `@test/${name}`,
        version: '1.0.0',
        nocobase: { templateKind: 'app' },
        dependencies: { '@nocobase/db-sqlite': '^1.0.0' },
      }),
    );
  }
  vi.mocked(downloadTemplate).mockResolvedValue({
    directory,
    name: '@test/workspace',
    version: '1.0.0',
  });
}

describe('workspace JSON creation flow', () => {
  it('installs once at the root and verifies and synchronizes each App, never the root', async () => {
    await workspaceTemplate();
    expect(await run(['platform', '--template=multi-app', '--json'])).toBe(0);
    const directory = path.join(root, 'platform');
    expect(downloadTemplate).toHaveBeenCalledWith({
      registry: 'https://registry.npmjs.org',
      source: '@nocobase/app-template-multi-app@latest',
    });
    expect(installDependencies).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ directory }),
    );
    expect(verifyDriver).toHaveBeenCalledTimes(2);
    expect(syncSkills).toHaveBeenCalledTimes(2);
    for (const name of ['main', 'sub']) {
      expect(verifyDriver).toHaveBeenCalledWith(
        path.join(directory, 'apps', name),
      );
      expect(syncSkills).toHaveBeenCalledWith(
        path.join(directory, 'apps', name),
      );
      await expect(
        readFile(path.join(directory, 'apps', name, 'config.yml')),
      ).rejects.toThrow();
    }
    expect(syncSkills).not.toHaveBeenCalledWith(directory);
    expect(JSON.parse(stdout)).toMatchObject({
      ok: true,
      result: {
        configured: false,
        applications: [
          {
            name: 'platform-main',
            directory: path.join(directory, 'apps/main'),
          },
          { name: 'platform-sub', directory: path.join(directory, 'apps/sub') },
        ],
        nextCommands: [
          'pnpm --dir=apps/main nocobase config init',
          'pnpm --dir=apps/main nocobase config check',
          'pnpm --dir=apps/sub nocobase config init',
          'pnpm --dir=apps/sub nocobase config check',
        ],
      },
    });
    expect(stdout.trim()).not.toContain('\n');
  });

  it('keeps no-install read-only with respect to configuration and Skills', async () => {
    await workspaceTemplate();
    expect(await run(['platform', '--json', '--no-install'])).toBe(0);
    const result = JSON.parse(stdout).result;
    expect(result.nextCommands[0]).toBe('pnpm install');
    expect(result.applications).toHaveLength(2);
    expect(result.dependenciesInstalled).toBe(false);
    expect(installDependencies).not.toHaveBeenCalled();
    expect(verifyDriver).not.toHaveBeenCalled();
    expect(syncSkills).not.toHaveBeenCalled();
  });

  it('retains both Apps after denied commercial installation and reports a root-only retry', async () => {
    await workspaceTemplate();
    vi.mocked(installDependencies).mockRejectedValue(
      new Error('E401: commercial package access denied'),
    );
    expect(await run(['platform', '--json'])).toBe(1);
    const envelope = JSON.parse(stdout);
    expect(envelope).toMatchObject({
      ok: false,
      error: {
        code: 'INSTALL_FAILED',
        details: { projectCreated: true, dependenciesInstalled: false },
      },
    });
    expect(envelope.error.details.applications).toHaveLength(2);
    expect(envelope.error.suggestions[0].run).toEqual({
      command: 'pnpm',
      args: ['--dir', path.join(root, 'platform'), 'install'],
    });
    for (const name of ['main', 'sub']) {
      expect(
        await readFile(
          path.join(root, 'platform/apps', name, 'package.json'),
          'utf8',
        ),
      ).toContain(`platform-${name}`);
    }
    expect(syncSkills).not.toHaveBeenCalled();
  });

  it('identifies the App whose native-driver verification failed', async () => {
    await workspaceTemplate();
    vi.mocked(verifyDriver)
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({
        ok: false,
        reason: 'native driver unavailable',
      });
    expect(await run(['platform', '--json'])).toBe(1);
    expect(JSON.parse(stdout)).toMatchObject({
      ok: false,
      error: {
        details: {
          dependenciesInstalled: true,
          applicationDirectory: path.join(root, 'platform/apps/sub'),
        },
      },
    });
  });

  it('warns for a failed Skills sync but continues syncing the other App', async () => {
    await workspaceTemplate();
    vi.mocked(syncSkills)
      .mockResolvedValueOnce({ ok: false, reason: 'sync unavailable' })
      .mockResolvedValueOnce({ ok: true });
    expect(await run(['platform', '--json'])).toBe(0);
    expect(syncSkills).toHaveBeenCalledTimes(2);
    expect(JSON.parse(stdout).warnings).toEqual([
      expect.stringContaining('apps/main: sync unavailable'),
    ]);
  });
});
