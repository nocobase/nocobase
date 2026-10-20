/* eslint-disable react-refresh/only-export-components, @eslint-react/no-unnecessary-use-prefix -- a stand-in for a
   module of components and hooks, under the names of the real ones whether or not the stand-in calls a hook */
import type * as Chat from '@nocobase/app-plugin-agents/client/chat';
import { Chat as SDKChat, useChat as useSDKChat } from '@ai-sdk/react';
import {
  createUIMessageStreamResponse,
  DefaultChatTransport,
  type UIMessageChunk,
} from 'ai';
import { appUIMessageText } from '../../../../packages/plugins/app-plugin-agents/shared/ui-message.js';
export { appUIMessageText };
import {
  AIToolRendererProvider as ToolRendererProvider,
  useAIToolRenderer as useToolRenderer,
  getAIToolSourceMessage as toolSourceMessage,
} from '../../../../packages/plugins/app-plugin-agents/client/chat/tool-renderer.js';
export type {
  AIToolPart,
  AIToolRendererContext,
  AIToolRendererMap,
  AIToolRendererProps,
  AIToolRendererProviderProps,
} from '@nocobase/app-plugin-agents/client/chat';

// Use the real context implementation so preview nesting and exact-name dispatch cannot drift.
export const AIToolRendererProvider: typeof Chat.AIToolRendererProvider =
  ToolRendererProvider;
export const useAIToolRenderer: typeof Chat.useAIToolRenderer = useToolRenderer;
export const getAIToolSourceMessage: typeof Chat.getAIToolSourceMessage =
  toolSourceMessage;
