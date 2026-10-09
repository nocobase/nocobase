import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ApiClientError,
  type RealtimeClient,
  type RealtimeListener,
} from '@nocobase/app-client';
import { useMailWorkspaceData } from '../../client/hooks/use-mail-workspace-data.js';
import type {
  MailClient,
  MailMessage,
  MailPage,
  MailAccountView,
} from '../../client/mail-client.js';

const transport = vi.hoisted(() => ({
  listener: undefined as RealtimeListener<unknown> | undefined,
}));
vi.mock('@nocobase/app-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/app-client')>();
  const realtime: Pick<RealtimeClient, 'subscribe' | 'onOpen'> = {
    subscribe: (_topic, listener) => {
      transport.listener = listener;
      return () => {
        transport.listener = undefined;
      };
    },
    onOpen: () => () => undefined,
  };
  return { ...actual, useService: () => realtime };
});

function message(id: string): MailMessage {
  return {
    id,
    accountId: 'account',
    providerMessageId: id,
    subject: id,
    text: id,
    to: [],
    cc: [],
    bcc: [],
    replyTo: [],
    references: [],
    folderIds: [],
    labelIds: [],
    attachments: [],
    read: true,
    starred: false,
    draft: false,
    hasAttachments: false,
  };
}

function setup() {
  const listMessages = vi
    .fn<MailClient['listMessages']>()
    .mockResolvedValue({ items: [message('selected')] });
  const getMessage = vi
    .fn<MailClient['getMessage']>()
    .mockResolvedValue(message('selected'));
  const listConversationMessages = vi
    .fn<MailClient['listConversationMessages']>()
    .mockResolvedValue({ items: [] });
  const updateMessage = vi
    .fn<MailClient['updateMessage']>()
    .mockImplementation(async (input) => ({
      ...message(input.messageId),
      read: input.read ?? true,
    }));
  const mail = {
    listMessages,
    getMessage,
    listConversationMessages,
    updateMessage,
  } as unknown as MailClient;
  const options = {
    mail,
    accounts: [{ id: 'account', status: 'active' }] as MailAccountView[],
    messageQuery: { pageSize: 50 },
    reloadVersion: 0,
    requestError: vi.fn(),
    setError: vi.fn(),
    onFocus: vi.fn(),
  };
  const hook = renderHook(() => useMailWorkspaceData(options));
  return {
    ...hook,
    options,
    listMessages,
    getMessage,
    listConversationMessages,
    updateMessage,
    requestError: options.requestError,
  };
}

function invalidate(): void {
  act(() =>
    transport.listener?.({ payload: { kind: 'mail.changed' } } as Parameters<
      RealtimeListener<unknown>
    >[0]),
  );
}

