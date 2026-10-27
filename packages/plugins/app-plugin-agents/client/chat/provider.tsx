/* eslint-disable react-refresh/only-export-components -- the provider and its hooks are intentionally colocated */
/**
 * The chat panel across the whole application: its state, ⌘J / Ctrl+J, the `?chat=` links, what the current page
 * contributes as context, and the text last selected on the page. The application renders `ChatProvider` around its
 * routes (for example, in `AppLayout`), so none of it resets when the page changes; only the page's own sources, the
 * selection and the removed chips follow the path.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type Provider,
  type ReactElement,
  type ReactNode,
} from 'react';
import { useHref, useLocation, useNavigate } from 'react-router';

import type {
  ConversationMode,
  ConversationSource,
  PageContextRef,
  PageUIContext,
} from '../../shared/conversations.js';
import { clonePageUIContext } from '../../shared/page-ui-context.js';
import {
  clampSelection,
  itemKey,
  FILTER_KEY,
  parseSourceAttribute,
  SELECTION_KEY,
  SOURCE_ATTRIBUTE,
  snapshotUIContext,
  uiItemKey,
  type ChatUIContextSource,
  type ChatContextFilter,
  type ChatContextItem,
  type ChatSelection,
} from './context-model.js';
import {
  CHAT_PARAM,
  isChatShortcut,
  panelStateFromSearch,
  readPanelState,
  withoutPanelParams,
  writePanelState,
  type ChatPanelMode,
  type ChatPanelState,
  type ChatPanelView,
} from './panel-state.js';
import { readLastAgent, rememberLastAgent } from './agent-mode.js';
import { ChatClientProvider } from './controller.js';
import { useChatRealtime } from './use-chat.js';

export const CHAT_PANEL_ID = 'agents-chat-panel';
/** Marks the panel's DOM: a selection inside it is not page context, and focus inside it means "in the panel". */
export const CHAT_PANEL_ATTRIBUTE = 'data-agents-chat';

export interface OpenChatOptions {
  /** An object kept in the context until the next message is sent ("Ask agent"). */
  readonly pin?: ChatContextItem;
  /** Registered browser UI sources included atomically with opening this chat; never read until send. */
  readonly uiSources?: readonly PageContextRef[];
  /** Text put into the composer; never sent on its own. An explicit empty string is retained. */
  readonly draft?: string;
  /** Open this conversation; null always resets to a fresh composer; left out keeps the current one. */
  readonly conversationId?: string | null;
  /** The agent a new conversation goes to. */
  readonly agentId?: string | null;
  /** Where a conversation started from here comes from: `askAgent` for a button on a page. */
  readonly source?: ConversationSource;
  readonly view?: ChatPanelView;
}

interface ContextChange {
  readonly revision: number;
  readonly pin: ChatContextItem | undefined;
  readonly uiSources: readonly PageContextRef[] | undefined;
}

export interface ChatDraft {
  readonly text: string;
  readonly nonce: number;
}

export interface ChatPanelValue extends ChatPanelState {
  /** The viewer may chat (signed in, and the application offers the panel). */
  readonly available: boolean;
  readonly openChat: (options?: OpenChatOptions) => void;
  readonly closeChat: () => void;
  readonly toggleChat: () => void;
  readonly setMode: (mode: ChatPanelMode) => void;
  readonly setView: (view: ChatPanelView) => void;
  /** Shows a conversation; null starts a fresh one. Preserve the composer only for executor changes or first-send promotion. */
  readonly selectConversation: (
    conversationId: string | null,
    agentId?: string | null,
    options?: { readonly preserveComposer?: boolean },
  ) => void;
  readonly pinned: readonly ChatContextItem[];
  readonly clearPinned: () => void;
  readonly draft: ChatDraft | null;
  /** Changes only when a fresh composer is requested, not on close/reopen or first-send promotion. */
  readonly composerRevision: number;
  /** Where the next new conversation comes from; back to `panel` once it is created. */
  readonly source: ConversationSource;
  readonly resetSource: () => void;
  /** The composer registers how to focus it; the returned function unregisters. */
  readonly registerComposer: (focus: () => void) => () => void;
  readonly focusComposer: () => void;
  /**
   * Opens a conversation on the application's full-page view and closes the panel; null when the application gave
   * `ChatProvider` no `conversationPath`.
   */
  readonly openPage: ((conversationId: string) => void) | null;
  /** The full-page view's path of a conversation; null without one. */
  readonly conversationPath: ((conversationId: string) => string) | null;
  /** Switches the panel to one kind of agent (`online` or `runner`); null goes back to choosing it from the agents. */
  readonly setAgentMode?: (mode: ConversationMode | null) => void;
  /** The agent last used for a new conversation, remembered per application and `memoryScope`; null when none. */
  readonly lastAgentId?: string | null;
  /** Remembers the agent a new conversation went to, so the next one starts with it. */
  readonly rememberAgent?: (agentId: string) => void;
}