export { chatMessageSegments } from '../../../../packages/plugins/app-plugin-agents/client/chat/message-model.js';
import type {
  ChatAgent,
  ConversationDetail,
  ResolvedPageContext,
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
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { useNavigate } from 'react-router';

import { cn } from 'cn';
import {
  contextChips as realContextChips,
  buildPageContext as realBuildPageContext,
  uiItemKey as realUIItemKey,
  snapshotUIContext as realSnapshotUIContext,
} from '../../../../packages/plugins/app-plugin-agents/client/chat/context-model.js';
import { clonePageUIContext } from '../../../../packages/plugins/app-plugin-agents/shared/page-ui-context.js';

// The preview's stand-in for @nocobase/app-plugin-agents/client/chat, aliased in vite.config.ts and mocked with it in
// the tests: the panel's state as the plugin keeps it, and the conversations in memory. A message is answered after a
// moment, the reply growing in place, as a run at work. Every export is
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
    description: 'Everyday coding and writing.',
    nameText: null,
    descriptionText: null,
    avatar: null,
    isSystemDefault: false,
    isMyDefault: true,
    runnerNames: ['Demo runtime'],
    availability: online,
    personalOnly: false,
  },
  {
    id: 'coder',
    name: 'Coding agent',
    description: 'Works in a repository on a runner.',
    nameText: null,
    descriptionText: null,
    avatar: null,
    isSystemDefault: true,
    isMyDefault: false,
    runnerNames: ['Demo runtime'],
    availability: online,
    personalOnly: false,
  },
  {
    id: 'release',
    name: 'Release manager',
    description: null,
    nameText: null,
    descriptionText: null,
    avatar: null,
    isSystemDefault: false,
    isMyDefault: false,
    runnerNames: [],
    availability: { online: false, reason: 'noRunner', onlineRunners: 0 },
    personalOnly: true,
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

function conversation(
  id: string,
  agentId: string,
  title: string,
  fields: Partial<ConversationDetail> = {},
): ConversationDetail {
  const agent = AGENTS.find((candidate) => candidate.id === agentId);
  return {
    id,
    title,
    titleSource: 'auto',
    category: 'chat',
    showInChatList: true,
    source: 'panel',
    mode: 'runner',
    agent: agentRef(agentId),
    fallbackFrom: null,
    read: true,
    lastMessageAt: ago(5),
    archivedAt: null,
    createdAt: ago(60),
    updatedAt: ago(5),
    run: null,
    availability: agent?.availability ?? online,
    canFallback: false,
    canRestore: false,
    ...fields,
  };
}

function message(
  conversationId: string,
  seq: number,
  role: Chat.AppUIMessage['role'],
  content: string,
  fields: {
    createdAt?: string;
    workContext?: ResolvedPageContext;
    attachments?: readonly MessageAttachment[];
    metadata?: {
      agentId?: string;
      clientId?: string;
      notice?: ConversationNotice;
    };
  } = {},
): Chat.AppUIMessage {
  const notice = fields.metadata?.notice;
  return {
    id: `${conversationId}-${seq}`,
    role,
    metadata: {
      conversationId,
      seq,
      revision: 1,
      createdAt: fields.createdAt ?? ago(30 - seq),
      ...(fields.metadata?.agentId ? { agentId: fields.metadata.agentId } : {}),
      ...(fields.metadata?.clientId
        ? { clientId: fields.metadata.clientId }
        : {}),
      ...(fields.workContext ? { context: fields.workContext } : {}),
    },
    parts: [
      ...(notice
        ? notice.code === 'news'
          ? [
              {
                type: 'data-notice' as const,
                id: `notice-${seq}`,
                data: {
                  type: notice.type,
                  title: notice.title,
                  ...(notice.params ? { params: { ...notice.params } } : {}),
                },
              },
            ]
          : [
              {
                type: 'data-business' as const,
                id: `business-${seq}`,
                data: {
                  kind: notice.code,
                  id: `record-${seq}`,
                  payload: JSON.parse(JSON.stringify(notice)) as Chat.AppUIJson,
                },
              },
            ]
        : [{ type: 'text' as const, text: content, state: 'done' as const }]),
      ...(fields.attachments ?? []).map((file) => ({
        type: 'file' as const,
        filename: file.filename,
        mediaType: file.mimeType,
        url: file.contentUrl,
      })),
    ],
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
  readonly messages: Readonly<Record<string, readonly Chat.AppUIMessage[]>>;
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
              plans: 3,
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
const chats = new Map<string, SDKChat<Chat.AppUIMessage>>();
const stopReplies = new Map<string, () => void>();
let generation = 0;
function demoChat(id: string): SDKChat<Chat.AppUIMessage> {
  let chat = chats.get(id);
  if (!chat) {
    chat = new SDKChat<Chat.AppUIMessage>({
      id,
      messages: [...(store.messages[id] ?? [])],
      transport: new DefaultChatTransport({
        api: id,
        fetch: async () =>
          answer(
            id,
            store.conversations.find((item) => item.id === id)?.agent.id ??
              'assistant',
          ),
      }),
    });
    chats.set(id, chat);
  }
  return chat;
}

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
  generation++;
  for (const stop of stopReplies.values()) stop();
  stopReplies.clear();
  for (const chat of chats.values()) void chat.stop();
  chats.clear();
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
  build: (seq: number) => Chat.AppUIMessage,
): Chat.AppUIMessage {
  const list = store.messages[conversationId] ?? [];
  const added = build(list.length + 1);
  update((current) => ({
    ...current,
    messages: { ...current.messages, [conversationId]: [...list, added] },
  }));
  return added;
}

const REPLY =
  'Here is what I would do:\n\n1. Review **PM-12** today.\n2. Let the coding agent finish PM-15.\n3. Move PM-18 to the next release.';

/** A deterministic producer emits standard SDK chunks and saves only its final public message. */
function answer(conversationId: string, agentId: string): Response {
  const ownGeneration = generation;
  const seq = (store.messages[conversationId]?.length ?? 0) + 1;
  const id = `${conversationId}-${seq}`;
  const createdAt = new Date().toISOString();
  let length = 0,
    ended = false;
  let output!: ReadableStreamDefaultController<UIMessageChunk>;
  let interval: ReturnType<typeof setInterval> | undefined;
  let start: ReturnType<typeof setTimeout>;
  patchConversation(conversationId, (item) => ({
    ...item,
    run: { id: `run-${conversationId}`, status: 'running', acceptsInput: true },
    execution: { status: 'running' },
  }));
  const finish = (cancelled = false) => {
    if (ended) return;
    ended = true;
    clearTimeout(start);
    clearInterval(interval);
    replyTimers.delete(start);
    if (interval) replyTimers.delete(interval);
    stopReplies.delete(conversationId);
    if (ownGeneration !== generation) {
      output.close();
      return;
    }
    const saved: Chat.AppUIMessage = {
      id,
      role: 'assistant',
      metadata: { conversationId, seq, revision: 1, createdAt, agentId },
      parts: [{ type: 'text', text: REPLY.slice(0, length), state: 'done' }],
    };
    if (length) appendMessage(conversationId, () => saved);
    patchConversation(conversationId, (item) => ({
      ...item,
      run: null,
      execution: {
        status: 'idle',
        outcome: cancelled ? 'cancelled' : 'completed',
      },
      lastMessageAt: new Date().toISOString(),
    }));
    if (length) output.enqueue({ type: 'text-end', id: 'text' });
    output.enqueue({
      type: 'finish',
      ...(length ? { messageMetadata: saved.metadata } : {}),
      finishReason: cancelled ? 'other' : 'stop',
    });
    output.close();
  };
  const stream = new ReadableStream<UIMessageChunk>({
    start(controller) {
      output = controller;
      start = setTimeout(() => {
        replyTimers.delete(start);
        if (ownGeneration !== generation) return;
        output.enqueue({
          type: 'start',
          messageId: id,
          messageMetadata: { conversationId, createdAt, agentId, revision: 0 },
        });
        output.enqueue({ type: 'text-start', id: 'text' });
        interval = setInterval(() => {
          const before = length;
          length = Math.min(REPLY.length, length + 12);
          output.enqueue({
            type: 'text-delta',
            id: 'text',
            delta: REPLY.slice(before, length),
          });
          if (length === REPLY.length) finish();
        }, 80);
        replyTimers.add(interval);
      }, 700);
      replyTimers.add(start);
    },
    cancel() {
      ended = true;
      clearTimeout(start);
      clearInterval(interval);
      stopReplies.delete(conversationId);
    },
  });
  stopReplies.set(conversationId, () => finish(true));
  return createUIMessageStreamResponse({ stream });
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

export const contextChips: typeof Chat.contextChips = realContextChips;
export const buildPageContext: typeof Chat.buildPageContext =
  realBuildPageContext;
export const uiItemKey: typeof Chat.uiItemKey = realUIItemKey;
export const snapshotUIContext: typeof Chat.snapshotUIContext =
  realSnapshotUIContext;

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
  uiSources: [],
  selectedUIKeys: new Set(),
  registerUI: () => noop,
  selectUI: noop,
  snapshotUI: async () => undefined,
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

export const useChatUIContextSource: typeof Chat.useChatUIContextSource = (
  source,
) => {
  const { registerUI } = useChatSources();
  const latestRef = useRef(source);
  useLayoutEffect(() => {
    latestRef.current = source;
  });
  const kind = source?.kind;
  const id = source?.id;
  useEffect(() => {
    if (kind === undefined || id === undefined) return;
    return registerUI({
      kind,
      id,
      get label() {
        return latestRef.current?.label ?? id;
      },
      getSnapshot: () => {
        const current = latestRef.current;
        if (!current || current.kind !== kind || current.id !== id)
          throw new Error('UI context source is no longer available.');
        return current.getSnapshot();
      },
    });
  }, [registerUI, kind, id]);
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

  const uiRegistryRef = useRef(new Map<string, Chat.ChatUIContextSource>());
  const [uiSources, setUISources] = useState<
    readonly Chat.ChatUIContextSource[]
  >([]);
  const [selectedUIKeys, setSelectedUIKeys] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const selectedUIRef = useRef(selectedUIKeys);
  const registerUI = useCallback((source: Chat.ChatUIContextSource) => {
    const key = uiItemKey(source);
    if (uiRegistryRef.current.has(key))
      throw new Error(`UI context source already registered: ${key}`);
    clonePageUIContext({
      version: 1,
      items: [{ kind: source.kind, id: source.id }],
    });
    const registered: Chat.ChatUIContextSource = {
      kind: source.kind,
      id: source.id,
      get label() {
        return source.label;
      },
      getSnapshot: () => source.getSnapshot(),
    };
    uiRegistryRef.current.set(key, registered);
    setUISources([...uiRegistryRef.current.values()]);
    return () => {
      if (uiRegistryRef.current.get(key) !== registered) return;
      uiRegistryRef.current.delete(key);
      setUISources([...uiRegistryRef.current.values()]);
      const next = new Set(selectedUIRef.current);
      next.delete(key);
      selectedUIRef.current = next;
      setSelectedUIKeys(next);
    };
  }, []);
  const selectUI = useCallback<Chat.ChatSourcesValue['selectUI']>(
    (source, selected = true) => {
      const key = uiItemKey(source);
      if (selected && !uiRegistryRef.current.has(key))
        throw new Error('UI context source is no longer registered.');
      const next = new Set(selectedUIRef.current);
      if (selected) next.add(key);
      else next.delete(key);
      selectedUIRef.current = next;
      setSelectedUIKeys(next);
    },
    [],
  );
  const snapshotUI = useCallback<
    Chat.ChatSourcesValue['snapshotUI']
  >(async () => {
    const selected = selectedUIRef.current;
    const entries = [...uiRegistryRef.current.entries()].filter(([key]) =>
      selected.has(key),
    );
    const snapshot = await snapshotUIContext(
      entries.map(([, source]) => source),
    );
    if (
      selected !== selectedUIRef.current ||
      entries.some(([key, source]) => uiRegistryRef.current.get(key) !== source)
    )
      throw new Error(
        'UI context selection or source changed while reading its snapshot.',
      );
    return snapshot;
  }, []);
  const registerItem = useCallback((item: Chat.ChatContextItem) => {
    setItems((current) => [...current, item]);
    return () =>
      setItems((current) => current.filter((other) => other !== item));
  }, []);
  const sources = useMemo<Chat.ChatSourcesValue>(
    () => ({
      uiSources,
      selectedUIKeys,
      registerUI,
      selectUI,
      snapshotUI,
      items,
      filter: null,
      selection: null,
      removed,
      registerItem,
      registerFilter: () => noop,
      remove: (key) => {
        const source = uiRegistryRef.current.get(key);
        if (source) selectUI(source, false);
        else setRemoved((current) => new Set([...current, key]));
      },
    }),
    [
      uiSources,
      selectedUIKeys,
      registerUI,
      selectUI,
      snapshotUI,
      items,
      removed,
      registerItem,
    ],
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

export const useChatModels: typeof Chat.useChatModels = () => query([]);
export const useConversationModel: typeof Chat.useConversationModel = () => ({
  configuration: query(undefined),
  select: mutation(() => {}),
  changing: false,
});
export const useConversation: typeof Chat.useConversation = (
  conversationId,
) => {
  const { conversations } = useStore();
  return query(
    conversationId
      ? (() => {
          const item = conversations.find((item) => item.id === conversationId);
          return item
            ? {
                ...item,
                execution: item.execution ?? {
                  status: item.run ? 'running' : 'idle',
                },
              }
            : undefined;
        })()
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
            appUIMessageText(entry).toLowerCase().includes(q),
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
  useStore();
  const sdk = useSDKChat({ chat: demoChat(conversationId ?? 'draft') });
  const items = conversationId ? sdk.messages : [];
  return {
    items,
    pending: [],
    hasMore: false,
    olderToken: null,
    lastSeq: Math.max(0, ...items.map((message) => message.metadata?.seq ?? 0)),
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
  onCreated,
}) =>
  useCallback(
    (input) => {
      let id = conversationId;
      const agent = AGENTS.find((candidate) => candidate.id === agentId);
      if (!id) {
        if (!agent) return false;
        id = `new-${Date.now().toString(36)}`;
        const created = conversation(id, agent.id, input.content.slice(0, 30), {
          source,
          lastMessageAt: new Date().toISOString(),
        });
        update((current) => ({
          ...current,
          conversations: [created, ...current.conversations],
          messages: { ...current.messages, [created.id]: [] },
        }));
        onCreated(created);
      }
      const target = id;
      const sdk = demoChat(target);
      const saved = appendMessage(target, (seq) =>
        message(target, seq, 'user', input.content, {
          createdAt: new Date().toISOString(),
          ...(input.attachments?.length
            ? { attachments: input.attachments }
            : {}),
        }),
      );
      const detail = store.conversations.find((item) => item.id === target);
      if (detail) void sdk.sendMessage(saved);
      return true;
    },
    [conversationId, agentId, source, onCreated],
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
    stop: mutation<string>((id) => {
      stopReplies.get(id)?.();
      patchConversation(id, (item) => ({
        ...item,
        run: null,
        execution: { status: 'idle', outcome: 'cancelled' },
      }));
    }),
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

/** The preview has no network stream; production chat uses the plugin controller. */
export const useChatStream: typeof Chat.useChatStream = (id) => {
  const sdk = useSDKChat({ chat: demoChat(id ?? 'draft') });
  return id ? { status: sdk.status, error: sdk.error } : undefined;
};
export const useChatController: typeof Chat.useChatController = () =>
  ({
    refresh: async () => {},
    resume: async () => {},
    finalize: async () => {},
    approve: async () => {},
    isStopping: () => false,
    submissions: {
      blocked: () => false,
      snapshot: () => [],
      releaseUnknown: () => false,
    },
  }) as unknown as ReturnType<typeof Chat.useChatController>;

export {
  chatFeedback,
  chatIsRunning,
} from '../../../../packages/plugins/app-plugin-agents/client/chat/feedback.js';
export { useChatScroll } from '../../../../packages/plugins/app-plugin-agents/client/chat/use-chat-scroll.js';
