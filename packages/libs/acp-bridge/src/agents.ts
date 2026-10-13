/**
 * The coding agents a bridge starts over ACP, and how it finds them on this computer. Sessions run with the agent's
 * full access, as they would in its own terminal: the person is the one asking, on their own computer.
 */
import { constants } from 'node:fs';
import { access } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

export interface AgentLauncher {
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
  /** The value of the session's `mode` choice set when a session opens. */
  readonly mode?: string;
  /** The command that signs a person in to it, for the message when it is not signed in. */
  readonly signIn: string;
  /** Environment the agent runs with, over the bridge's own. */
  readonly env?: Readonly<Record<string, string>>;
}

export const AGENTS: readonly AgentSpec[] = [
  {
    id: 'codex',
    name: 'Codex',
    launchers: [
      { command: 'codex-acp', args: [] },
      // The adapter alone, fetched on first use for people who installed only Codex itself.
      {
        command: 'npx',
        args: ['--yes', '@agentclientprotocol/codex-acp@2.2.2'],
        requires: 'codex',
      },
    ],
    mode: 'agent-full-access',
    signIn: 'codex login',
  },
  {
    id: 'opencode',
    name: 'OpenCode',
    launchers: [
      {
        command: 'opencode',
        args: ['acp'],
        dirs: [path.join(os.homedir(), '.opencode', 'bin')],
      },
    ],
    mode: 'build',
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
): Promise<ResolvedAgent | undefined> {
  for (const launcher of spec.launchers) {
    if (launcher.requires && !(await findProgram(launcher.requires, [], env)))
      continue;
    const command = await findProgram(
      launcher.command,
      launcher.dirs ?? [],
      env,
    );
    if (command) return { spec, command, args: launcher.args };
  }
  return undefined;
}

/** The absolute path of an executable named `name` in `dirs` or on PATH. */
export async function findProgram(
  name: string,
  dirs: readonly string[],
  env: NodeJS.ProcessEnv = process.env,
): Promise<string | undefined> {
  const searched = [...dirs, ...(env.PATH ?? '').split(path.delimiter)].filter(
    Boolean,
  );
  for (const dir of searched) {
    const candidate = path.join(dir, name);
    try {
      await access(candidate, constants.X_OK);
      return candidate;
    } catch {
      // Not here; keep looking.
    }
  }
  return undefined;
}
