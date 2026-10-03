import { AIMessage } from '@langchain/core/messages';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { ChatResult } from '@langchain/core/outputs';
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
 * A fixed agent created through the factory, whose one tool is registered the
 * way an App registers it — so its permission is whatever `defaultPermission`
 * says, never an `auto` flag set by hand.
 */
async function fixedAgentWithTool(
  sessionId: string,
  defaultPermission?: 'ALLOW' | 'ASK',
) {
  const fixture = await createTestAIEmployeeFixture();
  const lookup = vi.fn(async () => ({ status: 'success', content: 'found' }));
  await fixture.deps.ai.toolsManager.registerTools(
    defineTools({
      scope: 'CUSTOM',
      ...(defaultPermission ? { defaultPermission } : {}),
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
  const agent = await fixture.container
    .resolve(agentServiceFactoryToken)
    .createAgent({
      sessionId,
      persistence: new MemoryConversationPersistence(sessionId),
      actor: { id: 1, roles: [], isRoot: false },
      runtime: { logger: fixture.deps.logging.getLogger('ai-employee-test') },
      tools: ['lookup'],
    });
  return { agent, lookup };
}

const question = [
  { role: 'user' as const, content: { type: 'text', content: 'capital?' } },
];

describe('createAgent() tool permission', () => {
  it('pauses on a tool that asks, as an employee agent does', async () => {
    const { agent, lookup } = await fixedAgentWithTool('fixed-ask', 'ASK');

    const result = await agent.invoke({ userMessages: question });

    expect(lookup).not.toHaveBeenCalled();
    expect(result.interrupt).toMatchObject({
      actions: [{ toolCall: { id: 'call-1', name: 'lookup' } }],
    });
  });

  it('runs the tool once the pause is approved', async () => {
    const { agent, lookup } = await fixedAgentWithTool('fixed-resume', 'ASK');
    const paused = await agent.invoke({ userMessages: question });

    const result = await agent.resumeInvoke({
      userDecisions: {
        interruptId: paused.interrupt?.id,
        decisions: [{ type: 'approve' }],
      },
    });

    expect(lookup).toHaveBeenCalledOnce();
    expect(result.message?.content).toEqual({
      type: 'text',
      content: 'Paris',
    });
  });

  it('treats a tool that declares no permission as one that asks', async () => {
    const { agent, lookup } = await fixedAgentWithTool('fixed-default');

    const result = await agent.invoke({ userMessages: question });

    expect(lookup).not.toHaveBeenCalled();
    expect(result.interrupt).toBeTruthy();
  });

  it('runs a tool that allows without pausing', async () => {
    const { agent, lookup } = await fixedAgentWithTool('fixed-allow', 'ALLOW');

    const result = await agent.invoke({ userMessages: question });

    expect(lookup).toHaveBeenCalledOnce();
    expect(result.interrupt).toBeFalsy();
    expect(result.message?.content).toEqual({
      type: 'text',
      content: 'Paris',
    });
  });
});

describe('createAgent() under the default database persistence', () => {
  it('pauses on a tool that asks and resumes from a newly created agent', async () => {
    const fixture = await createTestAIEmployeeFixture();
    const database = fixture.deps.database;
    await database.connect();
    await createMigrator({
      database,
      sources: aiEmployeeMigrations,
    }).latest();
    // `sessionId` is a uuid column; a fixed value keeps the test deterministic.
    const sessionId = '6f1d2c3b-4a5e-4f60-8b7c-9d0e1f2a3b4c';
    await fixture.container
      .resolve(repositoryFactoryToken)
      .aiConversations.create({
        values: { sessionId, category: 'chat', thread: 0, read: true },
      });
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
    // One script across both agents: the first asks for the tool, the second
    // answers once the approved call has run.
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
    const create = () =>
      fixture.container.resolve(agentServiceFactoryToken).createAgent({
        sessionId,
        actor: { id: 1, roles: [], isRoot: false },
        runtime: {
          logger: fixture.deps.logging.getLogger('ai-employee-test'),
        },
        tools: ['lookup'],
      });

    try {
      const paused = await (await create()).invoke({ userMessages: question });
      expect(lookup).not.toHaveBeenCalled();
      expect(paused.interrupt?.id).toEqual(expect.any(String));

      const resumed = await (
        await create()
      ).resumeInvoke({
        userDecisions: {
          interruptId: paused.interrupt?.id,
          decisions: [{ type: 'approve' }],
        },
      });

      expect(lookup).toHaveBeenCalledOnce();
      expect(resumed.message?.content).toEqual({
        type: 'text',
        content: 'Paris',
      });
    } finally {
      await database.destroy();
    }
  });
});
