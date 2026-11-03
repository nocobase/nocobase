/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AIMessage, BaseMessage, HumanMessage, ToolMessage } from '@langchain/core/messages';
import { FakeChatModel } from '@langchain/core/utils/testing';
import { Command, MemorySaver } from '@langchain/langgraph';
import { createAgent, createMiddleware, humanInTheLoopMiddleware, tool } from 'langchain';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { AIEmployee, ChatStreamProtocol } from '../ai-employee';
import type { LLMProvider } from '../../llm-providers/provider';

const conversation = { sessionId: 'session-1', from: 'main-agent', username: 'nathan' };
const toolCall = { id: 'read-1', name: 'readJSCode', args: {}, type: 'tool_call' as const };
const description = JSON.stringify({
  ...conversation,
  toolCallId: toolCall.id,
  toolCallName: toolCall.name,
});

function deferred() {
  let complete: () => void;
  const promise = new Promise<void>((resolve) => {
    complete = resolve;
  });
  return { promise, resolve: () => complete() };
}

class ReadCodeModel extends FakeChatModel {
  bindTools() {
    return this;
  }

  async _generate(messages: BaseMessage[]) {
    const message = messages.some(ToolMessage.isInstance)
      ? new AIMessage('Code read successfully')
      : new AIMessage({ content: '', tool_calls: [toolCall] });
    return { generations: [{ text: '', message }] };
  }
}

type StatusEvent = { type: string; body?: { invokeStatus?: string } };

function createEmployee(onEvent: (event: StatusEvent) => void) {
  const employee = Object.create(AIEmployee.prototype) as AIEmployee;
  const end = vi.fn();
  Reflect.set(employee, 'sessionId', conversation.sessionId);
  Reflect.set(employee, 'from', conversation.from);
  Reflect.set(employee, 'employee', { username: conversation.username });
  Reflect.set(employee, 'ctx', {
    log: { error: vi.fn() },
    res: { end, write: vi.fn(), headersSent: true },
    db: { getRepository: () => ({ update: vi.fn() }) },
  });
  Reflect.set(employee, 'streamCached', { skipped: vi.fn(), clear: vi.fn() });
  Reflect.set(
    employee,
    'protocol',
    new ChatStreamProtocol({
      write: (chunk: string) => onEvent(JSON.parse(chunk.slice('data: '.length)) as StatusEvent),
    }),
  );
  vi.spyOn(employee, 'getToolsMap').mockResolvedValue(new Map());
  vi.spyOn(employee, 'shouldInterruptToolCall').mockReturnValue(true);
  const updateInterrupted = vi.spyOn(employee, 'updateToolCallInterrupted').mockResolvedValue(1);
  return { employee, updateInterrupted, end };
}

const provider = {
  parseReasoningContent: () => null,
  parseResponseChunk: (content: unknown) => (typeof content === 'string' && content ? content : null),
  parseWebSearchAction: () => [],
  parseResponseError: (error: Error) => error.message,
} as unknown as LLMProvider;

function processStream(employee: AIEmployee, stream: AsyncIterable<unknown>, signal = new AbortController().signal) {
  return employee.processChatStream(stream, {
    signal,
    providerName: 'deepseek',
    model: 'deepseek-v4.1-flash',
    provider,
    responseMetadata: new Map(),
  });
}

describe('AIEmployee tool resume checkpoint ordering', () => {
  it('allows automatic frontend resume only after pending checkpoints are durable', async () => {
    const checkpointGate = deferred();
    const interruptEmitted = deferred();
    const checkpointer = new MemorySaver();
    const put = checkpointer.put.bind(checkpointer);
    vi.spyOn(checkpointer, 'put').mockImplementation(async (...args) => {
      const messages = args[1].channel_values.messages;
      if (Array.isArray(messages) && messages.some((message) => AIMessage.isInstance(message))) {
        await checkpointGate.promise;
      }
      return put(...args);
    });

    const readCode = vi.fn(async () => ({ code: 'ctx.render("hello")' }));
    const createReadAgent = () =>
      createAgent({
        model: new ReadCodeModel({}),
        tools: [tool(readCode, { name: toolCall.name, description: 'Read editor code', schema: z.object({}) })],
        middleware: [
          humanInTheLoopMiddleware({
            interruptOn: { readJSCode: { allowedDecisions: ['approve'], description } },
          }),
          createMiddleware({
            name: 'SaveAIMessage',
            afterModel: (state, runtime) => {
              runtime.writer?.({
                action: 'AfterAIMessageSaved',
                body: { id: state.messages.at(-1)?.id, messageId: '101' },
                currentConversation: conversation,
              });
            },
          }),
        ],
        checkpointer,
      });
    const config = { configurable: { thread_id: conversation.sessionId } };
    let resume: ReturnType<ReturnType<typeof createReadAgent>['invoke']> | undefined;
    const { employee, updateInterrupted } = createEmployee((event) => {
      if (event.type === 'tool_call_status' && event.body?.invokeStatus === 'interrupted') {
        const interruptId = updateInterrupted.mock.calls[0][3];
        resume = createReadAgent().invoke(
          new Command({ resume: { [interruptId]: { decisions: [{ type: 'approve' }] } } }),
          config,
        );
      }
    });

    async function* stream() {
      const chunks = await createReadAgent().stream(
        { messages: [new HumanMessage('Read block content')] },
        { ...config, streamMode: ['updates', 'messages', 'custom'], metadata: { currentConversation: conversation } },
      );
      for await (const chunk of chunks) {
        if (chunk[0] === 'updates' && chunk[1].__interrupt__) {
          interruptEmitted.resolve();
        }
        yield chunk;
      }
    }

    const processing = processStream(employee, stream());
    await interruptEmitted.promise;
    await new Promise<void>((resolve) => setImmediate(resolve));
    const notifiedBeforeCheckpoint = updateInterrupted.mock.calls.length > 0;
    checkpointGate.resolve();
    await processing;
    const result = await resume;

    expect(notifiedBeforeCheckpoint).toBe(false);
    expect(updateInterrupted).toHaveBeenCalledTimes(1);
    expect(readCode).toHaveBeenCalledTimes(1);
    expect(result?.messages.filter(ToolMessage.isInstance)).toEqual([
      expect.objectContaining({ tool_call_id: toolCall.id, content: JSON.stringify({ code: 'ctx.render("hello")' }) }),
    ]);
  });

  it.each(['aborted', 'failed'] as const)(
    'does not publish an interrupt when the stream is %s before draining',
    async (mode) => {
      const controller = new AbortController();
      const events: StatusEvent[] = [];
      const { employee, updateInterrupted, end } = createEmployee((event) => events.push(event));
      async function* stream() {
        yield [
          'custom',
          { action: 'AfterAIMessageSaved', body: { id: 'ai-1', messageId: '101' }, currentConversation: conversation },
        ];
        yield [
          'updates',
          {
            __interrupt__: [
              {
                id: 'interrupt-1',
                value: {
                  actionRequests: [{ name: toolCall.name, args: {}, description }],
                  reviewConfigs: [{ actionName: toolCall.name, allowedDecisions: ['approve'] }],
                },
              },
            ],
          },
        ];
        if (mode === 'failed') {
          throw new Error('Checkpoint persistence failed');
        }
        controller.abort();
      }

      await processStream(employee, stream(), controller.signal);

      expect(updateInterrupted).not.toHaveBeenCalled();
      expect(events.some((event) => event.body?.invokeStatus === 'interrupted')).toBe(false);
      expect(end).toHaveBeenCalled();
    },
  );
});
