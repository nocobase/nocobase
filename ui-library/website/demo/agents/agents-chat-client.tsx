/* eslint-disable react-refresh/only-export-components, @eslint-react/no-unnecessary-use-prefix -- a stand-in for a
   module of components and hooks, under the names of the real ones whether or not the stand-in calls a hook */
import type * as Chat from '@nocobase/app-plugin-agents/client/chat';
import type {
  ChatAgent,
  ConversationDetail,
  ConversationMessage,
  ConversationNotice,
  ConversationSource,
  MessageAttachment,
} from '@nocobase/app-plugin-agents/shared/conversations';
import { BotIcon } from 'lucide-react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { useNavigate } from 'react-router';

import { cn } from 'cn';

// The preview's stand-in for @nocobase/app-plugin-agents/client/chat, aliased in vite.config.ts and mocked with it in
// the tests: the panel's state as the plugin keeps it, and the conversations in memory. A message to an online agent
// is answered after a moment, the reply growing in place; a runner conversation shows a run at work. Every export is
// typed against the real one, so the block and this mock follow the plugin's contract.

type RunEvent = ReturnType<typeof Chat.useLiveRunEvents>[number];

const now = Date.now();
const ago = (minutes: number): string =>
  new Date(now - minutes * 60_000).toISOString();

const online = { online: true, reason: null, onlineRunners: 1 } as const;

const AGENTS: readonly ChatAgent[] = [
  {
    id: 'assistant',
    name: 'Assistant',
    description: 'Answers in seconds on the server.',
    nameText: null,
    descriptionText: null,
    avatar: null,
    type: 'online',
    models: [
      {
        modelService: 'openai',
        model: 'gpt-5-mini',
        serviceTitle: 'OpenAI',
        modelLabel: 'gpt-5-mini',
      },
      {
        modelService: 'anthropic',
        model: 'claude-sonnet',
        serviceTitle: 'Anthropic',
        modelLabel: 'claude-sonnet',
      },
    ],
    personal: false,
    isSystemDefault: false,
    isMyDefault: true,
    fallbackAgentId: null,
    availability: online,
  },
  {
    id: 'coder',
    name: 'Coding agent',
    description: 'Works in a repository on a runner.',
    nameText: null,
    descriptionText: null,
    avatar: null,
    type: 'runner',
    models: [],
    personal: false,
    isSystemDefault: true,
    isMyDefault: false,
    fallbackAgentId: null,
    availability: online,
  },
  {
    id: 'release',
    name: 'Release manager',
    description: null,
    nameText: null,
    descriptionText: null,
    avatar: null,
    type: 'runner',
    models: [],
    personal: true,
    isSystemDefault: false,
    isMyDefault: false,
    fallbackAgentId: null,
    availability: { online: false, reason: 'noRunner', onlineRunners: 0 },
  },
];

function agentRef(id: string): ConversationDetail['agent'] {
  const agent = AGENTS.find((candidate) => candidate.id === id);
  return {
    id,
    name: agent?.name ?? null,
    nameText: null,
    avatar: null,
    archived: false,
  };
}

const MODELS = [
  {
    modelService: 'openai',
    model: 'gpt-5-mini',
    serviceTitle: 'OpenAI',
    modelLabel: 'gpt-5-mini',
  },
  {
    modelService: 'anthropic',
    model: 'claude-sonnet',
    serviceTitle: 'Anthropic',
    modelLabel: 'claude-sonnet',
  },
] as const;

function conversation(
  id: string,
  agentId: string,
  title: string,
  fields: Partial<ConversationDetail> = {},
): ConversationDetail {
  const agent = AGENTS.find((candidate) => candidate.id === agentId);
  const mode = agent?.type ?? 'online';
  return {
    id,
    title,
    titleSource: 'auto',
    category: 'chat',
    source: 'panel',
    mode,
    agent: agentRef(agentId),
    fallbackFrom: null,
    model: mode === 'online' ? MODELS[0] : null,
    read: true,
    lastMessageAt: ago(5),
    archivedAt: null,
    createdAt: ago(60),
    updatedAt: ago(5),
    run: null,
    availability: agent?.availability ?? online,
    models: mode === 'online' ? MODELS : [],
    canFallback: false,
    canRestore: false,
    ...fields,
  };
}

