// Run with NOCOBASE_TEST_OPENSSH=1 on a Linux host with sshd and PAM, including /run/sshd.
import { execFileSync, spawn, type ChildProcess } from 'node:child_process';
import { generateKeyPairSync } from 'node:crypto';
import { once } from 'node:events';
import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { createConnection, createServer } from 'node:net';
import { userInfo } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { openGitSsh } from '../src/core/git-ssh.ts';
import { FakeServer, waitFor } from './fake-server.ts';
import {
  cliEnv,
  git,
  registerRunner,
  removeDir,
  startDaemon,
  stopDaemon,
  tempDir,
  workRootOf,
  writeFakeCli,
  type Daemon,
} from './helpers.ts';

const sshd = '/usr/sbin/sshd';
const shellUser = userInfo().username;
const COMMIT =
  'git -c user.name=Test -c user.email=test@example.com -c commit.gpgsign=false commit -qm ssh-test --allow-empty';

/** A deployment key generated and retained in process memory only. */
function deploymentKey(): { privateKey: string; publicKey: string } {
  const pair = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const { n, e } = pair.publicKey.export({ format: 'jwk' });
  const field = (value: Buffer): Buffer => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(value.length);
    return Buffer.concat([len, value]);
  };
  const integer = (value: string): Buffer => {
    const bytes = Buffer.from(value, 'base64url');
    return field(
      bytes[0]! & 0x80 ? Buffer.concat([Buffer.alloc(1), bytes]) : bytes,
    );
  };
  const key = Buffer.concat([
    field(Buffer.from('ssh-rsa')),
    integer(e!),
    integer(n!),
  ]).toString('base64');
  return {
    privateKey: pair.privateKey
      .export({ type: 'pkcs1', format: 'pem' })
      .toString(),
    publicKey: `ssh-rsa ${key}`,
  };
}

async function freePort(): Promise<number> {
  const reserve = createServer().listen(0, '127.0.0.1');
  await once(reserve, 'listening');
  const port = (reserve.address() as { port: number }).port;
  await new Promise<void>((resolve) => reserve.close(() => resolve()));
  return port;
}

async function listening(port: number): Promise<boolean> {
  const client = createConnection(port, '127.0.0.1');
  return await new Promise<boolean>((resolve) => {
    client.once('connect', () => {
      client.destroy();
      resolve(true);
    });
    client.once('error', () => resolve(false));
  });
}

