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
  vi.restoreAllMocks();
  vi.clearAllMocks();
  await rm(root, { recursive: true, force: true });
});
async function template(kind = 'app'): Promise<void> {
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
    kind,
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
    // The registry the templates came from has to survive into the project, or the next `pnpm add @nocobase/…` the
    // user runs resolves against the public npm.
    expect(await readFile(path.join(root, 'crm/.npmrc'), 'utf8')).toContain(
      '@nocobase:registry=',
    );
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
  it('supports no-install and Hub startup commands', async () => {
    await template('hub');
    expect(
      await run(['crm', '--template', 'hub', '--json', '--no-install']),
    ).toBe(0);
    expect(JSON.parse(stdout)).toMatchObject({
      result: {
        dependenciesInstalled: false,
        nextCommands: [
          'pnpm install',
          'pnpm nocobase config init',
          'pnpm nocobase config check',
          'pnpm build',
          'pnpm start',
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
