// Wrappers for `git` and the code host CLIs (`gh`, `glab`), put first on the agent's PATH beside the application CLI's
// shim. They keep a run's credentials where the runner gives them:
//
// - a code host CLI the run names (`RunGit.tools`) runs with the current credential of its repository: each call asks
//   the worker through the credential helper (`<index> env <spec>`), exports the variables and execs the real binary.
//   Outside a run it runs as it is; when the runner cannot give a credential it fails with the runner's reason rather
//   than falling back to this machine's login;
// - every run refuses what would store a credential beyond it: `gh`/`glab` logins (`HOST_LOGIN_COMMANDS`), `git config`
//   writes of `credential.*` at global or system scope, and git URLs that embed a password (`GUARD_SCRIPT`).
//
// A host without a tool gets no wrapper. Like the keychain guards, they stop the casual path only: the runner is not a
// security boundary, and the agent can still call a binary by its absolute path.
import {
  chmod,
  mkdir,
  readdir,
  readFile,
  rename,
  rm,
  writeFile,
} from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import path from 'node:path';

import type { RunGitTool } from '../protocol/index.ts';
import { which } from './cli.ts';

/** The first line after the shebang of every wrapper, by which a later run finds and replaces them. */
export const WRAPPER_MARKER = '# nocobase-runner host tool wrapper';

/** The tools wrapped whenever they are installed, credential or not. */
export const GUARDED_TOOLS: readonly string[] = ['git', 'gh', 'glab'];

/** `<bin> auth <subcommand>` that would change this machine's login. */
export const HOST_LOGIN_COMMANDS: Readonly<Record<string, readonly string[]>> =
  {
    gh: ['login', 'logout', 'refresh', 'setup-git', 'switch'],
    glab: ['login', 'logout'],
  };

export const GUARD_FILE = 'git-guard-nocobase-runner.mjs';

/**
 * The git guard, run by the `git` wrapper as `<node> <file> <args…>` for the calls its quick filter cannot pass. It
 * exits 1 with the reason on stderr when the call is refused, 0 otherwise; it also exports the check as `refusal(args)`.
 */
export const GUARD_SCRIPT: string = `// Installed by nocobase-runner: refuses git calls that would store a credential beyond the run.
import { fileURLToPath } from 'node:url';

const URL_WITH_PASSWORD = /[a-z][a-z0-9+.-]*:\\/\\/[^\\/\\s@:]*:[^\\/\\s@]*@/i;
const GLOBAL_WITH_VALUE = new Set(['-C', '-c', '--git-dir', '--work-tree', '--namespace', '--config-env', '--exec-path']);
const READS = new Set(['--get', '--get-all', '--get-regexp', '--get-urlmatch', '-l', '--list', '--get-color', '--get-colorbool']);

export function refusal(args) {
  if (args.some((arg) => URL_WITH_PASSWORD.test(arg)))
    return 'refused: do not put a credential in a git URL. The run\\'s git already authenticates through the runner; use the repository URL without one.';
  let at = 0;
  while (at < args.length && args[at].startsWith('-')) at += GLOBAL_WITH_VALUE.has(args[at]) ? 2 : 1;
  const command = args[at];
  const rest = args.slice(at + 1);
  if (command === 'credential' && (rest[0] === 'approve' || rest[0] === 'store'))
    return 'refused: the run may not store credentials with git. Its git already authenticates through the runner.';
  if (command !== 'config') return null;
  if (!rest.some((arg) => arg === '--global' || arg === '--system')) return null;
  const words = rest.filter((arg) => !arg.startsWith('-'));
  if (!words.some((word) => /^credential(\\.|$)/i.test(word))) return null;
  if (rest.some((arg) => READS.has(arg)) || words[0] === 'get' || words[0] === 'list') return null;
  return 'refused: the run may not change credential settings outside the repository (git config --global/--system credential.*). Its git already authenticates through the runner.';
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const reason = refusal(process.argv.slice(2));
  if (reason !== null) {
    process.stderr.write('nocobase-runner: ' + reason + '\\n');
    process.exit(1);
  }
}
`;

const quote = (value: string): string => `'${value.replace(/'/g, `'\\''`)}'`;

/** Writes the guard into `dir` (the runner's own directory), replacing an older copy atomically; answers its path. */
export async function installCommandGuard(dir: string): Promise<string> {
  await mkdir(dir, { recursive: true, mode: 0o700 });
  const file = path.join(dir, GUARD_FILE);
  const temporary = `${file}.${process.pid}.${randomBytes(4).toString('hex')}`;
  await writeFile(temporary, GUARD_SCRIPT, { mode: 0o755 });
  await rename(temporary, file);
  return file;
}

/** The `git` wrapper: hands calls that might store a credential to the guard first. */
export function gitWrapperScript(
  real: string,
  guard: string,
  node: string = process.execPath,
): string {
  return [
    '#!/bin/sh',
    WRAPPER_MARKER,
    'for arg do',
    '  case "$arg" in',
    `    config|credential|*://*@*) ${quote(node)} ${quote(guard)} "$@" || exit 1; break ;;`,
    '  esac',
    'done',
    `exec ${quote(real)} "$@"`,
    '',
  ].join('\n');
}

