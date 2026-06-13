/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { EventEmitter } from 'node:events';
import { afterEach, expect, test, vi } from 'vitest';
import { setCliConfigValue } from '../lib/cli-config.js';

const spawnMock = vi.hoisted(() => vi.fn());

vi.mock('cross-spawn', () => ({
  default: spawnMock,
}));

function successfulChild() {
  return {
    once(event: string, callback: (...args: unknown[]) => void) {
      if (event === 'close') {
        setImmediate(() => callback(0, null));
      }
      return this;
    },
  };
}

function erroredChild(error: Error & { code?: string }) {
  return {
    stdout: {
      setEncoding() {},
      on() {},
    },
    stderr: {
      setEncoding() {},
      on() {},
    },
    once(event: string, callback: (...args: unknown[]) => void) {
      if (event === 'error') {
        setImmediate(() => callback(error));
      }
      return this;
    },
  };
}

function pipedChild() {
  const stdout = new EventEmitter();
  const stderr = new EventEmitter();

  return {
    stdout: {
      setEncoding() {},
      on(event: string, callback: (...args: unknown[]) => void) {
        stdout.on(event, callback);
        return this;
      },
    },
    stderr: {
      setEncoding() {},
      on(event: string, callback: (...args: unknown[]) => void) {
        stderr.on(event, callback);
        return this;
      },
    },
    once(event: string, callback: (...args: unknown[]) => void) {
      if (event === 'close') {
        setImmediate(() => {
          stdout.emit('data', 'hello stdout');
          stderr.emit('data', 'hello stderr');
          callback(0, null);
        });
      }
      return this;
    },
  };
}

function pipedChildWithClose(code: number, stderrChunk: string, stdoutChunk = '') {
  const stdout = new EventEmitter();
  const stderr = new EventEmitter();

  return {
    stdout: {
      setEncoding() {},
      on(event: string, callback: (...args: unknown[]) => void) {
        stdout.on(event, callback);
        return this;
      },
    },
    stderr: {
      setEncoding() {},
      on(event: string, callback: (...args: unknown[]) => void) {
        stderr.on(event, callback);
        return this;
      },
    },
    once(event: string, callback: (...args: unknown[]) => void) {
      if (event === 'close') {
        setImmediate(() => {
          if (stdoutChunk) {
            stdout.emit('data', stdoutChunk);
          }
          if (stderrChunk) {
            stderr.emit('data', stderrChunk);
          }
          callback(code, null);
        });
      }
      return this;
    },
  };
}

async function withTempCliHome(run: () => Promise<void>) {
  const previous = process.env.NB_CLI_ROOT;
  const tempHome = await fsp.mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-run-npm-'));
  const tempWorkspace = await fsp.mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-run-npm-cwd-'));
  const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tempWorkspace);
  process.env.NB_CLI_ROOT = tempHome;

  try {
    await run();
  } finally {
    cwdSpy.mockRestore();
    if (previous === undefined) {
      delete process.env.NB_CLI_ROOT;
    } else {
      process.env.NB_CLI_ROOT = previous;
    }
    await fsp.rm(tempHome, { recursive: true, force: true });
    await fsp.rm(tempWorkspace, { recursive: true, force: true });
  }
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

test('run uses cross-spawn to safely execute Windows package manager shims', async () => {
  vi.spyOn(process, 'platform', 'get').mockReturnValue('win32');
  spawnMock.mockReturnValue(successfulChild());

  const { run } = await import('../lib/run-npm.js');
  await run('yarn', ['install'], { stdio: 'ignore', cwd: 'C:\\work\\app' });

  expect(spawnMock).toHaveBeenCalledTimes(1);
  const [command, args, options] = spawnMock.mock.calls[0] ?? [];
  expect(command).toBe('yarn');
  expect(args).toEqual(['install']);
  expect(String(options?.cwd ?? '')).toContain('C:\\work\\app');
  expect(options).toMatchObject({
    stdio: 'ignore',
    windowsHide: true,
  });
  expect(options).not.toHaveProperty('shell');
});

