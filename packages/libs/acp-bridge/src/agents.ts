/**
 * The coding agents a bridge starts over ACP, and how it finds them on this computer. A person signs in to an agent
 * with its own command line, so the bridge offers the agents installed here: the agent's program run in its ACP mode,
 * or the ACP adapter for it. Sessions run with the agent's full access, as they would in its own terminal: the person
 * is the one asking, on their own computer. An agent offering a mode for that opens in it (`modes`); one offering
 * none has what it asks permission for allowed by the bridge (`allowAll`).
 */
import { constants } from 'node:fs';
import { access, stat } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

export interface AgentLauncher {
  /** The program's name, found in `dirs` or on PATH; on Windows, with one of PATHEXT's extensions. */
  readonly command: string;
  readonly args: readonly string[];
  /** Directories searched before PATH. */
  readonly dirs?: readonly string[];
  /** Another program this launcher needs, such as the agent itself for an adapter fetched with npx. */
  readonly requires?: string;
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

/** The agents the bridge offers, the most used first. */
export const AGENTS: readonly AgentSpec[] = [
  {
    id: 'codex',
    name: 'Codex',
    launchers: [
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
}

/** How to start `spec` here, or undefined when none of its launchers can run. */
export async function resolveAgent(
  spec: AgentSpec,
  env: NodeJS.ProcessEnv = process.env,
  platform: NodeJS.Platform = process.platform,
): Promise<ResolvedAgent | undefined> {
  for (const launcher of spec.launchers) {
    if (
      launcher.requires &&
      !(await findProgram(launcher.requires, [], env, platform))
    )
      continue;
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