function message(
  conversationId: string,
  seq: number,
  role: ConversationMessage['role'],
  content: string,
  fields: Partial<ConversationMessage> = {},
): ConversationMessage {
  return {
    id: `${conversationId}-${seq}`,
    conversationId,
    seq,
    role,
    content: { type: 'text', content },
    toolCalls: null,
    attachments: null,
    workContext: null,
    metadata: {},
    runId: null,
    createdAt: ago(30 - seq),
    ...fields,
  };
}

/** A 4×3 PNG of a test report, standing in for a screenshot. */
const SCREENSHOT =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAADCAYAAAC09K7GAAAAGklEQVR42mP8z8Dwn4EIwMjIyMjEQCQYVQwAkrgDBaaWfF8AAAAASUVORK5CYII=';

/** A file sent with a message, its bytes at `url`. */
function attachment(
  id: string,
  filename: string,
  mimeType: string,
  size: number,
  url: string,
): MessageAttachment {
  return {
    id,
    filename,
    ext: filename.split('.').pop()?.toLowerCase() ?? '',
    mimeType,
    size,
    contentUrl: url,
    downloadUrl: url,
    previewable: mimeType.startsWith('image/'),
  };
}

interface Store {
  readonly conversations: readonly ConversationDetail[];
  readonly messages: Readonly<Record<string, readonly ConversationMessage[]>>;
  readonly events: Readonly<Record<string, readonly RunEvent[]>>;
}

function initialStore(): Store {
  return {
    conversations: [
      conversation('release-plan', 'assistant', 'Plan the onboarding release', {
        lastMessageAt: ago(3),
      }),
      conversation('flaky-test', 'coder', 'Fix the flaky sign-in test', {
        read: false,
        source: 'askAgent',
        run: { id: 'run-7', status: 'running', acceptsInput: true },
        lastMessageAt: ago(1),
      }),
      conversation('notes', 'release', 'Release notes draft', {
        archivedAt: ago(600),
        lastMessageAt: ago(900),
      }),
    ],
    messages: {
      'release-plan': [
        message(
          'release-plan',
          1,
          'user',
          'What is left before we can ship the onboarding release?',
          {
            workContext: {
              route: '/projects/onboarding',
              dropped: 0,
              items: [
                {
                  kind: 'project',
                  id: 'p1',
                  key: null,
                  title: 'Onboarding',
                  url: null,
                },
              ],
            },
          },
        ),
        message(
          'release-plan',
          2,
          'assistant',
          'Three issues are still open:\n\n| Issue | Status | Owner |\n| --- | --- | --- |\n| PM-12 Welcome tour | In review | Lin |\n| PM-15 Invite emails | In progress | Coding agent |\n| PM-18 Empty states | Todo | — |\n\nPM-12 only needs a review; I can **ask the coding agent** to finish PM-15.',
          { metadata: { agentId: 'assistant' } },
        ),
        message('release-plan', 3, 'system', 'Consulted Coding agent', {
          metadata: {
            notice: {
              code: 'consultation',
              callId: 'call-1',
              runId: 'run-3',
              agentId: 'coder',
              agentName: 'Coding agent',
              question: 'How long until PM-15 can be reviewed?',
              state: 'completed',
              answer:
                'About an hour: the templates are done, the tests remain.',
              error: null,
              usage: { inputTokens: 1840, outputTokens: 212 },
              plans: 0,
            },
          },
        }),
      ],
      'flaky-test': [
        message(
          'flaky-test',
          1,
          'user',
          'The sign-in test fails about once in ten runs. Can you find out why?',
          {
            attachments: [
              attachment(
                'file-report',
                'test-report.png',
                'image/png',
                48_213,
                SCREENSHOT,
              ),
              attachment(
                'file-log',
                'sign-in.log',
                'text/plain',
                12_480,
                'data:text/plain,Timeout%20waiting%20for%20the%20session%20cookie',
              ),
            ],
          },
        ),
      ],
      notes: [
        message('notes', 1, 'user', 'Draft the notes for 1.4.'),
        message('notes', 2, 'system', 'The agent stopped before answering.', {
          metadata: {
            notice: { code: 'runFailed', runId: 'run-1', reason: null },
          },
        }),
      ],
    },
    events: {
      'run-7': [
        {
          seq: 1,
          at: ago(2),
          type: 'thinking',
          content: 'The failure is a timeout; look at the test first.',
        },
        {
          seq: 2,
          at: ago(2),
          type: 'toolUse',
          tool: 'Read',
          input: { file_path: 'e2e/sign-in.test.ts' },
        },
        {
          seq: 3,
          at: ago(1),
          type: 'toolResult',
          tool: 'Read',
          output:
            'await page.click("Sign in");\nawait expect(page).toHaveURL("/");',
        },
        {
          seq: 4,
          at: ago(1),
          type: 'toolUse',
          tool: 'Bash',
          input: { command: 'pnpm test:e2e sign-in --repeat-each 20' },
        },
      ],
    },
  };
}

