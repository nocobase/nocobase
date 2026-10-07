import { AIMessage, type BaseMessage } from '@langchain/core/messages';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { ChatResult } from '@langchain/core/outputs';
import { describe, expect, it, vi } from 'vitest';
import type { LLMProvider } from '@nocobase/ai-employee';
import { createMigrator } from '@nocobase/db';

import {
  CheckpointCleaner,
  RELEASED_THREAD,
} from '../server/agent/checkpoint/index.js';
import { agentServiceFactoryToken } from '../server/agent/service/agent-service-factory.js';
import { repositoryFactoryToken } from '../server/factory/repository-factory.js';
import { createTestAIEmployeeFixture } from './app/test-context.js';
import { MemoryConversationPersistence } from './memory-conversation-persistence.js';
import { aiEmployeeMigrations } from './support/migrations.js';

function text(message: BaseMessage): string {
  const { content } = message;
  if (typeof content === 'string') return content;
  return content
    .map((part) => ('text' in part ? String(part.text) : ''))
    .join('');
}

/** Answers each call with its number, and records what each call was sent. */
class RecordingChatModel extends BaseChatModel {
  public readonly calls: string[][] = [];

  public _llmType(): string {
    return 'recording';
  }

  public bindTools(): this {
    return this;
  }

  public async _generate(messages: BaseMessage[]): Promise<ChatResult> {
    this.calls.push(
      messages
        .filter((message) => ['human', 'ai'].includes(message.getType()))
        .map((message) => `${message.getType()}: ${text(message)}`),
    );
    const message = new AIMessage(`answer ${this.calls.length}`);
    return { generations: [{ message, text: String(message.content) }] };
  }
}

const ask = (content: string) => ({
  userMessages: [{ role: 'user' as const, content: { type: 'text', content } }],
});

async function fixedAgents(thread?: number) {
  const fixture = await createTestAIEmployeeFixture();
  const database = fixture.deps.database;
  await database.connect();
  await createMigrator({ database, sources: aiEmployeeMigrations }).latest();
  const repositories = fixture.container.resolve(repositoryFactoryToken);
  // `sessionId` is a uuid column; a fixed value keeps the test deterministic.
  const sessionId = '7a2e4c1d-5b3f-4e6a-9c8d-0f1e2d3c4b5a';
  await repositories.aiConversations.create({
    values: {
      sessionId,
      category: 'chat',
      read: true,
      ...(thread === undefined ? {} : { thread }),
    },
  });
  const model = new RecordingChatModel({});
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
  // A new agent for every run, as a request handler creates one.
  const create = (
    options: { persistence?: MemoryConversationPersistence } = {},
  ) =>
    factory.createAgent({
      sessionId,
      actor: { id: 1, roles: [], isRoot: false },
      runtime: { logger: fixture.deps.logging.getLogger('ai-employee-test') },
      ...options,
    });
  const cleaner = new CheckpointCleaner(database.connection(), {
    conversations: repositories.aiConversations,
    messages: repositories.aiMessages,
    checkpoints: repositories.lcCheckpoints,
    blobs: repositories.lcCheckpointBlobs,
    writes: repositories.lcCheckpointWrites,
  });
  const threadOf = async () =>
    Number(
      (await repositories.aiConversations.findOne({ filter: { sessionId } }))
        ?.thread,
    );
  const checkpoints = (threadId: string) =>
    repositories.lcCheckpoints.count({ filter: { threadId } });
  return {
    sessionId,
    model,
    create,
    cleaner,
    threadOf,
    checkpoints,
    repositories,
  };
}

describe('a released conversation', () => {
  it('continues from its stored messages on a fresh thread, then from that thread', async () => {
    const { sessionId, model, create, cleaner, threadOf, checkpoints } =
      await fixedAgents(1);
    await (await create()).invoke(ask('first question'));

    // Everything is older than a point in the future.
    await expect(
      cleaner.cleanOutdated(new Date(Date.now() + 60_000)),
    ).resolves.toBe(1);
    expect(await threadOf()).toBe(RELEASED_THREAD);
    expect(await checkpoints(`${sessionId}:1`)).toBe(0);

    await (await create()).invoke(ask('second question'));
    expect(model.calls[1]).toEqual([
      'human: first question',
      'ai: answer 1',
      'human: second question',
    ]);
    expect(await threadOf()).toBe(1);
    expect(await checkpoints(`${sessionId}:0`)).toBe(0);
    expect(await checkpoints(`${sessionId}:1`)).toBeGreaterThan(0);

    // Back on a checkpoint: nothing is replayed twice.
    await (await create()).invoke(ask('third question'));
    expect(model.calls[2]).toEqual([
      'human: first question',
      'ai: answer 1',
      'human: second question',
      'ai: answer 2',
      'human: third question',
    ]);
    expect(await threadOf()).toBe(1);
  });
});

describe('a conversation created without a thread', () => {
  it('starts on thread 1 and goes on from its checkpoints there', async () => {
    const { sessionId, model, create, threadOf, checkpoints } =
      await fixedAgents();
    expect(await threadOf()).toBe(1);

    await (await create()).invoke(ask('first question'));
    await (await create()).invoke(ask('second question'));

    expect(model.calls[1]).toEqual([
      'human: first question',
      'ai: answer 1',
      'human: second question',
    ]);
    expect(await threadOf()).toBe(1);
    expect(await checkpoints(`${sessionId}:0`)).toBe(0);
    expect(await checkpoints(`${sessionId}:1`)).toBeGreaterThan(0);
  });
});

describe('a conversation on thread 0', () => {
  it('beside a caller persistence, still sends only the request', async () => {
    const { model, create } = await fixedAgents(0);
    const persistence = new MemoryConversationPersistence(
      '7a2e4c1d-5b3f-4e6a-9c8d-0f1e2d3c4b5a',
    );

    await (await create({ persistence })).invoke(ask('first question'));
    // A new agent has a new in-process checkpointer, and replays nothing.
    await (await create({ persistence })).invoke(ask('second question'));

    expect(model.calls[1]).toEqual(['human: second question']);
  });
});
