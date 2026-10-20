// @vitest-environment jsdom
import { sdkResponse } from './sdk-chat.js';
/**
 * The chat's headless exports, as an application's own chat UI uses them: the data hooks read this plugin's cache
 * whatever `QueryClientProvider` is above them (or none), and `ChatProvider` holds the one realtime subscription.
 */
import type { ApiClient } from '@nocobase/app-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  act,
  fireEvent,
  render,
  renderHook,
  waitFor,
} from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  CONVERSATIONS_TOPIC,
  type ChatAgent,
  type ConversationDetail,
  type ConversationSummary,
} from '../../shared/conversations.js';
import type { ModelService } from '../../shared/models.js';
import {
  api,
  callsTo,
  clientMocks,
  FakeApiError,
  realtime,
  resetApi,
} from './fake-client.js';

vi.mock('@nocobase/app-client', () => clientMocks.appClient());
vi.mock('@nocobase/i18n/client', () => clientMocks.i18n());
vi.mock('@nocobase/app-plugin-authorization/client', () =>
  clientMocks.authorization(),
);

const chat = await import('../../client/chat.js');
const { agentsQueryClient } = await import('../../client/query.js');
const { CHAT_PANEL_STORAGE_KEY } = chat;
const { ChatClientProvider } = await import('../../client/chat/controller.js');