let store: Store = initialStore();
const listeners = new Set<() => void>();

function update(next: (current: Store) => Store): void {
  store = next(store);
  for (const listener of listeners) listener();
}

function useStore(): Store {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => store,
  );
}

/** Replies still on their way; a reset cancels them so they cannot write into the conversations that follow. */
const replyTimers = new Set<ReturnType<typeof setTimeout>>();

/** Puts the sample conversations back; the tests call it between cases. */
export function resetChatDemo(): void {
  for (const timer of replyTimers) clearTimeout(timer);
  replyTimers.clear();
  update(() => initialStore());
}

function patchConversation(
  id: string,
  patch: (current: ConversationDetail) => ConversationDetail,
): ConversationDetail | undefined {
  update((current) => ({
    ...current,
    conversations: current.conversations.map((item) =>
      item.id === id ? patch(item) : item,
    ),
  }));
  return store.conversations.find((item) => item.id === id);
}

function appendMessage(
  conversationId: string,
  build: (seq: number) => ConversationMessage,
): ConversationMessage {
  const list = store.messages[conversationId] ?? [];
  const added = build(list.length + 1);
  update((current) => ({
    ...current,
    messages: { ...current.messages, [conversationId]: [...list, added] },
  }));
  return added;
}

function replaceMessage(added: ConversationMessage): void {
  update((current) => ({
    ...current,
    messages: {
      ...current.messages,
      [added.conversationId]: (
        current.messages[added.conversationId] ?? []
      ).map((item) => (item.id === added.id ? added : item)),
    },
  }));
}

const REPLY =
  'Here is what I would do:\n\n1. Review **PM-12** today.\n2. Let the coding agent finish PM-15.\n3. Move PM-18 to the next release.';

/** An online agent's reply: a run opens, then the reply grows in place until it is final. */
function answer(conversationId: string, agentId: string): void {
  patchConversation(conversationId, (item) => ({
    ...item,
    run: { id: `run-${conversationId}`, status: 'running', acceptsInput: true },
  }));
  const start = setTimeout(() => {
    replyTimers.delete(start);
    const draft = appendMessage(conversationId, (seq) =>
      message(conversationId, seq, 'assistant', '', {
        createdAt: new Date().toISOString(),
        metadata: { agentId, streaming: true },
      }),
    );
    let length = 0;
    const timer = setInterval(() => {
      length = Math.min(REPLY.length, length + 12);
      const done = length === REPLY.length;
      replaceMessage({
        ...draft,
        content: { type: 'text', content: REPLY.slice(0, length) },
        metadata: { agentId, ...(done ? {} : { streaming: true }) },
      });
      if (!done) return;
      clearInterval(timer);
      replyTimers.delete(timer);
      patchConversation(conversationId, (item) => ({
        ...item,
        run: null,
        lastMessageAt: new Date().toISOString(),
      }));
    }, 80);
    replyTimers.add(timer);
  }, 700);
  replyTimers.add(start);
}

