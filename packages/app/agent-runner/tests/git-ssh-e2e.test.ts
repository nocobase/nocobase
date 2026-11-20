// Run with NOCOBASE_TEST_OPENSSH=1 on a Linux host with sshd, PAM, /run/sshd and openssl.
import { execFileSync, spawn, type ChildProcess } from 'node:child_process';
import { generateKeyPairSync } from 'node:crypto';
import { once } from 'node:events';
import { createServer as createHttpsServer } from 'node:https';
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

/** Serve the same bare repository through Git's smart HTTP handler over TLS. */
async function httpsGit(bare: string, home: string) {
  const pem = execFileSync(
    'bash',
    [
      '-o',
      'pipefail',
      '-c',
      'openssl "$@" | cat',
      'openssl',
      'req',
      '-x509',
      '-newkey',
      'rsa:2048',
      '-nodes',
      '-days',
      '1',
      '-subj',
      '/CN=localhost',
      '-addext',
      'subjectAltName=IP:127.0.0.1',
      '-keyout',
      '/dev/stdout',
    ],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
  );
  const certAt = pem.indexOf('-----BEGIN CERTIFICATE-----');
  const cert = pem.slice(certAt);
  const certPath = path.join(home, 'git-https-ca.pem');
  writeFileSync(certPath, cert);
  const requests: string[] = [];
  const server = createHttpsServer(
    { key: pem.slice(0, certAt), cert },
    (req, res) => {
      const target = new URL(req.url ?? '/', 'https://localhost');
      if (!target.pathname.startsWith(`${bare}/`)) {
        res.writeHead(404).end();
        return;
      }
      requests.push(`${target.pathname}${target.search}`);
      const backend = spawn('git', ['http-backend'], {
        env: {
          ...process.env,
          GIT_PROJECT_ROOT: path.dirname(bare),
          GIT_HTTP_EXPORT_ALL: '1',
          REMOTE_USER: 'test',
          PATH_INFO: target.pathname.slice(path.dirname(bare).length),
          QUERY_STRING: target.search.slice(1),
          REQUEST_METHOD: req.method,
          CONTENT_TYPE: req.headers['content-type'],
          CONTENT_LENGTH: req.headers['content-length'],
        },
        stdio: ['pipe', 'pipe', 'ignore'],
      });
      const output: Buffer[] = [];
      backend.stdout.on('data', (chunk: Buffer) => output.push(chunk));
      backend.stdin.on('error', () => undefined);
      req.pipe(backend.stdin);
      backend.once('close', (code) => {
        const cgi = Buffer.concat(output);
        const headerEnd = cgi.indexOf('\r\n\r\n');
        if (code !== 0 || headerEnd < 0) {
          res.writeHead(502).end();
          return;
        }
        for (const line of cgi
          .subarray(0, headerEnd)
          .toString()
          .split('\r\n')) {
          const colon = line.indexOf(':');
          const name = line.slice(0, colon);
          const value = line.slice(colon + 1).trim();
          if (name === 'Status') res.statusCode = Number(value.split(' ')[0]);
          else res.setHeader(name, value);
        }
        res.end(cgi.subarray(headerEnd + 4));
      });
    },
  ).listen(0, '127.0.0.1');
  await once(server, 'listening');
  const url = `https://127.0.0.1:${(server.address() as { port: number }).port}${bare}`;
  writeFileSync(
    path.join(home, '.gitconfig'),
    `[http "${url}"]\n\tsslCAInfo = ${certPath}\n`,
  );
  return { server, url, requests };
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

    const enqueue = (
      turn: string,
      credential = ssh,
      initial = true,
      readOnly = false,
    ) =>
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
          ...(readOnly ? { readOnly: true } : {}),
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

    it('lets a read-only agent fetch and reserves SSH pushes for writable runs', async () => {
      const seed = path.join(scratch, 'seed');
      git(['clone', '--quiet', bare, seed]);
      git(
        [
          '-c',
          'user.name=Test',
          '-c',
          'user.email=test@example.com',
          '-c',
          'commit.gpgsign=false',
          'commit',
          '--allow-empty',
          '-qm',
          'seed',
        ],
        seed,
      );
      git(['push', 'origin', 'HEAD:refs/heads/main'], seed);
      const sha = git(['rev-parse', 'HEAD'], seed);
      const remoteRef = 'refs/heads/agent/test';
      const readOnly = enqueue(
        [
          'bash git fetch origin refs/heads/main',
          'bash git rev-parse FETCH_HEAD',
          `bash git push origin HEAD:${remoteRef}`,
          'say done',
        ].join('\n'),
        ssh,
        false,
        true,
      );

      daemon = startDaemon(env);
      await waitFor(
        () => readOnly.status === 'completed' || readOnly.status === 'failed',
        20_000,
        'the read-only SSH run',
      );
      expect(readOnly.fail).toBeUndefined();
      expect(
        [...readOnly.events.values()].map((event) => event.output?.trim()),
      ).toEqual(
        expect.arrayContaining([
          sha,
          expect.stringContaining(
            'This read-only run permits only Git fetch over SSH.',
          ),
        ]),
      );
      expect(
        git(['for-each-ref', '--format=%(refname)', remoteRef], bare),
      ).toBe('');

      const writable = app.enqueue({
        run: { requires: readOnly.payload.run.requires },
        subject: readOnly.payload.subject,
        workspace: { ...readOnly.payload.workspace, readOnly: false },
        prompt: {
          ...readOnly.payload.prompt,
          turn: `bash git push origin HEAD:${remoteRef}\nsay done`,
        },
      });
      await waitFor(
        () => writable.status === 'completed' || writable.status === 'failed',
        20_000,
        'the writable SSH run',
      );
      expect(writable.fail).toBeUndefined();
      expect(git(['rev-parse', remoteRef], bare)).toBe(sha);
    }, 60_000);

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

      writeFileSync(
        path.join(bare, 'hooks', 'pre-receive'),
        '#!/bin/sh\nwhile read -r old new ref; do case "$ref" in refs/tags/*) exit 1 ;; esac; done\n',
        { mode: 0o700 },
      );
      const next = enqueue(
        [
          `bash ${COMMIT}`,
          'bash git push origin HEAD:refs/heads/agent/test',
          'bash git push origin HEAD:refs/tags/refused',
          'say done',
        ].join('\n'),
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
      expect(next.complete?.repos?.[0]?.failure).toBeUndefined();
      expect(
        [...next.events.values()].some((event) =>
          event.output?.includes('[remote rejected]'),
        ),
      ).toBe(true);
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

    it('switches a reused task checkout from HTTPS to SSH and back without losing local work', async () => {
      const https = await httpsGit(bare, home);
      try {
        env.HOME = home;
        daemon = startDaemon(env);
        const branch = 'refs/heads/agent/test';
        const runAt = async (remote: string, turn: string, useSsh = false) => {
          const run = app.enqueue({
            run: { requires: useSsh ? ['checkout', 'gitSsh'] : ['checkout'] },
            workspace: {
              key: 'clone-method',
              dirs: [
                {
                  kind: 'repo',
                  url: remote,
                  defaultBranch: 'main',
                  branch: 'agent/test',
                  path: 'repo',
                  initializeIfEmpty: true,
                },
              ],
              env: [],
              ...(useSsh ? { git: { ssh: [ssh] } } : {}),
            },
            prompt: {
              system: 'System rules.',
              turn: [
                'bash git remote get-url origin',
                'bash git remote get-url --push origin',
                turn,
              ].join('\n'),
              session: 'fresh',
            },
          });
          await waitFor(
            () => run.status === 'completed' || run.status === 'failed',
            20_000,
            `task checkout and push at ${remote}`,
          );
          expect(run.fail).toBeUndefined();
          expect(run.complete?.repos?.[0]?.url).toBe(remote);
          expect(
            [...run.events.values()].filter(
              (event) =>
                event.type === 'toolResult' && event.output?.trim() === remote,
            ),
          ).toHaveLength(2);
          return path.join(run.start!.workDir, 'repo');
        };

        const workDir = await runAt(
          https.url,
          `bash git fetch origin\nbash ${COMMIT}\nbash git push origin HEAD:refs/heads/main\nsay done`,
        );
        expect(
          https.requests.some((req) => req.endsWith('/git-receive-pack')),
        ).toBe(true);
        const httpsRequests = https.requests.length;
        const gitDir = git(['rev-parse', '--absolute-git-dir'], workDir);
        git(['commit', '--allow-empty', '-qm', 'unpublished'], workDir);
        const localSha = git(['rev-parse', 'HEAD'], workDir);
        writeFileSync(path.join(workDir, 'local-work'), 'keep this file');

        expect(
          await runAt(
            url,
            `bash git fetch origin\nbash git push origin HEAD:${branch}\nsay done`,
            true,
          ),
        ).toBe(workDir);
        expect(https.requests).toHaveLength(httpsRequests);
        expect(git(['remote', 'get-url', 'origin'], workDir)).toBe(https.url);
        expect(git(['rev-parse', branch], bare)).toBe(localSha);
        expect(readFileSync(path.join(workDir, 'local-work'), 'utf8')).toBe(
          'keep this file',
        );

        expect(
          await runAt(
            https.url,
            `bash git fetch origin\nbash ${COMMIT}\nbash git push origin HEAD:${branch}\nsay done`,
          ),
        ).toBe(workDir);
        expect(https.requests.slice(httpsRequests)).toEqual(
          expect.arrayContaining([
            `${bare}/info/refs?service=git-upload-pack`,
            `${bare}/git-receive-pack`,
          ]),
        );
        expect(git(['rev-parse', '--absolute-git-dir'], workDir)).toBe(gitDir);
        const newSha = git(['rev-parse', 'HEAD'], workDir);
        expect(newSha).not.toBe(localSha);
        expect(git(['rev-parse', branch], bare)).toBe(newSha);
        expect(readFileSync(path.join(workDir, 'local-work'), 'utf8')).toBe(
          'keep this file',
        );
      } finally {
        await new Promise<void>((resolve) =>
          https.server.close(() => resolve()),
        );
      }
    }, 70_000);
  },
);
