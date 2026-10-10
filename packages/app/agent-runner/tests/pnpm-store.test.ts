// The pnpm store every run on a machine shares (src/core/pnpm-store.ts): what the agent's environment and sandbox get,
// what it is told, that a second project installing the same package adds nothing to the store, and when the daemon
// prunes it.
import { execFileSync, spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { buildAgentEnv } from '../src/agent/env.ts';
import { agentWritableRoots } from '../src/agent/prepare/index.ts';
import { workspaceNotes } from '../src/agent/worker.ts';
import { workspaceRecordPath } from '../src/core/checkout.ts';
import { RunnerDaemon } from '../src/core/loop.ts';
import { isInside } from '../src/core/command-policy.ts';
import {
  ensurePnpmStore,
  pnpmImportMethod,
  pnpmStoreEnv,
  probeReflink,
  pruneCommand,
  type PnpmImportMethod,
  prunePnpmStore,
} from '../src/core/pnpm-store.ts';
import { readConnections, readSettings } from '../src/lib/config.ts';
import { runnerPaths, type RunnerPaths } from '../src/lib/home.ts';
import { FakeServer, waitFor } from './fake-server.ts';
import { cliEnv, registerRunner, removeDir, tempDir } from './helpers.ts';

const hasPnpm = spawnSync('pnpm', ['--version']).status === 0;

/** The package files in the store (`<version>/files/`), by path; not its index or its registry of projects. */
function storeFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((version) => {
    const files = path.join(dir, version, 'files');
    if (!existsSync(files)) return [];
    return readdirSync(files, { recursive: true, encoding: 'utf8' })
      .map((entry) => path.join(files, entry))
      .filter((file) => statSync(file).isFile());
  });
}

