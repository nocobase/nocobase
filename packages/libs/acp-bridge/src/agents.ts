/**
 * The coding agents a bridge starts over ACP, and how it finds them on this computer. A person signs in to an agent
 * with its own command line, so the bridge offers the agents installed here: the agent's program run in its ACP mode,
 * or the ACP adapter for it. Sessions run with the agent's full access, as they would in its own terminal: the person
 * is the one asking, on their own computer. An agent offering a mode for that opens in it (`modes`); one offering
 * none has what it asks permission for allowed by the bridge (`allowAll`).
 *
 * The adapters for Codex and Claude Code ship with this package, bundled into `dist/adapters/` by
 * `scripts/build-adapters.mjs`, and run with the Node.js running the bridge against the agent installed here, so a
 * session does not wait for npx. An adapter installed on PATH comes after them unless `NOCOBASE_ACP_ADAPTERS` is
 * `installed`, and npx fetches one only when neither can run.
 */
import { execFile } from 'node:child_process';
import { constants } from 'node:fs';
import { access, stat } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export interface AgentLauncher {
  /** The program's name, found in `dirs` or on PATH; on Windows, with one of PATHEXT's extensions. */
  readonly command: string;
  readonly args: readonly string[];
  /** Directories searched before PATH. */
  readonly dirs?: readonly string[];
  /** Another program this launcher needs, such as the agent itself for an adapter fetched with npx. */
  readonly requires?: string;
  /**
   * The launcher is an adapter bundled with this package: `command` is its file in `dist/adapters/`, run by Node.js,
   * and the agent it `requires`, at least `minVersion`, is named to it in the environment variable `variable`.
   * `batchFiles` says the adapter can start an agent that is a Windows batch file, as npm installs agents.
   */
  readonly bundled?: {
    readonly variable: string;
    readonly minVersion: string;
    readonly batchFiles?: boolean;
  };
}

export interface AgentSpec {
  readonly id: string;
  readonly name: string;
  /** Ways to start it, in order of preference. */
  readonly launchers: readonly AgentLauncher[];
  /** The values of the session's `mode` choice that give the agent full access: a session opens in the first offered. */
  readonly modes?: readonly string[];
  /** The agent offers no such mode: the bridge allows whatever it asks permission for. */
  readonly allowAll?: boolean;
  /** What a person runs in a terminal to sign in to it, for the message when it is not signed in. */
  readonly signIn: string;
  /** Environment the agent runs with, over the bridge's own. */
  readonly env?: Readonly<Record<string, string>>;
}

const home = os.homedir();
const localBin = path.join(home, '.local', 'bin');

/** The program `command` run with `args`, found as it is installed. */
function program(
  command: string,
  args: readonly string[] = [],
  dirs: readonly string[] = [],
): AgentLauncher {
  return { command, args, ...(dirs.length > 0 ? { dirs } : {}) };
}

/** An ACP adapter published on npm, fetched by npx on first use, for people who installed only the agent `requires`. */
function npx(pkg: string, requires: string): AgentLauncher {
  return { command: 'npx', args: ['--yes', pkg], requires };
}

/**
 * The ACP adapter bundled as `file`, which runs the agent `requires` that it finds in `variable`. The adapter is
 * built against `minVersion` of the agent and may not drive an older one.
 */
function bundled(
  file: string,
  requires: string,
  bundle: NonNullable<AgentLauncher['bundled']>,
): AgentLauncher {
  return { command: file, args: [], requires, bundled: bundle };
}

