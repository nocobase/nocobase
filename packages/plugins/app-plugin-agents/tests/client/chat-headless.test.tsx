// @vitest-environment jsdom
/**
 * The chat's headless exports, as an application's own chat UI uses them: the data hooks read this plugin's cache
 * whatever `QueryClientProvider` is above them (or none), and `ChatProvider` holds the one realtime subscription.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, renderHook, waitFor } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  CONVERSATIONS_TOPIC,
  type ChatAgent,
  type ConversationSummary,
} from '../../shared/conversations.js';
import { callsTo, clientMocks, realtime, resetApi } from './fake-client.js';

vi.mock('@nocobase/app-client', () => clientMocks.appClient());
vi.mock('@nocobase/i18n/client', () => clientMocks.i18n());
vi.mock('@nocobase/app-plugin-authorization/client', () =>
  clientMocks.authorization(),
);

const chat = await import('../../client/chat.js');
const { agentsQueryClient } = await import('../../client/query.js');
const { CHAT_PANEL_STORAGE_KEY } = chat;

const AT = '2026-10-01T08:00:00.000Z';

function agent(id: string): ChatAgent {
  return {
    id,
    name: `Agent ${id}`,
    description: null,
    avatar: null,
    type: 'runner',
    models: [],
    personal: false,
    isSystemDefault: false,
    isMyDefault: false,
    availability: { online: true, reason: null, onlineRunners: 1 },
    fallbackAgentId: null,
  };
}

function summary(id: string): ConversationSummary {
  return {
    id,
    title: `Conversation ${id}`,
    titleSource: 'auto',
    category: 'chat',
    source: 'panel',
    mode: 'runner',
    agent: { id: 'pm', name: 'Project manager', avatar: null, archived: false },
    fallbackFrom: null,
    model: null,
    read: true,
    lastMessageAt: AT,
    archivedAt: null,
    createdAt: AT,
    updatedAt: AT,
    run: null,
  };
}

function topicListeners(): number {
  return realtime.listeners.get(CONVERSATIONS_TOPIC)?.size ?? 0;
}

beforeEach(() => {
  const client = agentsQueryClient();
  client.clear();
  client.setDefaultOptions({ queries: { retry: false } });
  realtime.listeners.clear();
  window.sessionStorage.clear();
  resetApi({
    'agents/chatAgents': () => [agent('pm')],
    'agents/conversations': (request) =>
      request.query.pageToken === 'next'
        ? { data: [summary('c3')], meta: {} }
        : {
            data: [summary('c1'), summary('c2')],
            meta: { nextPageToken: 'next' },
          },
  });
});

describe('headless chat hooks', () => {
  it('upload a file to send, discard one, and send the files of a message by their ids', async () => {
    const file = {
      id: 'f1',
      filename: 'log.txt',
      ext: 'txt',
      mimeType: 'text/plain',
      size: 3,
      contentUrl: '/api/agents/chatAttachments/f1/content',
      downloadUrl: '/api/agents/chatAttachments/f1/content?download=true',
      previewable: false,
    };
    resetApi({
      'POST agents/chatAttachments': () => file,
      'DELETE agents/chatAttachments/f1': () => undefined,
      'POST agents/conversations/c1/messages': (request) => ({
        message: { id: 'm1', seq: 1, attachments: [file] },
        run: null,
        conversation: summary('c1'),
        echo: request.json,
      }),
    });
    const { result } = renderHook(() => chat.useChatAttachments());
    const uploaded = await result.current.upload(
      new File(['log'], 'log.txt', { type: 'text/plain' }),
    );
    expect(uploaded).toEqual(file);
    expect(callsTo('POST', 'agents/chatAttachments')).toHaveLength(1);
    result.current.discard(uploaded);
    await waitFor(() =>
      expect(callsTo('DELETE', 'agents/chatAttachments/f1')).toHaveLength(1),
    );

    const dispatch = vi.fn();
    const { result: send } = renderHook(() =>
      chat.useSendMessage({
        conversationId: 'c1',
        agentId: 'pm',
        source: 'panel',
        dispatch,
        onCreated: () => undefined,
      }),
    );
    await act(async () => {
      await send.current({
        content: '',
        context: undefined,
        attachments: [file],
      });
    });
    expect(
      callsTo('POST', 'agents/conversations/c1/messages')[0]?.json,
    ).toEqual({
      content: '',
      clientId: expect.any(String),
      attachmentIds: ['f1'],
    });
    expect(dispatch.mock.calls[0]?.[0]).toMatchObject({
      type: 'sending',
      message: { attachments: [file] },
    });
  });

  it('read this plugin’s cache without a QueryClientProvider', async () => {
    const { result } = renderHook(() => chat.useChatAgents());
    await waitFor(() => expect(result.current.data).toHaveLength(1));
    expect(agentsQueryClient().getQueryData(chat.chatKeys.agents)).toEqual(
      result.current.data,
    );
  });

  it('ignore another cache above them', async () => {
    const other = new QueryClient();
    const { result } = renderHook(() => chat.useChatAgents(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={other}>{children}</QueryClientProvider>
      ),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(other.getQueryData(chat.chatKeys.agents)).toBeUndefined();
    expect(agentsQueryClient().getQueryData(chat.chatKeys.agents)).toEqual([
      agent('pm'),
    ]);
  });

  it('page the conversation list by its next page token', async () => {
    const { result } = renderHook(() =>
      chat.useConversationList({ archived: false }),
    );
    await waitFor(() => expect(result.current.data?.pages).toHaveLength(1));
    expect(result.current.hasNextPage).toBe(true);
    await act(() => result.current.fetchNextPage());
    await waitFor(() =>
      expect(
        result.current.data?.pages.flatMap((page) =>
          page.items.map((item) => item.id),
        ),
      ).toEqual(['c1', 'c2', 'c3']),
    );
    expect(result.current.hasNextPage).toBe(false);
    expect(callsTo('GET', 'agents/conversations').at(-1)?.query).toMatchObject({
      archived: 'false',
      pageToken: 'next',
    });
  });
});

function Provider({
  available,
  children,
}: {
  readonly available?: boolean;
  readonly children?: ReactNode;
}): ReactElement {
  return (
    <MemoryRouter initialEntries={['/issues']}>
      <chat.ChatProvider {...(available === undefined ? {} : { available })}>
        {children}
      </chat.ChatProvider>
    </MemoryRouter>
  );
}

/** A chat view of the application's own: it reads the panel and its conversation. */
function View(): null {
  const panel = chat.useChatPanel();
  chat.useConversation(panel.conversationId);
  return null;
}