// ---------------------------------------------------------------------------------------------------------------------
// Constants and pure models
// ---------------------------------------------------------------------------------------------------------------------

export const CHAT_PANEL_ID: typeof Chat.CHAT_PANEL_ID = 'agents-chat-panel';
export const CHAT_PANEL_ATTRIBUTE: typeof Chat.CHAT_PANEL_ATTRIBUTE =
  'data-agents-chat';
export const CHAT_DOCK_QUERY: typeof Chat.CHAT_DOCK_QUERY =
  '(min-width: 1280px)';
export const CHAT_MOBILE_QUERY: typeof Chat.CHAT_MOBILE_QUERY =
  '(max-width: 767px)';

export const modifierKeyLabel: typeof Chat.modifierKeyLabel = () =>
  typeof navigator !== 'undefined' && /mac/iu.test(navigator.platform)
    ? '⌘'
    : 'Ctrl';

export const timelineOrder: typeof Chat.timelineOrder = (entries) =>
  [...entries].sort((a, b) => a.at.localeCompare(b.at) || a.rank - b.rank);

export const newConversationAgent: typeof Chat.newConversationAgent = (
  agents,
  picked,
) =>
  agents
    ? ((picked ? agents.find((agent) => agent.id === picked) : undefined) ??
      agents.find((agent) => agent.isMyDefault) ??
      agents.find((agent) => agent.isSystemDefault) ??
      null)
    : null;

export const noticeText: typeof Chat.noticeText = (
  t,
  notice: ConversationNotice | undefined,
  fallback,
  agentName,
  newsText,
) => {
  if (!notice) return fallback;
  switch (notice.code) {
    case 'switchedToDefault':
      return t('chat.notice.switchedToDefault', {
        name: agentName(notice.agentId),
        own: agentName(notice.fromAgentId),
      });
    case 'switchedBack':
      return t('chat.notice.switchedBack', { name: agentName(notice.agentId) });
    case 'runFailed':
      return t('chat.notice.runFailed');
    case 'runCancelled':
      return t('chat.notice.runCancelled');
    case 'news':
      return newsText?.(notice, t) ?? notice.title;
    default:
      return fallback;
  }
};

export const liveStepsView: typeof Chat.liveStepsView = (events) => {
  const steps = events.filter((event) =>
    ['thinking', 'toolUse', 'toolResult', 'permission'].includes(event.type),
  );
  const tool = [...steps].reverse().find((event) => event.type === 'toolUse');
  const input = tool?.input as { command?: string; file_path?: string } | null;
  const subject = input?.command ?? input?.file_path ?? tool?.tool ?? '';
  return {
    steps,
    line:
      !subject || steps.at(-1)?.type === 'thinking'
        ? { kind: 'thinking' }
        : tool?.tool === 'Read'
          ? { kind: 'reading', subject }
          : { kind: 'working', subject },
  };
};

export const stepLineText: typeof Chat.stepLineText = (t, line) =>
  line.kind === 'thinking'
    ? t('chat.steps.thinking')
    : t(`chat.steps.${line.kind}`, { subject: line.subject });

export const itemKey: typeof Chat.itemKey = (item) => `${item.kind}:${item.id}`;

export const filterText: typeof Chat.filterText = (filter) =>
  Object.entries(filter.params)
    .map(([key, value]) => `${key}=${value}`)
    .join(', ');

