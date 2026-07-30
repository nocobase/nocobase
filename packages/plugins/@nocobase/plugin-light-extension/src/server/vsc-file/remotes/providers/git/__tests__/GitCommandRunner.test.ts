/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { spawn } from 'node:child_process';
import { access, chmod, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { RemoteSyncError } from '../../../RemoteSyncAdapter';
import { GitCredentialMaterializer, gitCommandTemporaryDirectoryPrefix } from '../GitCredentialMaterializer';
import { GitCommandRunner, type GitSpawnProcess } from '../GitCommandRunner';

async function captureError(callback: () => Promise<unknown>): Promise<RemoteSyncError> {
  try {
    await callback();
  } catch (error) {
    expect(error).toBeInstanceOf(RemoteSyncError);
    return error as RemoteSyncError;
  }
  throw new Error('Expected operation to throw RemoteSyncError');
}

describe('GitCommandRunner', () => {
  let temporaryDirectory: string;
  let materializer: GitCredentialMaterializer;

  beforeEach(async () => {
    temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), 'git-command-runner-test-'));
    temporaryPathHolder = temporaryDirectory;
    materializer = new GitCredentialMaterializer({ temporaryDirectory });
  });

  afterEach(async () => {
    await rm(temporaryDirectory, { force: true, recursive: true });
  });

  it('spawns argument arrays with shell disabled and a fully isolated Git environment', async () => {
    const capturePath = path.join(temporaryDirectory, 'capture.json');
    const injectedPath = path.join(temporaryDirectory, 'injected');
    const fakeGit = await createFakeGit(
      `require('fs').writeFileSync(${JSON.stringify(capturePath)}, JSON.stringify({
        argv: process.argv.slice(2),
        env: {
          HOME: process.env.HOME,
          XDG_CONFIG_HOME: process.env.XDG_CONFIG_HOME,
          GIT_CONFIG_NOSYSTEM: process.env.GIT_CONFIG_NOSYSTEM,
          GIT_CONFIG_GLOBAL: process.env.GIT_CONFIG_GLOBAL,
          GIT_TERMINAL_PROMPT: process.env.GIT_TERMINAL_PROMPT,
          GIT_ASKPASS: process.env.GIT_ASKPASS,
          GIT_SSH_COMMAND: process.env.GIT_SSH_COMMAND,
          SSH_AUTH_SOCK: process.env.SSH_AUTH_SOCK,
        },
      }));`,
    );
    let capturedSpawnOptions: Parameters<GitSpawnProcess>[2] | undefined;
    const spawnProcess: GitSpawnProcess = (command, args, options) => {
      capturedSpawnOptions = options;
      return spawnNodeScript(command, args, options);
    };
    const inherited = {
      HOME: process.env.HOME,
      GIT_ASKPASS: process.env.GIT_ASKPASS,
      GIT_SSH_COMMAND: process.env.GIT_SSH_COMMAND,
      SSH_AUTH_SOCK: process.env.SSH_AUTH_SOCK,
    };
    process.env.HOME = '/unsafe/inherited-home';
    process.env.GIT_ASKPASS = '/unsafe/inherited-askpass';
    process.env.GIT_SSH_COMMAND = 'ssh -o StrictHostKeyChecking=no';
    process.env.SSH_AUTH_SOCK = '/unsafe/inherited-agent';

    try {
      const runner = new GitCommandRunner({ gitBinary: fakeGit, materializer, spawnProcess });
      const remoteUrl = 'https://git.example.com/team/project.git;touch-command-injection';
      await runner.run({
        args: ['ls-remote', remoteUrl, 'main;touch injected'],
        remoteUrl,
        transport: 'https',
      });
    } finally {
      restoreEnvironment(inherited);
    }

    const captured = JSON.parse(await readFile(capturePath, 'utf8')) as {
      argv: string[];
      env: Record<string, string | undefined>;
    };
    expect(Array.isArray(captured.argv)).toBe(true);
    expect(captured.argv).toContain('https://git.example.com/team/project.git;touch-command-injection');
    expect(captured.argv).toContain('main;touch injected');
    expect(captured.argv).toContain('credential.helper=');
    expect(captured.argv).toContain('protocol.file.allow=never');
    expect(captured.argv).toContain('protocol.ext.allow=never');
    expect(captured.argv).toContain('http.followRedirects=false');
    expect(captured.argv.some((argument) => argument.startsWith('core.hooksPath='))).toBe(true);
    expect(captured.env.HOME).toContain(gitCommandTemporaryDirectoryPrefix);
    expect(captured.env.XDG_CONFIG_HOME).toContain(gitCommandTemporaryDirectoryPrefix);
    expect(captured.env).toMatchObject({
      GIT_CONFIG_NOSYSTEM: '1',
      GIT_CONFIG_GLOBAL: process.platform === 'win32' ? 'NUL' : '/dev/null',
      GIT_TERMINAL_PROMPT: '0',
    });
    expect(captured.env.GIT_ASKPASS).toBeUndefined();
    expect(captured.env.GIT_SSH_COMMAND).toBeUndefined();
    expect(captured.env.SSH_AUTH_SOCK).toBeUndefined();
    expect(capturedSpawnOptions).toMatchObject({ shell: false });
    await expect(access(injectedPath)).rejects.toMatchObject({ code: 'ENOENT' });
    expect(
      (await readdir(temporaryDirectory)).filter((name) => name.startsWith(gitCommandTemporaryDirectoryPrefix)),
    ).toEqual([]);
  });

  it('checks the outbound target before probing or spawning a process', async () => {
    let spawnCount = 0;
    const fakeGit = await createFakeGit('process.exit(0);');
    const runner = new GitCommandRunner({
      gitBinary: fakeGit,
      materializer,
      urlPolicyChecker: () => {
        throw new Error('blocked target details');
      },
      spawnProcess: (command, args, options) => {
        spawnCount += 1;
        return spawnNodeScript(command, args, options);
      },
    });

    const error = await captureError(() =>
      runner.run({
        args: ['ls-remote', 'https://127.0.0.1/project.git'],
        remoteUrl: 'https://127.0.0.1/project.git',
        transport: 'https',
      }),
    );
    expect(error).toMatchObject({
      code: 'REMOTE_UNAVAILABLE',
      details: { reasonCode: 'network-policy-blocked' },
    });
    expect(spawnCount).toBe(0);
  });

  it.skipIf(process.platform === 'win32')(
    'terminates a process group on timeout and removes the job directory',
    async () => {
      const childPidPath = path.join(temporaryDirectory, 'child.pid');
      const fakeGit = await createFakeGit(`
      const child = require('child_process').spawn('/bin/sh', ['-c', 'trap "" TERM; sleep 30'], { stdio: 'ignore' });
      require('fs').writeFileSync(${JSON.stringify(childPidPath)}, String(child.pid));
      setInterval(() => {}, 1000);
    `);
      const runner = new GitCommandRunner({
        gitBinary: fakeGit,
        materializer,
        limits: { timeoutMs: 80, terminationGraceMs: 40 },
      });

      const error = await captureError(() => runner.run({ args: ['init', '--bare'] }));
      expect(error).toMatchObject({ code: 'REMOTE_UNAVAILABLE', details: { reasonCode: 'command-timeout' } });
      const childPid = Number(await readFile(childPidPath, 'utf8'));
      await expectProcessToStop(childPid);
      expect(
        (await readdir(temporaryDirectory)).filter((name) => name.startsWith(gitCommandTemporaryDirectoryPrefix)),
      ).toEqual([]);
    },
  );

  it('terminates output overflow and abort paths with stable errors', async () => {
    const outputGit = await createFakeGit(
      `process.stdout.write(Buffer.alloc(4096, 'x')); setInterval(() => {}, 1000);`,
    );
    const outputRunner = new GitCommandRunner({
      gitBinary: outputGit,
      materializer,
      limits: { maxStdoutBytes: 128, terminationGraceMs: 30 },
      spawnProcess: spawnNodeScript,
    });
    expect(await captureError(() => outputRunner.run({ args: ['cat-file', '--batch'] }))).toMatchObject({
      code: 'REMOTE_UNAVAILABLE',
      details: { reasonCode: 'command-output-limit' },
    });

    const abortGit = await createFakeGit('setInterval(() => {}, 1000);');
    const abortRunner = new GitCommandRunner({
      gitBinary: abortGit,
      materializer,
      limits: { terminationGraceMs: 30 },
      spawnProcess: spawnNodeScript,
    });
    const controller = new AbortController();
    const promise = abortRunner.run({ args: ['read-tree', '--empty'], signal: controller.signal });
    setTimeout(() => controller.abort(), 30);
    expect(await captureError(() => promise)).toMatchObject({
      code: 'REMOTE_UNAVAILABLE',
      details: { reasonCode: 'command-aborted' },
    });
    expect(
      (await readdir(temporaryDirectory)).filter((name) => name.startsWith(gitCommandTemporaryDirectoryPrefix)),
    ).toEqual([]);
  });

  it('keeps HTTPS available when SSH is missing and redacts SSH credentials from errors', async () => {
    const fakeGit = await createFakeGit("process.stdout.write('ok');");
    const runner = new GitCommandRunner({
      gitBinary: fakeGit,
      sshBinary: path.join(temporaryDirectory, 'missing-ssh'),
      materializer,
      spawnProcess: spawnNodeScript,
    });
    await expect(
      runner.run({
        args: ['ls-remote', 'https://git.example.com/team/project.git'],
        remoteUrl: 'https://git.example.com/team/project.git',
        transport: 'https',
      }),
    ).resolves.toMatchObject({ exitCode: 0 });

    const privateKey = 'private-key-must-not-leak';
    const passphrase = 'passphrase-must-not-leak';
    const knownHosts = 'known-hosts-must-not-leak';
    const error = await captureError(() =>
      runner.run({
        args: ['ls-remote', 'ssh://git@git.example.com/team/project.git'],
        remoteUrl: 'ssh://git@git.example.com/team/project.git',
        transport: 'ssh',
        credential: { kind: 'ssh', privateKey, passphrase, knownHosts },
      }),
    );
    expect(error).toMatchObject({
      code: 'REMOTE_UNAVAILABLE',
      details: { reasonCode: 'ssh-binary-unavailable' },
    });
    expect(JSON.stringify(error.toResponseBody())).not.toMatch(
      /private-key-must-not-leak|passphrase-must-not-leak|known-hosts-must-not-leak/u,
    );
  });

  it('never places HTTPS or SSH credential material in command arguments or output', async () => {
    const capturePath = path.join(temporaryDirectory, 'credential-argv.json');
    const fakeGit = await createFakeGit(
      `require('fs').appendFileSync(${JSON.stringify(capturePath)}, JSON.stringify(process.argv.slice(2)) + '\\n');`,
    );
    const fakeSsh = await createFakeGit('process.stdout.write("OpenSSH_9.9");');
    const runner = new GitCommandRunner({
      gitBinary: fakeGit,
      sshBinary: fakeSsh,
      materializer,
      spawnProcess: spawnNodeScript,
    });
    const httpsPassword = 'https-password-must-not-leak';
    const privateKey = 'ssh-private-key-must-not-leak';
    const passphrase = 'ssh-passphrase-must-not-leak';
    const knownHosts = 'git.example.com ssh-ed25519 known-hosts-must-not-leak';

    const httpsResult = await runner.run({
      args: ['ls-remote', 'https://git.example.com/team/project.git'],
      remoteUrl: 'https://git.example.com/team/project.git',
      transport: 'https',
      credential: { kind: 'https', username: 'git-user', password: httpsPassword },
    });
    const sshResult = await runner.run({
      args: ['ls-remote', 'ssh://git@git.example.com/team/project.git'],
      remoteUrl: 'ssh://git@git.example.com/team/project.git',
      transport: 'ssh',
      credential: { kind: 'ssh', privateKey, passphrase, knownHosts },
    });
    const observable = [
      await readFile(capturePath, 'utf8'),
      httpsResult.stdout.toString('utf8'),
      httpsResult.stderr.toString('utf8'),
      sshResult.stdout.toString('utf8'),
      sshResult.stderr.toString('utf8'),
    ].join('\n');
    expect(observable).not.toContain(httpsPassword);
    expect(observable).not.toContain(privateKey);
    expect(observable).not.toContain(passphrase);
    expect(observable).not.toContain(knownHosts);
  });

  it('rejects commands, process overrides, and untrusted environment variables', async () => {
    const fakeGit = await createFakeGit('process.exit(0);');
    const runner = new GitCommandRunner({ gitBinary: fakeGit, materializer, spawnProcess: spawnNodeScript });

    expect(
      await captureError(() => runner.run({ args: ['config', '--global', 'credential.helper', 'evil'] })),
    ).toMatchObject({ code: 'CONFIG_INVALID', details: { reasonCode: 'command-not-allowed' } });
    expect(
      await captureError(() => runner.run({ args: ['fetch', '--upload-pack=/tmp/evil', 'origin'] })),
    ).toMatchObject({ code: 'CONFIG_INVALID', details: { reasonCode: 'command-argument-not-allowed' } });
    expect(
      await captureError(() =>
        runner.run({
          args: ['push', '--repo=https://evil.example.com/a.git', 'https://git.example.com/a.git'],
          remoteUrl: 'https://git.example.com/a.git',
          transport: 'https',
        }),
      ),
    ).toMatchObject({ code: 'CONFIG_INVALID', details: { reasonCode: 'command-argument-not-allowed' } });
    expect(
      await captureError(() => runner.run({ args: ['init', '--bare'], environment: { GIT_CONFIG_COUNT: '0' } })),
    ).toMatchObject({ code: 'CONFIG_INVALID', details: { reasonCode: 'unsupported-environment' } });
  });

  it('requires network commands to execute the exact validated remote URL', async () => {
    let spawnCount = 0;
    const fakeGit = await createFakeGit('process.exit(0);');
    const runner = new GitCommandRunner({
      gitBinary: fakeGit,
      materializer,
      spawnProcess: (command, args, options) => {
        spawnCount += 1;
        return spawnNodeScript(command, args, options);
      },
    });

    expect(
      await captureError(() => runner.run({ args: ['ls-remote', 'https://git.example.com/a.git'] })),
    ).toMatchObject({
      code: 'CONFIG_INVALID',
      details: { reasonCode: 'remote-target-required' },
    });
    expect(
      await captureError(() =>
        runner.run({
          args: ['ls-remote', 'https://evil.example.com/a.git', 'https://git.example.com/a.git'],
          remoteUrl: 'https://git.example.com/a.git',
          transport: 'https',
        }),
      ),
    ).toMatchObject({ code: 'CONFIG_INVALID', details: { reasonCode: 'remote-target-mismatch' } });
    expect(spawnCount).toBe(0);
  });
});

async function createFakeGit(body: string): Promise<string> {
  const filename = path.join(temporaryPathHolder, `fake-git-${fakeGitSequence++}`);
  await writeFile(
    filename,
    `#!${process.execPath}
if (process.argv[2] === '--version' || process.argv[2] === '-V') {
  process.stdout.write('git version 2.45.0');
  process.exit(0);
}
${body}
`,
    { mode: 0o700 },
  );
  await chmod(filename, 0o700);
  return filename;
}

let temporaryPathHolder = os.tmpdir();
let fakeGitSequence = 0;

const spawnNodeScript: GitSpawnProcess = (command, args, options) =>
  spawn(process.execPath, [command, ...args], options);

function restoreEnvironment(values: Record<string, string | undefined>): void {
  for (const [name, value] of Object.entries(values)) {
    if (value === undefined) {
      delete process.env[name];
    } else {
      process.env[name] = value;
    }
  }
}

async function expectProcessToStop(pid: number): Promise<void> {
  const deadline = Date.now() + 2000;
  while (Date.now() < deadline) {
    try {
      process.kill(pid, 0);
    } catch {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  throw new Error(`Process ${pid} was not terminated`);
}
