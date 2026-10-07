// What a job's command runs with. Nothing of the runner's own crosses: not its variables (`NOCOBASE_RUNNER_*`, the
// service's environment), not its keys, not its home directory, not the host's git credentials.
//
// - Variables: `PATH`, `LANG`, `LC_ALL` and `TZ` from the runner's environment, then the job's own (`spec.env`), then
//   what the runner owns: `HOME` and `TMPDIR` inside the job's directory, and git told to read no system or global
//   configuration (`GIT_CONFIG_NOSYSTEM`, `GIT_CONFIG_GLOBAL=/dev/null`), so a credential helper configured on the
//   host is not used, and to never prompt.
// - Home: an empty directory with links to the package managers' caches only (npm's, pnpm's store, Yarn's, Corepack's),
//   so installs reuse what earlier builds downloaded. No `.ssh`, `.gitconfig`, `.npmrc`, `.gnupg`, `.config` or tool
//   logins.
//
// The command runs as the runner's own system user, so a determined command could still read files that user can
// read by their absolute path; the boundary here is what it is handed, not what the operating system enforces.
import { existsSync, lstatSync } from 'node:fs';
import { mkdir, symlink } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import type { JobEnvVar } from '../../protocol/index.ts';

/** Taken from the runner's environment. */
export const JOB_ENV_PASSED: readonly string[] = [
  'PATH',
  'LANG',
  'LC_ALL',
  'TZ',
];

/** Package-manager caches linked into a job's home. */
export const JOB_HOME_LINKS: readonly string[] = [
  '.npm/_cacache',
  '.cache/pnpm',
  '.cache/node',
  '.cache/yarn',
  '.local/share/pnpm',
  'Library/pnpm',
  'Library/Caches/pnpm',
  'Library/Caches/Yarn',
];

/** Names a job may not set: the runner's own and what it sets itself. */
export function forbiddenJobVariable(name: string): boolean {
  return (
    /^(NOCOBASE_RUNNER_|AGENT_RUN_|GIT_CONFIG|GIT_DIR$|GIT_WORK_TREE$|GIT_EXEC_PATH$|GIT_ASKPASS$|SSH_AUTH_SOCK$)/iu.test(
      name,
    ) ||
    ['HOME', 'TMPDIR'].includes(name) ||
    !/^[A-Za-z_][A-Za-z0-9_]*$/u.test(name)
  );
}

export function buildJobEnv(options: {
  /** The runner's environment. */
  source: NodeJS.ProcessEnv;
  env: readonly JobEnvVar[];
  home: string;
  tmpDir: string;
}): Record<string, string> {
  const env: Record<string, string> = {};
  for (const name of JOB_ENV_PASSED) {
    const value = options.source[name];
    if (value !== undefined) env[name] = value;
  }
  for (const variable of options.env)
    if (!forbiddenJobVariable(variable.name))
      env[variable.name] = variable.value;
  env.HOME = options.home;
  env.TMPDIR = options.tmpDir;
  env.GIT_CONFIG_NOSYSTEM = '1';
  env.GIT_CONFIG_GLOBAL = '/dev/null';
  env.GIT_TERMINAL_PROMPT = '0';
  return env;
}

/** Creates the job's home with links to the caches that exist in `realHome`. */
export async function prepareJobHome(
  home: string,
  realHome: string = os.homedir(),
): Promise<string> {
  await mkdir(home, { recursive: true, mode: 0o700 });
  for (const entry of JOB_HOME_LINKS) {
    const source = path.join(realHome, entry);
    const target = path.join(home, entry);
    if (!existsSync(source)) continue;
    try {
      lstatSync(target);
      continue;
    } catch {
      // Not there yet.
    }
    await mkdir(path.dirname(target), { recursive: true, mode: 0o700 });
    await symlink(source, target);
  }
  return home;
}