export interface ChatSourcesValue {
  /** All available UI sources; registration does not upload or select them. */
  readonly uiSources: readonly ChatUIContextSource[];
  readonly selectedUIKeys: ReadonlySet<string>;
  readonly registerUI: (source: ChatUIContextSource) => () => void;
  /** Explicit user intent, separate from source/form registration. */
  readonly selectUI: (source: PageContextRef, selected?: boolean) => void;
  /** Reads latest values of the currently selected sources and detaches them. */
  readonly snapshotUI: () => Promise<PageUIContext | undefined>;
  readonly items: readonly ChatContextItem[];
  readonly filter: ChatContextFilter | null;
  readonly selection: ChatSelection | null;
  readonly removed: ReadonlySet<string>;
  /** Registers an object the page shows; the returned function unregisters it. */
  readonly registerItem: (item: ChatContextItem) => () => void;
  readonly registerFilter: (filter: ChatContextFilter) => () => void;
  readonly remove: (key: string) => void;
}

const ChatPanelContext = createContext<ChatPanelValue | null>(null);
/** The full-page view puts its own value over the panel's for its subtree (`page.tsx`). */
export const ChatPanelScope: Provider<ChatPanelValue | null> =
  ChatPanelContext.Provider;

/**
 * Where the person was before they opened the full-page view, so that moving the conversation to the panel ("Open in
 * side panel") takes them back there. The page tells the provider while it is mounted (`enter`); the provider remembers
 * every other location (`returnTo`: path, search and hash; null when the application opened on the page).
 */
export interface ChatPageTracking {
  readonly enter: () => () => void;
  readonly returnTo: () => string | null;
}

const ChatPageContext = createContext<ChatPageTracking | null>(null);

export function useChatPageTracking(): ChatPageTracking | null {
  return useContext(ChatPageContext);
}
const ChatSourcesContext = createContext<ChatSourcesValue | null>(null);

function noop(): void {}