export const selectionPreview: typeof Chat.selectionPreview = (
  text,
  max = 40,
) => {
  const line = text.replace(/\s+/gu, ' ').trim();
  return line.length > max ? `${line.slice(0, max - 1)}…` : line;
};

export const contextChips: typeof Chat.contextChips = (input) => {
  const chips: Chat.ChatContextChip[] = [];
  const seen = new Set<string>();
  const pinned = new Set(input.pinned.map(itemKey));
  for (const item of [...input.pinned, ...input.sources]) {
    const key = itemKey(item);
    if (seen.has(key) || input.removed.has(key)) continue;
    seen.add(key);
    chips.push({ key, kind: 'item', item, pinned: pinned.has(key) });
  }
  if (input.filter && !input.removed.has('filter'))
    chips.push({ key: 'filter', kind: 'filter', filter: input.filter });
  if (input.selection && !input.removed.has('selection'))
    chips.push({
      key: 'selection',
      kind: 'selection',
      selection: input.selection,
    });
  return chips;
};

export const buildPageContext: typeof Chat.buildPageContext = (input) => ({
  route: input.route,
  items: contextChips(input).flatMap((chip) =>
    chip.kind === 'item' ? [{ kind: chip.item.kind, id: chip.item.id }] : [],
  ),
});

// ---------------------------------------------------------------------------------------------------------------------
// Names, avatars and times
// ---------------------------------------------------------------------------------------------------------------------

const agentText: Chat.AgentText = {
  name: ((agent: { readonly name: string | null }) =>
    agent.name) as Chat.AgentText['name'],
  description: (agent) => agent.description,
};

export const useAgentText: typeof Chat.useAgentText = () => agentText;

export const AgentAvatar: typeof Chat.AgentAvatar = ({
  name,
  size = 'default',
  className,
}) => (
  <span
    aria-hidden='true'
    className={cn(
      'inline-flex shrink-0 items-center justify-center bg-blue-500/15 font-semibold text-blue-700 dark:text-blue-300',
      size === 'xs'
        ? 'size-4 rounded-[0.3rem] text-[0.5625rem] [&_svg]:size-2.5'
        : size === 'sm'
          ? 'size-6 rounded-md text-xs [&_svg]:size-3.5'
          : 'size-8 rounded-md text-sm [&_svg]:size-4',
      className,
    )}
  >
    {name ? name.slice(0, 1).toUpperCase() : <BotIcon />}
  </span>
);

const relative = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
const dateTime = new Intl.DateTimeFormat('en', {
  dateStyle: 'medium',
  timeStyle: 'short',
});
const formatters: Chat.Formatters = {
  dateTime: (iso) => (iso ? dateTime.format(new Date(iso)) : '—'),
  time: (iso) => (iso ? new Date(iso).toLocaleTimeString('en') : '—'),
  relative: (iso) => {
    if (!iso) return '—';
    const minutes = Math.round((new Date(iso).getTime() - Date.now()) / 60_000);
    return Math.abs(minutes) < 60
      ? relative.format(minutes, 'minute')
      : relative.format(Math.round(minutes / 60), 'hour');
  },
};

export const useFormatters: typeof Chat.useFormatters = () => formatters;

// ---------------------------------------------------------------------------------------------------------------------
// The panel's state
// ---------------------------------------------------------------------------------------------------------------------

export const ChatExtensionsContext: typeof Chat.ChatExtensionsContext =
  createContext<Chat.ChatExtensions>({});

function noop(): void {}

const unavailable: Chat.ChatPanelValue = {
  available: false,
  open: false,
  mode: 'docked',
  view: 'chat',
  conversationId: null,
  newAgentId: null,
  openChat: noop,
  closeChat: noop,
  toggleChat: noop,
  setMode: noop,
  setView: noop,
  selectConversation: noop,
  pinned: [],
  clearPinned: noop,
  draft: null,
  source: 'panel',
  resetSource: noop,
  registerComposer: () => noop,
  focusComposer: noop,
  openPage: null,
  conversationPath: null,
};