describe.runIf(process.env.NOCOBASE_TEST_OPENSSH === '1')(
  'Git SSH with local OpenSSH',
  () => {
    let app: FakeServer;
    let daemon: Daemon | undefined;
    let sshServer: ChildProcess | undefined;
    let scratch: string;
    let home: string;
    let bare: string;
    let url: string;
    let port: number;
    let ssh: { url: string; privateKey: string; knownHosts: string };
    let env: NodeJS.ProcessEnv;

    beforeEach(async () => {
      app = new FakeServer();
      await app.listen();
      scratch = tempDir('nb-sshd-');
      home = tempDir('nb-ssh-home-');
      bare = path.join(scratch, 'repo.git');
      git(['init', '--quiet', '--bare', '--initial-branch=main', bare]);
      port = await freePort();
      url = `ssh://${shellUser}@127.0.0.1:${port}${bare}`;
      const hostKey = path.join(scratch, 'hostkey');
      const authorizedKeys = path.join(scratch, 'authorized_keys');
      const config = path.join(scratch, 'sshd_config');
      const deployment = deploymentKey();
      execFileSync('ssh-keygen', [
        '-q',
        '-t',
        'ed25519',
        '-N',
        '',
        '-f',
        hostKey,
      ]);
      writeFileSync(authorizedKeys, `restrict ${deployment.publicKey}\n`, {
        mode: 0o600,
      });
      writeFileSync(
        config,
        [
          'ListenAddress 127.0.0.1',
          `Port ${port}`,
          `HostKey ${hostKey}`,
          `AuthorizedKeysFile ${authorizedKeys}`,
          `PidFile ${path.join(scratch, 'sshd.pid')}`,
          'StrictModes no',
          'PasswordAuthentication no',
          'KbdInteractiveAuthentication no',
          'UsePAM yes',
        ].join('\n') + '\n',
      );
      sshServer = spawn(sshd, ['-D', '-e', '-f', config], { stdio: 'ignore' });
      await waitFor(
        () => listening(port),
        5_000,
        'the local SSH server to listen',
      );
      ssh = {
        url,
        privateKey: deployment.privateKey,
        knownHosts: `[127.0.0.1]:${port} ${readFileSync(hostKey + '.pub', 'utf8')}`,
      };
      env = cliEnv(home, { SSH_AUTH_SOCK: path.join(scratch, 'host-agent') });
      await registerRunner(app.url, env, [
        '--cli',
        `appcli=${writeFakeCli(scratch)}`,
      ]);
    });

    afterEach(async () => {
      if (daemon) await stopDaemon(daemon);
      daemon = undefined;
      if (sshServer?.exitCode === null) {
        const ended = once(sshServer, 'exit');
        sshServer.kill();
        await ended;
      }
      sshServer = undefined;
      await app?.close();
      if (scratch) removeDir(scratch);
      if (home) {
        removeDir(home);
        removeDir(workRootOf(home));
      }
    });

    const enqueue = (turn: string, credential = ssh, initial = true) =>
      app.enqueue({
        run: { requires: ['checkout', 'gitSsh'] },
        workspace: {
          dirs: [
            {
              kind: 'repo',
              url,
              defaultBranch: 'main',
              branch: 'agent/test',
              path: 'repo',
              ...(initial ? { initializeIfEmpty: true as const } : {}),
            },
          ],
          env: [],
          git: { ssh: [credential] },
        },
        prompt: { system: 'System rules.', turn, session: 'fresh' },
      });

    it('stores public material and gives each run its own socket', async () => {
      const first = await openGitSsh([ssh], scratch);
      try {
        const second = await openGitSsh([ssh], scratch);
        try {
          expect(first?.pid).toBeDefined();
          expect(second?.pid).not.toBe(first?.pid);
          const dirs = readdirSync(scratch).filter((file) =>
            file.startsWith('ssh-'),
          );
          expect(dirs).toHaveLength(2);
          for (const dir of dirs) {
            const absolute = path.join(scratch, dir);
            expect(statSync(absolute).mode & 0o777).toBe(0o700);
            expect(readdirSync(absolute).sort()).toEqual([
              'a',
              'config.json',
              'hosts-0',
              'key-0.pub',
            ]);
            const rawKeyLine = ssh.privateKey.split('\n')[1]!;
            for (const name of ['config.json', 'hosts-0', 'key-0.pub']) {
              expect(
                readFileSync(path.join(absolute, name), 'utf8').includes(
                  rawKeyLine,
                ),
              ).toBe(false);
            }
          }
        } finally {
          await second?.close();
        }
      } finally {
        await first?.close();
      }
      expect(
        readdirSync(scratch).filter((file) => file.startsWith('ssh-')),
      ).toEqual([]);
    });

    it('initializes, rechecks, pushes, and builds through managed SSH', async () => {
      expect([...app.runners.values()][0]?.register.features).toContain(
        'gitSsh',
      );
      const first = enqueue(
        [
          'bash env',
          'bash ls -Al "$TMPDIR"/ssh-*',
          `bash ${COMMIT}`,
          'bash git push origin HEAD:refs/heads/main',
          'say done',
        ].join('\n'),
      );
      daemon = startDaemon(env);
      await waitFor(
        () => first.status === 'completed' || first.status === 'failed',
        20_000,
        'SSH initialization',
      );
      expect(first.fail).toBeUndefined();
      expect(first.complete?.repos).toEqual([
        expect.objectContaining({ url, pushed: true }),
      ]);
      const firstSha = git(['rev-parse', 'refs/heads/main'], bare);

      const next = enqueue(
        `bash ${COMMIT}\nbash git push origin HEAD:refs/heads/agent/test\nsay done`,
        ssh,
        false,
      );
      await waitFor(
        () => next.status === 'completed' || next.status === 'failed',
        20_000,
        'SSH branch push',
      ).catch((error: Error) => {
        throw new Error(
          `${error.message} (${next.status})\n${daemon?.output() ?? ''}`,
        );
      });
      expect(next.fail).toBeUndefined();
      expect(next.complete?.repos).toEqual([
        expect.objectContaining({ url, pushed: true }),
      ]);
      const sha = git(['rev-parse', 'refs/heads/agent/test'], bare);
      expect(sha).not.toBe(firstSha);

      git(['update-ref', 'refs/tags/build-ssh', sha], bare);
      const { url: _url, ...auth } = ssh;
      const build = app.enqueueJob({
        kind: 'build',
        requires: ['jobs.build', 'gitSsh'],
        spec: {
          repo: { url, ref: 'refs/tags/build-ssh', ssh: auth },
          command: { argv: ['git', 'rev-parse', 'HEAD'] },
          env: [],
          outputs: [],
          timeoutSec: 20,
        },
      });
      await waitFor(
        () => build.status === 'completed' || build.status === 'failed',
        20_000,
        'SSH build',
      );
      expect(build.fail).toBeUndefined();
      expect(build.result?.sha).toBe(sha);
      const events = JSON.stringify([...first.events.values()]);
      const rawKeyLine = ssh.privateKey.split('\n')[1]!;
      expect(events.includes(rawKeyLine)).toBe(false);
      expect(daemon?.output().includes(rawKeyLine)).toBe(false);
      expect(
        JSON.stringify([...build.events.values()]).includes(rawKeyLine),
      ).toBe(false);
      expect(events).not.toContain('SSH_AUTH_SOCK=');
      expect(events).toContain('key-0.pub');
      expect(events).toContain('hosts-0');
      const envEvent = [...first.events.values()]
        .map((event) => event.output ?? event.content ?? '')
        .join('\n');
      const tmp = /(?:^|\n)TMPDIR=([^\n]+)/u.exec(envEvent)?.[1];
      expect(tmp).toBeDefined();
      await waitFor(
        () => !existsSync(tmp!),
        10_000,
        'SSH runtime directory cleanup',
      );
    }, 70_000);

    it('reports refused pushes and checkout failures with their SSH reason', async () => {
      const init = enqueue(
        `bash ${COMMIT}\nbash git push origin HEAD:refs/heads/main\nsay done`,
      );
      daemon = startDaemon(env);
      await waitFor(
        () => init.status === 'completed',
        20_000,
        'SSH initialization',
      );
      writeFileSync(
        path.join(bare, 'hooks', 'pre-receive'),
        '#!/bin/sh\nexit 1\n',
        { mode: 0o700 },
      );

      const rejected = enqueue(
        `bash ${COMMIT}\nbash git push origin HEAD:refs/heads/agent/test\nsay done`,
        ssh,
        false,
      );
      const unauthenticated = enqueue('say unused', {
        ...ssh,
        privateKey: deploymentKey().privateKey,
      });
      const mismatch = enqueue('say unused', {
        ...ssh,
        knownHosts: `[127.0.0.1]:${port} ${deploymentKey().publicKey}\n`,
      });
      await waitFor(
        () =>
          [rejected, unauthenticated, mismatch].every(
            (run) => run.status === 'completed' || run.status === 'failed',
          ),
        35_000,
        'SSH failures',
      ).catch((error: Error) => {
        throw new Error(
          `${error.message} (${[rejected, unauthenticated, mismatch].map(({ status }) => status).join(', ')})\n${daemon?.output() ?? ''}`,
        );
      });
      expect(rejected.complete?.repos?.[0]?.failure?.reason).toBe(
        'sshPushRejected',
      );
      expect(unauthenticated.fail?.detail).toContain(
        'SSH authentication failed',
      );
      expect([...unauthenticated.events.values()]).toContainEqual(
        expect.objectContaining({
          meta: expect.objectContaining({ gitSshFailure: 'authFailed' }),
        }),
      );
      expect(mismatch.fail?.detail).toContain(
        'SSH host key verification failed',
      );
      expect([...mismatch.events.values()]).toContainEqual(
        expect.objectContaining({
          meta: expect.objectContaining({ gitSshFailure: 'hostKeyMismatch' }),
        }),
      );
    }, 60_000);
  },
);