describe('workspace data invalidation', () => {
  beforeEach(() => {
    transport.listener = undefined;
  });

  it('preserves page and selection when focus supplies equivalent account objects', async () => {
    const { result, listMessages, options, rerender } = setup();
    listMessages.mockResolvedValueOnce({
      items: [message('selected')],
      nextCursor: 'page2',
    });
    await waitFor(() => expect(result.current.nextCursor).toBe('page2'));
    act(() => result.current.changeMessagePage(1));
    await waitFor(() => expect(result.current.pageIndex).toBe(1));
    act(() => result.current.selectMessage(message('selected')));
    await waitFor(() => expect(result.current.conversation).toHaveLength(1));
    options.accounts = options.accounts.map((account) => ({ ...account }));
    rerender();
    await act(async () => {});
    expect(result.current.pageIndex).toBe(1);
    expect(result.current.selected?.id).toBe('selected');
    expect(listMessages).toHaveBeenCalledTimes(2);
  });

  it('keeps explicitly unread messages unread through refresh and marks new replies only', async () => {
    const { result, getMessage, updateMessage } = setup();
    await waitFor(() => expect(result.current.messages).toHaveLength(1));
    act(() => result.current.selectMessage(message('selected')));
    await waitFor(() => expect(result.current.conversation).toHaveLength(1));
    const unread = { ...message('selected'), read: false };
    act(() => result.current.updateVisibleMessage(unread));
    getMessage.mockResolvedValue(unread);
    invalidate();
    await waitFor(() => expect(getMessage).toHaveBeenCalledTimes(2));
    expect(updateMessage).not.toHaveBeenCalled();
    expect(result.current.conversation[0]?.read).toBe(false);
  });

  it('bounds automatic reads and serializes a manual unread intent after an in-flight read', async () => {
    const { result, listConversationMessages, updateMessage } = setup();
    const pending: ReturnType<typeof Promise.withResolvers<MailMessage>>[] = [];
    updateMessage.mockImplementation((input) => {
      if (input.read === false)
        return Promise.resolve({ ...message(input.messageId), read: false });
      const request = Promise.withResolvers<MailMessage>();
      pending.push(request);
      return request.promise;
    });
    const items = Array.from({ length: 50 }, (_, index) => ({
      ...message(String(index)),
      read: false,
    }));
    listConversationMessages.mockResolvedValue({ items });
    await waitFor(() => expect(result.current.messages).toHaveLength(1));
    act(() =>
      result.current.selectMessage({ ...items[0], conversationId: 'thread' }),
    );
    await waitFor(() => expect(pending).toHaveLength(4));
    let manual: Promise<MailMessage>;
    act(() => {
      manual = result.current.setMessageRead(items[0], false);
    });
    expect(updateMessage).toHaveBeenCalledTimes(4);
    await act(async () => {
      pending[0].resolve(message('0'));
      result.current.updateVisibleMessage(await manual!);
    });
    expect(result.current.conversation[0]?.read).toBe(false);
    expect(updateMessage).toHaveBeenCalledWith({
      accountId: 'account',
      messageId: '0',
      read: false,
    });
    // Cancel queued automatic work when leaving the conversation.
    act(() => result.current.clearSelection());
    await act(async () => {
      for (const request of pending) request.resolve(message('other'));
    });
    expect(pending.length).toBeLessThanOrEqual(5);
  });

  it('continues queued reads when the same conversation is reopened while writes are pending', async () => {
    const { result, listConversationMessages, updateMessage } = setup();
    const items = Array.from({ length: 8 }, (_, index) => ({
      ...message(String(index)),
      read: false,
    }));
    const gate = Promise.withResolvers<void>();
    updateMessage.mockImplementation(async (input) => {
      await gate.promise;
      return message(input.messageId);
    });
    listConversationMessages.mockResolvedValue({ items });
    await waitFor(() => expect(result.current.messages).toHaveLength(1));
    act(() =>
      result.current.selectMessage({ ...items[0], conversationId: 'thread' }),
    );
    await waitFor(() => expect(updateMessage).toHaveBeenCalledTimes(4));
    act(() => result.current.clearSelection());
    act(() =>
      result.current.selectMessage({ ...items[0], conversationId: 'thread' }),
    );
    await waitFor(() => expect(result.current.conversation).toHaveLength(8));
    act(() =>
      result.current.updateVisibleMessage({ ...items[4], starred: true }),
    );
    await act(async () => {
      gate.resolve();
    });
    await waitFor(() => expect(updateMessage).toHaveBeenCalledTimes(8));
    expect(result.current.conversation.every((item) => item.read)).toBe(true);
  });

  it('recovers a failed initial list request when mail changes', async () => {
    const { result, listMessages, requestError } = setup();
    listMessages.mockRejectedValueOnce(new Error('Temporary failure'));
    await waitFor(() => expect(requestError).toHaveBeenCalledOnce());
    expect(result.current.loadingMessages).toBe(false);
    listMessages.mockResolvedValue({ items: [message('recovered')] });
    invalidate();
    await waitFor(() =>
      expect(result.current.messages[0]?.id).toBe('recovered'),
    );
  });

  it('marks new replies in the open conversation as read after a realtime refresh', async () => {
    const { result, listConversationMessages, updateMessage } = setup();
    listConversationMessages.mockResolvedValueOnce({
      items: [message('selected')],
    });
    await waitFor(() => expect(result.current.messages).toHaveLength(1));
    act(() =>
      result.current.selectMessage({
        ...message('selected'),
        conversationId: 'thread',
      }),
    );
    await waitFor(() => expect(result.current.conversation).toHaveLength(1));
    listConversationMessages.mockResolvedValue({
      items: [message('selected'), { ...message('reply'), read: false }],
    });
    invalidate();
    await waitFor(() => expect(result.current.conversation).toHaveLength(2));
    await waitFor(() =>
      expect(updateMessage).toHaveBeenCalledWith({
        accountId: 'account',
        messageId: 'reply',
        read: true,
      }),
    );
    await waitFor(() =>
      expect(result.current.conversation[1]?.read).toBe(true),
    );
    expect(updateMessage).toHaveBeenCalledOnce();
  });

  it('keeps a reader when new messages push its row off the current page', async () => {
    const { result, listMessages } = setup();
    await waitFor(() => expect(result.current.messages).toHaveLength(1));
    act(() => result.current.selectMessage(message('selected')));
    await waitFor(() => expect(result.current.conversation).toHaveLength(1));
    listMessages.mockResolvedValue({ items: [message('new')] });
    invalidate();
    await waitFor(() => expect(result.current.messages[0]?.id).toBe('new'));
    expect(result.current.selected?.id).toBe('selected');
    expect(result.current.conversation[0]?.id).toBe('selected');
  });

  it('applies list changes when the selected detail was deleted remotely', async () => {
    const { result, listMessages, getMessage, requestError } = setup();
    await waitFor(() => expect(result.current.messages).toHaveLength(1));
    act(() => result.current.selectMessage(message('selected')));
    await waitFor(() => expect(result.current.conversation).toHaveLength(1));
    listMessages.mockResolvedValue({ items: [message('remaining')] });
    getMessage.mockRejectedValue(
      new ApiClientError('Mail message was not found.', {
        status: 404,
        reason: 'MAIL_MESSAGE_NOT_FOUND',
        domain: 'mail',
        method: 'GET',
        url: '/api/mail/accounts/account/messages/selected',
      }),
    );
    invalidate();
    await waitFor(() =>
      expect(result.current.messages[0]?.id).toBe('remaining'),
    );
    expect(result.current.selected).toBeUndefined();
    expect(result.current.conversation).toHaveLength(0);
    expect(requestError).not.toHaveBeenCalled();
  });

  it('replays invalidations that arrive during a pending list request', async () => {
    const old = Promise.withResolvers<MailPage<MailMessage>>();
    const { result, listMessages } = setup();
    listMessages
      .mockImplementationOnce(() => old.promise)
      .mockResolvedValue({ items: [message('fresh')] });
    await waitFor(() => expect(listMessages).toHaveBeenCalledOnce());
    invalidate();
    await new Promise((resolve) => setTimeout(resolve, 150));
    await act(async () => {
      old.resolve({ items: [message('old')] });
      await old.promise;
    });
    await waitFor(() => expect(result.current.messages[0]?.id).toBe('fresh'));
  });

  it('does not let a stale refresh erase newly loaded conversation pages', async () => {
    const old = Promise.withResolvers<MailPage<MailMessage>>();
    const { result, listConversationMessages } = setup();
    listConversationMessages.mockResolvedValueOnce({
      items: [message('latest')],
      nextCursor: 'older',
    });
    await waitFor(() => expect(result.current.messages).toHaveLength(1));
    act(() =>
      result.current.selectMessage({
        ...message('selected'),
        conversationId: 'thread',
      }),
    );
    await waitFor(() =>
      expect(result.current.conversationCursor).toBe('older'),
    );
    listConversationMessages
      .mockImplementationOnce(() => old.promise)
      .mockResolvedValueOnce({
        items: [message('oldest')],
        nextCursor: undefined,
      });
    invalidate();
    await waitFor(() =>
      expect(listConversationMessages).toHaveBeenCalledTimes(2),
    );
    act(() => result.current.loadMoreConversation());
    await waitFor(() => expect(result.current.conversation).toHaveLength(2));
    await act(async () => {
      old.resolve({ items: [message('stale')] });
      await old.promise;
    });
    expect(result.current.conversation.map((item) => item.id)).toEqual([
      'oldest',
      'latest',
    ]);
    expect(result.current.conversationCursor).toBeUndefined();
  });

  it('replays changes received while the selected conversation is still loading', async () => {
    const old = Promise.withResolvers<MailPage<MailMessage>>();
    const { result, listConversationMessages } = setup();
    listConversationMessages
      .mockImplementationOnce(() => old.promise)
      .mockResolvedValue({ items: [message('fresh-reply')] });
    await waitFor(() => expect(result.current.messages).toHaveLength(1));
    act(() =>
      result.current.selectMessage({
        ...message('selected'),
        conversationId: 'thread',
      }),
    );
    await waitFor(() =>
      expect(listConversationMessages).toHaveBeenCalledOnce(),
    );
    invalidate();
    await new Promise((resolve) => setTimeout(resolve, 150));
    await act(async () => {
      old.resolve({ items: [message('old-reply')] });
      await old.promise;
    });
    await waitFor(() =>
      expect(result.current.conversation[0]?.id).toBe('fresh-reply'),
    );
  });

  it('refreshes an expanded conversation through provider-independent pagination', async () => {
    const { result, listConversationMessages } = setup();
    const items = Array.from({ length: 250 }, (_, index) =>
      message(`message-${index}`),
    );
    await waitFor(() => expect(result.current.messages).toHaveLength(1));
    listConversationMessages.mockResolvedValueOnce({
      items: items.slice(200),
      nextCursor: '200',
    });
    act(() =>
      result.current.selectMessage({
        ...message('selected'),
        conversationId: 'thread',
      }),
    );
    await waitFor(() => expect(result.current.conversation).toHaveLength(50));
    for (const end of [200, 150, 100, 50]) {
      listConversationMessages.mockResolvedValueOnce({
        items: items.slice(end - 50, end),
        nextCursor: end === 50 ? undefined : String(end - 50),
      });
      act(() => result.current.loadMoreConversation());
      await waitFor(() =>
        expect(result.current.conversation).toHaveLength(300 - end),
      );
    }
    listConversationMessages
      .mockResolvedValueOnce({ items: items.slice(50), nextCursor: '50' })
      .mockResolvedValueOnce({ items: items.slice(0, 50) });
    invalidate();
    await waitFor(() =>
      expect(listConversationMessages).toHaveBeenCalledTimes(7),
    );
    await waitFor(() => expect(result.current.conversation).toEqual(items));
    expect(listConversationMessages).toHaveBeenLastCalledWith(
      'account',
      'thread',
      { pageToken: '50', pageSize: 50 },
    );
  });
});
