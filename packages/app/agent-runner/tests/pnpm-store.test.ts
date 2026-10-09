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
import { legacyMetaPath } from '../src/core/checkout.ts';
import { RunnerDaemon } from '../src/core/loop.ts';
import {
  ensurePnpmStore,
  pnpmStoreEnv,
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

  it("is named in the agent's environment for every pnpm, and a run cannot point it elsewhere", () => {
    const env = buildAgentEnv({
      source: { PATH: '/bin', npm_config_store_dir: '/real' },
      pnpmStoreDir: '/w/.pnpm-store',
      workspace: {
        env: [
          { name: 'pnpm_config_store_dir', value: '/x' },
          { name: 'PNPM_CONFIG_STORE_DIR', value: '/x' },
        ],
        passthrough: ['npm_config_store_dir'],
      },
    });
    expect(env).toMatchObject({
      pnpm_config_store_dir: '/w/.pnpm-store',
      npm_config_store_dir: '/w/.pnpm-store',
    });
    expect(env.PNPM_CONFIG_STORE_DIR).toBeUndefined();
    expect(pnpmStoreEnv('/s')).toEqual({
      pnpm_config_store_dir: '/s',
      npm_config_store_dir: '/s',
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
    expect(notes).toContain('never edit them in place');
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
        ...pnpmStoreEnv(storeDir),
      };
      const install = (name: string): string => {
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
          env,
          stdio: 'ignore',
        });
        return dir;
      };

      const first = install('first-app');
      const stored = storeFiles(storeDir);
      expect(stored).not.toEqual([]);
      const second = install('second-app');
      expect(storeFiles(storeDir)).toEqual(stored);
      for (const dir of [first, second])
        expect(
          readFileSync(
            path.join(dir, 'node_modules', 'shared-dep', 'index.js'),
            'utf8',
          ),
        ).toBe('export default 42;\n');
      // Neither project keeps a store of its own.
      expect(existsSync(path.join(first, '.pnpm-store'))).toBe(false);
      expect(existsSync(path.join(second, '.pnpm-store'))).toBe(false);

      const linked = stored.filter((file) =>
        readFileSync(file, 'utf8').includes('export default 42;'),
      );
      expect(linked).not.toEqual([]);
      removeDir(first);
      removeDir(second);
      expect(await prunePnpmStore({ paths, source: env })).toBe(true);
      for (const file of linked) expect(existsSync(file)).toBe(false);
    },
    120_000,
  );

  it('is left alone without pnpm on the PATH, or without a store', async () => {
    const logs: string[] = [];
    expect(await prunePnpmStore({ paths, source: {} })).toBe(false);
    await ensurePnpmStore(paths);
    expect(
      await prunePnpmStore({
        paths,
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
    mkdirSync(path.dirname(legacyMetaPath(workDir)), { recursive: true });
    writeFileSync(
      legacyMetaPath(workDir),
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
