/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AIMessage, BaseMessage, HumanMessage, SystemMessage, ToolMessage } from '@langchain/core/messages';
import { convertMessagesToCompletionsMessageParams } from '@langchain/openai';
import { ChatPromptValue } from '@langchain/core/prompt_values';
import { convertPromptToAnthropic } from '@langchain/anthropic';
import { FakeListChatModel } from '@langchain/core/utils/testing';
import { MemorySaver } from '@langchain/langgraph';
import { createAgent, createMiddleware } from 'langchain';
import { convertMessagesToResponsesInput } from '@langchain/openai';
import { describe, expect, it, vi } from 'vitest';
import { AIEmployee } from '../ai-employees/ai-employee';
import {
  isToolCallHistoryValid,
  normalizeToolCallHistory,
  toolCallSanitizerMiddleware,
  toolResultIntegrityMiddleware,
} from '../ai-employees/middleware';
import type { AIToolMessage } from '../types/ai-message.type';

type ModelRequest = { messages: BaseMessage[] };
type ModelHandler = (request: ModelRequest) => unknown;
type WrapModelCall = (request: ModelRequest, handler: ModelHandler) => unknown;

const getWrapModelCall = (middleware: ReturnType<typeof toolResultIntegrityMiddleware>): WrapModelCall => {
  const wrapModelCall = (middleware as unknown as { wrapModelCall?: unknown }).wrapModelCall;
  if (typeof wrapModelCall === 'function') {
    return wrapModelCall as WrapModelCall;
  }
  if (wrapModelCall && typeof wrapModelCall === 'object' && 'hook' in wrapModelCall) {
    return (wrapModelCall as { hook: WrapModelCall }).hook;
  }
  throw new Error('wrapModelCall is not callable');
};

const toolCall = (id: string, name = `tool_${id}`) => ({ id, name, args: { secret: id }, type: 'tool_call' as const });
const rawToolCall = (id: string, name = `tool_${id}`) => ({
  id,
  type: 'function' as const,
  function: { name, arguments: JSON.stringify({ secret: id }) },
});
const aiMessage = (id: string, callIds: string[], content = '') =>
  new AIMessage({
    id,
    content,
    tool_calls: callIds.map((callId) => toolCall(callId)),
    additional_kwargs: callIds.length
      ? {
          tool_calls: callIds.map((callId) => rawToolCall(callId)),
          __openai_function_call_ids__: Object.fromEntries(callIds.map((callId) => [callId, `output_${callId}`])),
        }
      : {},
  });
const toolMessage = (id: string, suffix = '') =>
  new ToolMessage({
    id: `result_${id}${suffix}`,
    tool_call_id: id,
    name: `tool_${id}`,
    content: `result ${id}${suffix}`,
    status: 'success',
    additional_kwargs: { preserved: true },
    response_metadata: { preserved: true },
    artifact: { preserved: true },
  });
const persistedToolMessage = (id: string, overrides: Partial<AIToolMessage> = {}): AIToolMessage => ({
  id: `db_${id}`,
  sessionId: 'session_1',
  messageId: 'message_1',
  toolCallId: id,
  toolName: `tool_${id}`,
  status: 'success',
  content: { value: id } as unknown as string,
  invokeStatus: 'confirmed',
  invokeStartTime: new Date(),
  invokeEndTime: new Date(),
  auto: true,
  execution: 'backend',
  ...overrides,
});

const normalize = async (
  messages: BaseMessage[],
  persistedResults = new Map<string, AIToolMessage>(),
  logger = { warn: vi.fn() },
) => {
  const loadToolResults = vi.fn().mockResolvedValue(persistedResults);
  const normalized = await normalizeToolCallHistory(messages, {
    sessionId: 'session_1',
    logger,
    loadToolResults,
  });
  return { normalized, loadToolResults, logger };
};

const messageShape = (messages: BaseMessage[]) =>
  messages.map((message) => {
    if (AIMessage.isInstance(message)) {
      return `ai:${message.tool_calls.map((call) => call.id).join(',')}`;
    }
    if (ToolMessage.isInstance(message)) {
      return `tool:${message.tool_call_id}`;
    }
    return message.getType();
  });

