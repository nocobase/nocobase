import type {
  OnlineAgentConfig,
  OnlineAgentContext,
  OnlineAgentToolContext,
} from '@nocobase/app-plugin-agents/server/online-agent';
import type { OnlineAgentOptions } from '@nocobase/app-plugin-agents/server/online-agent';
import type {
  OnlineAgentSandboxInput,
  OnlineAgentSandboxProvider,
} from '@nocobase/app-plugin-agents/server/online-agent';
import { createSandboxProvider } from '@nocobase/app-plugin-agents/server/online-agent';
import type {
  OnlineAgentSandboxSkill,
  OnlineAgentSandboxSkillCatalog,
} from '@nocobase/app-plugin-agents/server/online-agent';

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
  const sandbox = await provider.create(input);
  await sandbox.exec('acme --help', {
    toolCallId: 'call',
    abortSignal: context.signal,
  });
  await sandbox.readSkill('selected-slug');
  await sandbox.dispose();
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
