import { AIMessage } from '@langchain/core/messages';
import { FakeListChatModel } from '@langchain/core/utils/testing';
import { describe, expect, it, vi } from 'vitest';
import type {
  AIMessageInput,
  LLMProvider,
  ToolsEntity,
} from '@nocobase/ai-employee';
import { LLMStreamCachedManager } from '../server/manager/llm-stream-cached-manager.js';
import { ConversationProvider } from '../server/agent/conversation/conversation-provider.js';
import { FixedAgentContextProvider } from '../server/agent/context/fixed/context.js';
import { AgentService } from '../server/agent/service/agent-service.js';
import type {
  AgentProviders,
  ResolvedAgentLLM,
} from '../server/agent/types.js';
import { MemoryConversationPersistence } from './memory-conversation-persistence.js';
import { createTestAIEmployeeFixture } from './app/test-context.js';

function createCaching() {
  const namespaces = new Map<string, Map<string, unknown>>();
  return {
    getCache: ({ namespace }: { namespace: string }) => {
      const values = namespaces.get(namespace) ?? new Map<string, unknown>();
      namespaces.set(namespace, values);
      return {
        get: async <T>(key: string): Promise<T | undefined> =>
          values.get(key) as T | undefined,
        set: async <T>(key: string, value: T): Promise<void> => {
          values.set(key, value);
        },
        delete: async (key: string): Promise<boolean> => values.delete(key),
      };
    },
  };
}

function createConversationProvider(
  persistence: MemoryConversationPersistence,
  sessionId: string,
) {
  return new ConversationProvider({
    sessionId,
    persistence,
    streamCache: new LLMStreamCachedManager(createCaching()),
    employeesManager: {
      registerAgentAbortHandle: vi.fn(),
      unregisterAgentAbortHandle: vi.fn(),
    } as never,
  });
}

function createProvider(
  conversation: ConversationProvider,
  responses: string[],
  seenMessages: string[],
): AgentProviders {
  const provider: LLMProvider = {
    createModel: () =>
      new FakeListChatModel({
        responses: responses.map((value) => new AIMessage(value)),
      }),
    resolveTools: () => [],
    parseResponseChunk: (value: unknown) => String(value),
    parseReasoningContent: () => undefined,
  } as unknown as LLMProvider;
  const llm: ResolvedAgentLLM = {
    providerName: 'memory-test',
    llmService: 'memory-test-service',
    model: 'memory-test-model',
    provider,
  };
  const context = new FixedAgentContextProvider({
    sessionId: 'fixed-session',
    agentContext: { state: { sessionId: 'fixed-session' } } as never,
    model: { llmService: 'memory-test-service', model: 'memory-test-model' },
    provider,
    providerName: llm.providerName,
    llmService: llm.llmService,
    systemPrompt: 'You are a memory test agent.',
  });
  return {
    conversation,
    context,
    converters: {
      formatMessages: async (messages: readonly AIMessageInput[]) => {
        seenMessages.push(
          ...messages
            .filter((item) => item.role === 'user')
            .map((item) => String(item.content.content)),
        );
        return messages;
      },
      assistant: {
        convert: (value: AIMessage) => ({
          role: 'assistant',
          content: { type: 'text', content: String(value.content) },
        }),
      },
      human: {
        convert: (value: { content: unknown }) => {
          const content =
            typeof value.content === 'object' &&
            value.content !== null &&
            'content' in value.content
              ? String((value.content as { content: unknown }).content)
              : String(value.content);
          return {
            role: 'user',
            content: { type: 'text', content },
          };
        },
      },
      tool: {
        convert: vi.fn(),
      },
    },
    logger: { warn: vi.fn(), error: vi.fn() } as never,
    features: {
      contextEnrichment: true,
      skills: true,
      tools: true,
      toolInteraction: true,
      toolCallStatus: true,
      conversationPersistence: true,
      toolCallSanitizer: true,
      knowledgeBase: true,
      subAgents: true,
    },
  };
}

const message = (content: string) => ({
  role: 'user' as const,
  content: { type: 'text' as const, content },
});

const tool = (name: string): ToolsEntity =>
  ({
    definition: { name, description: name },
    auto: false,
    execution: 'backend',
  }) as ToolsEntity;

