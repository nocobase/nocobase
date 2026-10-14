import { execFileSync, spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import {
  chmod,
  lstat,
  mkdir,
  realpath,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import net from 'node:net';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RunWorker } from '../src/agent/worker.ts';

import {
  buildAgentEnv,
  forbidden,
  providedVariables,
} from '../src/agent/env.ts';
import { writeWorkspaceMeta, readWorkspaceMeta } from '../src/core/checkout.ts';
import {
  allocateRunTemp,
  cleanupRunTemp,
  gcRunTemps,
  removeRunTemp,
  runTempName,
  runTempRoot,
  type RunTemp,
} from '../src/core/run-temp.ts';
import { writeRecord, removeRecord } from '../src/core/supervisor.ts';
import { runnerPaths } from '../src/lib/home.ts';
import { removeDir, tempDir } from './helpers.ts';

describe('short private run temporary directories', () => {
  let home: string;
  let paths: ReturnType<typeof runnerPaths>;
  let root: string;
  const allocations: RunTemp[] = [];
  beforeEach(async () => {
    home = tempDir('run-temp-');
    paths = runnerPaths(home, path.join(home, 'work'));
    root = await runTempRoot(paths);
  });
  afterEach(async () => {
    for (const allocation of allocations.splice(0))
      await allocation.lock.release();
    await rm(root, { recursive: true, force: true });
    removeDir(home);
  });
  const allocate = async (workDir: string) => {
    const allocation = await allocateRunTemp(paths, workDir);
    allocations.push(allocation);
    return allocation;
  };

  it.each([
    'completed',
    'failed',
    'cancelled',
    'runnerOffline',
    'preparation-error',
    'stop-failed',
  ])(
    'worker finally handles %s and preserves temporary files only when writers cannot stop',
    async (ending) => {
      const workDir = path.join(paths.workRoot, 'app', 'attempt');
      await mkdir(workDir, { recursive: true });
      await writeWorkspaceMeta(paths, workDir, {
        subjectKey: 'attempt',
        appKey: 'app',
        repos: [],
        lastUsedAt: new Date().toISOString(),
      });
      const allocation = await allocate(workDir);
      const stopWriters = vi.fn(async () => {
        expect(existsSync(allocation.dir)).toBe(true);
        if (ending === 'stop-failed') throw new Error('writer still alive');
      });
      // Exercise the real finally and local finalizer independently of tool inference and server delivery.
      const worker: RunWorker = Object.create(RunWorker.prototype);
      Object.assign(worker, {
        runId: 'run',
        payload: { workspace: { readOnly: false }, run: { id: 'run' } },
        deps: { paths, log: vi.fn(), stopWriters },
        timings: { statusIntervalMs: 60_000 },
        prepared: { workspace: { workDir } },
        record: { workDir },
        runTemp: allocation,
        releases: [],
        lease: { start() {}, stop() {} },
        spool: {
          start() {},
          stop() {},
          push() {},
          size: 0,
          remove: async () => {},
        },
        stopTool: vi.fn(async () => {}),
        updateRecord: vi.fn(async () => {}),
        finishFailed: vi.fn(async () => 'failed'),
        execute: async () => {
          if (ending === 'preparation-error') throw new Error('setup failed');
          return ending;
        },
      });
      await worker.run();
      expect(stopWriters).toHaveBeenCalledOnce();
      expect(existsSync(allocation.dir)).toBe(ending === 'stop-failed');
      if (ending === 'stop-failed') {
        expect(
          (await readWorkspaceMeta(paths, workDir))?.recoveryRequired,
        ).toBe(true);
        expect(await gcRunTemps(paths, true)).toEqual([]);
      }
    },
  );

  it('a snapshot keeps temporary files available and GC cannot cross the allocation window', async () => {
    const workDir = '/work/new-attempt';
    const [allocation] = await Promise.all([
      allocate(workDir),
      gcRunTemps(paths, true),
    ]);
    expect(existsSync(allocation.dir)).toBe(true);
    expect(await gcRunTemps(paths, true)).toEqual([]);
    const worker: RunWorker = Object.create(RunWorker.prototype);
    Object.assign(worker, {
      deps: { paths, log: vi.fn(), stopWriters: async () => {} },
      payload: { workspace: { readOnly: false } },
      prepared: { workspace: { workDir } },
      stopTool: async () => {},
      updateRecord: async () => {},
    });
    await worker['saveLocal'](false);
    expect(existsSync(allocation.dir)).toBe(true);
  });

  it('is short, private and writable with long work paths, distinct runs and attempts, and supports a real tsx socket', async () => {
    const work = path.join(paths.workRoot, 'long'.repeat(100));
    const a = await allocate(`${work}.run-a-1`);
    const b = await allocate(`${work}.run-a-2`);
    const c = await allocate(`${work}.run-b-1`);
    expect(new Set([a.dir, b.dir, c.dir]).size).toBe(3);
    for (const dir of [root, a.dir, b.dir, c.dir]) {
      expect(Buffer.byteLength(dir)).toBeLessThanOrEqual(40);
      expect(Buffer.byteLength(await realpath(dir))).toBeLessThanOrEqual(40);
      const stat = await lstat(dir);
      expect(stat.uid).toBe(process.getuid!());
      expect(stat.mode & 0o777).toBe(0o700);
    }
    await writeFile(path.join(a.dir, 'writable'), 'yes');
    const ipc = path.join(a.dir, `tsx-${process.getuid!()}`);
    await mkdir(ipc);
    const socket = path.join(ipc, `${process.pid}.pipe`);
    const server = net.createServer((client) => client.end('ok'));
    try {
      await new Promise<void>((resolve, reject) => {
        server.once('error', reject);
        server.listen(socket, resolve);
      });
      const reply = await new Promise<string>((resolve, reject) => {
        let output = '';
        const client = net.connect(socket);
        client.on('error', reject);
        client.on('data', (chunk) => {
          output += chunk;
        });
        client.on('end', () => resolve(output));
      });
      expect(reply).toBe('ok');
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
    await removeRunTemp(a.dir);
    expect(existsSync(a.dir)).toBe(false);
    expect(existsSync(b.dir)).toBe(true);
  });

  it('sets all three variables despite workspace, passthrough and inherited values, including grandchildren', async () => {
    const { dir } = await allocate('/work/run');
    const variables = ['TMPDIR', 'TMP', 'TEMP'];
    const hostile = Object.fromEntries(
      variables.map((name) => [name, '/long/override']),
    );
    const env = buildAgentEnv({
      source: { ...process.env, ...hostile },
      tmpDir: dir,
      passEnv: variables,
      localVariables: hostile,
      workspace: {
        passthrough: variables,
        env: variables.map((name) => ({
          name,
          value: '/workspace/override',
          secret: false,
        })),
      },
    });
    for (const name of variables) {
      expect(forbidden(name)).toBe(true);
      expect(env[name]).toBe(dir);
    }
    expect(providedVariables(hostile, variables, hostile)).toEqual({});
    const script = `const {execFileSync}=require('node:child_process'); process.stdout.write(execFileSync(process.execPath, ['-e', 'process.stdout.write(JSON.stringify([process.env.TMPDIR,process.env.TMP,process.env.TEMP]))']));`;
    expect(
      JSON.parse(
        execFileSync(process.execPath, ['-e', script], {
          env,
          encoding: 'utf8',
        }),
      ),
    ).toEqual([dir, dir, dir]);
  });

  it('rejects existing directories, symlinks and unsafe permissions without taking them over', async () => {
    const a = await allocate('/work/a');
    await a.lock.release();
    await expect(allocateRunTemp(paths, '/work/a')).rejects.toMatchObject({
      code: 'EEXIST',
    });
    const link = path.join(root, runTempName('/work/link'));
    await symlink(a.dir, link);
    await expect(allocateRunTemp(paths, '/work/link')).rejects.toMatchObject({
      code: 'EEXIST',
    });
    expect((await lstat(link)).isSymbolicLink()).toBe(true);
    await chmod(root, 0o755);
    await expect(allocateRunTemp(paths, '/work/b')).rejects.toThrow('Unsafe');
    expect((await lstat(root)).mode & 0o777).toBe(0o755);
  });

  it('rejects a namespace symlink without changing its target', async () => {
    await symlink(home, root);
    await expect(allocateRunTemp(paths, '/work/a')).rejects.toThrow('Unsafe');
    expect((await lstat(root)).isSymbolicLink()).toBe(true);
    expect(existsSync(path.join(home, runTempName('/work/a')))).toBe(false);
  });

  it('refuses an ownership mismatch without adopting or deleting the directory', async () => {
    const allocation = await allocate('/work/owner');
    const uid = process.getuid!();
    // Model a different owner without changing any host account or directory ownership.
    const getuid = vi
      .spyOn(process, 'getuid')
      .mockReturnValueOnce(uid)
      .mockReturnValue(uid + 1);
    try {
      await expect(allocateRunTemp(paths, '/work/other')).rejects.toThrow(
        'Unsafe',
      );
      await expect(removeRunTemp(allocation.dir)).rejects.toThrow('Unsafe');
      expect(existsSync(allocation.dir)).toBe(true);
    } finally {
      getuid.mockRestore();
    }
  });

  it('reclaims dead-owner locks but retains directories with real process holders', async () => {
    const allocation = await allocate('/work/orphan');
    await allocation.lock.release();
    const child = spawn(
      process.execPath,
      ['-e', "process.stdout.write('ready');setInterval(()=>{},1000)"],
      { cwd: allocation.dir },
    );
    try {
      await new Promise<void>((resolve, reject) => {
        child.once('error', reject);
        child.stdout.once('data', () => resolve());
      });
      if (process.platform === 'linux')
        expect(await gcRunTemps(paths, true)).toEqual([]);
    } finally {
      await new Promise<void>((resolve) => {
        child.once('exit', () => resolve());
        child.kill();
      });
    }
    await mkdir(`${allocation.dir}.lock`, { mode: 0o700 });
    await writeFile(path.join(`${allocation.dir}.lock`, 'owner'), '2147483647');
    expect(await gcRunTemps(paths, true)).toEqual([
      { dir: allocation.dir, removed: true },
    ]);
    expect(existsSync(allocation.dir)).toBe(false);
  });

  it('GC skips creation locks, records and recovery work, preserves another namespace, and honors dry-run', async () => {
    const active = await allocate('/work/active');
    expect(await gcRunTemps(paths, true)).toEqual([]);
    const workDir = path.join(paths.workRoot, 'app', 'attempt');
    const orphan = await allocate(workDir);
    await orphan.lock.release();
    await writeRecord(paths, {
      runId: 'run',
      appKey: 'app',
      attempt: 1,
      firstSeq: 1,
      pid: process.pid,
      phase: 'running',
      startedAt: new Date().toISOString(),
      workDir,
      log: '',
    });
    expect(await gcRunTemps(paths, true)).toEqual([]);
    await removeRecord(paths, 'run');
    await mkdir(workDir, { recursive: true });
    await writeWorkspaceMeta(paths, workDir, {
      subjectKey: 'attempt',
      appKey: 'app',
      repos: [],
      lastUsedAt: new Date().toISOString(),
      recoveryRequired: true,
    });
    expect(await gcRunTemps(paths, true)).toEqual([]);
    await writeWorkspaceMeta(paths, workDir, {
      subjectKey: 'attempt',
      appKey: 'app',
      repos: [],
      lastUsedAt: new Date().toISOString(),
    });
    const otherHome = path.join(home, 'other');
    await mkdir(otherHome);
    const other = await allocateRunTemp(runnerPaths(otherHome), '/work/other');
    try {
      expect(other.dir).not.toContain(root);
      expect(await gcRunTemps(paths, false)).toEqual([
        { dir: orphan.dir, removed: false },
      ]);
      expect(existsSync(orphan.dir)).toBe(true);
      expect(await gcRunTemps(paths, true)).toEqual([
        { dir: orphan.dir, removed: true },
      ]);
      expect(existsSync(active.dir)).toBe(true);
      expect(existsSync(other.dir)).toBe(true);
    } finally {
      await other.lock.release();
      await rm(path.dirname(other.dir), { recursive: true, force: true });
    }
    await cleanupRunTemp(paths, workDir);
  });
});
