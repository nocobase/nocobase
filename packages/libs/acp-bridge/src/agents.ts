/**
 * The coding agents a bridge starts over ACP, and how it finds them on this computer. A person signs in to an agent
 * with its own command line, so the bridge offers the agents installed here: the agent's program run in its ACP mode,
 * or the ACP adapter for it. Sessions run with the agent's full access, as they would in its own terminal: the person
 * is the one asking, on their own computer. An agent offering a mode for that opens in it (`modes`); one offering
 * none has what it asks permission for allowed by the bridge (`allowAll`).
 *
 * The adapters for Codex and Claude Code are managed by the bridge: installed from npm once for each version pinned
 * here (`./managed-adapters.ts`) and run with the Node.js running the bridge against the agent installed here, so a
 * session does not depend on npx. An adapter installed on PATH always takes precedence.
 */
import { execFile } from 'node:child_process';
import { stat } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import {
  adapterDir,
  installAdapter,
  installedAdapter,
  type AdapterPackage,
} from './managed-adapters.js';
import { findProgram } from './programs.js';
import { startupDetail } from './startup-detail.js';

export { findProgram, variable } from './programs.js';

export interface AgentLauncher {
  /** The program's name, found in `dirs` or on PATH; on Windows, with one of PATHEXT's extensions. */
  readonly command: string;
  readonly args: readonly string[];
  /** Directories searched before PATH. */
  readonly dirs?: readonly string[];
  /** Another program this launcher needs, such as the agent itself for an adapter fetched with npx. */
  readonly requires?: string;
  /**
   * The launcher is an adapter the bridge manages: `package` at `version`, installed from npm on first use, whose
   * program `command` is run by Node.js. The agent it `requires`, at least `minVersion`, is named to it in the
   * environment variable `variable`. `batchFiles` says the adapter can start an agent that is a Windows batch file, as
   * npm installs agents.
   */
  readonly managed?: {
    readonly package: string;
    readonly version: string;
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

/** The adapter versions the bridge installs. */
const CODEX_ACP = { name: '@agentclientprotocol/codex-acp', version: '2.2.2' };
const CLAUDE_AGENT_ACP = {
  name: '@agentclientprotocol/claude-agent-acp',
  version: '0.89.1',
};

/**
 * The ACP adapter `adapter`, whose program `bin` runs the agent `requires` that it finds in `variable`: managed by the
 * bridge, unless installed on PATH. The adapter is built against `minVersion` of the agent and may
 * not drive an older one.
 */
function adapter(
  pkg: { readonly name: string; readonly version: string },
  bin: string,
  requires: string,
  agent: Omit<NonNullable<AgentLauncher['managed']>, 'package' | 'version'>,
): AgentLauncher[] {
  return [
    program(bin),
    {
      command: bin,
      args: [],
      requires,
      managed: { package: pkg.name, version: pkg.version, ...agent },
    },
  ];
}

/** The agents the bridge offers, the most used first. */
export const AGENTS: readonly AgentSpec[] = [
  {
    id: 'codex',
    name: 'Codex',
    // codex-acp starts Codex with cross-spawn, which runs npm's `codex.cmd` on Windows.
    launchers: adapter(CODEX_ACP, 'codex-acp', 'codex', {
      variable: 'CODEX_PATH',
      minVersion: '0.160.1',
      batchFiles: true,
    }),
    modes: ['agent-full-access'],
    signIn: 'codex login',
  },
  {
    id: 'claude',
    name: 'Claude Code',
    launchers: adapter(CLAUDE_AGENT_ACP, 'claude-agent-acp', 'claude', {
      variable: 'CLAUDE_CODE_EXECUTABLE',
      minVersion: '2.1.200',
    }),
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
  /** The launcher is an adapter the bridge manages (`AgentLauncher.managed`). */
  readonly managed?: boolean;
}

export interface ResolveOptions {
  /**
   * The directory the managed adapters are installed in, one directory for each package and version. Without it no
   * adapter is installed or run that way.
   */
  readonly adapters?: string;
  /**
   * False starts installation in the background and reports that it is in progress, so the initial connection does
   * not wait for npm. Other values await the installation (bounded by its timeout).
   */
  readonly waitForInstall?: boolean | number;
  /** The Node.js that runs a managed adapter: the one running the bridge by default. */
  readonly node?: string;
  /** Told about installing a managed adapter, and why one is passed over for an agent it cannot drive. */
  readonly log?: (message: string) => void;
  /** Reports a managed installation before waiting for it, so other agents can be offered meanwhile. */
  readonly installing?: (detail: string) => void;
  /** Stops an installation started by this resolution when the bridge shuts down. */
  readonly signal?: AbortSignal;
}

/** How to start `spec` here, or undefined when none of its launchers can run. */
export async function resolveAgent(
  spec: AgentSpec,
  env: NodeJS.ProcessEnv = process.env,
  platform: NodeJS.Platform = process.platform,
  options: ResolveOptions = {},
): Promise<ResolvedAgent | undefined> {
  for (const launcher of ordered(spec.launchers)) {
    const requires = launcher.requires
      ? await findProgram(launcher.requires, [], env, platform)
      : undefined;
    if (launcher.requires && !requires) continue;
    if (launcher.managed) {
      const resolved = await resolveManaged(
        spec,
        launcher.command,
        launcher.managed,
        requires!,
        env,
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

/** An existing adapter always comes before a managed installation. */
function ordered(
  launchers: readonly AgentLauncher[],
): readonly AgentLauncher[] {
  const rank = (launcher: AgentLauncher): number =>
    launcher.managed ? 1 : launcher.requires ? 2 : 0;
  return [...launchers].sort((a, b) => rank(a) - rank(b));
}

async function resolveManaged(
  spec: AgentSpec,
  bin: string,
  managed: NonNullable<AgentLauncher['managed']>,
  agent: string,
  env: NodeJS.ProcessEnv,
  platform: NodeJS.Platform,
  options: ResolveOptions,
): Promise<ResolvedAgent | undefined> {
  if (options.adapters === undefined) return undefined;
  const batch = platform === 'win32' && BATCH_FILE.test(agent);
  if (batch && !managed.batchFiles)
    throw new Error(
      startupDetail(
        agent,
        [],
        `${spec.name}'s managed ACP adapter cannot start the batch file ${agent}. Install a native agent executable or an ACP adapter on PATH.`,
      ),
    );
  const version = await agentVersion(agent, batch);
  if (!version || compareVersions(version, managed.minVersion) < 0) {
    throw new Error(
      startupDetail(
        agent,
        ['--version'],
        `${spec.name} at ${agent} ${version ? `is version ${version}` : 'did not report its version'}; the ACP adapter ${managed.package}@${managed.version} needs ${managed.minVersion} or newer. Update the agent or install an ACP adapter on PATH.`,
      ),
    );
  }
  const pkg: AdapterPackage = {
    name: managed.package,
    version: managed.version,
    bin,
  };
  let file = await installedAdapter(adapterDir(options.adapters, pkg), pkg);
  if (!file) {
    options.installing?.(
      startupDetail(
        'npm',
        [
          'install',
          '--prefix',
          adapterDir(options.adapters, pkg),
          `${pkg.name}@${pkg.version}`,
        ],
        'ACP adapter installation is in progress. The bridge will check again automatically.',
      ),
    );
    const install = installAdapter(pkg, {
      dir: options.adapters,
      env,
      platform,
      log: options.log,
      signal: options.signal,
    });
    if (options.waitForInstall === false) {
      void install.catch(() => undefined);
      throw new Error(
        startupDetail(
          'npm',
          [
            'install',
            '--prefix',
            adapterDir(options.adapters, pkg),
            `${pkg.name}@${pkg.version}`,
          ],
          'ACP adapter installation is in progress. The bridge will check again automatically.',
        ),
      );
    }
    file = await install;
  }
  return {
    spec,
    command: options.node ?? process.execPath,
    args: [file],
    env: { [managed.variable]: agent },
    managed: true,
  };
}

const BATCH_FILE = /\.(?:cmd|bat)$/iu;
const VERSION_TIMEOUT_MS = 10_000;
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