describe('the shared pnpm store', () => {
  let root: string;
  let paths: RunnerPaths;

  beforeEach(() => {
    root = tempDir('nocobase-runner-pnpm-store-');
    paths = runnerPaths(path.join(root, 'home'), path.join(root, 'work'));
  });
  afterEach(() => removeDir(root));

  it('lives in the work root, beside the working directories and apart from the runner home', async () => {
    expect(paths.pnpmStoreDir).toBe(path.join(root, 'work', '.pnpm-store'));
    expect(await ensurePnpmStore(paths)).toBe(paths.pnpmStoreDir);
    expect(statSync(paths.pnpmStoreDir).isDirectory()).toBe(true);
  });

  it("is named in the agent's environment for every pnpm, imported without hard links, and a run cannot change either", () => {
    const env = buildAgentEnv({
      source: {
        PATH: '/bin',
        npm_config_store_dir: '/real',
        npm_config_package_import_method: 'hardlink',
      },
      pnpmStoreDir: '/w/.pnpm-store',
      pnpmImportMethod: 'clone',
      workspace: {
        env: [
          { name: 'pnpm_config_store_dir', value: '/x' },
          { name: 'PNPM_CONFIG_STORE_DIR', value: '/x' },
          { name: 'pnpm_config_package_import_method', value: 'hardlink' },
          { name: 'NPM_CONFIG_PACKAGE_IMPORT_METHOD', value: 'hardlink' },
        ],
        passthrough: [
          'npm_config_store_dir',
          'npm_config_package_import_method',
        ],
      },
    });
    expect(env).toMatchObject({
      pnpm_config_store_dir: '/w/.pnpm-store',
      npm_config_store_dir: '/w/.pnpm-store',
      pnpm_config_package_import_method: 'clone',
      npm_config_package_import_method: 'clone',
    });
    expect(env.PNPM_CONFIG_STORE_DIR).toBeUndefined();
    expect(env.NPM_CONFIG_PACKAGE_IMPORT_METHOD).toBeUndefined();
    // Without a probed method, a copy: never pnpm's fallback to hard links.
    expect(
      buildAgentEnv({ source: {}, pnpmStoreDir: '/s' })
        .pnpm_config_package_import_method,
    ).toBe('copy');
    expect(pnpmStoreEnv('/s', 'copy')).toEqual({
      pnpm_config_store_dir: '/s',
      npm_config_store_dir: '/s',
      pnpm_config_package_import_method: 'copy',
      npm_config_package_import_method: 'copy',
    });
  });

  it('is imported with clone where the work root clones, with copy otherwise, probed once', async () => {
    const probed: string[] = [];
    const clones = (result: boolean) => (workRoot: string) => {
      probed.push(workRoot);
      return Promise.resolve(result);
    };
    const other = (name: string) =>
      runnerPaths(path.join(root, 'home'), path.join(root, name));
    expect(await pnpmImportMethod(other('reflink'), clones(true))).toBe(
      'clone',
    );
    expect(await pnpmImportMethod(other('reflink'), clones(false))).toBe(
      'clone',
    );
    expect(await pnpmImportMethod(other('ext4'), clones(false))).toBe('copy');
    expect(
      await pnpmImportMethod(other('broken'), () =>
        Promise.reject(new Error('EACCES')),
      ),
    ).toBe('copy');
    expect(probed).toEqual([
      path.join(root, 'reflink'),
      path.join(root, 'ext4'),
    ]);
    // The real probe answers either way, and leaves nothing in the work root but the root itself. A Mac's temporary
    // directory is on APFS, which clones.
    const real = await probeReflink(paths.workRoot);
    if (process.platform === 'darwin') expect(real).toBe(true);
    else expect(typeof real).toBe('boolean');
    expect(readdirSync(paths.workRoot)).toEqual([]);
    expect(await probeReflink(paths.workRoot, 'linux')).toBeTypeOf('boolean');
    expect(readdirSync(paths.workRoot)).toEqual([]);
  });

  it("is pruned from the runner's own empty directory, named on the command line, with an environment built from nothing", () => {
    const command = pruneCommand(paths, {
      PATH: '/bin',
      HOME: '/home/runner',
      npm_config_registry: 'http://attacker.invalid/',
      NPM_CONFIG_STORE_DIR: '/evil',
      pnpm_config_store_dir: '/evil',
      PNPM_HOME: '/evil',
      COREPACK_HOME: '/evil',
      COREPACK_ENABLE_STRICT: '0',
    });
    expect(command.cwd).toBe(paths.toolCwd);
    // Neither the store nor anything else agents write is where pnpm starts or looks for settings.
    expect(isInside(paths.workRoot, command.cwd)).toBe(false);
    expect(isInside(paths.pnpmStoreDir, command.cwd)).toBe(false);
    expect(isInside(paths.home, command.cwd)).toBe(true);
    expect(command.args).toEqual([
      'store',
      'prune',
      '--store-dir',
      paths.pnpmStoreDir,
    ]);
    expect(command.env).toEqual({
      PATH: '/bin',
      HOME: '/home/runner',
      pnpm_config_pm_on_fail: 'ignore',
      pnpm_config_manage_package_manager_versions: 'false',
      npm_config_manage_package_manager_versions: 'false',
    });
  });

  it("is writable in a sandboxing tool's session", () => {
    expect(
      agentWritableRoots([], '/w/task-a/repo', ['/w/.pnpm-store']),
    ).toEqual(['/w/.pnpm-store']);
  });

  it('is what the agent is told to install with, instead of a store of its own', () => {
    const notes = workspaceNotes({
      workDir: '/w/task-a',
      cwd: '/w/task-a',
      dirs: [],
      cli: 'acme',
      pnpmStoreDir: '/w/.pnpm-store',
    });
    expect(notes).toContain('/w/.pnpm-store');
    expect(notes).toContain('without `--store-dir`');
    expect(notes).toContain('cloned or copied');
    expect(notes).toContain('`pnpm patch`');
    expect(
      workspaceNotes({
        workDir: '/w/task-a',
        cwd: '/w/task-a',
        dirs: [],
        cli: 'a',
      }),
    ).not.toContain('pnpm');
  });

  it.skipIf(!hasPnpm)(
    'adds nothing when a second project installs the same package, and is pruned once neither links it',
    async () => {
      const storeDir = await ensurePnpmStore(paths);
      // A temp directory may be inside this checkout; keep its projects out of the parent workspace.
      writeFileSync(path.join(root, 'pnpm-workspace.yaml'), 'packages: []\n');
      // A package from a local tarball: it goes through the store like a registry package, without the network.
      const source = path.join(root, 'pkg');
      mkdirSync(source, { recursive: true });
      writeFileSync(
        path.join(source, 'package.json'),
        JSON.stringify({ name: 'shared-dep', version: '1.0.0' }),
      );
      writeFileSync(path.join(source, 'index.js'), 'export default 42;\n');
      execFileSync('pnpm', ['pack', '--pack-destination', root], {
        cwd: source,
        stdio: 'ignore',
      });
      const tarball = path.join(root, 'shared-dep-1.0.0.tgz');
      const env = {
        PATH: process.env.PATH ?? '',
        HOME: path.join(root, 'user-home'),
        ...pnpmStoreEnv(storeDir, 'copy'),
      };
      const install = (name: string, method: PnpmImportMethod): string => {
        const dir = path.join(paths.workRoot, 'app', name);
        mkdirSync(dir, { recursive: true });
        writeFileSync(path.join(dir, 'pnpm-workspace.yaml'), 'packages: []\n');
        writeFileSync(
          path.join(dir, 'package.json'),
          JSON.stringify({
            name,
            private: true,
            dependencies: { 'shared-dep': `file:${tarball}` },
          }),
        );
        execFileSync('pnpm', ['install', '--offline'], {
          cwd: dir,
          env: { ...env, ...pnpmStoreEnv(storeDir, method) },
          stdio: 'ignore',
        });
        return dir;
      };

      // What this machine probes to (`clone` on APFS, `copy` on ext4), and `copy`: neither hard-links.
      const first = install('first-app', await pnpmImportMethod(paths));
      const stored = storeFiles(storeDir);
      expect(stored).not.toEqual([]);
      const second = install('second-app', 'copy');
      expect(storeFiles(storeDir)).toEqual(stored);
      for (const dir of [first, second])
        expect(
          readFileSync(
            path.join(dir, 'node_modules', 'shared-dep', 'index.js'),
            'utf8',
          ),
        ).toBe('export default 42;\n');
      // Imported as a clone or a copy: a file of its own, not the store's file under another name.
      for (const dir of [first, second])
        expect(
          statSync(path.join(dir, 'node_modules', 'shared-dep', 'index.js'))
            .nlink,
        ).toBe(1);
      // Neither project keeps a store of its own.
      expect(existsSync(path.join(first, '.pnpm-store'))).toBe(false);
      expect(existsSync(path.join(second, '.pnpm-store'))).toBe(false);

      const linked = stored.filter((file) =>
        readFileSync(file, 'utf8').includes('export default 42;'),
      );
      expect(linked).not.toEqual([]);
      removeDir(first);
      removeDir(second);
      // What an agent may leave in the store, which it can write: settings that would move the store, make pnpm download
      // and run another version of itself, or fetch from another registry. None of them is read.
      const elsewhere = path.join(root, 'elsewhere');
      writeFileSync(
        path.join(storeDir, 'package.json'),
        JSON.stringify({ packageManager: 'pnpm@9.0.0-does-not-exist' }),
      );
      writeFileSync(
        path.join(storeDir, 'pnpm-workspace.yaml'),
        `packages: []\nstoreDir: ${JSON.stringify(elsewhere)}\n`,
      );
      writeFileSync(
        path.join(storeDir, '.npmrc'),
        'registry=http://127.0.0.1:9/\n',
      );
      const logs: string[] = [];
      expect(
        await prunePnpmStore({
          paths,
          source: { ...env, pnpm_config_store_dir: elsewhere },
          log: (message) => logs.push(message),
        }),
      ).toBe(true);
      expect(logs.join('\n')).toContain('pruned the shared pnpm store');
      for (const file of linked) expect(existsSync(file)).toBe(false);
      expect(existsSync(elsewhere)).toBe(false);
    },
    120_000,
  );

  it('is pruned with the bundled pnpm on a machine without one', async () => {
    await ensurePnpmStore(paths);
    const logs: string[] = [];
    const ran = await prunePnpmStore({
      paths,
      source: { PATH: path.join(root, 'empty'), HOME: root },
      log: (message) => logs.push(message),
    });
    expect(ran).toBe(true);
    expect(logs.join('\n')).toContain('pruned the shared pnpm store');
  }, 60_000);

  it('is left alone without a bundled pnpm or one on the PATH, or without a store', async () => {
    const logs: string[] = [];
    expect(await prunePnpmStore({ paths, source: {} })).toBe(false);
    await ensurePnpmStore(paths);
    expect(
      await prunePnpmStore({
        paths,
        pnpmEntry: null,
        source: { PATH: path.join(root, 'empty') },
        log: (message) => logs.push(message),
      }),
    ).toBe(false);
    expect(logs.join('\n')).toContain('pnpm is not on the runner PATH');
  });
});

