// Entry point for Git's SSH command and for recording agent pushes. This module can run with plain Node.
import { spawn } from 'node:child_process';
import {
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';

import type { GitSshFailure } from '../protocol/index.ts';

export interface SshTarget {
  readonly destination: string;
  readonly port: string;
  readonly repoPath: string;
}

export interface SshIdentity extends SshTarget {
  readonly knownHosts: string;
  readonly publicKey: string;
}

export interface SshConfig {
  readonly ssh: string;
  readonly socket: string;
  readonly identities: readonly SshIdentity[];
}

/** How Git quotes a remote path before passing the command to SSH. */
function gitQuote(value: string): string {
  return "'" + value.replace(/['!]/gu, (char) => "'\\" + char + "'") + "'";
}

function canonicalDestination(value: string): string {
  const at = value.lastIndexOf('@');
  const host = value
    .slice(at + 1)
    .replace(/^\[|\]$/gu, '')
    .toLowerCase();
  return value.slice(0, at + 1) + host;
}

/** The wire failure codes and their user-facing English fallback. */
export const SSH_FAILURE_MESSAGES: Readonly<Record<GitSshFailure, string>> = {
  authFailed:
    'SSH authentication failed. Check the deployment key and repository access.',
  hostKeyMismatch:
    'SSH host key verification failed. Recheck the Git server fingerprint.',
  pushRejected:
    'SSH push was rejected. Check write access for the deployment key and branch permissions.',
  unreachable:
    'The SSH connection failed. Check that the Git server is reachable.',
};

export function classifySshFailure(
  stderr: string,
  push: boolean,
): GitSshFailure | undefined {
  if (
    /host key verification failed|remote host identification has changed|no matching host key type|no .* host key is known/iu.test(
      stderr,
    )
  )
    return 'hostKeyMismatch';
  if (
    push &&
    /\[remote rejected\]|\[rejected\]|pre-push hook declined|write access|read.only|not allowed to push|permission to .* denied|denied to .*deploy key|non-fast-forward/iu.test(
      stderr,
    )
  )
    return 'pushRejected';
  if (
    /permission denied \(publickey|authentication failed|repository (?:not found|does not exist)|project .* (?:not found|not have permission)|access denied|does not appear to be a git repository|no access to this repository|not authorized|no deployment key in the run/iu.test(
      stderr,
    )
  )
    return 'authFailed';
  if (
    /could not resolve hostname|connection refused|connection (?:reset|closed|timed out)|operation timed out|no route to host|network is unreachable|broken pipe|kex_exchange_identification/iu.test(
      stderr,
    )
  )
    return 'unreachable';
  if (push && /failed to push some refs/iu.test(stderr)) return 'pushRejected';
  return undefined;
}

const TRACE_DIR = 'NOCOBASE_RUNNER_SSH_PUSH_TRACE';

async function run(
  command: string,
  args: readonly string[],
  env: NodeJS.ProcessEnv,
  capture?: (text: string) => void,
): Promise<void> {
  const child = spawn(command, args, {
    env,
    stdio: ['inherit', 'inherit', capture ? 'pipe' : 'inherit'],
  });
  child.stderr?.on('data', (chunk: Buffer) => {
    process.stderr.write(chunk);
    capture?.(chunk.toString('utf8'));
  });
  const forward = (): void => {
    child.kill('SIGTERM');
  };
  process.once('SIGTERM', forward);
  process.exitCode = await new Promise<number>((resolve) => {
    child.once('error', () => resolve(1));
    child.once('close', (code) => resolve(code ?? 1));
  });
  process.removeListener('SIGTERM', forward);
}

async function ssh(config: SshConfig, args: readonly string[]): Promise<void> {
  const destination = args.at(-2);
  const command = args.at(-1);
  let port = '22';
  for (let i = 0; i < args.length - 2; i += 2) {
    if (args[i] === '-p' && /^\d+$/u.test(args[i + 1] ?? '')) {
      port = String(Number(args[i + 1]));
    } else if (args[i] !== '-o' || args[i + 1] !== 'SendEnv=GIT_PROTOCOL') {
      throw new Error('Unexpected Git SSH options.');
    }
  }
  const index = config.identities.findIndex(
    (identity) =>
      destination !== undefined &&
      identity.destination === canonicalDestination(destination) &&
      identity.port === port &&
      ['git-upload-pack', 'git-receive-pack', 'git-upload-archive'].some(
        (verb) => command === `${verb} ${gitQuote(identity.repoPath)}`,
      ),
  );
  const identity = config.identities[index];
  if (
    identity === undefined ||
    destination === undefined ||
    command === undefined
  )
    throw new Error('This SSH repository has no deployment key in the run.');
  const trace = process.env[TRACE_DIR];
  if (trace)
    writeFileSync(path.join(trace, String(index)), '', { mode: 0o600 });
  const file = (value: string) =>
    '"' + value.replaceAll('%', '%%').replace(/["\\]/gu, '\\$&') + '"';
  const env = { ...process.env, LC_ALL: 'C' };
  await run(
    config.ssh,
    [
      '-F',
      'none',
      '-o',
      'IdentitiesOnly=yes',
      '-o',
      `IdentityAgent=${file(config.socket)}`,
      '-o',
      `UserKnownHostsFile=${file(identity.knownHosts)}`,
      '-o',
      'GlobalKnownHostsFile=none',
      '-o',
      'StrictHostKeyChecking=yes',
      '-o',
      'BatchMode=yes',
      '-o',
      'UpdateHostKeys=no',
      '-o',
      'ConnectTimeout=15',
      '-o',
      'SendEnv=GIT_PROTOCOL',
      '-i',
      identity.publicKey,
      '-p',
      port,
      '--',
      destination,
      command,
    ],
    env,
  );
}

/** Captures the result of an SSH push while keeping Git's output and exit status. */
async function push(
  config: SshConfig,
  git: string,
  args: readonly string[],
): Promise<void> {
  const root = path.dirname(config.socket);
  const trace = mkdtempSync(path.join(root, 'push-'));
  let stderr = '';
  try {
    await run(git, args, { ...process.env, [TRACE_DIR]: trace }, (chunk) => {
      stderr = (stderr + chunk).slice(-32_768);
    });
    const failure =
      process.exitCode === 0 ? undefined : classifySshFailure(stderr, true);
    for (const index of readdirSync(trace)) {
      if (!/^\d+$/u.test(index)) continue;
      const result = path.join(root, `failure-${index}`);
      if (failure !== undefined) {
        const identity = config.identities[Number(index)];
        writeFileSync(result, failure, { mode: 0o600 });
        process.stderr.write(
          `${SSH_FAILURE_MESSAGES[failure]}${identity ? ` (${identity.destination}:${identity.port})` : ''}\n`,
        );
      } else if (process.exitCode === 0) {
        rmSync(result, { force: true });
      }
    }
  } finally {
    rmSync(trace, { force: true, recursive: true });
  }
}

if (process.argv[1] === import.meta.filename) {
  const [, , mode, configFile, ...args] = process.argv;
  try {
    if (!configFile) throw new Error('Missing Git SSH configuration.');
    const config = JSON.parse(readFileSync(configFile, 'utf8')) as SshConfig;
    if (mode === 'ssh') await ssh(config, args);
    else if (mode === 'push' && args[0])
      await push(config, args[0], args.slice(1));
    else throw new Error('Unknown Git SSH operation.');
  } catch (error) {
    process.stderr.write(
      `nocobase-runner: ${error instanceof Error ? error.message : 'Git SSH failed.'}\n`,
    );
    process.exitCode = 1;
  }
}