const NO_SOURCES: ChatSourcesValue = {
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

const UNAVAILABLE: ChatPanelValue = {
  open: false,
  mode: 'docked',
  view: 'chat',
  conversationId: null,
  newAgentId: null,
  available: false,
  openChat: noop,
  closeChat: noop,
  toggleChat: noop,
  setMode: noop,
  setView: noop,
  selectConversation: noop,
  pinned: [],
  clearPinned: noop,
  draft: null,
  composerRevision: 0,
  source: 'panel',
  resetSource: noop,
  registerComposer: () => noop,
  focusComposer: noop,
  openPage: null,
  conversationPath: null,
};

/** The panel's state and actions; outside `ChatProvider`, a closed panel nobody can open. */
export function useChatPanel(): ChatPanelValue {
  return useContext(ChatPanelContext) ?? UNAVAILABLE;
}

/** What the current page contributes; outside `ChatProvider`, nothing (and registering does nothing). */
export function useChatSources(): ChatSourcesValue {
  return useContext(ChatSourcesContext) ?? NO_SOURCES;
}

function focusIsInPanel(): boolean {
  const active =
    typeof document === 'undefined' ? null : document.activeElement;
  return (
    active instanceof Element &&
    active.closest(`[${CHAT_PANEL_ATTRIBUTE}]`) !== null
  );
}

export function ChatProvider({
  available = true,
  conversationPath,
  memoryScope,
  children,
}: {
  readonly available?: boolean;
  /**
   * Who the panel remembers things for in `localStorage`, such as the agent last used: pass the signed-in person's id.
   * The application's base path is added, so two applications on one origin keep theirs apart.
   */
  readonly memoryScope?: string;
  /**
   * Where the application shows one conversation as a page of its own (for example, `/chat/:conversationId`). With it, the
   * panel offers "Open full page" for a conversation, and the agent-chat block's `ChatConversationPage` moves between
   * conversations there.
   */
  readonly conversationPath?: (conversationId: string) => string;
  readonly children?: ReactNode;
}): ReactElement {
  const location = useLocation();
  const navigate = useNavigate();
  // The one subscription that keeps every chat view's conversations current, whichever views the application renders.
  useChatRealtime(available);
  const [state, setState] = useState<ChatPanelState>(() => readPanelState());
  const [pinned, setPinned] = useState<readonly ChatContextItem[]>([]);
  const [draft, setDraft] = useState<ChatDraft | null>(null);
  const [composerRevision, setComposerRevision] = useState(0);
  const [contextChange, setContextChange] = useState<ContextChange | null>(
    null,
  );
  const conversationRef = useRef(state.conversationId);
  useLayoutEffect(() => {
    conversationRef.current = state.conversationId;
  }, [state.conversationId]);
  const resetComposer = useCallback((options: OpenChatOptions = {}) => {
    setComposerRevision((revision) => revision + 1);
    setDraft(null);
    setPinned([]);
    setContextChange((current) => ({
      revision: (current?.revision ?? 0) + 1,
      pin: options.pin,
      uiSources: options.uiSources,
    }));
  }, []);
  const [source, setSource] = useState<ConversationSource>('panel');
  const composerFocusRef = useRef<(() => void) | null>(null);
  const focusWantedRef = useRef(false);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const draftNonceRef = useRef(0);

  useEffect(() => writePanelState(state), [state]);

  const base = useHref('/');
  const memoryKey = memoryScope ? `${base}:${memoryScope}` : base;
  const [lastAgent, setLastAgent] = useState(() => ({
    key: memoryKey,
    id: readLastAgent(memoryKey),
  }));
  if (lastAgent.key !== memoryKey)
    setLastAgent({ key: memoryKey, id: readLastAgent(memoryKey) });
  const rememberAgent = useCallback(
    (agentId: string) => {
      rememberLastAgent(memoryKey, agentId);
      setLastAgent({ key: memoryKey, id: agentId });
    },
    [memoryKey],
  );

  const focusComposer = useCallback(() => {
    focusWantedRef.current = true;
    if (composerFocusRef.current) {
      composerFocusRef.current();
      // A new conversation may remount the composer in this same update: the next one to register takes the focus.
      window.setTimeout(() => {
        focusWantedRef.current = false;
      }, 0);
    }
  }, []);

  const registerComposer = useCallback((focus: () => void) => {
    composerFocusRef.current = focus;
    if (focusWantedRef.current) {
      focusWantedRef.current = false;
      focus();
    }
    return () => {
      if (composerFocusRef.current === focus) composerFocusRef.current = null;
    };
  }, []);

  const openChat = useCallback(
    (options: OpenChatOptions = {}) => {
      if (!focusIsInPanel() && document.activeElement instanceof HTMLElement)
        returnFocusRef.current = document.activeElement;
      const view = options.view ?? 'chat';
      const fresh =
        options.conversationId !== undefined &&
        (options.conversationId === null ||
          options.conversationId !== conversationRef.current);
      if (fresh) resetComposer(options);
      else if (options.pin || options.uiSources !== undefined)
        setContextChange((current) => ({
          revision: current?.revision ?? 0,
          pin: options.pin,
          uiSources: options.uiSources,
        }));
      if (options.conversationId !== undefined)
        conversationRef.current = options.conversationId;
      setState((current) => ({
        ...current,
        open: true,
        view,
        conversationId:
          options.conversationId === undefined
            ? current.conversationId
            : options.conversationId,
        newAgentId:
          options.agentId === undefined ? current.newAgentId : options.agentId,
        // An agent asked for decides the panel's mode.
        agentMode: options.agentId ? null : (current.agentMode ?? null),
      }));
      if (options.source) setSource(options.source);
      const pin = options.pin;
      if (pin)
        setPinned((current) =>
          current.some((item) => itemKey(item) === itemKey(pin))
            ? current
            : [...current, pin],
        );
      if (options.draft !== undefined) {
        draftNonceRef.current += 1;
        setDraft({ text: options.draft, nonce: draftNonceRef.current });
      }
      if (view === 'chat') focusComposer();
    },
    [focusComposer, resetComposer],
  );

  const closeChat = useCallback(() => {
    const inPanel = focusIsInPanel();
    setState((current) => ({ ...current, open: false, mode: 'docked' }));
    const target = returnFocusRef.current;
    returnFocusRef.current = null;
    if (inPanel && target?.isConnected) target.focus();
  }, []);

  // The last two locations seen while no page is mounted. A page's effect runs before this provider's when it mounts
  // with its location, so the page's own location is not recorded; a page loaded lazily mounts a commit later, after
  // its location was recorded, and then the location before it is the one to go back to.
  const pagesRef = useRef(0);
  const lastRef = useRef<string | null>(null);
  const beforeRef = useRef<string | null>(null);
  const outsideRef = useRef<string | null>(null);
  const here = `${location.pathname}${location.search}${location.hash}`;
  const hereRef = useRef(here);
  useLayoutEffect(() => {
    hereRef.current = here;
  });
  useEffect(() => {
    if (pagesRef.current > 0) return;
    beforeRef.current = lastRef.current;
    lastRef.current = here;
  }, [here]);
  const pageTracking = useMemo<ChatPageTracking>(
    () => ({
      enter: () => {
        if (pagesRef.current === 0)
          outsideRef.current =
            lastRef.current === hereRef.current
              ? beforeRef.current
              : lastRef.current;
        pagesRef.current += 1;
        return () => {
          pagesRef.current -= 1;
        };
      },
      returnTo: () => outsideRef.current,
    }),
    [],
  );

  const pathOf = conversationPath ?? null;
  const openPage = useMemo(
    () =>
      pathOf
        ? (conversationId: string) => {
            setState((current) => ({
              ...current,
              open: false,
              mode: 'docked',
            }));
            returnFocusRef.current = null;
            void navigate(pathOf(conversationId));
          }
        : null,
    [pathOf, navigate],
  );

  const toggleChat = useCallback(() => {
    if (state.open) closeChat();
    else openChat();
  }, [state.open, closeChat, openChat]);

  // ⌘J / Ctrl+J: closed, open and focus the composer; open with focus elsewhere, bring the focus in; inside, close.
  const shortcutRef = useRef<() => void>(noop);
  useEffect(() => {
    shortcutRef.current = () => {
      if (!state.open) openChat();
      else if (!focusIsInPanel()) {
        if (state.view !== 'chat')
          setState((current) => ({ ...current, view: 'chat' }));
        if (document.activeElement instanceof HTMLElement)
          returnFocusRef.current = document.activeElement;
        focusComposer();
      } else closeChat();
    };
  });
  useEffect(() => {
    if (!available) return undefined;
    function onKeyDown(event: KeyboardEvent): void {
      if (event.defaultPrevented || !isChatShortcut(event)) return;
      event.preventDefault();
      shortcutRef.current();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [available]);

  // `?chat=` opens the panel, then leaves the URL. The state follows the URL while rendering; the effect only
  // rewrites the URL.
  const [seenSearch, setSeenSearch] = useState<string | null>(null);
  if (available && location.search !== seenSearch) {
    setSeenSearch(location.search);
    const params = new URLSearchParams(location.search);
    const next = panelStateFromSearch(params, state);
    if (next) {
      if (
        next.conversationId !== state.conversationId ||
        params.get(CHAT_PARAM)?.trim() === 'new'
      )
        resetComposer();
      setState(next);
    }
  }
  const { pathname, search, hash } = location;
  useEffect(() => {
    if (!available) return;
    const params = new URLSearchParams(search);
    if (!params.has(CHAT_PARAM)) return;
    void navigate(
      { pathname, search: withoutPanelParams(params), hash },
      { replace: true },
    );
  }, [available, pathname, search, hash, navigate]);

  const value = useMemo<ChatPanelValue>(
    () => ({
      ...state,
      open: available && state.open,
      available,
      openChat,
      closeChat,
      toggleChat,
      setMode: (mode) => setState((current) => ({ ...current, mode })),
      setView: (view) => setState((current) => ({ ...current, view })),
      selectConversation: (conversationId, agentId, options) => {
        const changed = conversationId !== conversationRef.current;
        if ((conversationId === null || changed) && !options?.preserveComposer)
          resetComposer();
        else if (changed) setDraft(null);
        conversationRef.current = conversationId;
        setState((current) => ({
          ...current,
          view: 'chat',
          conversationId,
          newAgentId:
            conversationId === null && agentId !== undefined
              ? agentId
              : current.newAgentId,
          agentMode:
            conversationId === null && agentId
              ? null
              : (current.agentMode ?? null),
        }));
      },
      pinned,
      clearPinned: () => setPinned([]),
      draft,
      composerRevision,
      source,
      resetSource: () => setSource('panel'),
      registerComposer,
      focusComposer,
      openPage,
      conversationPath: pathOf,
      setAgentMode: (agentMode) =>
        setState((current) => ({ ...current, agentMode })),
      lastAgentId: lastAgent.id,
      rememberAgent,
    }),
    [
      lastAgent.id,
      rememberAgent,
      openPage,
      pathOf,
      state,
      available,
      openChat,
      closeChat,
      toggleChat,
      pinned,
      draft,
      composerRevision,
      resetComposer,
      source,
      registerComposer,
      focusComposer,
    ],
  );

  return (
    <ChatPanelContext.Provider value={value}>
      <ChatPageContext.Provider value={pageTracking}>
        <ChatSourcesProvider
          pathname={location.pathname}
          contextChange={contextChange}
          onUnpin={(key) =>
            setPinned((current) =>
              current.filter((item) => itemKey(item) !== key),
            )
          }
        >
          <ChatClientProvider>{children}</ChatClientProvider>
        </ChatSourcesProvider>
      </ChatPageContext.Provider>
    </ChatPanelContext.Provider>
  );
}

let sourceSeed = 0;

/** What the current page contributes; objects, the filter, the selection and removed chips reset with the path. */
function ChatSourcesProvider({
  pathname,
  contextChange,
  onUnpin,
  children,
}: {
  readonly pathname: string;
  readonly contextChange: ContextChange | null;
  readonly onUnpin: (key: string) => void;
  readonly children?: ReactNode;
}): ReactElement {
  const [items, setItems] = useState<ReadonlyMap<number, ChatContextItem>>(
    () => new Map(),
  );
  const [filters, setFilters] = useState<
    ReadonlyMap<number, ChatContextFilter>
  >(() => new Map());
  const uiRegistryRef = useRef(new Map<string, ChatUIContextSource>());
  const uiLifetimeRef = useRef(0);
  useLayoutEffect(
    () => () => {
      uiLifetimeRef.current += 1;
    },
    [],
  );
  const [removed, setRemoved] = useState<ReadonlySet<string>>(() => new Set());
  const [uiSources, setUISources] = useState<readonly ChatUIContextSource[]>(
    [],
  );
  const [selectedUIKeys, setSelectedUIKeys] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const selectedUIRef = useRef(selectedUIKeys);
  useLayoutEffect(() => {
    selectedUIRef.current = selectedUIKeys;
  }, [selectedUIKeys]);
  const registerUI = useCallback((source: ChatUIContextSource) => {
    const key = uiItemKey(source);
    if (uiRegistryRef.current.has(key))
      throw new Error(`UI context source already registered: ${key}`);
    clonePageUIContext({
      version: 1,
      items: [{ kind: source.kind, id: source.id }],
    });
    // A fresh lease prevents an old cleanup from deleting a later registration of the same descriptor object.
    const registered: ChatUIContextSource = {
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
  const selectUI = useCallback((source: PageContextRef, selected = true) => {
    const key = uiItemKey(source);
    if (selected && !uiRegistryRef.current.has(key))
      throw new Error('UI context source is no longer registered.');
    const next = new Set(selectedUIRef.current);
    if (selected) next.add(key);
    else next.delete(key);
    selectedUIRef.current = next;
    setSelectedUIKeys(next);
    setRemoved((current) => {
      const nextRemoved = new Set(current);
      nextRemoved.delete(key);
      return nextRemoved;
    });
  }, []);
  const snapshotUI = useCallback(async () => {
    const lifetime = uiLifetimeRef.current;
    const selected = selectedUIRef.current;
    if ([...selected].some((key) => !uiRegistryRef.current.has(key)))
      throw new Error('UI context source is no longer registered.');
    const entries = [...uiRegistryRef.current.entries()].filter(([key]) =>
      selected.has(key),
    );
    const snapshot = await snapshotUIContext(
      entries.map(([, source]) => source),
    );
    if (
      lifetime !== uiLifetimeRef.current ||
      selected !== selectedUIRef.current ||
      entries.some(([key, source]) => uiRegistryRef.current.get(key) !== source)
    )
      throw new Error(
        'UI context selection or source changed while reading its snapshot.',
      );
    return snapshot;
  }, []);
  const [selection, setSelection] = useState<ChatSelection | null>(null);
  const onUnpinRef = useRef(onUnpin);
  useEffect(() => {
    onUnpinRef.current = onUnpin;
  });

  // Keep registrations alive: reset only what this editor carries, not the page's ability to contribute.
  const [seenContextChange, setSeenContextChange] = useState(contextChange);
  if (contextChange !== seenContextChange) {
    const clear =
      contextChange?.revision !== (seenContextChange?.revision ?? 0);
    setSeenContextChange(contextChange);
    if (contextChange) {
      const nextRemoved = clear
        ? new Set(
            [...items.values()].map(itemKey).concat(FILTER_KEY, SELECTION_KEY),
          )
        : new Set(removed);
      const nextSelected = clear ? new Set<string>() : new Set(selectedUIKeys);
      if (clear) setSelection(null);
      if (contextChange.pin) nextRemoved.delete(itemKey(contextChange.pin));
      for (const source of contextChange.uiSources ?? []) {
        const key = uiItemKey(source);
        nextSelected.add(key);
        nextRemoved.delete(key);
      }
      setSelectedUIKeys(nextSelected);
      setRemoved(nextRemoved);
    }
  }

  const [seenPath, setSeenPath] = useState(pathname);
  if (pathname !== seenPath) {
    setSeenPath(pathname);
    setSelection(null);
    setRemoved(new Set());
    setSelectedUIKeys(new Set());
  }

  // The page's selection, never one inside the chat (panel, page, history). Clicking into the chat collapses the page's
  // selection but keeps it as the context; collapsing it anywhere else (a click on the page, Escape) drops it.
  useEffect(() => {
    function inChat(node: Node | null | undefined): boolean {
      const element =
        node instanceof Element ? node : (node?.parentElement ?? null);
      return element?.closest(`[${CHAT_PANEL_ATTRIBUTE}]`) != null;
    }
    function onSelectionChange(): void {
      const current = document.getSelection();
      const text =
        current && !current.isCollapsed
          ? clampSelection(current.toString())
          : '';
      if (!current || !text) {
        if (focusIsInPanel() || inChat(current?.anchorNode)) return;
        setSelection(null);
        return;
      }
      if (inChat(current.anchorNode) || inChat(current.focusNode)) return;
      const anchor = current.anchorNode;
      const element =
        anchor instanceof Element ? anchor : (anchor?.parentElement ?? null);
      if (element?.closest('input, textarea, [contenteditable="true"]')) return;
      const from = parseSourceAttribute(
        element
          ?.closest(`[${SOURCE_ATTRIBUTE}]`)
          ?.getAttribute(SOURCE_ATTRIBUTE),
      );
      setSelection((previous) =>
        previous?.text === text
          ? previous
          : { text, ...(from ? { source: from } : {}) },
      );
      setRemoved((current) => {
        if (!current.has(SELECTION_KEY)) return current;
        const next = new Set(current);
        next.delete(SELECTION_KEY);
        return next;
      });
    }
    document.addEventListener('selectionchange', onSelectionChange);
    return () =>
      document.removeEventListener('selectionchange', onSelectionChange);
  }, []);

  const registerItem = useCallback((item: ChatContextItem) => {
    sourceSeed += 1;
    const key = sourceSeed;
    setItems((current) => new Map(current).set(key, item));
    return () =>
      setItems((current) => {
        const next = new Map(current);
        next.delete(key);
        return next;
      });
  }, []);

  const registerFilter = useCallback((filter: ChatContextFilter) => {
    sourceSeed += 1;
    const key = sourceSeed;
    setFilters((current) => new Map(current).set(key, filter));
    return () =>
      setFilters((current) => {
        const next = new Map(current);
        next.delete(key);
        return next;
      });
  }, []);

  const remove = useCallback((key: string) => {
    const next = new Set(selectedUIRef.current);
    next.delete(key);
    selectedUIRef.current = next;
    setSelectedUIKeys(next);
    onUnpinRef.current(key);
    setRemoved((current) => new Set(current).add(key));
  }, []);

  const value = useMemo<ChatSourcesValue>(
    () => ({
      uiSources,
      selectedUIKeys,
      registerUI,
      selectUI,
      snapshotUI,
      items: [...items.values()],
      // The innermost page registers last and wins.
      filter: [...filters.values()].at(-1) ?? null,
      selection,
      removed,
      registerItem,
      registerFilter,
      remove,
    }),
    [
      uiSources,
      selectedUIKeys,
      registerUI,
      selectUI,
      snapshotUI,
      items,
      filters,
      selection,
      removed,
      registerItem,
      registerFilter,
      remove,
    ],
  );
  return (
    <ChatSourcesContext.Provider value={value}>
      {children}
    </ChatSourcesContext.Provider>
  );
}

/**
 * Registers the object a page shows as context for the chat while the page is mounted; null while it loads. The
 * label is what its chip says. Outside `ChatProvider` it does nothing.
 */
export function useChatContextSource(item: ChatContextItem | null): void {
  const { registerItem } = useChatSources();
  const kind = item?.kind;
  const id = item?.id;
  const label = item?.label;
  useEffect(() => {
    if (!kind || !id) return undefined;
    return registerItem({ kind, id, label: label ?? id });
  }, [registerItem, kind, id, label]);
}

/** Make a UI source available while mounted. Select it separately with useChatSources().selectUI(source). */
export function useChatUIContextSource(
  source: ChatUIContextSource | null,
): void {
  const { registerUI } = useChatSources();
  const latestRef = useRef(source);
  useLayoutEffect(() => {
    latestRef.current = source;
  });
  const kind = source?.kind;
  const id = source?.id;
  useEffect(() => {
    if (kind === undefined || id === undefined) return undefined;
    return registerUI({
      kind,
      id,
      get label() {
        return latestRef.current?.label ?? id;
      },
      getSnapshot: () => {
        const current = latestRef.current;
        if (!current || current.kind !== kind || current.id !== id)
          throw new Error('UI context source changed before snapshotting.');
        return current.getSnapshot();
      },
    });
  }, [registerUI, kind, id]);
}

/** Registers a list page's filter while the page is mounted; null registers nothing. */
export function useChatFilterSource(filter: ChatContextFilter | null): void {
  const { registerFilter } = useChatSources();
  const serialized = filter ? JSON.stringify(filter) : null;
  useEffect(() => {
    if (!serialized) return undefined;
    return registerFilter(JSON.parse(serialized) as ChatContextFilter);
  }, [registerFilter, serialized]);
}
