import { expect, it, vi } from 'vitest';
import {
  ChatSubmissions,
  type ChatSubmissionApi,
} from '../../client/chat/submissions.js';
import type { AppUIMessage } from '../../client/chat.js';

const page = (items: AppUIMessage[]) => ({
  items,
  lastSeq: items.length,
  hasMore: false,
  nextCursor: null,
});

it('keeps a timed-out send uncertain while its history lacks it, since the server may still write it', async () => {
  let saved: AppUIMessage[] = [];
  let commit: () => void = () => {};
  // The page stops waiting after the deadline, but the server keeps admitting the request.
  const sendMessage = vi.fn(
    () =>
      new Promise<never>((_resolve, reject) => {
        commit = () => reject(new Error('response lost'));
      }),
  );
  const messages = vi.fn(async () => page(saved));
  const submissions = new ChatSubmissions(
    { createConversation: vi.fn(), sendMessage, messages } as ChatSubmissionApi,
    () => {},
    20,
  );
  submissions.submit({
    content: 'Please do this once',
    context: undefined,
    attachments: [],
    conversationId: 'c',
    editorKey: 'panel:c',
    create: {},
  });
  await vi.waitFor(() =>
    expect(submissions.snapshot()[0]?.status).toBe('unknown'),
  );
  const { clientId } = submissions.snapshot()[0]!;

  // A refresh while the conversation is idle and its complete history lacks the message.
  await submissions.reconcile(clientId);
  expect(submissions.snapshot()[0]?.status).toBe('unknown');
  expect(submissions.editRejected(clientId)).toBeNull();
  expect(submissions.blocked('c', 'panel:c')).toBe(true);

  // The original request commits after that refresh.
  saved = [
    {
      id: 'm1',
      role: 'user',
      parts: [{ type: 'text', text: 'Please do this once' }],
      metadata: { conversationId: 'c', clientId, seq: 1 } as never,
    },
  ];
  commit();
  await submissions.reconcile(clientId);
  expect(submissions.snapshot()[0]?.status).toBe('confirmed');
  expect(sendMessage).toHaveBeenCalledTimes(1);
});

it('still marks a send the server refused before writing it as not sent', async () => {
  const submissions = new ChatSubmissions(
    {
      createConversation: vi.fn(),
      sendMessage: vi.fn(async () => {
        throw { domain: 'agents', reason: 'CONFLICT' };
      }),
      messages: vi.fn(async () => page([])),
    } as ChatSubmissionApi,
    () => {},
  );
  submissions.submit({
    content: 'Refused',
    context: undefined,
    attachments: [],
    conversationId: 'c',
    editorKey: 'panel:c',
    create: {},
  });
  await vi.waitFor(() =>
    expect(submissions.snapshot()[0]?.status).toBe('notSubmitted'),
  );
  const { clientId } = submissions.snapshot()[0]!;
  expect(submissions.editRejected(clientId)?.content).toBe('Refused');
});
