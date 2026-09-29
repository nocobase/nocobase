/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { AIEmployee } from '../ai-employee';
import type { LLMProvider } from '../../llm-providers/provider';
import type { KnowledgeBaseReference } from '../../types';

const conversation = { sessionId: 'session-1', from: 'main-agent', username: 'employee' };
const subAgentConversation = { sessionId: 'session-2', from: 'sub-agent', username: 'helper' };

const handbook = { id: 1, title: 'Handbook', extname: '.pdf', url: '/files/main/main/aiKnowledgeBaseDocs/1.pdf' };
const policy = { id: 2, title: 'Policy', extname: '.pdf', url: '/files/main/main/aiKnowledgeBaseDocs/2.pdf' };
const guide = { id: 3, title: 'Guide', extname: '.md', url: '/files/main/main/aiKnowledgeBaseDocs/3.md' };

type ReferenceEvent = { conversation: { sessionId: string; from: string }; body: unknown } | string;

function createProtocol(referenceEvents: ReferenceEvent[]) {
  return {
    statistics: { sent: 1 },
    with: (current: { sessionId: string; from: string }) => ({
      startStream: async () => {
        referenceEvents.push('stream_start');
      },
      endStream: async () => {
        referenceEvents.push('stream_end');
      },
      newMessage: async () => {},
      toolCalls: async () => {},
      knowledgeBaseReferences: async (body: unknown) => {
        referenceEvents.push({ conversation: current, body });
      },
    }),
  };
}

function createFakeEmployee(referenceEvents: ReferenceEvent[], metadata: Record<string, unknown> = { id: 'lc-2' }) {
  const aiMessagesModel = {
    findOne: vi.fn().mockResolvedValue({ get: (field: string) => (field === 'metadata' ? metadata : undefined) }),
    update: vi.fn().mockResolvedValue([1]),
  };
  const fakeEmployee = {
    protocol: createProtocol(referenceEvents),
    sessionId: conversation.sessionId,
    from: conversation.from,
    employee: { username: conversation.username },
    ctx: { log: { error: vi.fn() }, res: { end: vi.fn() } },
    logger: { error: vi.fn() },
    streamCached: { skipped: vi.fn() },
    aiMessagesModel,
    sendErrorResponse: vi.fn(),
    sendSpecificError: vi.fn(),
    saveKnowledgeBaseReferences: Reflect.get(AIEmployee.prototype, 'saveKnowledgeBaseReferences'),
  };
  return { fakeEmployee, aiMessagesModel };
}

async function runStream(
  fakeEmployee: ReturnType<typeof createFakeEmployee>['fakeEmployee'],
  chunks: unknown[],
  knowledgeBaseDocuments?: KnowledgeBaseReference[],
) {
  async function* stream() {
    for (const chunk of chunks) {
      yield ['custom', chunk];
    }
  }
  await AIEmployee.prototype.processChatStream.call(fakeEmployee, stream(), {
    signal: new AbortController().signal,
    providerName: 'deepseek',
    model: 'deepseek-v4-flash',
    provider: { parseResponseError: (error: Error) => error.message } as unknown as LLMProvider,
    responseMetadata: new Map(),
    knowledgeBaseDocuments,
  });
}

describe('AIEmployee knowledge base references', () => {
  it('streams pre-retrieved and tool-retrieved documents and saves them on the last AI message', async () => {
    const referenceEvents: ReferenceEvent[] = [];
    const { fakeEmployee, aiMessagesModel } = createFakeEmployee(referenceEvents);

    await runStream(
      fakeEmployee,
      [
        { action: 'AfterAIMessageSaved', body: { id: 'lc-1', messageId: '101' }, currentConversation: conversation },
        {
          action: 'knowledgeBaseRetrieved',
          body: { toolCallId: 'call-1', documents: [handbook, policy] },
          currentConversation: { sessionId: conversation.sessionId, username: conversation.username },
        },
        {
          action: 'knowledgeBaseRetrieved',
          body: { toolCallId: 'call-2', documents: [guide] },
          currentConversation: { sessionId: subAgentConversation.sessionId, username: subAgentConversation.username },
        },
        {
          action: 'AfterAIMessageSaved',
          body: { id: 'lc-sub', messageId: '201' },
          currentConversation: subAgentConversation,
        },
        { action: 'AfterAIMessageSaved', body: { id: 'lc-2', messageId: '102' }, currentConversation: conversation },
      ],
      [handbook],
    );

    expect(referenceEvents).toEqual([
      'stream_start',
      { conversation, body: { documents: [handbook] } },
      {
        conversation: { sessionId: conversation.sessionId, username: conversation.username, from: 'main-agent' },
        body: { toolCallId: 'call-1', documents: [handbook, policy] },
      },
      {
        conversation: { sessionId: subAgentConversation.sessionId, username: 'helper', from: 'sub-agent' },
        body: { toolCallId: 'call-2', documents: [guide] },
      },
      'stream_end',
    ]);
    expect(aiMessagesModel.update).toHaveBeenCalledTimes(1);
    expect(aiMessagesModel.update).toHaveBeenCalledWith(
      { metadata: { id: 'lc-2', knowledgeBaseReferences: [handbook, policy, guide] } },
      { where: { sessionId: conversation.sessionId, messageId: '102' } },
    );
  });

  it('does not write metadata when no documents were retrieved', async () => {
    const referenceEvents: ReferenceEvent[] = [];
    const { fakeEmployee, aiMessagesModel } = createFakeEmployee(referenceEvents);

    await runStream(fakeEmployee, [
      { action: 'AfterAIMessageSaved', body: { id: 'lc-1', messageId: '101' }, currentConversation: conversation },
    ]);

    expect(referenceEvents).toEqual(['stream_start', 'stream_end']);
    expect(aiMessagesModel.update).not.toHaveBeenCalled();
  });
});