describe('pruning by the daemon', () => {
  let server: FakeServer;
  let home: string;

  beforeEach(async () => {
    server = new FakeServer();
    await server.listen();
    home = tempDir('nocobase-runner-prune-home-');
    await registerRunner(server.url, cliEnv(home));
  });
  afterEach(async () => {
    await server.close();
    removeDir(home);
    removeDir(`${home}-work`);
  });

  const daemon = async (pruned: string[], logs: string[] = []) => {
    const paths = runnerPaths(home, `${home}-work`);
    const [connection] = await readConnections(paths);
    if (connection === undefined) throw new Error('Not registered.');
    return new RunnerDaemon({
      paths,
      settings: await readSettings(paths),
      connections: [connection],
      adapters: new Map(),
      timings: {
        heartbeatIntervalMs: 100,
        pollTimeoutMs: 200,
        pollFallbackMs: 200,
      },
      log: (message) => logs.push(message),
      pruneStore: (options) => {
        pruned.push(options.paths.pnpmStoreDir);
        return Promise.resolve(true);
      },
    });
  };

  /** A working directory unused for 40 days, which the collection removes. */
  const abandoned = (subject: string): string => {
    const workDir = path.join(`${home}-work`, 'app', subject);
    const record = workspaceRecordPath(
      runnerPaths(home, `${home}-work`),
      workDir,
    );
    mkdirSync(workDir, { recursive: true });
    mkdirSync(path.dirname(record), { recursive: true });
    writeFileSync(
      record,
      JSON.stringify({
        subjectKey: subject,
        repos: [],
        lastUsedAt: new Date(Date.now() - 40 * 86_400_000).toISOString(),
      }),
    );
    return workDir;
  };

  it('prunes the store when the collection removed a working directory', async () => {
    const workDir = abandoned('abandoned-task');
    const paths = runnerPaths(home, `${home}-work`);
    await ensurePnpmStore(paths);
    const pruned: string[] = [];
    const runner = await daemon(pruned);
    await runner.start();
    await waitFor(() => pruned.length > 0);
    await runner.stop();
    expect(pruned).toEqual([paths.pnpmStoreDir]);
    expect(existsSync(workDir)).toBe(false);
    // The collection does not take the store for an application's directory.
    expect(existsSync(paths.pnpmStoreDir)).toBe(true);
  });

  it('does not prune when nothing was removed', async () => {
    const pruned: string[] = [];
    const logs: string[] = [];
    const runner = await daemon(pruned, logs);
    await runner.start();
    await waitFor(() => logs.some((line) => line.includes('starting')));
    await runner.pruneStore();
    await runner.stop();
    expect(pruned).toEqual([]);
  });
});
