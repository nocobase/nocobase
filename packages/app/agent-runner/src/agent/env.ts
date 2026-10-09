// The environment an agent's tool process gets: a short whitelist from the runner's own environment (the basics, and
// the proxy and CA variables a machine behind a proxy needs), the names the runner's owner always passes
// (`--pass-env`), the variables the run carries (`workspace.env`, secrets among them), and the local values of the names
// it asks the runner for (`workspace.passthrough`). Nothing else crosses: no `NOCOBASE_RUNNER_*` variable, and no
// credential: the run's token reaches the application's CLI only through its credentials file.
//
// A name the run asks the runner for is provided only by the runner's local variables (`nocobase-runner env set`) or a
// name its owner passes (`--pass-env`); the run fails before the agent starts when one is missing (`missingVariables`).
// Tool detection runs in the same environment, without the run's own (`detectionEnv`), so a tool that reads its login
// or its key from a variable is detected as it will run.
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

import {
  MAX_RUNNER_VARIABLES,
  RUN_CREDENTIALS_ENV,
  type RunWorkspace,
} from '../protocol/index.ts';
import { TRAILERS_ENV } from '../core/push-guard.ts';

/** The proxy variables, in both cases: tools read either. Their values may hold a user and password. */
export const PROXY_ENV: readonly string[] = [
  'HTTP_PROXY',
  'HTTPS_PROXY',
  'ALL_PROXY',
  'NO_PROXY',
  'http_proxy',
  'https_proxy',
  'all_proxy',
  'no_proxy',
];

/** The certificate authorities a machine behind an inspecting proxy adds. */
export const CA_ENV: readonly string[] = [
  'SSL_CERT_FILE',
  'NODE_EXTRA_CA_CERTS',
];

// USER: Claude Code's macOS keychain login lookup fails without it.
export const ENV_WHITELIST: readonly string[] = [
  'PATH',
  'HOME',
  'USER',
  'LANG',
  'TERM',
  'TMPDIR',
  ...PROXY_ENV,
  ...CA_ENV,
];

/** A variable name the runner's owner may set or pass: a shell name. */
export const ENV_NAME_PATTERN: RegExp = /^[A-Za-z_][A-Za-z0-9_]{0,127}$/u;

export interface BuildEnvOptions {
  /** The runner's environment. */
  source: NodeJS.ProcessEnv;
  /** Names always taken from `source` (`--pass-env`); a `passthrough` name is provided by these or `localVariables`. */
  passEnv?: readonly string[];
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

/** Names a run may not set and the runner's owner may not pass: the runner's own, and what it sets itself. */
export function forbidden(name: string): boolean {
  return (
    /^(NOCOBASE_RUNNER_|AGENT_RUN_|GIT_CONFIG|GIT_DIR$|GIT_WORK_TREE$|GIT_EXEC_PATH$)/i.test(
      name,
    ) ||
    ['PATH', 'HOME', 'TMPDIR'].includes(name) ||
    !/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)
  );
}

/**
 * The variables this runner provides to a run that asks for them by name (`workspace.passthrough`): the names its owner
 * passes (`--pass-env`) as the runner's environment has them, then its local variables (`env set`), which win.
 */
export function providedVariables(
  source: NodeJS.ProcessEnv,
  passEnv: readonly string[] = [],
  localVariables: Record<string, string> = {},
): Record<string, string> {
  const provided: Record<string, string> = {};
  for (const name of passEnv) {
    const value = source[name];
    if (value !== undefined && !forbidden(name)) provided[name] = value;
  }
  for (const [name, value] of Object.entries(localVariables))
    if (!forbidden(name)) provided[name] = value;
  return provided;
}

/** The names of the variables this runner provides (`providedVariables`), sorted, as it reports them. */
export function providedNames(
  source: NodeJS.ProcessEnv,
  passEnv: readonly string[] = [],
  localVariables: Record<string, string> = {},
): string[] {
  return Object.keys(providedVariables(source, passEnv, localVariables))
    .sort()
    .slice(0, MAX_RUNNER_VARIABLES);
}

/** The names of `passthrough` this runner does not provide, in order. */
export function missingVariables(
  passthrough: readonly string[],
  provided: Record<string, string>,
): string[] {
  return passthrough.filter(
    (name) => !forbidden(name) && provided[name] === undefined,
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
  const provided = providedVariables(
    options.source,
    options.passEnv,
    options.localVariables,
  );
  for (const name of options.passEnv ?? []) {
    const value = options.source[name];
    if (value !== undefined && !forbidden(name)) env[name] = value;
  }
  for (const name of options.workspace?.passthrough ?? []) {
    if (forbidden(name)) continue;
    const value = provided[name];
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
 * What a coding tool's detection runs with: what every run gets from the runner (the whitelist and `--pass-env`), with
 * the runner's own HOME, and none of a run's variables.
 */
export function detectionEnv(
  source: NodeJS.ProcessEnv,
  passEnv: readonly string[] = [],
): Record<string, string> {
  return buildAgentEnv({ source, passEnv });
}

/**
 * The values from the runner's environment a run's output must not show: the proxy variables' (a proxy URL may hold a
 * user and password; `NO_PROXY` holds none) and those of the names its owner passes.
 */
export function environmentSecrets(
  source: NodeJS.ProcessEnv,
  passEnv: readonly string[] = [],
): string[] {
  const names = [
    ...PROXY_ENV.filter((name) => name.toUpperCase() !== 'NO_PROXY'),
    ...passEnv,
  ];
  return names.flatMap((name) => {
    const value = source[name];
    return value === undefined || value === '' ? [] : [value];
  });
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