it('runs on the model it was created with and exposes its tools', async () => {
  const defaultProvider = {} as LLMProvider;
  const context = new FixedAgentContextProvider({
    sessionId: 'context-session',
    agentContext: { state: { sessionId: 'context-session' } } as never,
    model: { llmService: 'default-service', model: 'default-model' },
    provider: defaultProvider,
    providerName: 'default-provider',
    systemPrompt: 'fixed prompt',
    tools: new Map([['search', tool('search')]]),
    activeTools: new Set(['search']),
  });
  await expect(context.getSystemPrompt([])).resolves.toBe('fixed prompt');
  await expect(context.discoveredTools()).resolves.toMatchObject({
    tools: new Map([['search', tool('search')]]),
  });
  // A request carries no model, so every call resolves the same one.
  await expect(context.resolveLLM()).resolves.toMatchObject({
    providerName: 'default-provider',
    model: 'default-model',
    provider: defaultProvider,
  });
  await expect(context.resolveLLM()).resolves.toMatchObject({
    model: 'default-model',
  });
});

it('creates a reusable Fixed AgentService through the factory with Memory Persistence', async () => {
  const fixture = await createTestAIEmployeeFixture();
  const persistence = new MemoryConversationPersistence('factory-memory');
  const provider = {
    createModel: () =>
      new FakeListChatModel({ responses: ['factory-first', 'factory-second'] }),
    resolveTools: () => [],
    prepareStoredAssistantAdditionalKwargs: (
      additionalKwargs?: Record<string, unknown>,
    ) => additionalKwargs,
  } as unknown as LLMProvider;
  vi.spyOn(
    fixture.deps.ai.llmProviderManager,
    'resolveModel',
  ).mockResolvedValue({
    llmService: 'memory-service',
    model: 'memory-model',
  });
  vi.spyOn(
    fixture.deps.ai.llmProviderManager,
    'getLLMService',
  ).mockResolvedValue({
    provider,
    model: 'memory-model',
    service: { name: 'memory-service', provider: 'memory-provider' },
  } as never);
  const factory = fixture.container.resolve(
    (await import('../server/agent/service/agent-service-factory.js'))
      .agentServiceFactoryToken,
  );
  const service = await factory.createAgent({
    sessionId: 'factory-memory',
    persistence,
    actor: { id: 1, roles: [], isRoot: false },
    runtime: { logger: fixture.deps.logging.getLogger('ai-employee-test') },
  });
  await service.invoke({ userMessages: [message('factory-one')] });
  await service.invoke({ userMessages: [message('factory-two')] });
  expect(
    persistence
      .messagesFor('factory-memory')
      .filter((item) => item.role === 'user'),
  ).toHaveLength(2);
});