const PanelContext = createContext<Chat.ChatPanelValue | null>(null);
const SourcesContext = createContext<Chat.ChatSourcesValue | null>(null);
const PageContext = createContext<Chat.ChatPageTracking | null>(null);

export const ChatPanelScope: typeof Chat.ChatPanelScope = PanelContext.Provider;

export const useChatPanel: typeof Chat.useChatPanel = () =>
  useContext(PanelContext) ?? unavailable;

const noSources: Chat.ChatSourcesValue = {
  items: [],
  filter: null,
  selection: null,
  removed: new Set(),
  registerItem: () => noop,
  registerFilter: () => noop,
  remove: noop,
};

export const useChatSources: typeof Chat.useChatSources = () =>
  useContext(SourcesContext) ?? noSources;

export const useChatPageTracking: typeof Chat.useChatPageTracking = () =>
  useContext(PageContext);

export const useChatContextSource: typeof Chat.useChatContextSource = (
  item,
) => {
  const { registerItem } = useChatSources();
  // Registered again only when the object or its label changes, not for each new object literal.
  const key = item ? `${itemKey(item)}\u0000${item.label}` : null;
  const itemRef = useRef(item);
  useEffect(() => {
    itemRef.current = item;
  });
  useEffect(() => {
    const current = itemRef.current;
    return key && current ? registerItem(current) : undefined;
  }, [registerItem, key]);
};

export const ChatProvider: typeof Chat.ChatProvider = ({
  available = true,
  conversationPath,
  children,
}) => {
  const navigate = useNavigate();
  const [state, setState] = useState({
    open: false,
    mode: 'docked' as Chat.ChatPanelMode,
    view: 'chat' as Chat.ChatPanelView,
    conversationId: null as string | null,
    newAgentId: null as string | null,
  });
  const [pinned, setPinned] = useState<readonly Chat.ChatContextItem[]>([]);
  const [draft, setDraft] = useState<Chat.ChatDraft | null>(null);
  const [source, setSource] = useState<ConversationSource>('panel');
  const [items, setItems] = useState<readonly Chat.ChatContextItem[]>([]);
  const [removed, setRemoved] = useState<ReadonlySet<string>>(() => new Set());
  const focusRef = useRef<(() => void) | null>(null);
  const wantFocusRef = useRef(false);

  const focusComposer = useCallback(() => {
    if (focusRef.current) focusRef.current();
    else wantFocusRef.current = true;
  }, []);
  const registerComposer = useCallback((focus: () => void) => {
    focusRef.current = focus;
    if (wantFocusRef.current) {
      wantFocusRef.current = false;
      focus();
    }
    return () => {
      if (focusRef.current === focus) focusRef.current = null;
    };
  }, []);

  const openChat = useCallback((options: Chat.OpenChatOptions = {}) => {
    setState((current) => ({
      ...current,
      open: true,
      view: options.view ?? 'chat',
      conversationId:
        options.conversationId === undefined
          ? current.conversationId
          : options.conversationId,
      newAgentId:
        options.agentId === undefined ? current.newAgentId : options.agentId,
    }));
    if (options.source) setSource(options.source);
    const pin = options.pin;
    if (pin)
      setPinned((current) =>
        current.some((item) => itemKey(item) === itemKey(pin))
          ? current
          : [...current, pin],
      );
    if (options.draft) {
      const text = options.draft;
      setDraft((current) => ({ text, nonce: (current?.nonce ?? 0) + 1 }));
    }
  }, []);
  const closeChat = useCallback(
    () => setState((current) => ({ ...current, open: false })),
    [],
  );
  const toggleChat = useCallback(
    () => setState((current) => ({ ...current, open: !current.open })),
    [],
  );

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key.toLowerCase() !== 'j' || event.metaKey === event.ctrlKey)
        return;
      event.preventDefault();
      toggleChat();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [toggleChat]);

  const panel = useMemo<Chat.ChatPanelValue>(
    () => ({
      ...state,
      available,
      openChat,
      closeChat,
      toggleChat,
      setMode: (mode) => setState((current) => ({ ...current, mode })),
      setView: (view) => setState((current) => ({ ...current, view })),
      selectConversation: (conversationId, agentId) =>
        setState((current) => ({
          ...current,
          view: 'chat',
          conversationId,
          newAgentId:
            conversationId === null ? (agentId ?? null) : current.newAgentId,
        })),
      pinned,
      clearPinned: () => setPinned([]),
      draft,
      source,
      resetSource: () => setSource('panel'),
      registerComposer,
      focusComposer,
      openPage: conversationPath
        ? (conversationId) => {
            closeChat();
            void navigate(conversationPath(conversationId));
          }
        : null,
      conversationPath: conversationPath ?? null,
    }),
    [
      state,
      available,
      openChat,
      closeChat,
      toggleChat,
      pinned,
      draft,
      source,
      registerComposer,
      focusComposer,
      conversationPath,
      navigate,
    ],
  );

  const registerItem = useCallback((item: Chat.ChatContextItem) => {
    setItems((current) => [...current, item]);
    return () =>
      setItems((current) => current.filter((other) => other !== item));
  }, []);
  const sources = useMemo<Chat.ChatSourcesValue>(
    () => ({
      items,
      filter: null,
      selection: null,
      removed,
      registerItem,
      registerFilter: () => noop,
      remove: (key) => setRemoved((current) => new Set([...current, key])),
    }),
    [items, removed, registerItem],
  );

  const tracking = useMemo<Chat.ChatPageTracking>(
    () => ({ enter: () => noop, returnTo: () => null }),
    [],
  );

  return (
    <PanelContext.Provider value={panel}>
      <SourcesContext.Provider value={sources}>
        <PageContext.Provider value={tracking}>{children}</PageContext.Provider>
      </SourcesContext.Provider>
    </PanelContext.Provider>
  );
};

