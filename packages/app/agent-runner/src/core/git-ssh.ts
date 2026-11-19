import { execFile, spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { lstat, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

import type { GitSshFailure, RepoSshCredential } from '../protocol/index.ts';
import { which } from '../agent/cli.ts';
import { GitSshError } from './git.ts';
import {
  type SshConfig,
  type SshTarget,
  SSH_FAILURE_MESSAGES,
} from './ssh-command.ts';

function targetFor(url: string): SshTarget {
  if (url.startsWith('ssh://')) {
    const address = new URL(url);
    if (
      address.password ||
      address.search ||
      address.hash ||
      address.pathname.length < 2
    )
      throw new Error('Invalid SSH clone URL.');
    return {
      destination:
        (address.username ? decodeURIComponent(address.username) + '@' : '') +
        address.hostname.replace(/^\[|\]$/gu, '').toLowerCase(),
      port: address.port || '22',
      repoPath: decodeURIComponent(address.pathname),
    };
  }
  const match = /^((?:[^@/:]+@)?)(\[[^\]]+\]|[^:/]+):([^\r\n]+)$/u.exec(url);
  if (match === null || match[3]?.startsWith('//'))
    throw new Error('Invalid SSH clone URL.');
  return {
    destination: match[1] + match[2].replace(/^\[|\]$/gu, '').toLowerCase(),
    port: '22',
    repoPath: match[3],
  };
}

/** An SSH URL or Git's scp-style destination, excluding local paths and other URL schemes. */
export function isGitSshUrl(url: string): boolean {
  return (
    url.startsWith('ssh://') ||
    (!url.includes('://') &&
      /^[^/:]+:.+/u.test(url) &&
      !/^[a-z]:[\\/]/iu.test(url))
  );
}

function binaries(): string[] {
  const search = process.env.PATH ?? '';
  return ['ssh', 'ssh-agent', 'ssh-add'].map((name) => {
    const found = which(name, search);
    return found === undefined ? '' : path.resolve(found);
  });
}

let stdinSupport:
  { agent: string; add: string; supported: boolean } | undefined;

/** Probe the selected tools once per process, without contacting the user's agent or using a real key. */
export function supportsGitSsh(): boolean {
  if (process.platform !== 'linux' && process.platform !== 'darwin')
    return false;
  const [ssh, agent, add] = binaries();
  if (!ssh || !agent || !add) return false;
  if (stdinSupport?.agent === agent && stdinSupport.add === add)
    return stdinSupport.supported;

  let supported = false;
  let dir: string | undefined;
  try {
    dir = mkdtempSync(path.join(tmpdir(), 'ssh-probe-'));
    const probe = spawnSync(
      agent,
      ['-a', path.join(dir, 'a'), '-P', '', add, '-'],
      {
        cwd: dir,
        input: 'invalid key\n',
        env: {
          PATH: process.env.PATH,
          LC_ALL: 'C',
          SSH_ASKPASS_REQUIRE: 'never',
        },
        encoding: 'utf8',
        timeout: 5_000,
        killSignal: 'SIGKILL',
        maxBuffer: 8_192,
      },
    );
    // A supporting ssh-add parses "-" as stdin. Older versions try to open a file named "-".
    supported =
      probe.status === 1 &&
      probe.stderr.startsWith('Error loading key "(stdin)":');
  } catch {
    // A runner that cannot launch the probe cannot offer this feature.
  } finally {
    if (dir !== undefined) rmSync(dir, { recursive: true, force: true });
  }
  stdinSupport = { agent, add, supported };
  return supported;
}

function quote(value: string): string {
  return "'" + value.replaceAll("'", "'\"'\"'") + "'";
}

export interface GitSshSession {
  /** Only Git commands for the matching repositories use these settings. */
  env(url: string): Record<string, string>;
  /** The worker's SSH agent, kept alive while the agent's Git writers are stopped. */
  readonly pid: number | undefined;
  readonly command: string;
  readonly pushCommand: string;
  pushFailure(url: string): Promise<GitSshFailure | undefined>;
  close(): Promise<void>;
}

function add(
  binary: string,
  socket: string,
  args: string[],
  signal: AbortSignal,
  input?: string,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = execFile(
      binary,
      args,
      {
        env: {
          PATH: process.env.PATH,
          SSH_AUTH_SOCK: socket,
          SSH_ASKPASS_REQUIRE: 'never',
        },
        signal,
        timeout: 5000,
      },
      (error, stdout) => {
        if (error === null) resolve(stdout.trim());
        else reject(new GitSshError('authFailed'));
      },
    );
    // ssh-add can exit before it reads stdin, for example if the socket has disappeared.
    child.stdin?.on('error', () => undefined);
    child.stdin?.end(input);
  });
}

