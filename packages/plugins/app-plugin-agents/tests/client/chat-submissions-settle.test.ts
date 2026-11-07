import { expect, it, vi } from 'vitest';
import {
  ChatSubmissions,
  type ChatSubmissionApi,
} from '../../client/chat/submissions.js';
import type { AppUIMessage } from '../../client/chat.js';
import type { ConversationDetail } from '../../shared/conversations.js';

const page = (items: AppUIMessage[]) => ({
  items,
  lastSeq: items.length,
  hasMore: false,
  nextCursor: null,
});

/** A send whose response was lost: the request failed before the server's answer reached the page. */
async function lostSend(api: Partial<ChatSubmissionApi>) {
  const sendMessage = vi.fn(async () => {
    throw new TypeError('Load failed');
  });
  const messages = api.messages ?? vi.fn(async () => page([]));
  const submissions = new ChatSubmissions(
    {
      createConversation: vi.fn(),
      sendMessage,
      ...api,
      messages,
    } as ChatSubmissionApi,
    () => {},
  );
  submissions.submit({
    content: 'Hello',
    context: undefined,
    attachments: [],
    conversationId: 'c',
    editorKey: 'panel:c',
    create: {},
  });
  await vi.waitFor(() =>
    expect(submissions.snapshot()[0]?.status).toBe('unknown'),
  );
  // The automatic check after the failure never concludes anything.
  await vi.waitFor(() => expect(messages).toHaveBeenCalled());
  expect(submissions.snapshot()[0]?.status).toBe('unknown');
  return { submissions, clientId: submissions.snapshot()[0]!.clientId };
}

const idle = { id: 'c', execution: { status: 'idle' } } as ConversationDetail;

it('concludes a send was not written when an idle conversation and its complete history lack it', async () => {
  const { submissions, clientId } = await lostSend({
    conversation: async () => idle,
  });
  await submissions.reconcile(clientId, true);
  expect(submissions.snapshot()[0]?.status).toBe('notSubmitted');
  expect(submissions.editRejected(clientId)?.content).toBe('Hello');
});

it('confirms a lost send found in history instead of concluding it failed', async () => {
  let saved: AppUIMessage[] = [];
  const { submissions, clientId } = await lostSend({
    conversation: async () => idle,
    messages: vi.fn(async () => page(saved)),
  });
  saved = [
    {
      id: 'm1',
      role: 'user',
      parts: [{ type: 'text', text: 'Hello' }],
      metadata: { conversationId: 'c', clientId, seq: 1 } as never,
    },
  ];
  await submissions.reconcile(clientId, true);
  expect(submissions.snapshot()[0]?.status).toBe('confirmed');
});

it.each([
  ['a run is still open', { ...idle, run: { id: 'r', status: 'queued' } }],
  [
    'the conversation is running',
    { id: 'c', execution: { status: 'running' } },
  ],
])('keeps a lost send uncertain while %s', async (_case, detail) => {
  const { submissions, clientId } = await lostSend({
    conversation: async () => detail as ConversationDetail,
  });
  await submissions.reconcile(clientId, true);
  expect(submissions.snapshot()[0]?.status).toBe('unknown');
});

it('keeps a lost send uncertain when the conversation cannot be read', async () => {
  const { submissions, clientId } = await lostSend({
    conversation: async () => {
      throw new TypeError('Load failed');
    },
  });
  await submissions.reconcile(clientId, true);
  expect(submissions.snapshot()[0]?.status).toBe('unknown');
});
