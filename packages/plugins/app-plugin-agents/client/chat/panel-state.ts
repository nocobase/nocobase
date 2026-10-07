/**
 * The chat panel's state as plain data: whether it is open, at its usual width or covering the content, showing a
 * conversation or the history, and which conversation. It is kept in `sessionStorage`, so a reload in the same tab
 * reopens the panel where it was; every access is guarded (private windows, full storage). A link opens the panel
 * with `?chat=<conversationId|new|history>` (and `chatMode=expanded`), which the panel applies and then removes.
 */

export type ChatPanelMode = 'docked' | 'expanded';
export type ChatPanelView = 'chat' | 'history';

export interface ChatPanelState {
  readonly open: boolean;
  readonly mode: ChatPanelMode;
  readonly view: ChatPanelView;
  /** Null: a new conversation, created on the server by its first message. */
  readonly conversationId: string | null;
  /** The agent a new conversation goes to; null: the person's default (or the system default). */
  readonly newAgentId: string | null;
}

export const CHAT_PANEL_STORAGE_KEY = 'nocobase:agents-chat-panel';
/** The query parameters of a link that opens the panel. */
export const CHAT_PARAM = 'chat';
export const CHAT_MODE_PARAM = 'chatMode';

export const INITIAL_PANEL_STATE: ChatPanelState = {
  open: false,
  mode: 'docked',
  view: 'chat',
  conversationId: null,
  newAgentId: null,
};

/**
 * From this width the panel docks beside the content, which narrows to make room; below it, it floats over the
 * content's right side. At 1280px with the navigation open the content keeps about 720px, which every page lays out
 * in; floating there instead covered the pages' header actions and toolbars.
 */
export const CHAT_DOCK_QUERY = '(min-width: 1280px)';
/** Below this width the panel is a full-screen dialog opened from a floating button. */
export const CHAT_MOBILE_QUERY = '(max-width: 767px)';

function storageOf(storage?: Storage | null): Storage | null {
  if (storage) return storage;
  try {
    return typeof window === 'undefined' ? null : window.sessionStorage;
  } catch {
    return null;
  }
}

function text(value: unknown): string | null {
  return typeof value === 'string' && value ? value : null;
}

export function readPanelState(storage?: Storage | null): ChatPanelState {
  try {
    const raw = storageOf(storage)?.getItem(CHAT_PANEL_STORAGE_KEY);
    if (!raw) return INITIAL_PANEL_STATE;
    const value = JSON.parse(raw) as Partial<
      Record<keyof ChatPanelState, unknown>
    > | null;
    if (!value || typeof value !== 'object') return INITIAL_PANEL_STATE;
    return {
      open: value.open === true,
      mode: value.mode === 'expanded' ? 'expanded' : 'docked',
      view: value.view === 'history' ? 'history' : 'chat',
      conversationId: text(value.conversationId),
      newAgentId: text(value.newAgentId),
    };
  } catch {
    return INITIAL_PANEL_STATE;
  }
}

export function writePanelState(
  state: ChatPanelState,
  storage?: Storage | null,
): void {
  try {
    storageOf(storage)?.setItem(CHAT_PANEL_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Not remembered; the panel still works for this visit.
  }
}

/** What a link asks for: `?chat=<id>`, `?chat=new`, `?chat=history`; null without `chat`. */
export function panelStateFromSearch(
  search: URLSearchParams,
  current: ChatPanelState,
): ChatPanelState | null {
  const value = search.get(CHAT_PARAM)?.trim();
  if (!value) return null;
  const mode: ChatPanelMode =
    search.get(CHAT_MODE_PARAM) === 'expanded' ? 'expanded' : current.mode;
  if (value === 'history')
    return { ...current, open: true, mode, view: 'history' };
  if (value === 'new')
    return {
      ...current,
      open: true,
      mode,
      view: 'chat',
      conversationId: null,
    };
  return { ...current, open: true, mode, view: 'chat', conversationId: value };
}

/** The search string without the panel's own parameters, once they have been applied. */
export function withoutPanelParams(search: URLSearchParams): string {
  const next = new URLSearchParams(search);
  next.delete(CHAT_PARAM);
  next.delete(CHAT_MODE_PARAM);
  const value = next.toString();
  return value ? `?${value}` : '';
}

/** The search of a link that opens the panel on `target` (a conversation id, `new` or `history`). */
export function chatLinkSearch(target: string): string {
  return `?${new URLSearchParams({ [CHAT_PARAM]: target }).toString()}`;
}

/** `⌘` on Apple platforms, `Ctrl` elsewhere. */
export function modifierKeyLabel(): string {
  if (typeof navigator === 'undefined') return 'Ctrl';
  const platform =
    (navigator as { userAgentData?: { platform?: string } }).userAgentData
      ?.platform ?? navigator.platform;
  return /mac|iphone|ipad/iu.test(platform) ? '⌘' : 'Ctrl';
}

/** ⌘J on macOS, Ctrl+J elsewhere; never with Shift or Alt, never while composing text. */
export function isChatShortcut(event: KeyboardEvent): boolean {
  if (event.isComposing || event.shiftKey || event.altKey) return false;
  if (event.key.toLowerCase() !== 'j' && event.code !== 'KeyJ') return false;
  return event.metaKey !== event.ctrlKey;
}