// ---------------------------------------------------------------------------------------------------------------------
// Data hooks
// ---------------------------------------------------------------------------------------------------------------------

function query<T>(data: T | undefined): never {
  return {
    data,
    isSuccess: data !== undefined,
    isError: false,
    isPending: data === undefined,
    error: null,
    refetch: () => Promise.resolve(),
  } as never;
}

export const useChatAgents: typeof Chat.useChatAgents = () =>
  query([...AGENTS]);

export const useConversation: typeof Chat.useConversation = (
  conversationId,
) => {
  const { conversations } = useStore();
  return query(
    conversationId
      ? conversations.find((item) => item.id === conversationId)
      : undefined,
  );
};

export const useConversationList: typeof Chat.useConversationList = (
  filter,
) => {
  const { conversations, messages } = useStore();
  const q = filter.q?.toLowerCase();
  const items = conversations
    .filter(
      (item) =>
        (filter.archived === 'all' ||
          Boolean(item.archivedAt) === Boolean(filter.archived)) &&
        (!filter.agentId || item.agent.id === filter.agentId) &&
        (!filter.source || item.source === filter.source) &&
        (!q ||
          (item.title ?? '').toLowerCase().includes(q) ||
          (messages[item.id] ?? []).some((entry) =>
            entry.content.content.toLowerCase().includes(q),
          )),
    )
    .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));
  return {
    ...(query({
      pages: [{ items, nextCursor: null }],
      pageParams: [null],
    }) as object),
    hasNextPage: false,
    isFetchingNextPage: false,
    fetchNextPage: () => Promise.resolve(),
  } as never;
};

export const useConversationMessages: typeof Chat.useConversationMessages = (
  conversationId,
) => {
  const { messages } = useStore();
  const items = conversationId ? (messages[conversationId] ?? []) : [];
  return {
    items,
    pending: [],
    hasMore: false,
    olderToken: null,
    lastSeq: items.at(-1)?.seq ?? 0,
    loaded: true,
    loadingOlder: false,
    error: undefined,
    loadOlder: noop,
    fetchNewer: noop,
    dispatch: noop,
  };
};