describe('Fixed Agent and Memory Conversation Persistence', () => {
  it('persists ordered messages, threads, assistant usage, and every tool state', async () => {
    const persistence = new MemoryConversationPersistence('memory-session');
    const provider = createConversationProvider(persistence, 'memory-session');

    await provider.messages.saveUserMessages([message('one'), message('two')]);
    const saved = await provider.messages.saveAssistantMessage(
      {
        role: 'assistant',
        content: { type: 'text', content: 'answer' },
        metadata: {
          provider: 'memory-test',
          usage_metadata: { total_tokens: 3 },
        },
        toolCalls: [
          { id: 'pending', name: 'pending-tool', args: {} },
          { id: 'done', name: 'done-tool', args: {} },
          { id: 'error', name: 'error-tool', args: {} },
          { id: 'interrupted', name: 'interrupted-tool', args: {} },
          { id: 'confirmed', name: 'confirmed-tool', args: {} },
          { id: 'cancelled', name: 'cancelled-tool', args: {} },
        ],
      },
      new Map([
        ['pending-tool', tool('pending-tool')],
        ['done-tool', tool('done-tool')],
        ['error-tool', tool('error-tool')],
        ['interrupted-tool', tool('interrupted-tool')],
        ['confirmed-tool', tool('confirmed-tool')],
        ['cancelled-tool', tool('cancelled-tool')],
      ]),
    );

    const messageId = String(saved.message.messageId);
    expect(
      persistence.messagesFor('memory-session').map((item) => item.content),
    ).toEqual([
      { type: 'text', content: 'one' },
      { type: 'text', content: 'two' },
      { type: 'text', content: 'answer' },
    ]);
    expect(persistence.usageEventWrites).toHaveLength(1);
    expect(persistence.usageEventWrites[0]?.messageId).toBe(messageId);

    await provider.messages.updateToolPending(messageId, 'pending');
    await provider.messages.updateToolPending(messageId, 'done');
    await provider.messages.updateToolDone(messageId, 'done', {
      content: 'ok',
    });
    await provider.messages.updateToolPending(messageId, 'error');
    await provider.messages.updateToolError(
      messageId,
      'error',
      new Error('failed'),
    );
    await provider.messages.updateToolInterrupted(
      'memory-session',
      messageId,
      'interrupted',
      'interrupt-1',
      { order: 0, description: 'confirm' },
    );
    await provider.messages.saveToolMessages(messageId, [
      {
        role: 'tool',
        content: { type: 'text', content: 'confirmed' },
        metadata: { toolCallId: 'confirmed' },
      },
    ]);

    const states = new Map(
      persistence
        .toolMessagesFor('memory-session')
        .map((item) => [item.toolCallId, item.invokeStatus]),
    );
    expect(states.get('pending')).toBe('pending');
    expect(states.get('done')).toBe('done');
    expect(states.get('error')).toBe('done');
    expect(states.get('interrupted')).toBe('interrupted');
    expect(states.get('confirmed')).toBe('confirmed');
    expect(states.get('cancelled')).toBe('init');

    await provider.messages.saveUserMessages(
      [message('thread-two')],
      undefined,
      {
        sessionId: 'memory-session',
        thread: 1,
        threadId: 'memory-session:1',
      },
    );
    await expect(provider.messages.currentThread()).resolves.toMatchObject({
      thread: 1,
      threadId: 'memory-session:1',
    });
  });

  it('isolates stream cache sessions and honors skipped markers', async () => {
    const manager = new LLMStreamCachedManager(createCaching());
    const first = manager.getCached('first');
    const second = manager.getCached('second');
    await first.append('first-content');
    await first.skipped();
    await first.append('after-skip');
    await second.append('second-content');
    await second.append('"type":"stream_end"');
    await first.append('"type":"stream_end"');

    const firstChunks: string[] = [];
    for await (const chunk of first.stream({ initialWaitTimeout: 0 }))
      firstChunks.push(chunk);
    const secondChunks: string[] = [];
    for await (const chunk of second.stream({ initialWaitTimeout: 0 }))
      secondChunks.push(chunk);

    expect(firstChunks).toEqual(['after-skip', '"type":"stream_end"']);
    expect(secondChunks).toEqual(['second-content', '"type":"stream_end"']);
    await first.clear();
    const cleared: string[] = [];
    for await (const chunk of first.stream({ initialWaitTimeout: 0 }))
      cleared.push(chunk);
    expect(cleared).toEqual([]);
  });

  it('supports repeated Fixed Agent invocations with request-owned messages', async () => {
    const persistence = new MemoryConversationPersistence('fixed-session');
    const conversation = createConversationProvider(
      persistence,
      'fixed-session',
    );
    const seenMessages: string[] = [];
    const service = new AgentService(
      createProvider(conversation, ['first', 'second'], seenMessages),
    );

    await service.invoke({ userMessages: [message('request-one')] });
    await service.invoke({ userMessages: [message('request-two')] });

    expect(seenMessages).toEqual(['request-one', 'request-two']);
  });

  it('registers and aborts only the matching session handle', () => {
    const handles = new Map<
      string,
      Map<symbol, { abort(reason?: unknown): void }>
    >();
    const manager = {
      registerAgentAbortHandle: (
        sessionId: string,
        token: symbol,
        handle: { abort(reason?: unknown): void },
      ): void => {
        const sessionHandles = handles.get(sessionId) ?? new Map();
        sessionHandles.set(token, handle);
        handles.set(sessionId, sessionHandles);
      },
      unregisterAgentAbortHandle: (sessionId: string, token: symbol): void => {
        handles.get(sessionId)?.delete(token);
      },
    };
    const first = new ConversationProvider({
      sessionId: 'abort-first',
      persistence: new MemoryConversationPersistence('abort-first'),
      streamCache: new LLMStreamCachedManager(createCaching()),
      employeesManager: manager as never,
    });
    const second = new ConversationProvider({
      sessionId: 'abort-second',
      persistence: new MemoryConversationPersistence('abort-second'),
      streamCache: new LLMStreamCachedManager(createCaching()),
      employeesManager: manager as never,
    });
    const firstAbort = vi.fn();
    const secondAbort = vi.fn();
    const firstToken = Symbol('first');
    const secondToken = Symbol('second');
    first.abort.registerAbortHandle(firstToken, {
      signal: new AbortController().signal,
      abort: firstAbort,
    });
    second.abort.registerAbortHandle(secondToken, {
      signal: new AbortController().signal,
      abort: secondAbort,
    });
    for (const handle of handles.get('abort-first')?.values() ?? [])
      handle.abort('cancelled');
    expect(firstAbort).toHaveBeenCalledWith('cancelled');
    expect(secondAbort).not.toHaveBeenCalled();
    first.abort.unregisterAbortHandle(firstToken);
    expect(handles.get('abort-first')).toHaveLength(0);
  });
});
