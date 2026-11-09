// The launcher the agent's `pnpm`, `npm` and `npx` go through when a call reaches a registry (runner-tools.ts writes
// the wrappers): `node npm-launcher.ts <pnpm|npm> <real command…> -- <arguments…>`. It runs the real command once, or
// twice when NocoBase's private registry is needed, with a user configuration of the run's own:
//
// 1. The machine's own configuration stays in effect (its mirror, `cafile`, proxy), except every line that points a
//    scope or the whole registry at the private registry, or carries its credentials (`maskPrivate`). The user npmrc
//    (`NPM_CONFIG_USERCONFIG`, or `~/.npmrc`) is copied without them into a file in the run's npm directory
//    (`NPM_DIR_ENV`), which npm reads through `NPM_CONFIG_USERCONFIG` and pnpm through `pnpm_config_npmrc_auth_file`.
//    npm's global npmrc is replaced the same way (`NPM_CONFIG_GLOBALCONFIG`) when it has such lines. pnpm's own global
//    configuration (`auth.ini`, which `pnpm config set --location global` and `pnpm login` write, and pnpm 10's `rc`)
//    is read from its configuration directory, so when one of them has such lines that directory is copied without
//    them and `XDG_CONFIG_HOME` points this pnpm process (and the scripts it runs) at the copy; otherwise nothing of it
//    changes.
// 2. When a `.npmrc` the repository commits (at its root or a workspace package's) points a scope or the whole
//    registry at the private registry, the launcher asks the worker for the token first and adds only its credential
//    line: the project's configuration chooses the registry.
// 3. Otherwise the command runs as it is. When it fails because an `@nocobase/*` package is not on the registry it used
//    (`notFoundPackage`), and the project does not point `@nocobase` elsewhere, the launcher asks for the token, adds
//    `@nocobase:registry=<private>` with the credential and runs the command once more, with that exit code. Later
//    installs of the run use the private registry for `@nocobase` at once.
//
// When the application has no token it says so on stderr, naming where an administrator sets it. The token reaches
// only the run's files, which the launcher removes after the command and the worker removes with the run's npm
// directory; it is never on a command line or in the environment. The repository's own `.npmrc` and lockfile are
// never written.
import { execFileSync, spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  DEFAULT_PRIVATE_REGISTRY,
  NPM_DIR_ENV,
  PRIVATE_REGISTRY_ENV,
  declaration,
  maskPrivate,
  notFoundPackage,
  privateLines,
  privateRefused,
  type Declaration,
  type MissingPackage,
} from './npm-registry.ts';

const SOCKET_ENV = 'NOCOBASE_RUNNER_GIT_CREDENTIAL_SOCKET';
const NONCE_ENV = 'NOCOBASE_RUNNER_GIT_CREDENTIAL_NONCE';
/** Marks that this run's installs use the private registry for `@nocobase` (step 3 happened). */
const FALLBACK_MARKER = 'nocobase-scope';
/** How much of a command's output is kept to read its failure from. */
const TAIL_BYTES = 256 * 1024;

export const SETTINGS_HINT =
  'ask an administrator to set the NocoBase private registry token in Settings › License';

type Env = Record<string, string | undefined>;

const say = (line: string): void => {
  process.stderr.write(`nocobase-runner: ${line}\n`);
};

/** The value of an npm or pnpm variable whatever its case, such as `npm_config_userconfig`. */
function variable(env: Env, name: string): string | undefined {
  const lower = name.toLowerCase();
  for (const [key, value] of Object.entries(env))
    if (key.toLowerCase() === lower && value !== undefined && value !== '')
      return value;
  return undefined;
}

function withoutVariable(env: Env, name: string): void {
  const lower = name.toLowerCase();
  for (const key of Object.keys(env))
    if (key.toLowerCase() === lower) delete env[key];
}

function readText(file: string): string | undefined {
  try {
    return readFileSync(file, 'utf8');
  } catch {
    return undefined;
  }
}