describe('ChatProvider realtime', () => {
  it('subscribes once, whichever chat views are rendered', () => {
    window.sessionStorage.setItem(
      CHAT_PANEL_STORAGE_KEY,
      JSON.stringify({ open: true, mode: 'docked', view: 'chat' }),
    );
    const view = render(
      <Provider>
        <View />
        <View />
      </Provider>,
    );
    expect(topicListeners()).toBe(1);
    view.unmount();
    expect(topicListeners()).toBe(0);
  });

  it('subscribes with no chat view rendered', () => {
    render(<Provider />);
    expect(topicListeners()).toBe(1);
  });

  it('does not subscribe while the chat is unavailable', () => {
    render(<Provider available={false} />);
    expect(topicListeners()).toBe(0);
  });

  it('refreshes the lists in this plugin’s cache when a conversation changes', async () => {
    const { result } = renderHook(
      () => chat.useConversationList({ archived: false }),
      {
        wrapper: ({ children }: { children: ReactNode }) => (
          <Provider>{children}</Provider>
        ),
      },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const before = callsTo('GET', 'agents/conversations').length;
    act(() =>
      realtime.publish(CONVERSATIONS_TOPIC, {
        kind: 'conversation.changed',
        conversationId: 'c1',
      }),
    );
    await waitFor(() =>
      expect(callsTo('GET', 'agents/conversations').length).toBeGreaterThan(
        before,
      ),
    );
  });
});
