/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AIMessage as LangChainAIMessage } from '@langchain/core/messages';
import { UniqueConstraintError } from '@nocobase/database';
import { createMockServer, MockServer } from '@nocobase/test';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createAIChatConversation } from '../manager/ai-chat-conversation';
import { AIEmployee } from '../ai-employees/ai-employee';
import { LLMProvider } from '../llm-providers/provider';
import PluginAIServer from '../plugin';

const sessionId = '76dd71a8-6550-4bb6-8198-ff8e73bc2ff1';
const interruptedContent = 'The tool call was interrupted because the conversation was aborted.';
const toolCalls = ['A', 'B', 'C'].map((suffix) => ({
  id: `call_${suffix}`,
  name: `tool${suffix}`,
  args: { suffix },
  type: 'tool_call' as const,
}));

const provider = {
  reshapeAIMessage: vi.fn(),
} as unknown as LLMProvider;

describe('AIEmployee aborted AI message persistence', () => {
  let app: MockServer;
  let employee: AIEmployee;

  beforeAll(async () => {
    app = await createMockServer({
      plugins: ['nocobase', 'field-sort', 'workflow'],
    });
    await app.pm.enable('ai');
  });

  beforeEach(async () => {
    await app.db.getModel('aiToolMessages').destroy({ where: {} });
    await app.db.getModel('aiMessages').destroy({ where: {} });
    await app.db.getModel('aiConversations').destroy({ where: {} });
    await app.db.getRepository('aiConversations').create({
      values: { sessionId, from: 'main-agent', category: 'chat' },
    });

    const ctx = {
      app,
      db: app.db,
      logger: app.logger,
    };
    employee = Object.create(AIEmployee.prototype) as AIEmployee;
    Reflect.set(employee, 'ctx', ctx);
    Reflect.set(employee, 'db', app.db);
    Reflect.set(employee, 'plugin', app.pm.get('ai') as PluginAIServer);
    Reflect.set(employee, 'sessionId', sessionId);
    Reflect.set(employee, 'employee', {
      username: 'test-employee',
      skillSettings: {},
      get: (key: string) => (key === 'username' ? 'test-employee' : undefined),
    });
    Reflect.set(employee, 'aiChatConversation', createAIChatConversation(ctx as never, sessionId));
    vi.spyOn(employee, 'getToolsMap').mockResolvedValue(
      new Map(
        toolCalls.map((toolCall) => [
          toolCall.name,
          {
            definition: { name: toolCall.name },
            defaultPermission: 'ALLOW',
            scope: 'BUILT_IN',
            execution: 'backend',
          },
        ]),
      ) as never,
    );
  });

  afterAll(async () => {
    await app.db.clean({ drop: true });
    await app.destroy();
  });

  function createMessage(id = 'langchain-message-1', calls = toolCalls) {
    return new LangChainAIMessage({
      id,
      content: 'Calling tools',
      tool_calls: calls,
    });
  }

  async function finalize(message = createMessage(), knownMessageId?: string) {
    return await employee.finalizeAbortedAIMessage({
      aiMessage: message,
      providerName: 'bedrock',
      provider,
      llmService: 'bedrock-service',
      model: 'claude',
      knownMessageId,
    });
  }

  async function listMessages() {
    return await app.db.getRepository('aiConversations.messages', sessionId).find({ sort: ['messageId'] });
  }

  async function listToolMessages() {
    return await app.db.getRepository('aiToolMessages').find({ sort: ['toolCallId'] });
  }

  it('atomically closes every tool call when an unsaved AI message is aborted', async () => {
    await finalize();

    const messages = await listMessages();
    const aiMessages = messages.filter((message) => message.role === 'test-employee');
    const resultMessages = messages.filter((message) => message.role === 'tool');
    const toolMessages = await listToolMessages();

    expect(aiMessages).toHaveLength(1);
    expect(aiMessages[0].metadata).toMatchObject({ id: 'langchain-message-1', interrupted: true });
    expect(aiMessages[0].toolCalls).toEqual(toolCalls);
    expect(resultMessages).toHaveLength(3);
    expect(toolMessages).toHaveLength(3);

    for (const toolCall of toolCalls) {
      const toolRecord = toolMessages.find((record) => record.toolCallId === toolCall.id);
      const resultMessage = resultMessages.find((message) => message.metadata.toolCallId === toolCall.id);
      expect(String(resultMessage?.metadata.messageId)).toBe(String(aiMessages[0].messageId));
      expect(toolRecord).toMatchObject({
        messageId: aiMessages[0].messageId,
        invokeStatus: 'confirmed',
        status: 'error',
        content: interruptedContent,
      });
      expect(resultMessage).toMatchObject({
        content: { type: 'text', content: interruptedContent },
        metadata: {
          toolCallId: toolCall.id,
          toolCall,
          autoCall: true,
          provider: 'bedrock',
          model: 'claude',
          llmService: 'bedrock-service',
        },
      });
    }
  });

  it('reuses a committed afterModel message even before its stream event is consumed', async () => {
    const message = createMessage();
    const values = {
      role: 'test-employee',
      content: { type: 'text', content: 'Calling tools' },
      metadata: { id: message.id, model: 'claude', provider: 'bedrock' },
      toolCalls,
    };
    const saved = await employee.persistAIMessage({
      values,
      langChainMessageId: message.id,
      toolCalls,
    });

    await finalize(message);

    const messages = await listMessages();
    expect(messages.filter((item) => item.role === 'test-employee')).toHaveLength(1);
    expect(messages.filter((item) => item.role === 'tool')).toHaveLength(3);
    expect((await listToolMessages()).map((item) => item.toolCallId)).toEqual(['call_A', 'call_B', 'call_C']);
    expect(String(saved.message.messageId)).toBe(
      String(messages.find((item) => item.role === 'test-employee')?.messageId),
    );
  });

  it('serializes concurrent afterModel and abort persistence for the same LangChain message', async () => {
    const message = createMessage('concurrent-message');
    const values = {
      role: 'test-employee',
      content: { type: 'text', content: 'Calling tools' },
      metadata: { id: message.id, model: 'claude', provider: 'bedrock' },
      toolCalls,
    };

    await Promise.all([
      employee.persistAIMessage({ values, langChainMessageId: message.id, toolCalls }),
      finalize(message),
    ]);

    const messages = await listMessages();
    expect(messages.filter((item) => item.role === 'test-employee')).toHaveLength(1);
    expect(messages.filter((item) => item.role === 'tool')).toHaveLength(3);
    expect(await listToolMessages()).toHaveLength(3);
  });

  it('retries after a tool-call unique conflict and reuses the winning transaction', async () => {
    const conversation = Reflect.get(employee, 'aiChatConversation');
    const originalWithTransaction = conversation.withTransaction.bind(conversation);
    const uniqueError = Object.create(UniqueConstraintError.prototype) as UniqueConstraintError;
    const withTransaction = vi
      .spyOn(conversation, 'withTransaction')
      .mockRejectedValueOnce(uniqueError)
      .mockImplementation(originalWithTransaction);

    await finalize(createMessage('unique-retry-message'));

    expect(withTransaction).toHaveBeenCalledTimes(2);
    expect((await listMessages()).filter((item) => item.role === 'test-employee')).toHaveLength(1);
    expect(await listToolMessages()).toHaveLength(3);
    withTransaction.mockRestore();
  });

  it('does not duplicate already confirmed tool results', async () => {
    const message = createMessage();
    const first = await finalize(message);

    await finalize(message, first?.message.messageId);

    const messages = await listMessages();
    const persistedAIMessage = messages.find((item) => item.role === 'test-employee');
    expect(messages.filter((item) => item.role === 'test-employee')).toHaveLength(1);
    expect(messages.filter((item) => item.role === 'tool')).toHaveLength(3);
    expect(persistedAIMessage?.metadata.interrupted).toBe(true);
    expect(await listToolMessages()).toHaveLength(3);
  });

  it('preserves completed afterModel results when abort arrives later', async () => {
    const message = createMessage('completed-message');
    const saved = await employee.persistAIMessage({
      values: {
        role: 'test-employee',
        content: { type: 'text', content: 'Calling tools' },
        metadata: { id: message.id, model: 'claude', provider: 'bedrock' },
        toolCalls,
      },
      langChainMessageId: message.id,
      toolCalls,
    });
    await app.db
      .getModel('aiToolMessages')
      .update(
        { invokeStatus: 'confirmed', status: 'success', content: 'completed' },
        { where: { messageId: saved.message.messageId } },
      );
    await createAIChatConversation(Reflect.get(employee, 'ctx'), sessionId).addMessages(
      toolCalls.map((toolCall) => ({
        role: 'tool',
        content: { type: 'text', content: 'completed' },
        metadata: {
          model: 'claude',
          provider: 'bedrock',
          messageId: saved.message.messageId,
          toolCallId: toolCall.id,
        },
      })),
    );

    await finalize(message, saved.message.messageId);

    const messages = await listMessages();
    const persistedAIMessage = messages.find((item) => item.role === 'test-employee');
    expect(messages.filter((item) => item.role === 'test-employee')).toHaveLength(1);
    expect(messages.filter((item) => item.role === 'tool')).toHaveLength(3);
    expect(persistedAIMessage?.metadata.interrupted).toBeUndefined();
    expect(await listToolMessages()).toEqual([
      expect.objectContaining({ invokeStatus: 'confirmed', status: 'success', content: 'completed' }),
      expect.objectContaining({ invokeStatus: 'confirmed', status: 'success', content: 'completed' }),
      expect.objectContaining({ invokeStatus: 'confirmed', status: 'success', content: 'completed' }),
    ]);
  });

  it('persists an interrupted text-only message without tool records', async () => {
    await finalize(createMessage('text-only-message', []));

    const messages = await listMessages();
    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatchObject({
      role: 'test-employee',
      metadata: { id: 'text-only-message', interrupted: true },
      toolCalls: null,
    });
    expect(await listToolMessages()).toHaveLength(0);
  });

  it('rolls back the AI message when tool initialization fails', async () => {
    vi.spyOn(employee, 'initToolCall').mockRejectedValueOnce(new Error('init failed'));

    await expect(finalize()).rejects.toThrow('init failed');
    expect(await listMessages()).toHaveLength(0);
    expect(await listToolMessages()).toHaveLength(0);
  });

  it('rolls back the AI message and tool records when ToolMessage creation fails', async () => {
    const conversation = Reflect.get(employee, 'aiChatConversation');
    const prototype = Object.getPrototypeOf(conversation);
    const originalAddMessages = prototype.addMessages;
    const addMessages = vi.spyOn(prototype, 'addMessages');
    addMessages.mockImplementation(async function (messages) {
      const list = Array.isArray(messages) ? messages : [messages];
      if (list.some((message) => message.role === 'tool')) {
        throw new Error('tool result create failed');
      }
      return await originalAddMessages.call(this, messages);
    });

    await expect(finalize()).rejects.toThrow('tool result create failed');
    expect(await listMessages()).toHaveLength(0);
    expect(await listToolMessages()).toHaveLength(0);
    addMessages.mockRestore();
  });

  it('rolls back all messages and tool records when the status update fails', async () => {
    const toolModel = app.db.getModel('aiToolMessages');
    const update = vi.spyOn(toolModel, 'update').mockRejectedValueOnce(new Error('status update failed'));

    await expect(finalize()).rejects.toThrow('status update failed');
    expect(await listMessages()).toHaveLength(0);
    expect(await listToolMessages()).toHaveLength(0);
    update.mockRestore();
  });
});
