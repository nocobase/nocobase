import {
  chmod,
  mkdtemp,
  mkdir,
  readFile,
  readdir,
  rename,
  rm,
  stat,
  symlink,
  writeFile,
  readlink,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { applyProjectEdits } from '../src/lib/project-edits.ts';
import { createPlugin } from '../src/lib/scaffold.ts';
import { runCreatePluginCli } from '../src/create.ts';
import type { ProjectEdit } from '../src/lib/project.ts';

vi.mock('node:fs/promises', async (importOriginal) => {
  const fs = await importOriginal<typeof import('node:fs/promises')>();
  return {
    ...fs,
    writeFile: vi.fn(fs.writeFile),
    rename: vi.fn(fs.rename),
    rm: vi.fn(fs.rm),
  };
});
const fs =
  await vi.importActual<typeof import('node:fs/promises')>('node:fs/promises');
const directories: string[] = [];

async function fixture(): Promise<{ root: string; edits: ProjectEdit[] }> {
  const root = await mkdtemp(path.join(os.tmpdir(), 'create-plugin-edits-'));
  directories.push(root);
  const edits = [
    {
      path: path.join(root, 'package.json'),
      before: '{"name":"app"}\n',
      after: '{"name":"app","dependencies":{}}\n',
    },
    {
      path: path.join(root, 'pnpm-workspace.yaml'),
      before: '# Original settings\n',
      after: '# Original settings\npackages: [packages/*]\n',
    },
  ];
  for (const edit of edits) await writeFile(edit.path, edit.before);
  return { root, edits };
}

async function applicationFixture() {
  const { root, edits } = await fixture();
  const manifest = JSON.stringify({
    name: 'app',
    nocobase: { templateKind: 'app' },
  });
  await writeFile(edits[0]!.path, manifest);
  const foundation = await createPlugin({
    repoRoot: root,
    name: 'demo',
    empty: true,
    dryRun: true,
  });
  for (const name of Object.keys(foundation.dependencies.devDependencies!)) {
    const directory = path.join(root, 'node_modules', name);
    await mkdir(directory, { recursive: true });
    await writeFile(
      path.join(directory, 'package.json'),
      JSON.stringify({ name, version: '1.0.0' }),
    );
  }
  return { root, edits, manifest };
}

function failFirstCleanup(root: string) {
  let failedDirectory: string | undefined;
  vi.mocked(rm).mockImplementation(async (file, options) => {
    if (
      String(file).startsWith(path.join(root, '.create-plugin-')) &&
      !failedDirectory
    ) {
      failedDirectory = String(file);
      throw Object.assign(new Error('Cleanup I/O failure'), { code: 'EIO' });
    }
    return fs.rm(file, options);
  });
  return () => failedDirectory;
}

afterEach(async () => {
  vi.restoreAllMocks();
  vi.resetAllMocks();
  await Promise.all(
    directories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

describe('application configuration edits', () => {
  it.each(['api', 'json'])(
    'keeps the committed plugin and configuration when cleanup fails through %s',
    async (mode) => {
      const { root } = await applicationFixture();
      const failedDirectory = failFirstCleanup(root);
      const stderr = vi.spyOn(process.stderr, 'write').mockReturnValue(true);
      const stdout = vi.spyOn(process.stdout, 'write').mockReturnValue(true);
      if (mode === 'json') {
        const code = await runCreatePluginCli({
          argv: ['demo', '--dir', root, '--empty', '--no-install', '--json'],
          binary: 'create-plugin',
          version: '0.0.1',
        });
        expect(code).toBe(0);
        expect(stdout).toHaveBeenCalledTimes(1);
        expect(JSON.parse(String(stdout.mock.calls[0]![0]))).toMatchObject({
          ok: true,
          status: 'success',
        });
      } else {
        const synchronize = vi.fn();
        await createPlugin({
          directory: root,
          name: 'demo',
          empty: true,
          synchronize,
        });
        expect(synchronize).toHaveBeenCalledWith(
          root,
          path.join(root, 'packages/app-plugin-demo'),
        );
        expect(stdout).not.toHaveBeenCalled();
      }
      expect(
        JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'))
          .dependencies['@nocobase/app-plugin-demo'],
      ).toBe('workspace:*');
      expect(
        JSON.parse(
          await readFile(
            path.join(root, 'packages/app-plugin-demo/package.json'),
            'utf8',
          ),
        ).name,
      ).toBe('@nocobase/app-plugin-demo');
      expect(
        await readFile(path.join(root, 'pnpm-workspace.yaml'), 'utf8'),
      ).toContain('packages/*');
      expect(stderr).toHaveBeenCalledWith(
        expect.stringContaining(failedDirectory()!),
      );
      expect(stderr).toHaveBeenCalledWith(
        expect.stringContaining('Cleanup I/O failure'),
      );
      expect(
        (await readdir(root)).filter((name) =>
          name.startsWith('.create-plugin-'),
        ),
      ).toEqual([path.basename(failedDirectory()!)]);
    },
  );

  it('preserves the original error and restores configuration even when cleanup also fails', async () => {
    const { root, edits } = await fixture();
    const failure = new Error('Replacement failed');
    vi.mocked(rename).mockImplementation(async (source, target) => {
      if (target === edits[1]!.path) throw failure;
      return fs.rename(source, target);
    });
    const failedDirectory = failFirstCleanup(root);
    const stderr = vi.spyOn(process.stderr, 'write').mockReturnValue(true);
    await expect(applyProjectEdits(edits)).rejects.toBe(failure);
    for (const edit of edits)
      expect(await readFile(edit.path, 'utf8')).toBe(edit.before);
    expect(stderr).toHaveBeenCalledWith(
      expect.stringContaining(failedDirectory()!),
    );
    expect(
      (await readdir(root)).filter((name) =>
        name.startsWith('.create-plugin-'),
      ),
    ).toEqual([path.basename(failedDirectory()!)]);
  });

  it('removes the generated plugin and preserves application files after a partial configuration write', async () => {
    const { root, edits, manifest } = await applicationFixture();
    const options = {
      directory: root,
      name: 'demo',
      empty: true,
      install: false,
    };
    const plan = await createPlugin({ ...options, dryRun: true });
    const workspaceEdit = plan.projectEdits.find(
      (edit) => edit.path === edits[1]!.path,
    )!;
    vi.mocked(writeFile).mockImplementation(async (file, data, options) => {
      if (data === workspaceEdit.after) {
        await fs.writeFile(file, String(data).slice(0, 8), options);
        throw Object.assign(new Error('Disk full'), { code: 'ENOSPC' });
      }
      return fs.writeFile(file, data, options);
    });
    await expect(createPlugin(options)).rejects.toMatchObject({
      code: 'ENOSPC',
    });
    expect(await readFile(edits[0]!.path, 'utf8')).toBe(manifest);
    expect(await readFile(edits[1]!.path, 'utf8')).toBe(edits[1]!.before);
    expect(await readdir(path.join(root, 'packages'))).toEqual([]);
    expect(
      (await readdir(root)).filter((name) =>
        name.startsWith('.create-plugin-'),
      ),
    ).toEqual([]);
  });

  it.each([0, 1])(
    'leaves configuration intact after a partial write of edit %s',
    async (index) => {
      const { root, edits } = await fixture();
      const failure = Object.assign(new Error('Disk full'), { code: 'ENOSPC' });
      vi.mocked(writeFile).mockImplementation(async (file, data, options) => {
        if (data === edits[index]!.after) {
          await fs.writeFile(file, String(data).slice(0, 8), options);
          throw failure;
        }
        return fs.writeFile(file, data, options);
      });
      await expect(applyProjectEdits(edits)).rejects.toBe(failure);
      for (const edit of edits)
        expect(await readFile(edit.path, 'utf8')).toBe(edit.before);
      expect((await readdir(root)).sort()).toEqual([
        'package.json',
        'pnpm-workspace.yaml',
      ]);
    },
  );

  it('restores a committed edit when a later replacement fails', async () => {
    const { root, edits } = await fixture();
    const failure = new Error('Rename failed');
    vi.mocked(rename).mockImplementation(async (source, target) => {
      if (target === edits[1]!.path) throw failure;
      return fs.rename(source, target);
    });
    await expect(applyProjectEdits(edits)).rejects.toBe(failure);
    for (const edit of edits)
      expect(await readFile(edit.path, 'utf8')).toBe(edit.before);
    expect((await readdir(root)).sort()).toEqual([
      'package.json',
      'pnpm-workspace.yaml',
    ]);
  });

  it('removes a newly created configuration file on rollback', async () => {
    const { root, edits } = await fixture();
    await rm(edits[0]!.path);
    const planned = [{ ...edits[0]!, before: undefined }, edits[1]!];
    vi.mocked(rename).mockImplementation(async (source, target) => {
      if (target === edits[1]!.path) throw new Error('Rename failed');
      return fs.rename(source, target);
    });
    await expect(applyProjectEdits(planned)).rejects.toThrow('Rename failed');
    expect(await readdir(root)).toEqual(['pnpm-workspace.yaml']);
    expect(await readFile(edits[1]!.path, 'utf8')).toBe(edits[1]!.before);
  });

  it('retains the original backup if rollback itself fails', async () => {
    const { root, edits } = await fixture();
    vi.mocked(rename).mockImplementation(async (source, target) => {
      if (
        target === edits[1]!.path ||
        path.basename(String(source)) === 'before'
      )
        throw new Error('Rename failed');
      return fs.rename(source, target);
    });
    await expect(applyProjectEdits(edits)).rejects.toThrow(
      'Application configuration rollback failed.',
    );
    const backups = (await readdir(root)).filter((name) =>
      name.startsWith('.create-plugin-'),
    );
    expect(backups).toHaveLength(1);
    expect(await readFile(path.join(root, backups[0]!, 'before'), 'utf8')).toBe(
      edits[0]!.before,
    );
    expect(await readFile(edits[1]!.path, 'utf8')).toBe(edits[1]!.before);
  });

  it('preserves symlinks and permissions when replacing configuration', async () => {
    const { root, edits } = await fixture();
    const target = path.join(root, 'workspace.yml');
    await rename(edits[1]!.path, target);
    await chmod(target, 0o640);
    await symlink('workspace.yml', edits[1]!.path);
    await applyProjectEdits(edits);
    expect(await readlink(edits[1]!.path)).toBe('workspace.yml');
    expect((await stat(target)).mode & 0o777).toBe(0o640);
    for (const edit of edits)
      expect(await readFile(edit.path, 'utf8')).toBe(edit.after);
    expect((await readdir(root)).sort()).toEqual([
      'package.json',
      'pnpm-workspace.yaml',
      'workspace.yml',
    ]);
  });

  it('does not overwrite configuration changed after planning', async () => {
    const { edits } = await fixture();
    await writeFile(edits[1]!.path, '# User changed settings\n');
    await expect(applyProjectEdits(edits)).rejects.toMatchObject({
      code: 'PROJECT_CHANGED',
    });
    expect(await readFile(edits[0]!.path, 'utf8')).toBe(edits[0]!.before);
    expect(await readFile(edits[1]!.path, 'utf8')).toBe(
      '# User changed settings\n',
    );
  });
});
