import type {
  OnlineAgentConfig,
  OnlineAgentContext,
  OnlineAgentToolContext,
} from '@nocobase/app-plugin-agents/server/online-agent';
import type { OnlineAgentOptions } from '@nocobase/app-plugin-agents/server/online-agent';
import type {
  OnlineAgentSandboxInput,
  OnlineAgentSandboxProvider,
} from '../server/online/sandbox/types.js';
import { createSandboxProvider } from '../server/online/sandbox/provider.js';
import type {
  OnlineAgentSandboxSkill,
  OnlineAgentSandboxSkillCatalog,
} from '@nocobase/app-plugin-agents/server/online-agent';
import type * as PublicOnlineAgent from '@nocobase/app-plugin-agents/server/online-agent';

export type SandboxProviderIsInternal =
  // @ts-expect-error Provider construction is internal, not an application extension contract.
  PublicOnlineAgent.OnlineAgentSandboxProvider;
export type SandboxPreparationIsInternal =
  // @ts-expect-error Preparation is internal to native execution ownership.
  PublicOnlineAgent.OnlineAgentSandboxPreparation;

export function builtinSkillCatalogContract(
  skills: Parameters<typeof createSandboxProvider>[0]['skills'],
): OnlineAgentSandboxProvider {
  const resource: OnlineAgentSandboxSkill = {
    slug: 'builtin-guide',
    name: 'Builtin guide',
    description: 'Current application resource.',
    content: '# Guide',
    files: [
      { path: 'assets/example.txt', content: 'example' },
      { path: 'assets/binary.bin', content: null },
    ],
  };
  const builtinSkills: OnlineAgentSandboxSkillCatalog = new Map([
    ['builtin-guide-id', async () => resource],
  ]);
  return createSandboxProvider({ skills, builtinSkills });
}
/** The unified factory accepts either Shell-only dependencies or the complete authenticated CLI group. */
export function sandboxProviderDependenciesContract(
  skills: Parameters<typeof createSandboxProvider>[0]['skills'],
  application: ReturnType<
    NonNullable<Parameters<typeof createSandboxProvider>[0]['cli']>
  >,
): OnlineAgentSandboxProvider {
  const provider = createSandboxProvider({ skills, cli: () => application });
  createSandboxProvider({
    skills,
    // @ts-expect-error A CLI callback requires authentication and credential ownership.
    cli: () => ({ commandsOf: application.commandsOf }),
  });
  // @ts-expect-error Authentication alone is not a complete CLI dependency group.
  createSandboxProvider({ skills, cli: () => ({ auth: application.auth }) });
  createSandboxProvider({
    skills,
    // @ts-expect-error Authentication and credentials also require the caller-filtered command surface.
    cli: () => ({
      auth: application.auth,
      credentials: application.credentials,
    }),
  });
  return provider;
}

/** Existing typed native configurations need not add a new field to opt out of Sandbox Skills. */
export const legacyNativeConfiguration: OnlineAgentConfig = {
  scope: [],
  systemPrompt: '',
  tool: [],
  toolVersions: {},
  model: ['fixture/chat'],
};
/** Compile-only contracts: tool selection belongs to configuration, never the Sandbox input. */
export async function sandboxInputContract(
  provider: OnlineAgentSandboxProvider,
  context: OnlineAgentToolContext,
): Promise<OnlineAgentSandboxInput> {
  const input: OnlineAgentSandboxInput = {
    sessionId: context.sessionId,
    context,
    skill: ['existing-skill-id'],
  };
  const prepared = await provider.prepare(input);
  const sandbox = await prepared.create();
  await sandbox.exec('acme --help', {
    toolCallId: 'call',
    abortSignal: context.signal,
  });
  await sandbox.readSkill('selected-slug');
  await sandbox.dispose();
  prepared.dispose();
  const invalid: OnlineAgentSandboxInput = {
    ...input,
    // @ts-expect-error Tools belong to OnlineAgent configuration rather than duplicated Sandbox state.
    tools: ['bash'],
  };
  return invalid;
}

export function serverSkillConfiguration(
  context: OnlineAgentContext,
): OnlineAgentOptions {
  return {
    tool: ['bash', 'skill'],
    skill: ['existing-skill-id'],
    context: { variable: context.variable },
  };
}

export function toolExecutionContract(context: OnlineAgentToolContext): void {
  const id: string = context.execution.id;
  void id;
  context.signal.throwIfAborted();
  void context.execution.getSandbox();
  void context.execution.readSkill('selected-slug');
  // @ts-expect-error Cancellation has one public entry point: context.signal.
  void context.execution.signal;
  // @ts-expect-error Tools cannot finalize the execution through the public capability interface.
  void context.execution.dispose;
}
