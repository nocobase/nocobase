// The environment an agent's tool process gets: a short whitelist from the runner's own environment, the variables the
// run carries (`workspace.env`, secrets among them), and the local values of the names it asks the runner for
// (`workspace.passthrough`). Nothing else crosses: no `NOCOBASE_RUNNER_*` variable, and no credential: the run's token
// reaches the application's CLI only through its credentials file.
//
// The runner then sets what it owns: HOME (the agent's home, see agent-home.ts), TMPDIR (inside the working
// directory), the application CLI's directory first on PATH, and `core.hooksPath` through `GIT_CONFIG_*`, so every
// git the agent runs uses the runner's hooks (push-guard.ts) whatever the repository configures. With the run's git
// (`workspace.git`): the commit author and committer (`GIT_AUTHOR_*`, `GIT_COMMITTER_*`), the trailers the
// `prepare-commit-msg` hook adds, and for each repository with a short-lived credential a credential helper scoped to
// its URL that answers with it from the environment. The credential lives only in the agent's environment, never on
// disk; the push guard still decides what may be pushed.
import { chmod, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { RUN_CREDENTIALS_ENV, type RunWorkspace } from '../protocol/index.ts';
import { TRAILERS_ENV } from '../core/push-guard.ts';

// USER: Claude Code's macOS keychain login lookup fails without it.
export const ENV_WHITELIST: readonly string[] = [
  'PATH',
  'HOME',
  'USER',
  'LANG',
  'TERM',
  'TMPDIR',
];

export interface BuildEnvOptions {
  /** The runner's environment. */
  source: NodeJS.ProcessEnv;
  /** Values from the runner's local configuration, which win over `source` for `passthrough` names. */
  localVariables?: Record<string, string>;
  workspace?: Pick<RunWorkspace, 'env' | 'passthrough' | 'git'>;
  /** Put first on PATH: the directory holding the application's CLI (see `writeCliShim`). */
  binDir?: string;
  /** The agent's HOME; the runner's own when absent. */
  home?: string;
  tmpDir?: string;
  /** The push guard's hooks directory. */
  hooksDir?: string;
}

/** Names a run may not set: the runner's own, and what it sets itself. */
function forbidden(name: string): boolean {
  return (
    /^(NOCOBASE_RUNNER_|AGENT_RUN_|GIT_CONFIG|GIT_DIR$|GIT_WORK_TREE$|GIT_EXEC_PATH$)/i.test(
      name,
    ) ||
    ['PATH', 'HOME', 'TMPDIR'].includes(name) ||
    !/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)
  );
}

export function buildAgentEnv(
  options: BuildEnvOptions,
): Record<string, string> {
  const env: Record<string, string> = {};
  for (const name of ENV_WHITELIST) {
    const value = options.source[name];
    if (value !== undefined) env[name] = value;
  }
  for (const name of options.workspace?.passthrough ?? []) {
    if (forbidden(name)) continue;
    const value = options.localVariables?.[name] ?? options.source[name];
    if (value !== undefined) env[name] = value;
  }
  for (const variable of options.workspace?.env ?? []) {
    if (forbidden(variable.name)) continue;
    env[variable.name] = variable.value;
  }
  if (options.binDir !== undefined)
    env.PATH =
      env.PATH === undefined || env.PATH === ''
        ? options.binDir
        : `${options.binDir}${path.delimiter}${env.PATH}`;
  if (options.home !== undefined) env.HOME = options.home;
  if (options.tmpDir !== undefined) env.TMPDIR = options.tmpDir;
  const config: [string, string][] = [];
  if (options.hooksDir !== undefined)
    config.push(['core.hooksPath', options.hooksDir]);
  const git = options.workspace?.git;
  if (git?.author) {
    env.GIT_AUTHOR_NAME = git.author.name;
    env.GIT_AUTHOR_EMAIL = git.author.email;
    env.GIT_COMMITTER_NAME = git.author.name;
    env.GIT_COMMITTER_EMAIL = git.author.email;
  }
  if (git?.trailers && git.trailers.length > 0)
    env[TRAILERS_ENV] = git.trailers
      .map((trailer) => trailer.replace(/[\r\n]+/gu, ' '))
      .join('\n');
  for (const [index, credential] of (git?.credentials ?? []).entries()) {
    const user = `NOCOBASE_RUNNER_GIT_USERNAME_${index}`;
    const password = `NOCOBASE_RUNNER_GIT_PASSWORD_${index}`;
    env[user] = credential.username;
    env[password] = credential.password;
    // An empty helper first clears the helpers configured elsewhere for this URL, then the run's answers.
    config.push([`credential.${credential.url}.helper`, '']);
    config.push([
      `credential.${credential.url}.helper`,
      `!f() { test "$1" = get || exit 0; echo "username=$${user}"; echo "password=$${password}"; }; f`,
    ]);
  }
  if (config.length > 0) {
    env.GIT_CONFIG_COUNT = String(config.length);
    for (const [index, [key, value]] of config.entries()) {
      env[`GIT_CONFIG_KEY_${index}`] = key;
      env[`GIT_CONFIG_VALUE_${index}`] = value;
    }
  }
  return env;
}

/**
 * Writes `<binDir>/<name>`, a script that starts the application's CLI at `target`: a JavaScript entry runs with this
 * runner's Node, anything else is executed directly. It holds no secret: it tells the CLI, and only the CLI, where the
 * run's credentials file is (`RUN_CREDENTIALS_ENV`), since the agent may work in a directory the file is not above.
 */
export async function writeCliShim(
  binDir: string,
  name: string,
  target: string,
  credentialsFile?: string,
): Promise<string> {
  const quote = (value: string) => `'${value.replace(/'/g, `'\\''`)}'`;
  const command = /\.[cm]?js$/u.test(target)
    ? `${quote(process.execPath)} ${quote(target)}`
    : quote(target);
  const exported =
    credentialsFile === undefined
      ? ''
      : `${RUN_CREDENTIALS_ENV}=${quote(credentialsFile)}\nexport ${RUN_CREDENTIALS_ENV}\n`;
  const script = `#!/bin/sh\n${exported}exec ${command} "$@"\n`;
  await mkdir(binDir, { recursive: true, mode: 0o700 });
  const file = path.join(binDir, name);
  await writeFile(file, script, { mode: 0o700 });
  await chmod(file, 0o700);
  return file;
}