/** A foreground SSH agent in the worker's process group. It receives private keys only on stdin. */
export async function openGitSsh(
  credentials: readonly RepoSshCredential[] | undefined,
  parent: string = tmpdir(),
  signal: AbortSignal = new AbortController().signal,
): Promise<GitSshSession | undefined> {
  if (!credentials?.length) return undefined;
  const [ssh, agent, sshAdd] = binaries();
  if (!ssh || !agent || !sshAdd || process.platform === 'win32')
    throw new Error(
      'OpenSSH (ssh, ssh-agent and ssh-add) is required for Git SSH.',
    );
  const targets = credentials.map(({ url }) => targetFor(url));
  const dir = await mkdtemp(path.join(parent, 'ssh-'));
  const socket = path.join(dir, 'a');
  if (Buffer.byteLength(socket) > 100) {
    await rm(dir, { recursive: true, force: true });
    throw new Error('The Git SSH agent socket path is too long.');
  }
  const child = spawn(agent, ['-D', '-P', '', '-a', socket], {
    env: { PATH: process.env.PATH },
    stdio: 'ignore',
  });
  let stopped = false;
  const exited = new Promise<void>((resolve) => {
    const stop = (): void => {
      stopped = true;
      resolve();
    };
    child.once('error', stop);
    child.once('close', stop);
  });
  const close = async (): Promise<void> => {
    if (!stopped) {
      child.kill('SIGTERM');
      const kill = setTimeout(() => child.kill('SIGKILL'), 1000);
      try {
        await exited;
      } finally {
        clearTimeout(kill);
      }
    }
    await rm(dir, { recursive: true, force: true });
  };

  try {
    const deadline = Date.now() + 5000;
    while (!(await lstat(socket).catch(() => undefined))?.isSocket()) {
      if (stopped || Date.now() >= deadline)
        throw new Error('Could not start the Git SSH agent.');
      await delay(10, undefined, { signal });
    }
    const identities: SshConfig['identities'][number][] = [];
    const publicKeys = new Map<string, string>();
    const loaded = new Set<string>();
    for (const [index, credential] of credentials.entries()) {
      signal.throwIfAborted();
      let publicKey = publicKeys.get(credential.privateKey);
      if (publicKey === undefined) {
        await add(
          sshAdd,
          socket,
          ['-'],
          signal,
          credential.privateKey.trimEnd() + '\n',
        );
        const keys = (await add(sshAdd, socket, ['-L'], signal))
          .split('\n')
          .map((line) => line.split(/\s+/u, 2).join(' '));
        const key = keys.find((line) => !loaded.has(line));
        if (!key) throw new GitSshError('authFailed');
        loaded.add(key);
        publicKey = path.join(dir, `key-${index}.pub`);
        await writeFile(publicKey, key + '\n', { mode: 0o600 });
        publicKeys.set(credential.privateKey, publicKey);
      }
      const knownHosts = path.join(dir, `hosts-${index}`);
      if (/^\s*@/mu.test(credential.knownHosts))
        throw new GitSshError('hostKeyMismatch');
      await writeFile(knownHosts, credential.knownHosts.trimEnd() + '\n', {
        mode: 0o600,
      });
      identities.push({ ...targets[index], publicKey, knownHosts });
    }
    const config = path.join(dir, 'config.json');
    await writeFile(
      config,
      JSON.stringify({ ssh, socket, identities } satisfies SshConfig),
      { mode: 0o600 },
    );
    const extension = path.extname(import.meta.filename);
    const entry = path.join(import.meta.dirname, `ssh-command${extension}`);
    const command = (mode: string) =>
      [process.execPath, entry, mode, config].map(quote).join(' ');
    const sshCommand = command('ssh');
    const indexes = new Map(credentials.map(({ url }, index) => [url, index]));
    return {
      get pid() {
        return stopped ? undefined : child.pid;
      },
      command: sshCommand,
      pushCommand: command('push'),
      env: (url): Record<string, string> =>
        indexes.has(url)
          ? {
              GIT_SSH_COMMAND: sshCommand,
              GIT_SSH_VARIANT: 'ssh',
              GIT_CONFIG_GLOBAL: '/dev/null',
              GIT_CONFIG_NOSYSTEM: '1',
              GIT_ALLOW_PROTOCOL: 'ssh',
              LC_ALL: 'C',
            }
          : {},
      pushFailure: async (url) => {
        const index = indexes.get(url);
        if (index === undefined) return undefined;
        const value = await readFile(
          path.join(dir, `failure-${index}`),
          'utf8',
        ).catch(() => undefined);
        return value !== undefined && Object.hasOwn(SSH_FAILURE_MESSAGES, value)
          ? (value as GitSshFailure)
          : undefined;
      },
      close,
    };
  } catch (error) {
    await close();
    throw error;
  }
}