export const useSendMessage: typeof Chat.useSendMessage = ({
  conversationId,
  agentId,
  source,
  model = null,
  onCreated,
}) =>
  useCallback(
    (input) => {
      let id = conversationId;
      const agent = AGENTS.find((candidate) => candidate.id === agentId);
      if (!id) {
        if (!agent) return Promise.resolve(null);
        id = `new-${Date.now().toString(36)}`;
        const created = conversation(id, agent.id, input.content.slice(0, 30), {
          source,
          lastMessageAt: new Date().toISOString(),
          ...(model ? { model } : {}),
        });
        update((current) => ({
          ...current,
          conversations: [created, ...current.conversations],
          messages: { ...current.messages, [created.id]: [] },
        }));
        onCreated(created);
      }
      const target = id;
      appendMessage(target, (seq) =>
        message(target, seq, 'user', input.content, {
          createdAt: new Date().toISOString(),
          ...(input.attachments?.length
            ? { attachments: input.attachments }
            : {}),
        }),
      );
      const detail = store.conversations.find((item) => item.id === target);
      if (detail?.mode === 'online') answer(target, detail.agent.id);
      return Promise.resolve(null);
    },
    [conversationId, agentId, source, model, onCreated],
  );

let uploads = 0;

/** Uploads after a moment, the file's bytes kept in the page; a file named `fail…` fails, to show the error. */
export const useChatAttachments: typeof Chat.useChatAttachments = () =>
  useMemo(
    () => ({
      upload: (file, signal) =>
        new Promise<MessageAttachment>((resolve, reject) => {
          const timer = setTimeout(() => {
            if (file.name.startsWith('fail')) {
              reject(new Error('The upload failed.'));
              return;
            }
            uploads += 1;
            resolve(
              attachment(
                `upload-${uploads}`,
                file.name,
                file.type || 'application/octet-stream',
                file.size,
                typeof URL.createObjectURL === 'function'
                  ? URL.createObjectURL(file)
                  : '',
              ),
            );
          }, 400);
          signal?.addEventListener('abort', () => clearTimeout(timer));
        }),
      discard: () => undefined,
    }),
    [],
  );

function mutation<V>(run: (variables: V) => void): never {
  return { mutate: run, isPending: false } as never;
}

export const useConversationActions: typeof Chat.useConversationActions =
  () => ({
    rename: mutation<{ id: string; title: string }>(({ id, title }) =>
      patchConversation(id, (item) => ({
        ...item,
        title,
        titleSource: 'user',
      })),
    ),
    archive: mutation<{ id: string; archived: boolean }>(({ id, archived }) =>
      patchConversation(id, (item) => ({
        ...item,
        archivedAt: archived ? new Date().toISOString() : null,
      })),
    ),
    chooseModel: mutation<{
      id: string;
      model: (typeof MODELS)[number] | null;
    }>(({ id, model }) =>
      patchConversation(id, (item) => ({
        ...item,
        model: model ?? item.models[0] ?? null,
      })),
    ),
    stop: mutation<string>((id) =>
      patchConversation(id, (item) => ({ ...item, run: null })),
    ),
    fallback: mutation<string>(noop),
    restore: mutation<string>(noop),
    markRead: (id: string) => {
      if (store.conversations.find((item) => item.id === id)?.read === false)
        patchConversation(id, (item) => ({ ...item, read: true }));
    },
  });

export const useLiveRunEvents: typeof Chat.useLiveRunEvents = (runId) =>
  useStore().events[runId] ?? [];

const SOURCES: readonly Chat.ConversationSourceOption[] = [
  { key: 'askAgent', label: 'Ask agent' },
  { key: 'home', label: 'Home page' },
];

export const useConversationSources: typeof Chat.useConversationSources = () =>
  SOURCES;
