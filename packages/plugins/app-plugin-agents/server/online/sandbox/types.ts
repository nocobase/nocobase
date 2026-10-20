import type { Auth } from '@nocobase/app-plugin-authentication';
import type { OnlineAgentCredentials } from '../../cli/online-credential.js';
import type { CallerIdentity } from '../../core/callers/index.js';
import type { OnlineAgentToolContext } from '../agent/types.js';
import type { CliCommand } from '@nocobase/app-cli-client/parse';

/** Application dependencies; the CLI is resolved only when a Sandbox is actually created. */
export interface OnlineAgentSandboxOptions {
  builtinSkills?: OnlineAgentSandboxSkillCatalog;
  bin?: () => string | undefined;
  cli?: () => {
    auth: Auth;
    credentials: OnlineAgentCredentials;
    commandsOf(
      identity: CallerIdentity,
      token: string,
    ): Promise<CommandSurface | undefined>;
  };
}

/** Current application-owned Skill resources, loaded anew for every SDK execution segment. */
export interface OnlineAgentSandboxSkill {
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  readonly content: string;
  readonly files: readonly {
    readonly path: string;
    readonly content: string | null;
  }[];
}
export type OnlineAgentSandboxSkillCatalog = ReadonlyMap<
  string,
  () => Promise<OnlineAgentSandboxSkill>
>;
export type OnlineAgentSandboxInput = {
  sessionId: string;
  executionId?: string;
  context: Omit<OnlineAgentToolContext, 'execution'>;
  skill: readonly string[];
};
export interface OnlineAgentSandbox {
  readonly instructions: string;
  exec(
    command: string,
    options: { toolCallId: string; abortSignal?: AbortSignal },
  ): Promise<{ ok: boolean; output: string; exitCode: number }>;
  readSkill(name: string): Promise<{ ok: boolean; output: string }>;
  dispose(): Promise<void>;
}
export interface OnlineAgentSandboxPreparation {
  readonly instructions: string;
  readSkill(name: string): Promise<{ ok: boolean; output: string }>;
  create(): Promise<OnlineAgentSandbox>;
  dispose(): void;
}
export interface OnlineAgentSandboxProvider {
  prepare(
    input: OnlineAgentSandboxInput,
  ): Promise<OnlineAgentSandboxPreparation>;
}
/** Caller-filtered application commands and authenticated, application-local dispatch. */
export interface CommandSurface {
  readonly bin: string;
  readonly commands: readonly CliCommand[];
  send(
    request: {
      readonly method: string;
      readonly path: string;
      readonly body?: string | FormData;
    },
    signal?: AbortSignal,
  ): Promise<Response>;
}
