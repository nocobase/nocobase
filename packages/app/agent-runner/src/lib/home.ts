// Where the runner keeps its state, in two trees that never overlap:
//
// The runner's own directory (0700), which no agent works in: `~/.nocobase-runner`. `NOCOBASE_RUNNER_HOME` moves it;
// tests use that.
//
//   ~/.nocobase-runner/settings.json               this machine's runner settings: name, slots, how agents get a home
//   ~/.nocobase-runner/policy.json                 the owner's local policy: what work the runner takes (written by
//                                                  its owner only; see core/local-policy.ts)
//   ~/.nocobase-runner/apps/<app>.json             one registration per application: server, runner id
//   ~/.nocobase-runner/credentials/<app>.json      that registration's runner key (0600, in a 0700 directory)
//   ~/.nocobase-runner/daemon.pid                  the running daemon
//   ~/.nocobase-runner/runs/<runId>.json           one record per supervised run, for orphan recovery
//   ~/.nocobase-runner/runs/<runId>.events.ndjson  the run's event spool
//   ~/.nocobase-runner/logs/                       daemon and per-run logs
//   ~/.nocobase-runner/repos/<sha1>.git            bare repository caches
//   ~/.nocobase-runner/cli/<name>/<version>/       application CLIs installed for runs
//   ~/.nocobase-runner/skills/<app>/<slug>/<hash>/ skill bundles fetched for runs, by content hash
//   ~/.nocobase-runner/locks/<sha1>.lock           one lock per directory used in place (one run at a time in it)
//   ~/.nocobase-runner/hooks/pre-push              the push guard every agent's git runs
//
// The work root, where agents work: `~/.nocobase-runner-work`, or `<NOCOBASE_RUNNER_HOME>-work`.
// `NOCOBASE_RUNNER_WORK_ROOT` moves it.
//
//   ~/.nocobase-runner-work/<app>/<subjectKey>/   one long-lived working directory per subject
//     .nocobase-runner/                           the runner's per-workspace files: the agent's home, tmp, bin, the
//                                                 run's skills (`plugin/skills/`) and the workspace record
import {
  chmod,
  mkdir,
  readFile,
  rename,
  rm,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

/**
 * Where the person's own copy of a run's CLI keeps its state, such as `~/.acme` (with their `acme login`), which is
 * kept from the agent: the CLI's default state directory, `~/.<name>`, and the home directory's counterpart of the run's
 * credentials directory (`~/.acme` for `.acme/run.json`).
 */
export function cliStateDirs(
  cli: {
    readonly name: string;
    readonly credential: { readonly file: string };
  },
  home: string = os.homedir(),
): string[] {
  const dirs = [path.join(home, `.${cli.name}`)];
  const [top] = cli.credential.file.split(/[\\/]/u);
  if (cli.credential.file.includes('/') && top !== undefined && top !== '')
    dirs.push(path.join(home, top));
  return [...new Set(dirs)];
}

export function runnerHome(env: NodeJS.ProcessEnv = process.env): string {
  const configured = env.NOCOBASE_RUNNER_HOME;
  return configured !== undefined && configured !== ''
    ? path.resolve(configured)
    : path.join(os.homedir(), '.nocobase-runner');
}

export function workRoot(env: NodeJS.ProcessEnv = process.env): string {
  const configured = env.NOCOBASE_RUNNER_WORK_ROOT;
  if (configured !== undefined && configured !== '')
    return path.resolve(configured);
  const home = env.NOCOBASE_RUNNER_HOME;
  return home !== undefined && home !== ''
    ? `${path.resolve(home)}-work`
    : path.join(os.homedir(), '.nocobase-runner-work');
}

export interface RunnerPaths {
  home: string;
  settings: string;
  policy: string;
  appsDir: string;
  credentialsDir: string;
  daemonPid: string;
  runsDir: string;
  logsDir: string;
  daemonLog: string;
  reposDir: string;
  cliDir: string;
  skillsDir: string;
  mountsDir: string;
  locksDir: string;
  hooksDir: string;
  workRoot: string;
}

export function runnerPaths(
  home: string = runnerHome(),
  work: string = workRoot(),
): RunnerPaths {
  const logsDir = path.join(home, 'logs');
  return {
    home,
    settings: path.join(home, 'settings.json'),
    policy: path.join(home, 'policy.json'),
    appsDir: path.join(home, 'apps'),
    credentialsDir: path.join(home, 'credentials'),
    daemonPid: path.join(home, 'daemon.pid'),
    runsDir: path.join(home, 'runs'),
    logsDir,
    daemonLog: path.join(logsDir, 'runner.log'),
    reposDir: path.join(home, 'repos'),
    cliDir: path.join(home, 'cli'),
    skillsDir: path.join(home, 'skills'),
    mountsDir: path.join(home, 'mounts'),
    locksDir: path.join(home, 'locks'),
    hooksDir: path.join(home, 'hooks'),
    workRoot: work,
  };
}

/** The runner's directory, created private. */
export async function ensureHome(paths: RunnerPaths): Promise<void> {
  await mkdir(paths.home, { recursive: true, mode: 0o700 });
  await chmod(paths.home, 0o700);
}

export function runLogPath(paths: RunnerPaths, runId: string): string {
  return path.join(paths.logsDir, 'runs', `${safeName(runId)}.log`);
}

/** A string safe to use as one path segment. */
export function safeName(value: string): string {
  const cleaned = value.replace(/[^A-Za-z0-9._-]/g, '_').replace(/^\.+/, '_');
  return cleaned === '' ? '_' : cleaned.slice(0, 120);
}

export async function readJson<T>(file: string): Promise<T | undefined> {
  try {
    return JSON.parse(await readFile(file, 'utf8')) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
    throw error;
  }
}

/** Writes through a temporary file and a rename, so a reader never sees half a file. */
export async function writeJsonAtomic(
  file: string,
  value: unknown,
  mode = 0o600,
): Promise<void> {
  await mkdir(path.dirname(file), { recursive: true, mode: 0o700 });
  const temporary = `${file}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, { mode });
  // The mode on writeFile is masked by umask; chmod sets it exactly.
  await chmod(temporary, mode);
  await rename(temporary, file);
}

export async function removeFile(file: string): Promise<void> {
  await rm(file, { force: true });
}
