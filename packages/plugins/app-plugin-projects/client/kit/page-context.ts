/**
 * What the page shows, for an assistant, and the places an assistant's buttons go. This plugin knows nothing of
 * agents: its pages register what they show (`usePageContextSource`) and place a slot (`IntakeAgentSlot`); all of
 * it is inert until the application mounts a `PageContextProvider` and fills the slot's context — the assembling application does, with the agents plugin's chat panel.
 *
 * A page registers one entry per thing it shows (the issue, the project, a list's filters, the selected inbox item)
 * and the provider keeps them in registration order while the page is mounted. Entries carry ids and a label for the
 * tag only; whoever sends them on resolves the ids again and drops what the asker may not see. Limits as NocoProject
 * had them: at most `PAGE_CONTEXT_MAX_ENTRIES` entries, `PAGE_CONTEXT_MAX_FILTERS` filter keys, a label of
 * `PAGE_CONTEXT_MAX_LABEL` characters and a text of `PAGE_CONTEXT_MAX_TEXT`.
 */
import {
  createContext,
  useContext,
  useEffect,
  useId,
  useSyncExternalStore,
  type ComponentType,
  type Context,
} from 'react';

export const PAGE_CONTEXT_MAX_ENTRIES = 10;
export const PAGE_CONTEXT_MAX_FILTERS = 20;
export const PAGE_CONTEXT_MAX_IDS = 10;
export const PAGE_CONTEXT_MAX_LABEL = 200;
export const PAGE_CONTEXT_MAX_TEXT = 2000;

/** Kinds the plugin's pages register; others may add their own. */
export type PageContextKind =
  'issue' | 'project' | 'issues' | 'inbox' | 'plan' | (string & {});

export interface PageContextEntry {
  readonly kind: PageContextKind;
  /** The record shown, when it is one. */
  readonly id?: string;
  /** How a tag names it (`PM-12 Fix sign-in`, a project's name). Shown only; never trusted. */
  readonly label?: string;
  /** A list's filters, as the page's query values (`issues`). */
  readonly filters?: Readonly<Record<string, string>>;
  /** The records selected on the page. */
  readonly ids?: readonly string[];
  /** Selected text. */
  readonly text?: string;
}

/** Where pages register what they show; the application's provider implements it. */
export interface PageContextSink {
  /** Registers or replaces `key`'s entry; answers what removes it. */
  register(key: string, entry: PageContextEntry): () => void;
}

export const PageContextSinkContext: Context<PageContextSink | null> =
  createContext<PageContextSink | null>(null);

/** An entry within the limits. */
export function normalizeEntry(entry: PageContextEntry): PageContextEntry {
  const filters = entry.filters
    ? Object.fromEntries(
        Object.entries(entry.filters)
          .filter(([, value]) => typeof value === 'string' && value !== '')
          .slice(0, PAGE_CONTEXT_MAX_FILTERS),
      )
    : undefined;
  return {
    kind: entry.kind,
    ...(entry.id ? { id: entry.id } : {}),
    ...(entry.label
      ? { label: entry.label.slice(0, PAGE_CONTEXT_MAX_LABEL) }
      : {}),
    ...(filters && Object.keys(filters).length > 0 ? { filters } : {}),
    ...(entry.ids && entry.ids.length > 0
      ? { ids: entry.ids.slice(0, PAGE_CONTEXT_MAX_IDS) }
      : {}),
    ...(entry.text ? { text: entry.text.slice(0, PAGE_CONTEXT_MAX_TEXT) } : {}),
  };
}

/**
 * Registers what the page shows while it is mounted; null registers nothing. Without a provider it does nothing. The
 * entry is compared by value, so an object built during render does not register again on every render.
 */
export function usePageContextSource(entry: PageContextEntry | null): void {
  const sink = useContext(PageContextSinkContext);
  const registrationId = useId();
  const serialized = entry ? JSON.stringify(normalizeEntry(entry)) : null;
  useEffect(() => {
    if (!sink || serialized === null) return undefined;
    return sink.register(
      registrationId,
      JSON.parse(serialized) as PageContextEntry,
    );
  }, [sink, registrationId, serialized]);
}

/** A store of registered entries, for a provider. */
export interface PageContextStore extends PageContextSink {
  /** The entries, oldest registration first, at most `PAGE_CONTEXT_MAX_ENTRIES`. */
  readonly entries: () => readonly PageContextEntry[];
  readonly subscribe: (listener: () => void) => () => void;
}

export function createPageContextStore(): PageContextStore {
  const byKey = new Map<string, PageContextEntry>();
  const listeners = new Set<() => void>();
  let snapshot: readonly PageContextEntry[] = [];
  const changed = () => {
    snapshot = [...byKey.values()].slice(0, PAGE_CONTEXT_MAX_ENTRIES);
    for (const listener of listeners) listener();
  };
  return {
    register(key, entry) {
      byKey.set(key, normalizeEntry(entry));
      changed();
      return () => {
        if (byKey.get(key) === undefined) return;
        byKey.delete(key);
        changed();
      };
    },
    entries: () => snapshot,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

/** The store a `PageContextProvider` holds, for `usePageContextEntries`. */
export const PageContextStoreContext: Context<PageContextStore | null> =
  createContext<PageContextStore | null>(null);

const NO_ENTRIES: readonly PageContextEntry[] = [];
const noSubscription = () => () => undefined;

/** What the pages under the nearest `PageContextProvider` show now; empty without one. */
export function usePageContextEntries(): readonly PageContextEntry[] {
  const store = useContext(PageContextStoreContext);
  return useSyncExternalStore(
    store ? store.subscribe : noSubscription,
    store ? store.entries : () => NO_ENTRIES,
    store ? store.entries : () => NO_ENTRIES,
  );
}

// ---------------------------------------------------------------------------------------------------------------
// Slots
// ---------------------------------------------------------------------------------------------------------------

/** What the AI draft tab hands to "Let an agent organize". */
export interface IntakeAgentSlotProps {
  /** The text as typed. */
  readonly text: string;
  /** The uploaded files (`POST /api/projects/intake/files`), the caller's own. */
  readonly fileIds: readonly string[];
  readonly projectId: string | null;
  /** True while the page cannot hand anything over (nothing typed, an upload running). */
  readonly disabled: boolean;
  /** Shows the plan the agent proposed in place of the draft. */
  readonly onPlan: (planId: string) => void;
  readonly className?: string;
}

/** What fills the AI draft tab's slot; nothing fills it by default. */
export interface IntakeAgentSlotFill {
  readonly Organize: ComponentType<IntakeAgentSlotProps>;
}

export const IntakeAgentSlotContext: Context<IntakeAgentSlotFill | null> =
  createContext<IntakeAgentSlotFill | null>(null);
