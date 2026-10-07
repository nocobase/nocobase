import { execFileSync, spawn, type ChildProcess } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const PACKAGE_ROOT = path.resolve(import.meta.dirname, '..');
export const BIN = path.join(PACKAGE_ROOT, 'bin', 'run.js');

/** Fast intervals for driving the daemon in tests. */
export const FAST_TIMINGS = {
  heartbeatIntervalMs: 300,
  pollTimeoutMs: 1_000,
  pollFallbackMs: 500,
  rotationIntervalMs: 200,
  leaseIntervalMs: 400,
  statusIntervalMs: 300,
  eventFlushMs: 100,
  reportTimeoutMs: 20_000,
  cancelGraceMs: 3_000,
  killGraceMs: 1_000,
};

export function tempDir(prefix = 'nocobase-runner-'): string {
  // realpath: macOS's /var is a link to /private/var, and the policy resolves links.
  return execFileSync(
    'realpath',
    [mkdtempSync(path.join(os.tmpdir(), prefix))],
    { encoding: 'utf8' },
  ).trim();
}

export function removeDir(dir: string): void {
  rmSync(dir, { recursive: true, force: true });
}

/** The work root a runner with `NOCOBASE_RUNNER_HOME=home` uses when nothing else is set. */
export function workRootOf(home: string): string {
  return `${home}-work`;
}

/**
 * A stand-in for an application CLI: reads the file `AGENT_RUN_CREDENTIALS` names, or walks up from its working
 * directory to `.app/run.json`, and prints what it found,
 * with the HOME and TMPDIR it runs with, as JSON.
 */
export function writeFakeCli(dir: string, name = 'appcli'): string {
  const file = path.join(dir, `${name}.mjs`);
  writeFileSync(
    file,
    `import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
let current = process.cwd();
let credential = null;
const named = process.env.AGENT_RUN_CREDENTIALS;
if (named && existsSync(named)) credential = JSON.parse(readFileSync(named, 'utf8'));
for (;credential === null;) {
  const candidate = path.join(current, '.app', 'run.json');
  if (existsSync(candidate)) { credential = JSON.parse(readFileSync(candidate, 'utf8')); break; }
  const parent = path.dirname(current);
  if (parent === current) break;
  current = parent;
}
process.stdout.write(JSON.stringify({ args: process.argv.slice(2), credential, home: process.env.HOME, tmp: process.env.TMPDIR }) + '\\n');
`,
  );
  return file;
}

export function cliEnv(
  home: string,
  extra: Record<string, string> = {},
): NodeJS.ProcessEnv {
  return {
    ...process.env,
    NOCOBASE_RUNNER_HOME: home,
    NOCOBASE_RUNNER_ADAPTER: 'echo',
    NOCOBASE_RUNNER_TIMINGS: JSON.stringify(FAST_TIMINGS),
    ...extra,
  };
}

export interface CliResult {
  code: number | null;
  stdout: string;
  stderr: string;
}

export function cli(
  args: string[],
  env: NodeJS.ProcessEnv,
  options: { cwd?: string; input?: string } = {},
): Promise<CliResult> {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [BIN, ...args], {
      env,
      cwd: options.cwd ?? PACKAGE_ROOT,
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk: Buffer) => (stdout += chunk.toString()));
    child.stderr.on('data', (chunk: Buffer) => (stderr += chunk.toString()));
    child.stdin.end(options.input ?? '');
    child.on('close', (code) => resolve({ code, stdout, stderr }));
  });
}

export interface Daemon {
  child: ChildProcess;
  output(): string;
  exited: Promise<number | null>;
}

export function startDaemon(
  env: NodeJS.ProcessEnv,
  args: string[] = [],
): Daemon {
  const child = spawn(
    process.execPath,
    [BIN, 'start', '--foreground', ...args],
    {
      env,
      cwd: PACKAGE_ROOT,
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
  let output = '';
  child.stdout?.on('data', (chunk: Buffer) => (output += chunk.toString()));
  child.stderr?.on('data', (chunk: Buffer) => (output += chunk.toString()));
  const exited = new Promise<number | null>((resolve) =>
    child.on('exit', (code) => resolve(code)),
  );
  return { child, output: () => output, exited };
}

export async function stopDaemon(daemon: Daemon): Promise<void> {
  if (daemon.child.exitCode !== null || daemon.child.signalCode !== null)
    return;
  daemon.child.kill('SIGTERM');
  const timer = setTimeout(() => daemon.child.kill('SIGKILL'), 15_000);
  await daemon.exited;
  clearTimeout(timer);
}

export function groupAlive(pgid: number): boolean {
  try {
    process.kill(-pgid, 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === 'EPERM';
  }
}

export function git(args: string[], cwd?: string): string {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    env: {
      ...process.env,
      GIT_AUTHOR_NAME: 'Test',
      GIT_AUTHOR_EMAIL: 'test@example.com',
      GIT_COMMITTER_NAME: 'Test',
      GIT_COMMITTER_EMAIL: 'test@example.com',
    },
  }).trim();
}

/** A bare "remote" with one commit on main. Returns its file URL. */
export function makeRemote(root: string, name = 'origin-repo'): string {
  const bare = path.join(root, `${name}.git`);
  const seed = path.join(root, `${name}-seed`);
  git(['init', '--quiet', '--bare', '--initial-branch=main', bare]);
  git(['init', '--quiet', '--initial-branch=main', seed]);
  writeFileSync(path.join(seed, 'README.md'), '# seed\n');
  git(['add', '.'], seed);
  git(['-c', 'commit.gpgsign=false', 'commit', '--quiet', '-m', 'seed'], seed);
  git(['remote', 'add', 'origin', bare], seed);
  git(['push', '--quiet', 'origin', 'main'], seed);
  return `file://${bare}`;
}

export async function registerRunner(
  serverUrl: string,
  env: NodeJS.ProcessEnv,
  extra: string[] = [],
): Promise<void> {
  const result = await cli(
    [
      'register',
      '--server',
      serverUrl,
      '--token',
      'reg-token',
      '--name',
      'test-runner',
      ...extra,
    ],
    env,
  );
  if (result.code !== 0)
    throw new Error(`register failed: ${result.stderr}${result.stdout}`);
}