/** The `.npmrc` files committed at the repository's root and in its packages' directories, read from disk. */
export function committedNpmrcs(cwd: string): string[] {
  let top: string;
  let listed: string;
  try {
    top = execFileSync('git', ['rev-parse', '--show-toplevel'], {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    listed = execFileSync(
      'git',
      ['ls-files', '-z', '--', ':(glob)**/.npmrc', ':(glob)**/package.json'],
      {
        cwd: top,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
        maxBuffer: 64 * 1024 * 1024,
      },
    );
  } catch {
    return [];
  }
  const files = listed.split('\0').filter((file) => file !== '');
  const packages = new Set(
    files
      .filter((file) => path.posix.basename(file) === 'package.json')
      .map((file) => path.posix.dirname(file)),
  );
  return files
    .filter((file) => path.posix.basename(file) === '.npmrc')
    .filter((file) => {
      const dir = path.posix.dirname(file);
      return dir === '.' || packages.has(dir);
    })
    .flatMap((file) => {
      const text = readText(path.join(top, file));
      return text === undefined ? [] : [text];
    });
}

/** pnpm's configuration directory, as pnpm finds it. */
export function pnpmConfigDir(env: Env): string {
  if (env.XDG_CONFIG_HOME) return path.join(env.XDG_CONFIG_HOME, 'pnpm');
  if (process.platform === 'darwin')
    return path.join(os.homedir(), 'Library/Preferences/pnpm');
  return path.join(os.homedir(), '.config/pnpm');
}

/** npm's global npmrc, as npm finds it when nothing names it otherwise. */
function npmGlobalConfig(env: Env): string {
  const named = variable(env, 'npm_config_globalconfig');
  if (named !== undefined) return named;
  const prefix =
    variable(env, 'npm_config_prefix') ??
    path.dirname(path.dirname(process.execPath));
  return path.join(prefix, 'etc', 'npmrc');
}

export interface RunConfig {
  readonly env: Env;
  /** What to remove once the command ended. */
  readonly files: readonly string[];
}

export interface ConfigOptions {
  readonly tool: 'pnpm' | 'npm';
  readonly dir: string;
  readonly registry: string;
  readonly token: string | null;
  /** Adds `@nocobase:registry=<private>`. */
  readonly scope: boolean;
  readonly env: Env;
}

/** Writes the run's configuration for one command (step 1, with the private lines asked for) and its environment. */
export function writeRunConfig(options: ConfigOptions): RunConfig {
  const { dir, registry, tool } = options;
  const env: Env = { ...options.env };
  const files: string[] = [];
  const id = `${process.pid}-${randomBytes(4).toString('hex')}`;
  mkdirSync(dir, { recursive: true, mode: 0o700 });

  const userSource =
    variable(env, 'npm_config_userconfig') ?? path.join(os.homedir(), '.npmrc');
  const user = maskPrivate(readText(userSource) ?? '', registry).text;
  const lines = privateLines(registry, options.token, options.scope);
  const userFile = path.join(dir, `npmrc-${id}`);
  writeFileSync(userFile, [user, ...lines, ''].join('\n'), { mode: 0o600 });
  files.push(userFile);
  withoutVariable(env, 'npm_config_userconfig');
  withoutVariable(env, 'pnpm_config_npmrc_auth_file');
  withoutVariable(env, 'pnpm_config_userconfig');
  env.NPM_CONFIG_USERCONFIG = userFile;
  env.pnpm_config_npmrc_auth_file = userFile;

  if (tool === 'npm') {
    const globalSource = npmGlobalConfig(env);
    const global = maskPrivate(readText(globalSource) ?? '', registry);
    if (global.masked > 0) {
      const globalFile = path.join(dir, `globalnpmrc-${id}`);
      writeFileSync(globalFile, `${global.text}\n`, { mode: 0o600 });
      files.push(globalFile);
      withoutVariable(env, 'npm_config_globalconfig');
      env.NPM_CONFIG_GLOBALCONFIG = globalFile;
    }
  } else {
    const source = pnpmConfigDir(env);
    const masked = ['auth.ini', 'rc'].map((name) => ({
      name,
      ...maskPrivate(readText(path.join(source, name)) ?? '', registry),
    }));
    if (masked.some((file) => file.masked > 0)) {
      const home = path.join(dir, `xdg-${id}`);
      const copy = path.join(home, 'pnpm');
      mkdirSync(copy, { recursive: true, mode: 0o700 });
      for (const name of readdirSync(source)) {
        const from = path.join(source, name);
        if (!statSync(from).isFile()) continue;
        const replaced = masked.find((file) => file.name === name);
        writeFileSync(
          path.join(copy, name),
          replaced === undefined ? readFileSync(from) : `${replaced.text}\n`,
          { mode: 0o600 },
        );
      }
      files.push(home);
      env.XDG_CONFIG_HOME = home;
    }
  }
  return { env, files };
}

type TokenAnswer =
  | { readonly ok: true; readonly token: string | null }
  | { readonly ok: false; readonly message: string };

/** Asks the worker for the private registry's token through the run's socket. */
export function askToken(
  env: Env,
  reason: 'declared' | 'notFound',
  missing?: MissingPackage,
): Promise<TokenAnswer> {
  const socket = env[SOCKET_ENV];
  const nonce = env[NONCE_ENV];
  if (!socket || !nonce)
    return Promise.resolve({
      ok: false,
      message: 'this shell is not part of a run',
    });
  return new Promise((resolve) => {
    let answer = '';
    const connection = net.createConnection(socket);
    const timer = setTimeout(() => {
      connection.destroy();
      resolve({ ok: false, message: 'the runner did not answer in time' });
    }, 60_000);
    connection.setEncoding('utf8');
    connection.on('connect', () =>
      connection.write(
        `${JSON.stringify({
          nonce,
          action: 'npmToken',
          reason,
          ...(missing === undefined
            ? {}
            : {
                package: `${missing.name}${missing.spec === undefined ? '' : `@${missing.spec}`}`,
              }),
        })}\n`,
      ),
    );
    connection.on('data', (chunk: string) => {
      answer += chunk;
    });
    connection.on('error', () => {
      clearTimeout(timer);
      resolve({ ok: false, message: 'the runner that held this run is gone' });
    });
    connection.on('close', () => {
      clearTimeout(timer);
      try {
        const parsed = JSON.parse(answer) as {
          ok?: unknown;
          token?: unknown;
          message?: unknown;
        };
        resolve(
          parsed.ok === true
            ? {
                ok: true,
                token: typeof parsed.token === 'string' ? parsed.token : null,
              }
            : {
                ok: false,
                message:
                  typeof parsed.message === 'string'
                    ? parsed.message
                    : 'the runner gave no token',
              },
        );
      } catch {
        resolve({ ok: false, message: 'the runner gave no answer' });
      }
    });
  });
}

interface Outcome {
  readonly code: number;
  readonly tail: string;
}

/** Runs the command with its output passed through, keeping the end of it. */
function runCommand(command: readonly string[], env: Env): Promise<Outcome> {
  return new Promise((resolve) => {
    const child = spawn(command[0], command.slice(1), {
      stdio: ['inherit', 'pipe', 'pipe'],
      env: env,
    });
    let tail = '';
    const keep = (chunk: Buffer) => {
      tail = (tail + chunk.toString('utf8')).slice(-TAIL_BYTES);
    };
    child.stdout.on('data', (chunk: Buffer) => {
      process.stdout.write(chunk);
      keep(chunk);
    });
    child.stderr.on('data', (chunk: Buffer) => {
      process.stderr.write(chunk);
      keep(chunk);
    });
    const forward = (signal: NodeJS.Signals) => () => child.kill(signal);
    const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM', 'SIGHUP'];
    const handlers = signals.map((signal) => {
      const handler = forward(signal);
      process.on(signal, handler);
      return [signal, handler] as const;
    });
    const done = (code: number) => {
      for (const [signal, handler] of handlers) process.off(signal, handler);
      resolve({ code, tail });
    };
    child.on('error', (error) => {
      process.stderr.write(`nocobase-runner: ${error.message}\n`);
      done(127);
    });
    child.on('close', (code, signal) =>
      done(
        code ??
          (signal === null ? 1 : 128 + (os.constants.signals[signal] ?? 0)),
      ),
    );
  });
}

const described = (missing: MissingPackage): string =>
  `${missing.name}${missing.spec === undefined ? '' : `@${missing.spec}`}`;

async function tokenFor(
  env: Env,
  reason: 'declared' | 'notFound',
  missing?: MissingPackage,
): Promise<string | null> {
  const answer = await askToken(env, reason, missing);
  if (!answer.ok) {
    say(
      `could not get the NocoBase private registry token: ${answer.message}.`,
    );
    return null;
  }
  return answer.token;
}

export interface LaunchOptions {
  readonly tool: 'pnpm' | 'npm';
  readonly command: readonly string[];
  readonly args: readonly string[];
  readonly env: Env;
  readonly cwd: string;
}

/** Runs the command as the header says; answers its exit code. */
export async function launch(options: LaunchOptions): Promise<number> {
  const { tool, env } = options;
  const command = [...options.command, ...options.args];
  const dir = env[NPM_DIR_ENV];
  if (!dir) return (await runCommand(command, env)).code;
  const registry = env[PRIVATE_REGISTRY_ENV] || DEFAULT_PRIVATE_REGISTRY;
  const project: Declaration = declaration(
    committedNpmrcs(options.cwd),
    registry,
  );
  const scoped = existsSync(path.join(dir, FALLBACK_MARKER));

  const attempt = async (
    token: string | null,
    scope: boolean,
  ): Promise<Outcome> => {
    const config = writeRunConfig({ tool, dir, registry, token, scope, env });
    try {
      return await runCommand(command, config.env);
    } finally {
      for (const file of config.files)
        rmSync(file, { recursive: true, force: true });
    }
  };
  const refused = (outcome: Outcome, token: string | null): Outcome => {
    if (
      outcome.code !== 0 &&
      token !== null &&
      privateRefused(outcome.tail, registry)
    )
      say(
        'the NocoBase private registry refused the token: ask an administrator to replace the NocoBase private registry token in Settings › License.',
      );
    return outcome;
  };

  if (project.private || scoped) {
    const token = await tokenFor(
      env,
      project.private ? 'declared' : 'notFound',
    );
    if (token === null && project.private)
      say(
        `this repository's .npmrc uses the NocoBase private registry (${registry}), and no token is configured: ${SETTINGS_HINT}.`,
      );
    return refused(await attempt(token, scoped && !project.private), token)
      .code;
  }

  const first = await attempt(null, false);
  if (first.code === 0 || project.nocobaseElsewhere) return first.code;
  const missing = notFoundPackage(first.tail, registry);
  if (missing === null) return first.code;
  const token = await tokenFor(env, 'notFound', missing);
  if (token === null) {
    say(
      `${described(missing)} was not found on the default registry (404) and needs the NocoBase private registry (${registry}): ${SETTINGS_HINT}.`,
    );
    return first.code;
  }
  writeFileSync(path.join(dir, FALLBACK_MARKER), '', { mode: 0o600 });
  say(
    `${described(missing)} was not found on the default registry; retrying once with the NocoBase private registry (${registry}).`,
  );
  return refused(await attempt(token, true), token).code;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [tool, ...rest] = process.argv.slice(2);
  const split = rest.indexOf('--');
  if ((tool !== 'pnpm' && tool !== 'npm') || split < 1) {
    say('usage: npm-launcher <pnpm|npm> <command…> -- <arguments…>');
    process.exit(2);
  }
  process.exitCode = await launch({
    tool,
    command: rest.slice(0, split),
    args: rest.slice(split + 1),
    env: { ...process.env },
    cwd: process.cwd(),
  });
}