/** The agents the bridge offers, the most used first. */
export const AGENTS: readonly AgentSpec[] = [
  {
    id: 'codex',
    name: 'Codex',
    launchers: [
      // codex-acp starts Codex with cross-spawn, which runs npm's `codex.cmd` on Windows.
      bundled('codex-acp.mjs', 'codex', {
        variable: 'CODEX_PATH',
        minVersion: '0.160.1',
        batchFiles: true,
      }),
      program('codex-acp'),
      npx('@agentclientprotocol/codex-acp@2.2.2', 'codex'),
    ],
    modes: ['agent-full-access'],
    signIn: 'codex login',
  },
  {
    id: 'claude',
    name: 'Claude Code',
    launchers: [
      bundled('claude-agent-acp.mjs', 'claude', {
        variable: 'CLAUDE_CODE_EXECUTABLE',
        minVersion: '2.1.200',
      }),
      program('claude-agent-acp'),
      npx('@agentclientprotocol/claude-agent-acp@0.89.1', 'claude'),
    ],
    modes: ['bypassPermissions'],
    signIn: 'claude',
  },
  {
    id: 'gemini',
    name: 'Gemini CLI',
    launchers: [program('gemini', ['--acp'])],
    modes: ['yolo'],
    signIn: 'gemini',
  },
  {
    id: 'copilot',
    name: 'GitHub Copilot',
    launchers: [program('copilot', ['--acp'])],
    allowAll: true,
    signIn: 'copilot',
  },
  {
    id: 'cursor',
    name: 'Cursor',
    launchers: [program('cursor-agent', ['acp'], [localBin])],
    allowAll: true,
    signIn: 'cursor-agent login',
  },
  {
    id: 'opencode',
    name: 'OpenCode',
    launchers: [
      program('opencode', ['acp'], [path.join(home, '.opencode', 'bin')]),
    ],
    modes: ['build'],
    signIn: 'opencode auth login',
    env: {
      OPENCODE_PERMISSION: JSON.stringify({
        edit: 'allow',
        bash: 'allow',
        webfetch: 'allow',
        external_directory: 'allow',
      }),
    },
  },
  {
    id: 'qwen',
    name: 'Qwen Code',
    launchers: [program('qwen', ['--acp'])],
    modes: ['yolo'],
    signIn: 'qwen',
  },
  {
    id: 'kimi',
    name: 'Kimi CLI',
    launchers: [program('kimi', ['acp'], [localBin])],
    allowAll: true,
    signIn: 'kimi',
  },
  {
    id: 'codebuddy',
    name: 'CodeBuddy Code',
    launchers: [program('codebuddy', ['--acp'])],
    allowAll: true,
    signIn: 'codebuddy',
  },
  {
    id: 'qoder',
    name: 'Qoder CLI',
    launchers: [program('qodercli', ['--acp'])],
    allowAll: true,
    signIn: 'qodercli',
  },
  {
    id: 'goose',
    name: 'Goose',
    launchers: [program('goose', ['acp'], [localBin])],
    allowAll: true,
    signIn: 'goose configure',
    env: { GOOSE_MODE: 'auto' },
  },
  {
    id: 'auggie',
    name: 'Auggie',
    launchers: [program('auggie', ['--acp'])],
    allowAll: true,
    signIn: 'auggie login',
    env: { AUGMENT_DISABLE_AUTO_UPDATE: '1' },
  },
  {
    id: 'droid',
    name: 'Factory Droid',
    launchers: [
      program(
        'droid',
        ['exec', '--output-format', 'acp-daemon'],
        [localBin, path.join(home, '.factory', 'bin')],
      ),
    ],
    allowAll: true,
    signIn: 'droid',
    env: {
      DROID_DISABLE_AUTO_UPDATE: 'true',
      FACTORY_DROID_AUTO_UPDATE_ENABLED: 'false',
    },
  },
  {
    id: 'kilo',
    name: 'Kilo Code',
    launchers: [program('kilo', ['acp'])],
    allowAll: true,
    signIn: 'kilo',
  },
  {
    id: 'cline',
    name: 'Cline',
    launchers: [program('cline', ['--acp'])],
    allowAll: true,
    signIn: 'cline',
  },
  {
    id: 'amp',
    name: 'Amp',
    launchers: [program('amp-acp', [], [localBin])],
    allowAll: true,
    signIn: 'amp login',
  },
  {
    id: 'vibe',
    name: 'Mistral Vibe',
    launchers: [program('vibe-acp', [], [localBin])],
    allowAll: true,
    signIn: 'vibe',
  },
];

export interface ResolvedAgent {
  readonly spec: AgentSpec;
  /** The absolute path of the program to run. */
  readonly command: string;
  readonly args: readonly string[];
  /** Environment this launcher adds, over the agent's own. */
  readonly env?: Readonly<Record<string, string>>;
}

export interface ResolveOptions {
  /** Where the bundled adapters are: this package's `dist/adapters/` by default. */
  readonly adapters?: string;
  /** The Node.js that runs a bundled adapter: the one running the bridge by default. */
  readonly node?: string;
  /** Told why a bundled adapter is passed over for an agent it cannot drive. */
  readonly log?: (message: string) => void;
}

/** This package's bundled adapters, from `src/` in a source checkout and from `dist/` once built. */
const ADAPTERS_DIR = fileURLToPath(
  new URL('../dist/adapters/', import.meta.url),
);

/** How to start `spec` here, or undefined when none of its launchers can run. */
export async function resolveAgent(
  spec: AgentSpec,
  env: NodeJS.ProcessEnv = process.env,
  platform: NodeJS.Platform = process.platform,
  options: ResolveOptions = {},
): Promise<ResolvedAgent | undefined> {
  const preferInstalled =
    variable(env, 'NOCOBASE_ACP_ADAPTERS', platform) === 'installed';
  for (const launcher of ordered(spec.launchers, preferInstalled)) {
    const requires = launcher.requires
      ? await findProgram(launcher.requires, [], env, platform)
      : undefined;
    if (launcher.requires && !requires) continue;
    if (launcher.bundled) {
      const resolved = await resolveBundled(
        spec,
        launcher.command,
        launcher.bundled,
        requires!,
        platform,
        options,
      );
      if (resolved) return resolved;
      continue;
    }
    const command = await findProgram(
      launcher.command,
      launcher.dirs ?? [],
      env,
      platform,
    );
    if (command) return { spec, command, args: launcher.args };
  }
  return undefined;
}