test('run resolves configured binary overrides before spawning commands', async () => {
  spawnMock.mockReturnValue(successfulChild());

  await withTempCliHome(async () => {
    await setCliConfigValue('bin.docker', '/usr/local/bin/docker-custom', { scope: 'global' });

    const { run } = await import('../lib/run-npm.js');
    await run('docker', ['ps'], { stdio: 'ignore' });
  });

  expect(spawnMock).toHaveBeenCalledTimes(1);
  const [command, args] = spawnMock.mock.calls[0] ?? [];
  expect(command).toBe('/usr/local/bin/docker-custom');
  expect(args).toEqual(['ps']);
});

test('run keeps non-shim commands off the shell on Windows', async () => {
  vi.spyOn(process, 'platform', 'get').mockReturnValue('win32');
  spawnMock.mockReturnValue(successfulChild());

  const { run } = await import('../lib/run-npm.js');
  await run('git', ['status'], { stdio: 'ignore', cwd: 'C:\\work\\app' });

  expect(spawnMock).toHaveBeenCalledTimes(1);
  const [command, args, options] = spawnMock.mock.calls[0] ?? [];
  expect(command).toBe('git');
  expect(args).toEqual(['status']);
  expect(String(options?.cwd ?? '')).toContain('C:\\work\\app');
  expect(options).toMatchObject({
    stdio: 'ignore',
    windowsHide: true,
  });
  expect(options).not.toHaveProperty('shell');
});

test('runNocoBaseCommand executes nocobase-v1 via PATH resolution', async () => {
  spawnMock.mockReturnValue(successfulChild());
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-nocobase-'));

  try {
    await fsp.mkdir(path.join(dir, 'node_modules', '.bin'), { recursive: true });
    await fsp.writeFile(path.join(dir, 'node_modules', '.bin', 'nocobase-v1'), '');

    const { runNocoBaseCommand } = await import('../lib/run-npm.js');
    await runNocoBaseCommand(['test'], { cwd: dir, stdio: 'ignore' });

    expect(spawnMock).toHaveBeenCalledTimes(1);
    const [command, args, options] = spawnMock.mock.calls[0] ?? [];
    expect(command).toBe('nocobase-v1');
    expect(args).toEqual(['test']);
    expect(options).toMatchObject({
      cwd: dir,
      stdio: 'ignore',
    });
  } finally {
    await fsp.rm(dir, { recursive: true, force: true });
  }
});

test('run tees inherited child output through pipes when command logging is active', async () => {
  spawnMock.mockReturnValue(pipedChild());
  const stdoutWrite = vi.spyOn(process.stdout, 'write').mockReturnValue(true);
  const stderrWrite = vi.spyOn(process.stderr, 'write').mockReturnValue(true);
  process.env.NB_CLI_ACTIVE_LOG_FILE = '/tmp/nb-command.log';

  try {
    const { run } = await import('../lib/run-npm.js');
    await run('git', ['status'], { stdio: 'inherit' });

    expect(spawnMock).toHaveBeenCalledTimes(1);
    const [, , options] = spawnMock.mock.calls[0] ?? [];
    expect(options?.stdio).toEqual(['inherit', 'pipe', 'pipe']);
    expect(stdoutWrite).toHaveBeenCalledWith('hello stdout');
    expect(stderrWrite).toHaveBeenCalledWith('hello stderr');
  } finally {
    delete process.env.NB_CLI_ACTIVE_LOG_FILE;
    stdoutWrite.mockRestore();
    stderrWrite.mockRestore();
  }
});