/** Where a code host CLI wrapper gets the run's credential: the helper and the repository's index in the broker. */
export interface ToolCredential {
  readonly helper: string;
  readonly index: number;
  readonly env: RunGitTool['env'];
}

/** A `gh`/`glab` wrapper: refuses logins, and with `credential` runs the tool with the run's credential. */
export function hostToolWrapperScript(
  bin: string,
  real: string,
  credential?: ToolCredential,
  node: string = process.execPath,
): string {
  const lines = ['#!/bin/sh', WRAPPER_MARKER];
  const logins = HOST_LOGIN_COMMANDS[bin] ?? [];
  if (logins.length > 0)
    lines.push(
      'if [ "$1" = auth ]; then',
      '  case "$2" in',
      `    ${logins.join('|')})`,
      // `bin` matches RUN_GIT_TOOL_BIN_PATTERN, so it is safe inside double quotes.
      `      echo "nocobase-runner: refused: '${bin} auth $2' would change this machine's login. The run's ${bin} already uses the credential the runner gives it." >&2`,
      '      exit 1 ;;',
      '  esac',
      'fi',
    );
  if (credential !== undefined)
    lines.push(
      `exports=$(${quote(node)} ${quote(credential.helper)} ${credential.index} env ${quote(JSON.stringify(credential.env))}) || exit 1`,
      'eval "$exports"',
    );
  lines.push(`exec ${quote(real)} "$@"`, '');
  return lines.join('\n');
}

/** Removes the wrappers an earlier run left in `binDir`, which may name another run's repositories. */
export async function removeHostToolWrappers(binDir: string): Promise<void> {
  let names: string[];
  try {
    names = await readdir(binDir);
  } catch {
    return;
  }
  for (const name of names) {
    const file = path.join(binDir, name);
    const head = await readFile(file, 'utf8')
      .then((text) => text.slice(0, 200))
      .catch(() => '');
    if (head.split('\n')[1] === WRAPPER_MARKER) await rm(file, { force: true });
  }
}

export interface WriteHostToolsOptions {
  binDir: string;
  /** The runner's directory for its helpers (`installCredentialHelper`, `installCommandGuard`). */
  helpersDir: string;
  /** The credential helper, when the run has repository credentials. */
  helper?: string;
  /** The URLs the broker answers for, in its order. */
  urls?: readonly string[];
  tools?: readonly RunGitTool[];
  /** Where real binaries are looked for, outside `binDir`. */
  searchPath?: string;
  log?: (message: string) => void;
}

export interface HostToolsResult {
  /** Bins wrapped with the run's credential. */
  readonly credentialed: readonly string[];
  /** Every bin wrapped. */
  readonly wrapped: readonly string[];
}

/** Writes the run's wrappers into `binDir`, replacing those of an earlier run. */
export async function writeHostTools(
  options: WriteHostToolsOptions,
): Promise<HostToolsResult> {
  const { binDir } = options;
  await removeHostToolWrappers(binDir);
  const others = (options.searchPath ?? process.env.PATH ?? '')
    .split(path.delimiter)
    .filter((dir) => dir !== '' && path.resolve(dir) !== path.resolve(binDir))
    .join(path.delimiter);
  const byBin = new Map((options.tools ?? []).map((tool) => [tool.bin, tool]));
  const bins = [...new Set([...GUARDED_TOOLS, ...byBin.keys()])];
  const wrapped: string[] = [];
  const credentialed: string[] = [];
  let guard: string | undefined;
  for (const bin of bins) {
    const real = which(bin, others);
    if (real === undefined) {
      if (byBin.has(bin))
        options.log?.(`host tools: ${bin} is not installed; no wrapper`);
      continue;
    }
    let script: string;
    if (bin === 'git') {
      guard ??= await installCommandGuard(options.helpersDir);
      script = gitWrapperScript(real, guard);
    } else {
      const tool = byBin.get(bin);
      const index =
        tool === undefined ? -1 : (options.urls ?? []).indexOf(tool.url);
      if (tool !== undefined && (index === -1 || options.helper === undefined))
        options.log?.(
          `host tools: ${bin}: ${tool.url} has no credential in this run; wrapped without one`,
        );
      const credential =
        tool !== undefined && index !== -1 && options.helper !== undefined
          ? { helper: options.helper, index, env: tool.env }
          : undefined;
      script = hostToolWrapperScript(bin, real, credential);
      if (credential !== undefined) credentialed.push(bin);
    }
    await mkdir(binDir, { recursive: true, mode: 0o700 });
    const file = path.join(binDir, bin);
    await writeFile(file, script, { mode: 0o700 });
    await chmod(file, 0o700);
    wrapped.push(bin);
  }
  return { credentialed, wrapped };
}