/** The launchers to try, with an adapter installed on PATH before the bundled one when the person prefers it. */
function ordered(
  launchers: readonly AgentLauncher[],
  preferInstalled: boolean,
): readonly AgentLauncher[] {
  if (!preferInstalled) return launchers;
  const rank = (launcher: AgentLauncher): number =>
    launcher.bundled ? 1 : launcher.requires ? 2 : 0;
  return [...launchers].sort((a, b) => rank(a) - rank(b));
}

async function resolveBundled(
  spec: AgentSpec,
  adapter: string,
  bundle: NonNullable<AgentLauncher['bundled']>,
  agent: string,
  platform: NodeJS.Platform,
  options: ResolveOptions,
): Promise<ResolvedAgent | undefined> {
  const file = path.join(options.adapters ?? ADAPTERS_DIR, adapter);
  if (!(await exists(file))) return undefined;
  const batch = platform === 'win32' && BATCH_FILE.test(agent);
  if (batch && !bundle.batchFiles) return undefined;
  const version = await agentVersion(agent, batch);
  if (!version || compareVersions(version, bundle.minVersion) < 0) {
    const note = `${spec.name} at ${agent} ${version ? `is version ${version}` : 'did not report its version'}; the adapter bundled with this bridge needs ${bundle.minVersion} or newer, so ${spec.name} starts another way.`;
    // The bridge looks for agents every minute: say it once for each version found.
    if (!noted.has(note)) {
      noted.add(note);
      options.log?.(note);
    }
    return undefined;
  }
  return {
    spec,
    command: options.node ?? process.execPath,
    args: [file],
    env: { [bundle.variable]: agent },
  };
}

const BATCH_FILE = /\.(?:cmd|bat)$/iu;
const VERSION_TIMEOUT_MS = 10_000;
const noted = new Set<string>();
/** Versions already read, by program, while the program is unchanged; one that could not be read is asked again. */
const versions = new Map<
  string,
  { readonly modified: number; readonly version: Promise<string | undefined> }
>();

/**
 * The version the program at `file` prints for `--version`, or undefined when it prints none. A Windows batch file
 * (`batch`) runs only through cmd.exe.
 */
async function agentVersion(
  file: string,
  batch = false,
): Promise<string | undefined> {
  let modified: number;
  try {
    modified = (await stat(file)).mtimeMs;
  } catch {
    return undefined;
  }
  const known = versions.get(file);
  if (known?.modified === modified) return known.version;
  const version = new Promise<string | undefined>((resolve) => {
    execFile(
      batch ? `"${file}"` : file,
      ['--version'],
      { timeout: VERSION_TIMEOUT_MS, windowsHide: true, shell: batch },
      (error, stdout) =>
        resolve(error ? undefined : /\d+\.\d+\.\d+/u.exec(String(stdout))?.[0]),
    );
  });
  versions.set(file, { modified, version });
  void version.then((read) => {
    if (read === undefined && versions.get(file)?.version === version)
      versions.delete(file);
  });
  return version;
}

/** Compares two `major.minor.patch` versions. */
export function compareVersions(a: string, b: string): number {
  const left = a.split('.').map(Number);
  const right = b.split('.').map(Number);
  for (let index = 0; index < 3; index += 1) {
    const difference = (left[index] ?? 0) - (right[index] ?? 0);
    if (difference !== 0) return difference;
  }
  return 0;
}

async function exists(file: string): Promise<boolean> {
  try {
    return (await stat(file)).isFile();
  } catch {
    return false;
  }
}

/**
 * The absolute path of the program named `name` in `dirs` or on PATH: an executable file of that name, or on Windows a
 * file of that name with one of PATHEXT's extensions, such as `npx.cmd` or `opencode.exe`.
 */
export async function findProgram(
  name: string,
  dirs: readonly string[],
  env: NodeJS.ProcessEnv = process.env,
  platform: NodeJS.Platform = process.platform,
): Promise<string | undefined> {
  const windows = platform === 'win32';
  const paths = windows ? path.win32 : path.posix;
  const searched = [
    ...dirs,
    ...(variable(env, 'PATH', platform) ?? '').split(paths.delimiter),
  ].filter(Boolean);
  const extensions = windows
    ? (variable(env, 'PATHEXT', platform) ?? '.COM;.EXE;.BAT;.CMD')
        .split(';')
        .filter(Boolean)
    : [''];
  for (const dir of searched) {
    for (const extension of extensions) {
      const candidate = paths.join(dir, name + extension.toLowerCase());
      if (await runnable(candidate, windows)) return candidate;
    }
  }
  return undefined;
}

/** An environment variable; on Windows its name has any case, as `Path` usually has. */
export function variable(
  env: NodeJS.ProcessEnv,
  name: string,
  platform: NodeJS.Platform = process.platform,
): string | undefined {
  if (platform !== 'win32') return env[name];
  const key = Object.keys(env).find(
    (candidate) => candidate.toUpperCase() === name,
  );
  return key === undefined ? undefined : env[key];
}

async function runnable(file: string, windows: boolean): Promise<boolean> {
  try {
    // Windows has no execute bit: a file with a program's extension runs.
    if (windows) return (await stat(file)).isFile();
    await access(file, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}