test('run reports a friendly error when Docker is missing', async () => {
  spawnMock.mockReturnValue(erroredChild(Object.assign(new Error('spawn docker ENOENT'), { code: 'ENOENT' })));

  const { run } = await import('../lib/run-npm.js');
  await expect(run('docker', ['ps'], { stdio: 'ignore', errorName: 'docker ps' })).rejects.toThrow(
    "Couldn't run `docker ps` because the Docker executable could not be found. Install Docker or update `nb config set bin.docker <path>` and try again.",
  );
});

test('commandOutput reports a friendly error when Git is missing', async () => {
  spawnMock.mockReturnValue(erroredChild(Object.assign(new Error('spawn git ENOENT'), { code: 'ENOENT' })));

  const { commandOutput } = await import('../lib/run-npm.js');
  await expect(commandOutput('git', ['status'], { errorName: 'git status' })).rejects.toThrow(
    "Couldn't run `git status` because the Git executable could not be found. Install Git or update `nb config set bin.git <path>` and try again.",
  );
});

test('run reports a friendly error when Yarn is missing', async () => {
  spawnMock.mockReturnValue(erroredChild(Object.assign(new Error('spawn yarn ENOENT'), { code: 'ENOENT' })));

  const { run } = await import('../lib/run-npm.js');
  await expect(run('yarn', ['install'], { stdio: 'ignore', errorName: 'yarn install' })).rejects.toThrow(
    "Couldn't run `yarn install` because the Yarn executable could not be found. Install Yarn or update `nb config set bin.yarn <path>` and try again.",
  );
});

test('run reports a friendly error when Nginx is missing', async () => {
  spawnMock.mockReturnValue(erroredChild(Object.assign(new Error('spawn nginx ENOENT'), { code: 'ENOENT' })));

  const { run } = await import('../lib/run-npm.js');
  await expect(run('nginx', ['-t'], { stdio: 'ignore', errorName: 'nginx -t' })).rejects.toThrow(
    "Couldn't run `nginx -t` because the Nginx executable could not be found. Install Nginx or update `nb config set bin.nginx <path>` and try again.",
  );
});

test('commandOutputViaFile reports a friendly error when Docker is missing', async () => {
  spawnMock.mockReturnValue(erroredChild(Object.assign(new Error('spawn docker ENOENT'), { code: 'ENOENT' })));

  const { commandOutputViaFile } = await import('../lib/run-npm.js');
  await expect(commandOutputViaFile('docker', ['ps'], { errorName: 'docker ps' })).rejects.toThrow(
    "Couldn't run `docker ps` because the Docker executable could not be found. Install Docker or update `nb config set bin.docker <path>` and try again.",
  );
});

test('commandSucceeds rejects when Docker is missing', async () => {
  spawnMock.mockReturnValue(erroredChild(Object.assign(new Error('spawn docker ENOENT'), { code: 'ENOENT' })));

  const { commandSucceeds } = await import('../lib/run-npm.js');
  await expect(commandSucceeds('docker', ['ps'], { errorName: 'docker ps' })).rejects.toThrow(
    "Couldn't run `docker ps` because the Docker executable could not be found. Install Docker or update `nb config set bin.docker <path>` and try again.",
  );
});

test('commandSucceeds still returns false for unrelated missing commands', async () => {
  spawnMock.mockReturnValue(erroredChild(Object.assign(new Error('spawn pm2 ENOENT'), { code: 'ENOENT' })));

  const { commandSucceeds } = await import('../lib/run-npm.js');
  await expect(commandSucceeds('pm2', ['jlist'])).resolves.toBe(false);
});

test('ensureDockerDaemonRunning reports a friendly error when Docker daemon is not running', async () => {
  spawnMock.mockReturnValue(
    pipedChildWithClose(
      1,
      'Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?',
    ),
  );

  const { ensureDockerDaemonRunning } = await import('../lib/run-npm.js');
  await expect(ensureDockerDaemonRunning('prepare Docker resources for this environment')).rejects.toThrow(
    "Couldn't run `prepare Docker resources for this environment` because Docker is installed but the Docker daemon is not running.",
  );
});
