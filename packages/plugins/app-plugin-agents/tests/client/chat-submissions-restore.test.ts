import { expect, it, vi } from 'vitest';
import {
  ChatSubmissions,
  type ChatSubmissionApi,
} from '../../client/chat/submissions.js';
import type { ConversationDetail } from '../../shared/conversations.js';

function queue(api: Partial<ChatSubmissionApi> = {}) {
  return new ChatSubmissions(
    {
      createConversation: vi.fn(),
      messages: vi.fn(),
      sendMessage: vi.fn(),
      ...api,
    } as ChatSubmissionApi,
    () => {},
  );
}
const refused = {
  clientId: 'kept-1',
  createdAt: '2026-11-06T00:00:00.000Z',
  agentId: 'other-agent',
  content: 'Hello',
  context: undefined,
  attachments: [
    {
      id: 'f1',
      filename: 'a.txt',
      mimetype: 'text/plain',
      size: 1,
      url: '/f1',
    },
  ] as never,
  conversationId: 'c',
  editorKey: 'panel:c',
  create: {},
  error: { reason: 'CONFLICT' },
};

it('puts a refused message back without sending it', () => {
  const sendMessage = vi.fn();
  const submissions = queue({ sendMessage });
  expect(submissions.restore(refused)).toBe(true);
  const [record] = submissions.snapshot();
  expect(record).toMatchObject({
    clientId: 'kept-1',
    status: 'notSubmitted',
    agentId: 'other-agent',
    attachments: refused.attachments,
    error: refused.error,
  });
  expect(sendMessage).not.toHaveBeenCalled();
  // It holds the conversation's composer until it is put back, as a refusal does.
  expect(submissions.blocked('c', 'panel:c')).toBe(true);
  expect(submissions.editRejected('kept-1')?.content).toBe('Hello');
  expect(submissions.blocked('c', 'panel:c')).toBe(false);
});

it('refuses a known message or a conversation with a message in flight', () => {
  const submissions = queue({ sendMessage: () => new Promise(() => {}) });
  expect(submissions.restore(refused)).toBe(true);
  expect(submissions.restore(refused)).toBe(false);
  const other = queue({ sendMessage: () => new Promise(() => {}) });
  other.submit({
    content: 'In flight',
    context: undefined,
    attachments: [],
    conversationId: 'c',
    editorKey: 'panel:c',
    create: {},
  });
  expect(other.restore(refused)).toBe(false);
  expect(other.snapshot()).toHaveLength(1);
});

it('sends a restored message again with its agent once it is put back', async () => {
  const sendMessage = vi.fn(async () => ({
    message: {
      id: 'm',
      role: 'user',
      parts: [],
      metadata: { conversationId: 'c' },
    },
    conversation: { id: 'c' } as ConversationDetail,
  }));
  const submissions = queue({ sendMessage } as never);
  submissions.restore(refused);
  const { agentId, content, context, attachments, conversationId, editorKey } =
    submissions.editRejected('kept-1')!;
  expect(
    submissions.submit({
      agentId,
      content,
      context,
      attachments,
      conversationId,
      editorKey,
      create: {},
    }),
  ).toBe(true);
  await vi.waitFor(() =>
    expect(submissions.snapshot().at(-1)?.status).toBe('confirmed'),
  );
  expect(sendMessage).toHaveBeenCalledWith(
    'c',
    expect.objectContaining({
      agentId: 'other-agent',
      content: 'Hello',
      attachmentIds: ['f1'],
    }),
  );
});