describe('toolResultIntegrityMiddleware', () => {
  it('uses a zero-allocation fast path for valid histories', async () => {
    const humanBefore = new HumanMessage('before');
    const ai = aiMessage('ai_1', ['A', 'B']);
    const resultA = toolMessage('A');
    const resultB = toolMessage('B');
    const humanAfter = new HumanMessage('after');
    const originalMessages = [humanBefore, ai, resultA, resultB, humanAfter];
    const loadToolResults = vi.fn();
    const logger = { warn: vi.fn() };
    const middleware = toolResultIntegrityMiddleware({ sessionId: 'session_1', loadToolResults, logger });
    const request = { messages: originalMessages };
    const handler = vi.fn((handlerRequest) => handlerRequest.messages);

    expect(isToolCallHistoryValid(originalMessages)).toBe(true);
    const result = await getWrapModelCall(middleware)(request, handler);

    expect(result).toBe(originalMessages);
    expect(request.messages).toBe(originalMessages);
    expect(handler.mock.calls[0][0].messages).toBe(originalMessages);
    expect(loadToolResults).not.toHaveBeenCalled();
    expect(logger.warn).not.toHaveBeenCalled();
    expect(originalMessages[1]).toBe(ai);
    expect(originalMessages[2]).toBe(resultA);
  });

  it('uses the fast path when contiguous tool results are complete but out of declaration order', async () => {
    const ai = aiMessage('ai_1', ['A', 'B']);
    const resultB = toolMessage('B');
    const resultA = toolMessage('A');
    const originalMessages = [ai, resultB, resultA, new HumanMessage('after')];
    const loadToolResults = vi.fn();
    const logger = { warn: vi.fn() };
    const middleware = toolResultIntegrityMiddleware({ sessionId: 'session_1', loadToolResults, logger });
    const request = { messages: originalMessages };
    const handler = vi.fn((handlerRequest) => handlerRequest.messages);

    expect(isToolCallHistoryValid(originalMessages)).toBe(true);
    const result = await getWrapModelCall(middleware)(request, handler);

    expect(result).toBe(originalMessages);
    expect(request.messages).toBe(originalMessages);
    expect(handler.mock.calls[0][0].messages).toBe(originalMessages);
    expect(originalMessages[1]).toBe(resultB);
    expect(originalMessages[2]).toBe(resultA);
    expect(loadToolResults).not.toHaveBeenCalled();
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('rejects duplicate or unrelated contiguous tool results even when result order is flexible', () => {
    const ai = aiMessage('ai_1', ['A', 'B']);

    expect(isToolCallHistoryValid([ai, toolMessage('B'), toolMessage('B')])).toBe(false);
    expect(isToolCallHistoryValid([ai, toolMessage('B'), toolMessage('C')])).toBe(false);
  });

  it('restores the real failed session shape before the next human messages', async () => {
    const messages = [
      new HumanMessage('start'),
      aiMessage('ai_1', ['call_00', 'call_01']),
      new HumanMessage('next'),
      new HumanMessage('again'),
    ];
    const persisted = new Map([
      ['call_00', persistedToolMessage('call_00', { status: 'error', content: 'aborted' })],
      ['call_01', persistedToolMessage('call_01', { status: 'error', content: 'aborted' })],
    ]);

    const { normalized, loadToolResults } = await normalize(messages, persisted);

    expect(messageShape(normalized)).toEqual([
      'human',
      'ai:call_00,call_01',
      'tool:call_00',
      'tool:call_01',
      'human',
      'human',
    ]);
    expect(loadToolResults).toHaveBeenCalledWith(['call_00', 'call_01']);
    expect((normalized[2] as ToolMessage).id).toBe('restored-tool-result:session_1:call_00');
    expect((normalized[2] as ToolMessage).status).toBe('error');
  });

  it('moves a misplaced existing result without querying the database and preserves the object', async () => {
    const existingResult = toolMessage('A');
    const human = new HumanMessage('next');
    const { normalized, loadToolResults } = await normalize([aiMessage('ai_1', ['A']), human, existingResult]);

    expect(messageShape(normalized)).toEqual(['ai:A', 'tool:A', 'human']);
    expect(normalized[1]).toBe(existingResult);
    expect(normalized[2]).toBe(human);
    expect(loadToolResults).not.toHaveBeenCalled();
  });

  it('queries and restores only the missing result while keeping all results contiguous', async () => {
    const resultA = toolMessage('A');
    const resultC = toolMessage('C');
    const { normalized, loadToolResults } = await normalize(
      [aiMessage('ai_1', ['A', 'B', 'C']), resultA, resultC],
      new Map([['B', persistedToolMessage('B')]]),
    );

    expect(messageShape(normalized)[0]).toBe('ai:A,B,C');
    expect(normalized.slice(1)).toHaveLength(3);
    expect(normalized.slice(1).every(ToolMessage.isInstance)).toBe(true);
    expect(new Set(normalized.slice(1).map((message) => (message as ToolMessage).tool_call_id))).toEqual(
      new Set(['A', 'B', 'C']),
    );
    expect(normalized).toContain(resultA);
    expect(normalized).toContain(resultC);
    expect(loadToolResults).toHaveBeenCalledTimes(1);
    expect(loadToolResults).toHaveBeenCalledWith(['B']);
  });

  it.each([
    ['no persisted record', new Map<string, AIToolMessage>()],
    ['non-terminal persisted record', new Map([['A', persistedToolMessage('A', { invokeStatus: 'pending' })]])],
  ])('creates a deterministic synthetic error for %s', async (_name, persisted) => {
    const { normalized } = await normalize([aiMessage('ai_1', ['A'])], persisted);
    const result = normalized[1] as ToolMessage;

    expect(result.id).toBe('synthetic-tool-result:session_1:A');
    expect(result.status).toBe('error');
    expect(JSON.parse(result.content as string)).toEqual({
      status: 'error',
      error: 'Tool execution was interrupted before a result was recorded.',
    });
  });

  it('degrades a database failure to a synthetic result without logging sensitive message data', async () => {
    const logger = { warn: vi.fn() };
    const loadToolResults = vi.fn(async () => {
      logger.warn('Failed to load persisted tool results before model call', {
        sessionId: 'session_1',
        error: new Error('database unavailable'),
      });
      return new Map<string, AIToolMessage>();
    });
    const middleware = toolResultIntegrityMiddleware({ sessionId: 'session_1', logger, loadToolResults });
    const messages = [new HumanMessage('private user input'), aiMessage('ai_1', ['A'])];
    const handler = vi.fn((request) => request.messages);

    const normalized = (await getWrapModelCall(middleware)({ messages }, handler)) as BaseMessage[];

    expect((normalized[2] as ToolMessage).status).toBe('error');
    expect(handler).toHaveBeenCalledTimes(1);
    const logs = JSON.stringify(logger.warn.mock.calls);
    expect(logs).not.toContain('private user input');
    expect(logs).not.toContain('secret');
    expect(logs).not.toContain('result A');
  });

  it('preserves AI messages unchanged while moving and restoring tool results', async () => {
    const content = [
      { type: 'tool_call', id: 'A', name: 'tool_A', args: { secret: 'A' } },
      { type: 'text', text: 'partial response' },
    ];
    const ai = new AIMessage({
      id: 'ai_1',
      content,
      tool_calls: [toolCall('A'), toolCall('B')],
      additional_kwargs: {
        tool_calls: [rawToolCall('A'), rawToolCall('B')],
        __openai_function_call_ids__: { A: 'output_A', B: 'output_B' },
      },
    });
    const existingResult = toolMessage('A');
    const human = new HumanMessage('next');

    const { normalized, loadToolResults } = await normalize(
      [ai, human, existingResult],
      new Map([['B', persistedToolMessage('B')]]),
    );

    expect(messageShape(normalized)).toEqual(['ai:A,B', 'tool:A', 'tool:B', 'human']);
    expect(normalized[0]).toBe(ai);
    expect(normalized[1]).toBe(existingResult);
    expect(ai.content).toBe(content);
    expect(ai.tool_calls.map((call) => call.id)).toEqual(['A', 'B']);
    expect((ai.additional_kwargs.tool_calls as Array<{ id: string }>).map((call) => call.id)).toEqual(['A', 'B']);
    expect(ai.additional_kwargs.__openai_function_call_ids__).toEqual({ A: 'output_A', B: 'output_B' });
    expect(loadToolResults).toHaveBeenCalledWith(['B']);
  });

  it('removes orphan and duplicate results, preserving only the first matching object', async () => {
    const first = toolMessage('A', '_first');
    const duplicate = toolMessage('A', '_duplicate');
    const orphan = toolMessage('orphan');
    const malformed = toolMessage('');
    const human = new HumanMessage('hello');
    const { normalized, logger } = await normalize([
      human,
      orphan,
      malformed,
      aiMessage('ai_1', ['A']),
      first,
      duplicate,
    ]);

    expect(messageShape(normalized)).toEqual(['human', 'ai:A', 'tool:A']);
    expect(normalized[2]).toBe(first);
    expect(normalized).not.toContain(duplicate);
    expect(normalized).not.toContain(orphan);
    expect(logger.warn).toHaveBeenCalledWith(
      'Normalize invalid tool call history before model call',
      expect.objectContaining({ orphanResultCount: 3 }),
    );
  });

  it('leaves raw-only AI messages unchanged and does not create false results', async () => {
    const rawOnly = new AIMessage({
      id: 'raw_only',
      content: '',
      additional_kwargs: {
        tool_calls: [{ ...rawToolCall('A'), function: { name: 'tool_A', arguments: '{bad json' } }],
        reasoning_content: 'preserve',
      },
    });
    const system = new SystemMessage('system');
    const { normalized, loadToolResults } = await normalize([rawOnly, system]);

    expect(messageShape(normalized)).toEqual(['ai:', 'system']);
    expect(normalized[0]).toBe(rawOnly);
    expect(rawOnly.additional_kwargs).toEqual({
      tool_calls: [{ ...rawToolCall('A'), function: { name: 'tool_A', arguments: '{bad json' } }],
      reasoning_content: 'preserve',
    });
    expect(loadToolResults).not.toHaveBeenCalled();
    expect(normalized.some(ToolMessage.isInstance)).toBe(false);
  });

  it('runs after the sanitizer in the real middleware pipeline without inventing raw-only tool results', async () => {
    let capturedMessages: BaseMessage[] = [];
    const loadToolResults = vi.fn();
    const agent = createAgent({
      model: new FakeListChatModel({ responses: ['done'] }),
      tools: [],
      middleware: [
        toolCallSanitizerMiddleware(),
        toolResultIntegrityMiddleware({ sessionId: 'session_1', loadToolResults }),
        createMiddleware({
          name: 'CaptureMessagesMiddleware',
          wrapModelCall: (request, handler) => {
            capturedMessages = request.messages;
            return handler(request);
          },
        }),
      ],
      checkpointer: new MemorySaver(),
    });

    await agent.invoke(
      {
        messages: [
          new AIMessage({
            id: 'raw_only',
            content: '',
            additional_kwargs: {
              tool_calls: [{ ...rawToolCall('A'), function: { name: 'tool_A', arguments: '{bad json' } }],
            },
          }),
          new HumanMessage('continue'),
        ],
      } as never,
      { configurable: { thread_id: 'sanitizer-integrity-order' } },
    );

    expect((capturedMessages[0] as AIMessage).tool_calls).toEqual([]);
    expect((capturedMessages[0] as AIMessage).additional_kwargs).not.toHaveProperty('tool_calls');
    expect(capturedMessages.some(ToolMessage.isInstance)).toBe(false);
    expect(loadToolResults).not.toHaveBeenCalled();
  });

  it('produces a valid OpenAI strict tool-message sequence after normalization', async () => {
    const { normalized } = await normalize([
      aiMessage('ai_1', ['A', 'B']),
      new HumanMessage('must come after outputs'),
      toolMessage('B'),
    ]);
    const providerMessages = convertMessagesToCompletionsMessageParams({ messages: normalized });

    expect(providerMessages[0].role).toBe('assistant');
    expect(providerMessages.at(-1)?.role).toBe('user');
    expect(
      new Set(
        providerMessages
          .filter((message) => message.role === 'tool')
          .map((message) => ('tool_call_id' in message ? message.tool_call_id : undefined)),
      ),
    ).toEqual(new Set(['A', 'B']));
    expect(isToolCallHistoryValid(normalized)).toBe(true);
  });

  it('produces complete OpenAI and DeepSeek Responses function call outputs before the next user message', async () => {
    const { normalized } = await normalize([
      aiMessage('ai_1', ['A', 'B']),
      new HumanMessage('must come after outputs'),
    ]);
    const input = convertMessagesToResponsesInput({
      model: 'deepseek-v4-flash',
      zdrEnabled: false,
      messages: normalized,
    });
    const functionCalls = input.filter((item) => item.type === 'function_call');
    const functionOutputs = input.filter((item) => item.type === 'function_call_output');

    expect(new Set(functionCalls.map((item) => item.call_id))).toEqual(new Set(['A', 'B']));
    expect(new Set(functionOutputs.map((item) => item.call_id))).toEqual(new Set(['A', 'B']));
    expect(input.at(-1)).toMatchObject({ type: 'message', role: 'user' });
  });

  it('produces complete Anthropic and Bedrock-compatible tool results before the next user message', async () => {
    const { normalized } = await normalize([aiMessage('ai_1', ['A']), new HumanMessage('must come after result')]);
    const payload = convertPromptToAnthropic(new ChatPromptValue(normalized));

    expect(payload.messages).toEqual([
      expect.objectContaining({
        role: 'assistant',
        content: [expect.objectContaining({ type: 'tool_use', id: 'A' })],
      }),
      expect.objectContaining({
        role: 'user',
        content: [expect.objectContaining({ type: 'tool_result', tool_use_id: 'A' })],
      }),
      expect.objectContaining({ role: 'user', content: 'must come after result' }),
    ]);
  });

  it('loads persisted results with session-scoped IDs and terminal-state precedence', async () => {
    const findAll = vi.fn().mockResolvedValue([
      { toJSON: () => ({ ...persistedToolMessage('A', { invokeStatus: 'done' }), updatedAt: '2026-01-03' }) },
      { toJSON: () => ({ ...persistedToolMessage('A', { invokeStatus: 'confirmed' }), updatedAt: '2026-01-01' }) },
      { toJSON: () => ({ ...persistedToolMessage('B', { invokeStatus: 'pending' }), updatedAt: '2026-01-04' }) },
      { toJSON: () => ({ ...persistedToolMessage('C', { invokeStatus: 'done' }), updatedAt: '2026-01-01' }) },
      {
        toJSON: () => ({
          ...persistedToolMessage('C', { invokeStatus: 'done', content: 'newer' }),
          updatedAt: '2026-01-02',
        }),
      },
    ]);
    const fakeEmployee = { sessionId: 'session_1', aiToolMessagesModel: { findAll } };

    const results = await AIEmployee.prototype.getToolCallResults.call(fakeEmployee as unknown as AIEmployee, [
      'A',
      'B',
      'C',
    ]);

    expect(findAll).toHaveBeenCalledWith({
      where: {
        sessionId: 'session_1',
        toolCallId: expect.any(Object),
      },
    });
    const where = findAll.mock.calls[0][0].where;
    expect(Reflect.ownKeys(where.toolCallId)).toHaveLength(1);
    expect(where.toolCallId[Reflect.ownKeys(where.toolCallId)[0]]).toEqual(['A', 'B', 'C']);
    expect(results.get('A')?.invokeStatus).toBe('confirmed');
    expect(results.has('B')).toBe(false);
    expect(results.get('C')?.content).toBe('newer');
  });
});
