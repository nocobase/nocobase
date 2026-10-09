// @vitest-environment jsdom
/**
 * The chat's headless parts against a fake API and realtime: the models of the timeline and the context, the
 * conversation hooks (fetching, sending, the actions), and the panel state `ChatProvider` keeps. The UI built on them is
 * the UI Library's agent-chat block, tested there.
 */
import type { RunEvent } from '@nocobase/agent-protocol';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement, ReactNode } from 'react';
import { MemoryRouter, useLocation } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  CONVERSATIONS_TOPIC,
  type ChatAgent,
  type ConversationDetail,
  type ConversationMessage,
} from '../../shared/conversations.js';
import {
  callsTo,
  clientMocks,
  realtime,
  resetApi,
  type Routes,
} from './fake-client.js';

vi.mock('@nocobase/app-client', () => clientMocks.appClient());
vi.mock('@nocobase/i18n/client', () => clientMocks.i18n());
vi.mock('@nocobase/app-plugin-authorization/client', () =>
  clientMocks.authorization(),
);

const {
  CHAT_PANEL_ATTRIBUTE,
  ChatProvider,
  useChatContextSource,
  useChatPanel,
  useChatSources,
} = await import('../../client/chat/provider.js');
const { useConversationActions, useConversationMessages, useSendMessage } =
  await import('../../client/chat/use-chat.js');
const { agentsQueryClient } = await import('../../client/query.js');

/** The chat's hooks read this plugin's shared cache whatever is above them, so each test starts it empty. */
function chatClient(): QueryClient {
  const client = agentsQueryClient();
  client.clear();
  client.setDefaultOptions({ queries: { retry: false } });
  return client;
}
const {
  messagesReducer,
  EMPTY_MESSAGES,
  liveStepsView,
  timelineOrder,
  newConversationAgent,
} = await import('../../client/chat/message-model.js');
const { panelStateFromSearch, withoutPanelParams, isChatShortcut } =
  await import('../../client/chat/panel-state.js');
const { contextChips, buildPageContext } =
  await import('../../client/chat/context-model.js');

const AT = '2026-10-01T08:00:00.000Z';
const C = 'conversations/c1';

function chatAgent(id: string, overrides: Partial<ChatAgent> = {}): ChatAgent {
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
    ...overrides,
  };
}

function detail(
  overrides: Partial<ConversationDetail> = {},
): ConversationDetail {
  return {
    id: 'c1',
    title: 'Plan the release',
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
    availability: { online: true, reason: null, onlineRunners: 1 },
    models: [],
    canFallback: false,
    canRestore: false,
    ...overrides,
  };
}

function message(
  seq: number,
  role: ConversationMessage['role'],
  text: string,
  overrides: Partial<ConversationMessage> = {},
): ConversationMessage {
  return {
    id: `m${seq}`,
    conversationId: 'c1',
    seq,
    role,
    content: { type: 'text', content: text },
    toolCalls: null,
    attachments: null,
    workContext: null,
    metadata: {},
    runId: null,
    createdAt: AT,
    ...overrides,
  };
}

function Where(): ReactElement {
  const location = useLocation();
  return <p data-testid='where'>{`${location.pathname}${location.search}`}</p>;
}