const AT = '2026-10-01T08:00:00.000Z';
const catalog: ModelService[] = ['first', 'second'].map((name) => ({
  name,
  title: `Service ${name}`,
  provider: 'openai',
  models: [
    {
      value: 'shared/model',
      label: 'Shared model',
      kind: 'chat',
      dimensions: null,
    },
  ],
}));

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
    showInChatList: true,
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
  it('reads the public chat model catalog through the exported API, preserving service identity', async () => {
    resetApi({ 'agents/models': () => catalog });
    await expect(
      new chat.ChatApi(api as unknown as ApiClient).models(),
    ).resolves.toEqual(catalog);
    expect(api.calls).toEqual([
      {
        path: 'agents/models',
        method: 'GET',
        query: { kind: 'chat' },
        json: undefined,
      },
    ]);
  });

  it('shares the plugin cache and deduplicates concurrent consumers on open and window focus', async () => {
    resetApi({ 'agents/models': () => catalog });
    const other = new QueryClient();
    const { result, rerender } = renderHook(
      ({ enabled }) => {
        const gate = chat.useChatModels(enabled);
        chat.useChatModels(enabled);
        return gate;
      },
      {
        initialProps: { enabled: false },
        wrapper: ({ children }: { children: ReactNode }) => (
          <QueryClientProvider client={other}>{children}</QueryClientProvider>
        ),
      },
    );
    expect(api.calls).toHaveLength(0);
    rerender({ enabled: true });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(catalog);
    expect(other.getQueryData(chat.chatKeys.models)).toBeUndefined();
    expect(agentsQueryClient().getQueryData(chat.chatKeys.models)).toEqual(
      catalog,
    );

    expect(callsTo('GET', 'agents/models')).toHaveLength(1);
    fireEvent.focus(window);
    await waitFor(() =>
      expect(callsTo('GET', 'agents/models')).toHaveLength(2),
    );
    await waitFor(() => expect(result.current.isFetching).toBe(false));
    rerender({ enabled: false });
    fireEvent.focus(window);
    expect(callsTo('GET', 'agents/models')).toHaveLength(2);
    rerender({ enabled: true });
    await waitFor(() =>
      expect(callsTo('GET', 'agents/models')).toHaveLength(3),
    );
    expect(
      api.calls.every(
        (call) => call.method === 'GET' && call.path === 'agents/models',
      ),
    ).toBe(true);
  });

  it('exposes catalog failures without retrying or reporting an empty catalog, and recovers on reopen', async () => {
    const error = new FakeApiError(503, 'UNAVAILABLE');
    resetApi({
      'agents/models': () => {
        throw error;
      },
    });
    const { result, rerender } = renderHook(
      ({ enabled }) => chat.useChatModels(enabled),
      { initialProps: { enabled: true } },
    );
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBe(error);
    expect(result.current.data).toBeUndefined();
    expect(result.current.failureCount).toBe(1);
    expect(callsTo('GET', 'agents/models')).toHaveLength(1);
    rerender({ enabled: false });
    api.routes['agents/models'] = () => [];
    rerender({ enabled: true });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
    expect(callsTo('GET', 'agents/models')).toHaveLength(2);
  });

  it('abandons obsolete catalog refresh only after all consumers are disabled', async () => {
    resetApi({ 'agents/models': () => catalog });
    const { result, rerender } = renderHook(
      ({ gate, picker }) => ({
        gate: chat.useChatModels(gate),
        picker: chat.useChatModels(picker),
      }),
      { initialProps: { gate: true, picker: true } },
    );
    await waitFor(() => expect(result.current.gate.isSuccess).toBe(true));
    api.routes['agents/models'] = ({ signal }) =>
      new Promise((_resolve, reject) => {
        signal?.addEventListener('abort', () =>
          reject(new DOMException('Aborted', 'AbortError')),
        );
      });
    fireEvent(window, new Event('focus'));
    await waitFor(() =>
      expect(callsTo('GET', 'agents/models')).toHaveLength(2),
    );
    const signal = callsTo('GET', 'agents/models')[1]?.signal;
    rerender({ gate: false, picker: true });
    expect(signal?.aborted).toBe(false);
    rerender({ gate: false, picker: false });
    await waitFor(() => expect(signal?.aborted).toBe(true));
    api.routes['agents/models'] = () => [];
    rerender({ gate: true, picker: false });
    await waitFor(() => expect(result.current.gate.data).toEqual([]));
    expect(result.current.gate.isError).toBe(false);
  });

  it('uses normal query-signal cancellation on unmount without aborting another active consumer', async () => {
    resetApi({
      'agents/models': ({ signal }) =>
        new Promise((_resolve, reject) => {
          signal?.addEventListener('abort', () =>
            reject(new DOMException('Aborted', 'AbortError')),
          );
        }),
    });
    const gate = renderHook(() => chat.useChatModels());
    const picker = renderHook(() => chat.useChatModels());
    await waitFor(() =>
      expect(callsTo('GET', 'agents/models')).toHaveLength(1),
    );
    const signal = callsTo('GET', 'agents/models')[0]?.signal;
    expect(signal).toBeInstanceOf(AbortSignal);
    gate.unmount();
    expect(signal?.aborted).toBe(false);
    picker.unmount();
    await waitFor(() => expect(signal?.aborted).toBe(true));
    api.routes['agents/models'] = () => catalog;
    const reopened = renderHook(() => chat.useChatModels());
    await waitFor(() => expect(reopened.result.current.data).toEqual(catalog));
    expect(callsTo('GET', 'agents/models')).toHaveLength(2);
  });

  it.each(['first', 'second'])(
    'snapshots the %s service model for a new native conversation only',
    async (modelService) => {
      const conversation: ConversationDetail = {
        ...summary('c1'),
        mode: 'online',
        availability: { online: true, reason: null, onlineRunners: 0 },
        models: [],
        canFallback: false,
        canRestore: false,
      };
      let finishCreate!: (value: ConversationDetail) => void;
      resetApi({
        'POST agents/conversations': () =>
          new Promise<ConversationDetail>((resolve) => {
            finishCreate = resolve;
          }),
        'POST agents/conversations/c1/messages': () => sdkResponse(),
      });
      const selectedModel = { modelService, model: 'shared/model' };
      const { result, rerender } = renderHook(
        ({ selection }) => {
          const controller = chat.useChatController();
          const send = chat.useSendMessage({
            conversationId: null,
            agentId: 'online',
            source: 'panel',
            selectedModel: selection,
            dispatch: () => undefined,
            onCreated: () => undefined,
          });
          return { send, controller };
        },
        {
          initialProps: { selection: selectedModel },
          wrapper: ({ children }: { children: ReactNode }) => (
            <ChatClientProvider>{children}</ChatClientProvider>
          ),
        },
      );
      act(() => {
        expect(
          result.current.send({ content: 'Hello', context: undefined }),
        ).toBe(true);
      });
      const expected = {
        agentId: 'online',
        source: 'panel',
        selectedModel: { modelService, model: 'shared/model' },
      };
      selectedModel.modelService = 'changed-after-submit';
      rerender({
        selection: { modelService: 'another-picker-choice', model: 'other' },
      });
      expect(
        result.current.controller.submissions.snapshot()[0]?.create,
      ).toEqual(expected);
      expect(callsTo('POST', 'agents/conversations')[0]?.json).toEqual(
        expected,
      );
      await act(async () => {
        finishCreate(conversation);
      });
      await waitFor(() =>
        expect(
          callsTo('POST', 'agents/conversations/c1/messages'),
        ).toHaveLength(1),
      );
      expect(
        callsTo('POST', 'agents/conversations/c1/messages')[0]?.json,
      ).toEqual({
        message: {
          id: expect.any(String),
          role: 'user',
          parts: [{ type: 'text', text: 'Hello' }],
        },
      });
    },
  );

  it.each([
    { agentId: 'runner', conversationId: null },
    { agentId: null, conversationId: null },
    { agentId: 'online', conversationId: 'c1' },
    { agentId: 'runner', conversationId: 'c1' },
  ])(
    'does not attach a native model to $agentId / $conversationId',
    async ({ agentId, conversationId }) => {
      const conversation = {
        ...summary('c1'),
        availability: { online: true, reason: null, onlineRunners: 1 },
        models: [],
        canFallback: false,
        canRestore: false,
      };
      resetApi({
        'POST agents/conversations': () => conversation,
        'POST agents/conversations/c1/messages': () => sdkResponse(),
      });
      const { result } = renderHook(
        () => {
          const controller = chat.useChatController();
          const send = chat.useSendMessage({
            conversationId,
            agentId,
            source: 'panel',
            selectedModel: { modelService: 'first', model: 'shared/model' },
            dispatch: () => undefined,
            onCreated: () => undefined,
          });
          return { controller, send };
        },
        {
          wrapper: ({ children }: { children: ReactNode }) => (
            <ChatClientProvider>{children}</ChatClientProvider>
          ),
        },
      );
      await act(async () => {
        result.current.send({ content: 'Hello', context: undefined });
      });
      expect(
        result.current.controller.submissions.snapshot()[0]?.create,
      ).toEqual({ ...(agentId ? { agentId } : {}), source: 'panel' });
      expect(callsTo('POST', 'agents/conversations')).toHaveLength(
        conversationId ? 0 : 1,
      );
      expect(
        callsTo('POST', 'agents/conversations/c1/messages')[0]?.json,
      ).toEqual({
        message: {
          id: expect.any(String),
          role: 'user',
          parts: [{ type: 'text', text: 'Hello' }],
        },
      });
    },
  );

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
      'POST agents/conversations/c1/messages': () => sdkResponse(),
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
    const { result: send } = renderHook(
      () =>
        chat.useSendMessage({
          conversationId: 'c1',
          agentId: 'pm',
          source: 'panel',
          dispatch,
          onCreated: () => undefined,
        }),
      {
        wrapper: ({ children }: { children: ReactNode }) => (
          <ChatClientProvider>{children}</ChatClientProvider>
        ),
      },
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
      message: {
        id: expect.any(String),
        role: 'user',
        parts: [{ type: 'text', text: '' }],
      },
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
