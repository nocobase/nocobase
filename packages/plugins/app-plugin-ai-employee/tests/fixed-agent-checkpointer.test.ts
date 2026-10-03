import { AIMessage } from '@langchain/core/messages';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { ChatResult } from '@langchain/core/outputs';
import type { BaseCheckpointSaver } from '@langchain/langgraph';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { defineTools, type LLMProvider } from '@nocobase/ai-employee';
import { createMigrator } from '@nocobase/db';
import { agentServiceFactoryToken } from '../server/agent/service/agent-service-factory.js';
import { repositoryFactoryToken } from '../server/factory/repository-factory.js';
import { createTestAIEmployeeFixture } from './app/test-context.js';
import { MemoryConversationPersistence } from './memory-conversation-persistence.js';
import { aiEmployeeMigrations } from './support/migrations.js';

/** Answers each model call with the next scripted message. */
class ScriptedChatModel extends BaseChatModel {
  public constructor(private readonly script: AIMessage[]) {
    super({});
  }

  public _llmType(): string {
    return 'scripted';
  }

  public bindTools(): this {
    return this;
  }

  public async _generate(): Promise<ChatResult> {
    const message = this.script.shift();
    if (!message) throw new Error('The script has no response left');
    return { generations: [{ message, text: String(message.content) }] };
  }
}

/**
 * A fixture whose fixed agents share one model script and one caller-owned
 * persistence, so a second agent sees what the first one left behind.
 */
async function fixedAgents(sessionId: string) {
  const fixture = await createTestAIEmployeeFixture();
  const lookup = vi.fn(async () => ({ status: 'success', content: 'found' }));
  await fixture.deps.ai.toolsManager.registerTools(
    defineTools({
      scope: 'CUSTOM',
      defaultPermission: 'ASK',
      definition: {
        name: 'lookup',
        description: 'Looks something up',
        schema: z.object({ query: z.string() }),
      },
      invoke: lookup,
    }),
  );
  const model = new ScriptedChatModel([
    new AIMessage({
      content: '',
      tool_calls: [
        { id: 'call-1', name: 'lookup', args: { query: 'capital' } },
      ],
    }),
    new AIMessage('Paris'),
  ]);
  const provider = {
    createModel: () => model,
    resolveTools: (tools: unknown[]) => tools,
    prepareStoredAssistantAdditionalKwargs: (
      additionalKwargs?: Record<string, unknown>,
    ) => additionalKwargs,
  } as unknown as LLMProvider;
  vi.spyOn(
    fixture.deps.ai.llmProviderManager,
    'resolveModel',
  ).mockResolvedValue({ llmService: 'test-service', model: 'test-model' });
  vi.spyOn(
    fixture.deps.ai.llmProviderManager,
    'getLLMService',
  ).mockResolvedValue({
    provider,
    model: 'test-model',
    service: { name: 'test-service', provider: 'test' },
  } as never);
  const factory = fixture.container.resolve(agentServiceFactoryToken);
  const persistence = new MemoryConversationPersistence(sessionId);
  const create = (checkpointer?: BaseCheckpointSaver) =>
    factory.createAgent({
      sessionId,
      persistence,
      actor: { id: 1, roles: [], isRoot: false },
      runtime: { logger: fixture.deps.logging.getLogger('ai-employee-test') },
      tools: ['lookup'],
      ...(checkpointer ? { checkpointer } : {}),
    });
  return { fixture, factory, create, lookup };
}

const question = [
  { role: 'user' as const, content: { type: 'text', content: 'capital?' } },
];

async function approve(
  agent: Awaited<ReturnType<Awaited<ReturnType<typeof fixedAgents>>['create']>>,
  interruptId: string | undefined,
) {
  return agent.resumeInvoke({
    userDecisions: { interruptId, decisions: [{ type: 'approve' }] },
  });
}

describe('createAgent() checkpointer', () => {
  it('keeps a pause beside a caller persistence in the agent that paused, by default', async () => {
    const { create, lookup } = await fixedAgents('default-memory');
    const paused = await (await create()).invoke({ userMessages: question });
    expect(paused.interrupt).toBeDefined();

    // Another agent over the same persistence has no checkpoint to resume.
    await expect(
      approve(await create(), paused.interrupt?.id),
    ).rejects.toThrow();
    expect(lookup).not.toHaveBeenCalled();
  });

  it('keeps a pause in the checkpointer the caller supplies, so another agent resumes it', async () => {
    const { factory, create, lookup } = await fixedAgents('shared-memory');
    const checkpointer = factory.getMemorySaver();
    const put = vi.spyOn(checkpointer, 'put');

    const paused = await (
      await create(checkpointer)
    ).invoke({
      userMessages: question,
    });
    expect(paused.interrupt).toBeDefined();
    expect(put).toHaveBeenCalled();

    const result = await approve(
      await create(checkpointer),
      paused.interrupt?.id,
    );
    expect(lookup).toHaveBeenCalledOnce();
    expect(result.interrupt).toBeUndefined();
    expect(result.message?.content).toEqual({ type: 'text', content: 'Paris' });
  });

  it("writes a pause to the plugin's tables through getDatabaseCheckpointSaver()", async () => {
    const { fixture, factory, create, lookup } =
      await fixedAgents('database-saver');
    const database = fixture.deps.database;
    await database.connect();
    await createMigrator({
      database,
      sources: aiEmployeeMigrations,
    }).latest();
    const checkpoints = fixture.container.resolve(
      repositoryFactoryToken,
    ).lcCheckpoints;

    const paused = await (
      await create(factory.getDatabaseCheckpointSaver())
    ).invoke({ userMessages: question });
    expect(paused.interrupt).toBeDefined();
    // A fresh database: every checkpoint in it is this run's.
    expect(await checkpoints.count({})).toBeGreaterThan(0);

    const result = await approve(
      await create(factory.getDatabaseCheckpointSaver()),
      paused.interrupt?.id,
    );
    expect(lookup).toHaveBeenCalledOnce();
    expect(result.message?.content).toEqual({ type: 'text', content: 'Paris' });
  });
});