function renderChat(url = '/issues', children?: ReactNode): void {
  render(
    <QueryClientProvider client={chatClient()}>
      <MemoryRouter initialEntries={[url]}>
        <ChatProvider>
          {children}
          <Where />
        </ChatProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

let conversation: ConversationDetail;
let messages: ConversationMessage[];

function routes(extra: Routes = {}): Routes {
  return {
    'agents/chatAgents': () => [
      chatAgent('pm', { name: 'Project manager', isSystemDefault: true }),
      chatAgent('coder', { name: 'Coder' }),
    ],
    [`agents/${C}`]: () => conversation,
    [`agents/${C}/messages`]: (request) => {
      const after = request.query.after;
      const items =
        after === undefined
          ? messages
          : messages.filter((item) => item.seq > Number(after));
      return { data: items, meta: { lastSeq: messages.at(-1)?.seq ?? 0 } };
    },
    [`POST agents/${C}/markRead`]: () => ({ ...conversation, read: true }),
    ...extra,
  };
}

beforeEach(() => {
  window.sessionStorage.clear();
  conversation = detail();
  messages = [
    message(1, 'user', 'What is open?'),
    message(2, 'assistant', 'Two **issues**.', {
      metadata: { agentId: 'pm' },
    }),
  ];
  resetApi(routes());
});

describe('online models', () => {
  it('replaces an optimistic message with the server’s copy by clientId', () => {
    let state = messagesReducer(EMPTY_MESSAGES, {
      type: 'sending',
      message: {
        clientId: 'k1',
        content: 'Hello',
        context: undefined,
        createdAt: AT,
        status: 'sending',
      },
    });
    expect(state.pending).toHaveLength(1);
    // A page that does not carry it leaves it pending.
    state = messagesReducer(state, {
      type: 'page',
      page: {
        items: [message(1, 'assistant', 'Hi')],
        hasMore: false,
        lastSeq: 1,
      },
    });
    expect(state.pending).toHaveLength(1);
    state = messagesReducer(state, {
      type: 'page',
      page: {
        items: [message(2, 'user', 'Hello', { metadata: { clientId: 'k1' } })],
        hasMore: false,
        lastSeq: 2,
      },
    });
    expect(state.pending).toHaveLength(0);
    expect(state.items.map((item) => item.seq)).toEqual([1, 2]);
    expect(state.lastSeq).toBe(2);
  });

  it('marks a message that was not sent as failed', () => {
    const sending = messagesReducer(EMPTY_MESSAGES, {
      type: 'sending',
      message: {
        clientId: 'k1',
        content: 'Hello',
        context: undefined,
        createdAt: AT,
        status: 'sending',
      },
    });
    const failed = messagesReducer(sending, { type: 'failed', clientId: 'k1' });
    expect(failed.pending[0]?.status).toBe('failed');
  });

  it('sums up the run’s steps since its last text', () => {
    const events: RunEvent[] = [
      { seq: 1, at: AT, type: 'thinking', content: 'Hmm' },
      { seq: 2, at: AT, type: 'text', content: 'First answer' },
      { seq: 3, at: AT, type: 'thinking', content: 'Next' },
      {
        seq: 4,
        at: AT,
        type: 'toolUse',
        tool: 'Bash',
        input: { command: 'acme issue get PM-12' },
      },
    ];
    const view = liveStepsView(events);
    expect(view.steps.map((event) => event.seq)).toEqual([3, 4]);
    expect(view.line).toEqual({
      kind: 'reading',
      subject: 'acme issue get PM-12',
    });
    expect(liveStepsView(events.slice(0, 3)).line).toEqual({
      kind: 'thinking',
    });
    expect(
      liveStepsView([
        {
          seq: 1,
          at: AT,
          type: 'toolUse',
          tool: 'Bash',
          input: { command: 'pnpm test' },
        },
      ]).line,
    ).toEqual({ kind: 'working', subject: 'pnpm test' });
  });

  it('places other items after the messages created at or before them', () => {
    const order = timelineOrder([
      { key: 'm1', at: '2026-10-01T08:00:00Z', rank: 0 },
      { key: 'm2', at: '2026-10-01T08:02:00Z', rank: 0 },
      { key: 'plan', at: '2026-10-01T08:01:00Z', rank: 1 },
      { key: 'same', at: '2026-10-01T08:02:00Z', rank: 1 },
    ]);
    expect(order.map((entry) => entry.key)).toEqual([
      'm1',
      'plan',
      'm2',
      'same',
    ]);
  });

  it('picks the agent of a new conversation: picked, my default, the system default', () => {
    const agents = [
      chatAgent('a', { isSystemDefault: true }),
      chatAgent('b', { isMyDefault: true }),
      chatAgent('c'),
    ];
    expect(newConversationAgent(agents, 'c')?.id).toBe('c');
    expect(newConversationAgent(agents, null)?.id).toBe('b');
    expect(newConversationAgent([agents[0]!, agents[2]!], null)?.id).toBe('a');
    expect(newConversationAgent([agents[2]!], null)).toBeNull();
  });

  it('reads deep links and removes them once applied', () => {
    const current = {
      open: false,
      mode: 'docked' as const,
      view: 'chat' as const,
      conversationId: 'old',
      newAgentId: null,
    };
    expect(
      panelStateFromSearch(new URLSearchParams('chat=c9'), current),
    ).toMatchObject({ open: true, view: 'chat', conversationId: 'c9' });
    expect(
      panelStateFromSearch(
        new URLSearchParams('chat=new&chatMode=expanded'),
        current,
      ),
    ).toMatchObject({ open: true, mode: 'expanded', conversationId: null });
    expect(
      panelStateFromSearch(new URLSearchParams('chat=history'), current),
    ).toMatchObject({ open: true, view: 'history', conversationId: 'old' });
    expect(
      panelStateFromSearch(new URLSearchParams('q=1'), current),
    ).toBeNull();
    expect(withoutPanelParams(new URLSearchParams('q=1&chat=new'))).toBe(
      '?q=1',
    );
  });

  it('knows ⌘J and Ctrl+J', () => {
    const key = (init: KeyboardEventInit) =>
      isChatShortcut(new KeyboardEvent('keydown', { key: 'j', ...init }));
    expect(key({ metaKey: true })).toBe(true);
    expect(key({ ctrlKey: true })).toBe(true);
    expect(key({})).toBe(false);
    expect(key({ metaKey: true, shiftKey: true })).toBe(false);
  });

  it('builds the page context from the chips, ids only and within the limits', () => {
    const items = Array.from({ length: 12 }, (_, index) => ({
      kind: 'issue',
      id: `i${index}`,
      label: `PM-${index}`,
    }));
    const input = {
      route: `/issues/${'x'.repeat(600)}`,
      pinned: [{ kind: 'project', id: 'p1', label: 'Acme' }],
      sources: items,
      filter: {
        page: 'issues',
        params: { status: 'open' },
        label: 'Open issues',
      },
      selection: { text: 'y'.repeat(3000) },
      removed: new Set(['issue:i0']),
    };
    const chips = contextChips(input);
    expect(chips.filter((chip) => chip.kind === 'item')).toHaveLength(10);
    expect(chips[0]).toMatchObject({ kind: 'item', pinned: true });
    const context = buildPageContext(input);
    expect(context?.route).toHaveLength(500);
    expect(context?.items[0]).toEqual({ kind: 'project', id: 'p1' });
    expect(context?.items.some((item) => item.id === 'i0')).toBe(false);
    expect(context?.items[1]).not.toHaveProperty('label');
    expect(context?.selection?.text).toHaveLength(2000);
    expect(context?.filter).toEqual({
      page: 'issues',
      params: { status: 'open' },
      label: 'Open issues',
    });
  });
});

/** A conversation's messages and its send, as a chat view wires them. */
function useChat(
  conversationId: string | null,
  onCreated: (detail: ConversationDetail) => void = () => undefined,
) {
  const messages = useConversationMessages(conversationId, false);
  const send = useSendMessage({
    conversationId,
    agentId: 'pm',
    source: 'panel',
    dispatch: messages.dispatch,
    onCreated,
  });
  return { messages, send };
}

const wrapper = ({ children }: { readonly children: ReactNode }) => (
  <QueryClientProvider client={chatClient()}>{children}</QueryClientProvider>
);

const CONTEXT = { route: '/issues', items: [] };

describe('conversation hooks', () => {
  it('fetches the messages after the last one when the topic announces more', async () => {
    const { result } = renderHook(() => useChat('c1'), { wrapper });
    await waitFor(() => expect(result.current.messages.items).toHaveLength(2));
    messages = [...messages, message(3, 'assistant', 'And one more.')];
    act(() =>
      realtime.publish(CONVERSATIONS_TOPIC, {
        kind: 'conversation.messages',
        conversationId: 'c1',
        lastSeq: 3,
      }),
    );
    await waitFor(() => expect(result.current.messages.items).toHaveLength(3));
    expect(
      callsTo('GET', `agents/${C}/messages`).map((call) => call.query.after),
    ).toEqual([undefined, 2]);
    // Another conversation's announcement, or one already loaded, fetches nothing.
    act(() => {
      realtime.publish(CONVERSATIONS_TOPIC, {
        kind: 'conversation.messages',
        conversationId: 'c2',
        lastSeq: 9,
      });
      realtime.publish(CONVERSATIONS_TOPIC, {
        kind: 'conversation.messages',
        conversationId: 'c1',
        lastSeq: 3,
      });
    });
    expect(callsTo('GET', `agents/${C}/messages`)).toHaveLength(2);
  });

  it('replaces a reply still being written in place until it is final', async () => {
    messages = [
      ...messages,
      message(3, 'assistant', 'Two issues are', {
        metadata: { agentId: 'pm', streaming: true },
      }),
    ];
    const { result } = renderHook(() => useChat('c1'), { wrapper });
    await waitFor(() => expect(result.current.messages.items).toHaveLength(3));
    messages = [
      ...messages.slice(0, 2),
      message(3, 'assistant', 'Two issues are open.', {
        metadata: { agentId: 'pm', runEventSeq: 4 },
      }),
    ];
    // Announcements carry its seq, at or below the last loaded: fetched again from before it.
    act(() =>
      realtime.publish(CONVERSATIONS_TOPIC, {
        kind: 'conversation.messages',
        conversationId: 'c1',
        lastSeq: 3,
      }),
    );
    await waitFor(() =>
      expect(result.current.messages.items.at(-1)?.content.content).toBe(
        'Two issues are open.',
      ),
    );
    expect(result.current.messages.items).toHaveLength(3);
    expect(result.current.messages.items.at(-1)?.metadata.streaming).toBe(
      undefined,
    );
    expect(
      callsTo('GET', `agents/${C}/messages`).map((call) => call.query.after),
    ).toContain(2);
  });

  it('shows a message at once and replaces it with the server’s copy', async () => {
    let release: (() => void) | undefined;
    resetApi(
      routes({
        [`POST agents/${C}/messages`]: async (request) => {
          await new Promise<void>((resolve) => {
            release = resolve;
          });
          const json = request.json as { content: string; clientId: string };
          const sent = message(3, 'user', json.content, {
            metadata: { clientId: json.clientId },
            runId: 'r1',
          });
          messages = [...messages, sent];
          return {
            message: sent,
            run: { id: 'r1', outcome: 'appended' },
            conversation,
          };
        },
      }),
    );
    const { result } = renderHook(() => useChat('c1'), { wrapper });
    await waitFor(() => expect(result.current.messages.items).toHaveLength(2));
    let sending: Promise<unknown> | undefined;
    act(() => {
      sending = result.current.send({
        content: 'Also check PM-3',
        context: CONTEXT,
      });
    });
    expect(result.current.messages.pending).toMatchObject([
      { content: 'Also check PM-3', status: 'sending' },
    ]);
    await waitFor(() => expect(release).toBeDefined());
    await act(async () => {
      release?.();
      await sending;
    });
    await waitFor(() =>
      expect(result.current.messages.pending).toHaveLength(0),
    );
    expect(result.current.messages.items.at(-1)?.content.content).toBe(
      'Also check PM-3',
    );
    const sent = callsTo('POST', `agents/${C}/messages`)[0]?.json as {
      clientId?: string;
      context?: { route: string };
    };
    expect(sent.clientId).toMatch(/^c-/u);
    expect(sent.context?.route).toBe('/issues');
  });

  it('keeps a message that failed to send, to send again with the same id', async () => {
    resetApi(
      routes({
        [`POST agents/${C}/messages`]: () => {
          throw new Error('offline');
        },
      }),
    );
    const { result } = renderHook(() => useChat('c1'), { wrapper });
    await waitFor(() => expect(result.current.messages.items).toHaveLength(2));
    await act(async () => {
      await result.current.send({ content: 'Hello?', context: CONTEXT });
    });
    const failed = result.current.messages.pending[0];
    expect(failed?.status).toBe('failed');
    await act(async () => {
      await result.current.send({
        content: failed?.content ?? '',
        context: failed?.context,
        clientId: failed?.clientId ?? '',
      });
    });
    const [first, second] = callsTo('POST', `agents/${C}/messages`);
    expect((first?.json as { clientId: string }).clientId).toBe(
      (second?.json as { clientId: string }).clientId,
    );
  });

  it('creates a new conversation with its agent on the first message', async () => {
    resetApi(
      routes({
        'POST agents/conversations': () => conversation,
        [`POST agents/${C}/messages`]: (request) => {
          const json = request.json as { content: string; clientId: string };
          const sent = message(3, 'user', json.content, {
            metadata: { clientId: json.clientId },
          });
          messages = [sent];
          return { message: sent, run: null, conversation };
        },
      }),
    );
    const created = vi.fn();
    const { result } = renderHook(() => useChat(null, created), { wrapper });
    await act(async () => {
      await result.current.send({ content: 'Start here', context: CONTEXT });
    });
    expect(callsTo('POST', 'agents/conversations')[0]?.json).toEqual({
      agentId: 'pm',
      source: 'panel',
    });
    expect(created).toHaveBeenCalledWith(expect.objectContaining({ id: 'c1' }));
    expect(callsTo('POST', `agents/${C}/messages`)).toHaveLength(1);
  });

  it('stops a run, switches to the system default and back, picks a model and renames', async () => {
    resetApi(
      routes({
        [`POST agents/${C}/stop`]: () => conversation,
        [`POST agents/${C}/fallback`]: () => conversation,
        [`POST agents/${C}/restore`]: () => conversation,
        [`PATCH agents/${C}`]: (request) => ({
          ...conversation,
          ...(request.json as object),
        }),
      }),
    );
    const { result } = renderHook(() => useConversationActions(), { wrapper });
    await act(async () => {
      await result.current.stop.mutateAsync('c1');
      await result.current.fallback.mutateAsync('c1');
      await result.current.restore.mutateAsync('c1');
      await result.current.chooseModel.mutateAsync({
        id: 'c1',
        model: { modelService: 'openai', model: 'gpt-y' },
      });
      await result.current.rename.mutateAsync({
        id: 'c1',
        title: 'Release plan',
      });
    });
    for (const route of ['stop', 'fallback', 'restore'])
      expect(callsTo('POST', `agents/${C}/${route}`)).toHaveLength(1);
    expect(callsTo('PATCH', `agents/${C}`).map((call) => call.json)).toEqual([
      { model: { modelService: 'openai', model: 'gpt-y' } },
      { title: 'Release plan' },
    ]);
  });
});

/** What the provider holds, as text a test reads. */
function Probe(): ReactElement {
  const panel = useChatPanel();
  const sources = useChatSources();
  return (
    <>
      <p data-testid='panel'>
        {`${panel.open ? 'open' : 'closed'} ${panel.view} ${panel.conversationId ?? 'new'}`}
      </p>
      <p data-testid='draft'>{panel.draft?.text ?? ''}</p>
      <p data-testid='sources'>
        {sources.items.map((item) => item.label).join(',')}
      </p>
      <button
        type='button'
        onClick={() => panel.openChat({ draft: 'Summarize this.' })}
      >
        ask
      </button>
      <div {...{ [CHAT_PANEL_ATTRIBUTE]: '' }}>
        <input aria-label='In the panel' />
      </div>
    </>
  );
}

describe('ChatProvider', () => {
  it('opens from a ?chat= link and removes the parameter', async () => {
    renderChat('/issues?chat=history&q=1', <Probe />);
    await waitFor(() =>
      expect(screen.getByTestId('panel')).toHaveTextContent('open history'),
    );
    await waitFor(() =>
      expect(screen.getByTestId('where').textContent).toBe('/issues?q=1'),
    );
  });

  it('opens and closes with ⌘J', async () => {
    renderChat('/issues', <Probe />);
    expect(screen.getByTestId('panel')).toHaveTextContent('closed');
    fireEvent.keyDown(window, { key: 'j', metaKey: true });
    await waitFor(() =>
      expect(screen.getByTestId('panel')).toHaveTextContent('open'),
    );
    // From inside the panel, the shortcut closes it.
    screen.getByLabelText('In the panel').focus();
    fireEvent.keyDown(window, { key: 'j', metaKey: true });
    await waitFor(() =>
      expect(screen.getByTestId('panel')).toHaveTextContent('closed'),
    );
  });

  it('keeps a draft for the composer and what the page shows', async () => {
    function Page(): null {
      useChatContextSource({ kind: 'issue', id: 'i1', label: 'PM-1 Fix' });
      return null;
    }
    renderChat(
      '/issues/PM-1',
      <>
        <Page />
        <Probe />
      </>,
    );
    await waitFor(() =>
      expect(screen.getByTestId('sources')).toHaveTextContent('PM-1 Fix'),
    );
    fireEvent.click(screen.getByText('ask'));
    await waitFor(() =>
      expect(screen.getByTestId('draft')).toHaveTextContent('Summarize this.'),
    );
    expect(screen.getByTestId('panel')).toHaveTextContent('open chat');
  });
});

describe('profile and presets', () => {
  it('saves the default chat agent', async () => {
    let preferences = { defaultAgentId: null as string | null };
    resetApi(
      routes({
        'agents/chatPreferences': () => preferences,
        'PATCH agents/chatPreferences': (request) => {
          preferences = { ...preferences, ...(request.json as object) };
          return preferences;
        },
      }),
    );
    const { DefaultAgentPreference } =
      await import('../../client/profile/default-agent.js');
    renderChat('/profile', <DefaultAgentPreference />);
    expect(await screen.findByTestId('profile-agent')).toBeInTheDocument();
    expect(screen.queryByRole('switch')).not.toBeInTheDocument();
    // The chat's agent picker: no default of one's own reads as the system default.
    const picker = await screen.findByTestId('profile-default-agent');
    expect(picker).toHaveTextContent('chatProfile.systemDefaultNamed');
    expect(picker).toHaveAttribute('id', 'ag-profile-default-agent');
    // A form field: like a select, no type badge on the trigger.
    expect(picker).toHaveAttribute('data-appearance', 'field');
    expect(picker).not.toHaveTextContent('chat.agents.online');
    expect(picker).not.toHaveTextContent('chat.agents.runner');
    await userEvent.click(picker);
    await userEvent.click(
      await screen.findByRole('menuitem', { name: /^Coder/ }),
    );
    await waitFor(() => expect(preferences.defaultAgentId).toBe('coder'));
    // Back to the system default: the first choice of the menu.
    await userEvent.click(picker);
    const [system] = await screen.findAllByRole('menuitem');
    expect(system).toHaveTextContent('chatProfile.systemDefaultNamed');
    await userEvent.click(system!);
    await waitFor(() => expect(preferences.defaultAgentId).toBeNull());
  });

  it('fills a new agent from a preset, keeping a typed name', async () => {
    const { applyPreset, newAgentDraft } =
      await import('../../client/pages/agents/agent-model.js');
    const preset = {
      key: 'dealDesk',
      name: 'Deal desk',
      description: 'Keeps deals moving',
      nameText: { key: 'presets.dealDesk.name', ns: 'crm' },
      descriptionText: { key: 'presets.dealDesk.description', ns: 'crm' },
      instructions: 'You keep deals moving.',
      actions: ['crm.deals/view'],
    };
    const filled = applyPreset(newAgentDraft(), preset, '商机助手', '推进商机');
    expect(filled).toMatchObject({
      name: '商机助手',
      description: '推进商机',
      instructions: 'You keep deals moving.',
      actions: ['crm.deals/view'],
    });
    expect(
      applyPreset({ ...newAgentDraft(), name: 'Mine' }, preset, 'x', 'y').name,
    ).toBe('Mine');
  });
});
