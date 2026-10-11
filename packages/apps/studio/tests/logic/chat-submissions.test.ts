import { describe, expect, it, vi } from 'vitest';
import type { ChatApi } from '@nocobase/app-plugin-agents/client/chat';
import type {
  ConversationDetail,
  ConversationMessage,
} from '@nocobase/app-plugin-agents/shared/conversations';
import {
  ChatSubmissions,
  type SubmissionInput,
} from '../../client/agents/chat-submissions.js';

const detail = { id: 'c1' } as ConversationDetail;
const input: SubmissionInput = {
  content: 'Question\nnext line',
  context: { route: '/issues/12', items: [{ kind: 'issue', id: '12' }] },
  attachments: [],
  conversationId: 'c1',
  editorKey: 'panel:c1',
  create: { source: 'panel' },
};
function setup() {
  const api = {
    createConversation: vi.fn(async () => detail),
    sendMessage: vi.fn(async (_id: string, request: { clientId?: string }) => ({
      conversation: detail,
      message: {
        id: 'm1',
        seq: 1,
        metadata: { clientId: request.clientId },
      } as ConversationMessage,
    })),
    messages: vi.fn(async () => ({
      items: [] as ConversationMessage[],
      hasMore: false,
      lastSeq: 0,
      nextCursor: null as string | null,
    })),
  };
  const updated = vi.fn();
  const store = new ChatSubmissions(
    api as Pick<ChatApi, 'createConversation' | 'sendMessage' | 'messages'>,
    updated,
    20,
  );
  return { api, updated, store };
}
describe('stable submissions', () => {
  it('registers synchronously, prevents doubles, preserves submitted snapshot', async () => {
    const { api, store } = setup();
    const context = {
      route: '/issues/12',
      items: [{ kind: 'issue', id: '12' }],
    };
    expect(store.submit({ ...input, context })).toBe(true);
    expect(store.submit(input)).toBe(false);
    context.items[0]!.id = 'changed';
    await vi.waitFor(() =>
      expect(store.snapshot()[0]?.status).toBe('confirmed'),
    );
    expect(api.sendMessage).toHaveBeenCalledTimes(1);
    expect(store.snapshot()[0]?.context?.items[0]?.id).toBe('12');
  });
  it('reconciles a saved message after a lost response without a second POST', async () => {
    const { api, store } = setup();
    api.sendMessage.mockRejectedValue(new Error('Response lost'));
    store.submit(input);
    const record = store.snapshot()[0]!;
    api.messages.mockResolvedValue({
      items: [
        {
          id: 'saved',
          metadata: { clientId: record.clientId },
        } as ConversationMessage,
      ],
      hasMore: false,
      lastSeq: 1,
      nextCursor: null,
    });
    await vi.waitFor(() => expect(record.status).toBe('confirmed'));
    expect(api.sendMessage).toHaveBeenCalledTimes(1);
  });
  it('an absent message or failed read keeps result unknown and frozen', async () => {
    const { api, store } = setup();
    api.sendMessage.mockRejectedValue(new Error('Network'));
    store.submit(input);
    await vi.waitFor(() => expect(store.snapshot()[0]?.status).toBe('unknown'));
    expect(store.submit(input)).toBe(false);
    api.messages.mockRejectedValue(new Error('Read failed'));
    await store.reconcile(store.snapshot()[0]!.clientId);
    expect(store.snapshot()[0]?.status).toBe('unknown');
    expect(api.sendMessage).toHaveBeenCalledTimes(1);
  });
  it('reads all pages before leaving a saved question unknown', async () => {
    const { api, store } = setup();
    api.sendMessage.mockRejectedValue(new Error('Network'));
    store.submit(input);
    const record = store.snapshot()[0]!;
    api.messages
      .mockResolvedValueOnce({
        items: [],
        hasMore: true,
        lastSeq: 3,
        nextCursor: 'older',
      })
      .mockResolvedValueOnce({
        items: [
          {
            id: 'saved',
            metadata: { clientId: record.clientId },
          } as ConversationMessage,
        ],
        hasMore: false,
        lastSeq: 3,
        nextCursor: null,
      });
    await vi.waitFor(() => expect(record.status).toBe('confirmed'));
    expect(api.messages.mock.calls[1]).toEqual(['c1', { pageToken: 'older' }]);
  });
  it('losing creation response never sends or automatically creates again', async () => {
    const { api, store } = setup();
    api.createConversation.mockRejectedValue(new Error('Lost'));
    store.submit({ ...input, conversationId: null });
    await vi.waitFor(() =>
      expect(store.snapshot()[0]?.status).toBe('creationUnknown'),
    );
    expect(api.sendMessage).not.toHaveBeenCalled();
    expect(api.createConversation).toHaveBeenCalledTimes(1);
    expect(store.resumeCreation(store.snapshot()[0]!.clientId, 'chosen')).toBe(
      true,
    );
    await vi.waitFor(() => expect(api.sendMessage).toHaveBeenCalledTimes(1));
    expect(api.sendMessage.mock.calls[0]?.[0]).toBe('chosen');
  });
  it('late creation cannot rebind after user chooses another target', async () => {
    const { api, store, updated } = setup();
    let resolve!: (value: ConversationDetail) => void;
    api.createConversation.mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    store.submit({ ...input, conversationId: null });
    await vi.waitFor(() =>
      expect(store.snapshot()[0]?.status).toBe('creationUnknown'),
    );
    store.resumeCreation(store.snapshot()[0]!.clientId, 'chosen');
    resolve({ id: 'late' } as ConversationDetail);
    await vi.waitFor(() => expect(api.sendMessage).toHaveBeenCalledTimes(1));
    expect(updated.mock.calls.some(([value]) => value.id === 'late')).toBe(
      false,
    );
  });
  it('identity exit invalidates a queued creation before deferred disposal', async () => {
    const { api, store, updated } = setup();
    let resolve!: (value: ConversationDetail) => void;
    api.createConversation.mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    store.submit({ ...input, conversationId: null });
    resolve(detail);
    store.invalidate();
    await Promise.resolve();
    await Promise.resolve();
    expect(api.sendMessage).not.toHaveBeenCalled();
    expect(updated).not.toHaveBeenCalled();
    store.dispose();
    expect(store.snapshot()).toEqual([]);
  });
  it('server realtime confirmation wins over a late network error', async () => {
    const { api, store } = setup();
    let reject!: (error: Error) => void;
    api.sendMessage.mockImplementation(
      () =>
        new Promise((_resolve, fail) => {
          reject = fail;
        }),
    );
    store.submit(input);
    const record = store.snapshot()[0]!;
    store.observe('c1', [
      {
        id: 'saved',
        metadata: { clientId: record.clientId },
      } as ConversationMessage,
    ]);
    reject(new Error('Lost'));
    await Promise.resolve();
    await Promise.resolve();
    expect(record.status).toBe('confirmed');
  });
  it('only audited errors permit editing, never all 4xx or missing-conversation errors', async () => {
    const { api, store } = setup();
    api.sendMessage.mockRejectedValue({
      domain: 'agents',
      reason: 'FORBIDDEN',
    });
    store.submit(input);
    await vi.waitFor(() =>
      expect(store.snapshot()[0]?.status).toBe('notSubmitted'),
    );
    expect(store.editRejected(store.snapshot()[0]!.clientId)?.content).toBe(
      input.content,
    );
    api.sendMessage.mockRejectedValue({
      domain: 'agents',
      reason: 'CONVERSATION_NOT_FOUND',
      status: 404,
    });
    store.submit(input);
    await vi.waitFor(() => expect(store.snapshot()[1]?.status).toBe('unknown'));
    expect(store.editRejected(store.snapshot()[1]!.clientId)).toBeNull();
  });
});
