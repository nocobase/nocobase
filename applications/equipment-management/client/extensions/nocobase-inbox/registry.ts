/**
 * The inbox registry: how the browser words and renders what each contributor puts in the inbox, and which categories
 * the inbox sorts it into. Each contributor brings, keyed by its notices' `source` (and optionally `types`):
 *
 * - an **entry renderer** (`InboxEntryRenderer`) for its in-app items: the icon, the type label and the card's title
 *   and sentence; for the detail pane, what it loads once (`useModel`), whether the viewer may act (`useCanAct`), the
 *   actions (`Actions`) and the body (`Body`), and what it offers elsewhere in place of the actions (`Brief`, `Here`);
 * - or a **feed** (`InboxFeed`) for decisions whose waiting state lives in its own API: a query listing them, a list
 *   section shown before the decisions, and a detail pane.
 *
 * A contributor's parts render in its own i18n namespace (`namespace`); one that brings its resources (`resources`)
 * has them added to the namespace. An item whose source nobody renders gets a safe fallback: a bell, its title and
 * body as sent, and no actions.
 *
 * The registry is a React context (`InboxRegistryProvider`, `registry-scope.tsx`); without a provider it is
 * `defaultInboxRegistry`: no contributors, and the decisions and notifications as categories.
 */
import { useApiClient, type ApiClient } from '@nocobase/app-client';
import { useTranslation, type Namespace } from '@nocobase/i18n/client';
import { useQueries, type QueryKey } from '@tanstack/react-query';
import { BellIcon, type LucideIcon } from 'lucide-react';
import {
  createContext,
  useCallback,
  useContext,
  type ComponentType,
  type Context,
} from 'react';

import {
  entryCategories,
  type InboxCategory,
  type InboxEntry,
  type InboxEntryCategory,
} from './model.js';

/** An item's title and the one sentence under it. */
export interface EntryText {
  readonly title: string;
  readonly sentence: string | null;
}

/** Whether the viewer may act on a decision now: not at all, not yet known, yes, or no, with why. */
export type InboxCanAct =
  | { readonly state: 'none' }
  | { readonly state: 'loading' }
  | { readonly state: 'yes' }
  | { readonly state: 'no'; readonly reason: string };

/** What an entry's detail parts receive: the entry, what `useModel` loaded, and how to report a decision taken. */
export interface InboxPartProps<M> {
  readonly entry: InboxEntry;
  readonly model: M;
  /** The title shown, for accessible names. */
  readonly title: string;
  /** Opens what the item is about, when it has a route. */
  readonly onOpen?: () => void;
  /** Called once the viewer decided: marks the item read. */
  readonly onDecided: () => void;
}

/** What the item is about, for whatever the application places beside it (`detailToolbar`), such as an assistant. */
export interface InboxEntryContext {
  /** Ids of the records the item is about. */
  readonly ids?: readonly string[];
  /** The record an assistant would be asked about. */
  readonly ask?: {
    readonly kind: string;
    readonly id: string;
    readonly label: string;
  };
}

export interface InboxEntryWording<M> {
  /** What kind of item it is, in words; `detail` for the detail pane's header. */
  readonly label: (entry: InboxEntry, where?: 'card' | 'detail') => string;
  /** The title and sentence; in the detail pane with what `useModel` loaded. */
  readonly text: (entry: InboxEntry, model?: M) => EntryText;
  /** How a decision ended, in words; `inbox.outcomes.<outcome>` when left out. */
  readonly outcome?: (outcome: string) => string;
  /** The name of the button opening the item's route. */
  readonly open?: string;
}

export interface InboxEntryRenderer<M = unknown> {
  /** The source it renders, as its notices name it. */
  readonly source: string;
  /** The types it renders; every type of the source when left out. */
  readonly types?: readonly string[];
  /** The i18n namespace its parts translate in; the page's when left out. */
  readonly namespace?: Namespace;
  /** Resources of `namespace` by locale, added when the inbox first renders the entry. */
  readonly resources?: Readonly<Record<string, object>>;
  readonly icon: (entry: InboxEntry) => LucideIcon;
  /** The wording, as a hook so it may translate and read other hooks. */
  readonly useWording: () => InboxEntryWording<M>;
  /** What the detail pane loads once for the item, shared by the parts below. */
  readonly useModel?: (entry: InboxEntry) => M;
  /** Whether the viewer may act; no actions when left out. */
  readonly useCanAct?: (entry: InboxEntry, model: M) => InboxCanAct;
  /** What the viewer may do, shown in the header when `useCanAct` says yes. */
  readonly Actions?: ComponentType<InboxPartProps<M>>;
  /** Everything below the header. */
  readonly Body?: ComponentType<InboxPartProps<M>>;
  /** The gist of the item, for a card shown outside the inbox without `Body`. */
  readonly Brief?: ComponentType<InboxPartProps<M>>;
  /** What a card shown on the page of what the item is about offers in place of `Actions`, such as a way there. */
  readonly Here?: ComponentType<InboxPartProps<M>>;
  readonly context?: (entry: InboxEntry, model: M) => InboxEntryContext;
}

/** A decision source whose items live in its own API, listed before the decisions and counted as waiting. */
export interface InboxFeed<T = unknown> {
  readonly id: string;
  /** The URL search parameter holding the selected item's id. */
  readonly param: string;
  readonly namespace?: Namespace;
  readonly resources?: Readonly<Record<string, object>>;
  /** The items waiting on the viewer: `queryFn` reads the contributor's API, `select` keeps what waits. */
  readonly query: (api: ApiClient) => {
    readonly queryKey: QueryKey;
    readonly queryFn: () => Promise<unknown>;
    readonly select: (data: unknown) => readonly T[];
    readonly staleTime?: number;
  };
  /** The section listing them. */
  readonly List: ComponentType<{
    readonly items: readonly T[];
    readonly selectedId: string | null;
    readonly onSelect: (id: string) => void;
  }>;
  /** One of them in the detail pane. */
  readonly Detail: ComponentType<{
    readonly id: string;
    readonly onBack: () => void;
  }>;
}

export interface InboxRegistry {
  readonly renderers: readonly InboxEntryRenderer<never>[];
  readonly feeds: readonly InboxFeed<never>[];
  /** The kinds of the filter, in its order; `defaultInboxCategories` when left out. */
  readonly categories?: readonly InboxCategory[];
}

/** Types an entry renderer for the registry, whose entries are erased to `never` models. */
export function defineInboxRenderer<M>(
  renderer: InboxEntryRenderer<M>,
): InboxEntryRenderer<never> {
  return renderer as unknown as InboxEntryRenderer<never>;
}

export function defineInboxFeed<T>(feed: InboxFeed<T>): InboxFeed<never> {
  return feed as unknown as InboxFeed<never>;
}

/** The decisions an item asks the viewer to take: its notice's kind is `decision`. They wait until settled. */
export const decisionCategory: InboxEntryCategory = {
  type: 'entries',
  id: 'decision',
  label: (t) => t('inbox.kinds.decision', { defaultValue: 'Decisions' }),
  title: (t) => t('inbox.tabs.decision', { defaultValue: 'Needs my decision' }),
  empty: (t) =>
    t('inbox.empty.decision', {
      defaultValue: 'No decisions waiting for you',
    }),
  match: (entry) => entry.notice?.kind === 'decision',
  waits: true,
};

/** Everything else: information, including every item the source knows nothing about. */
export const infoCategory: InboxEntryCategory = {
  type: 'entries',
  id: 'info',
  label: (t) => t('inbox.kinds.info', { defaultValue: 'Notifications' }),
  title: (t) => t('inbox.tabs.info', { defaultValue: 'Notifications' }),
  empty: (t) => t('inbox.empty.info', { defaultValue: 'No notifications' }),
  match: (entry) => entry.notice?.kind !== 'decision',
};

export const defaultInboxCategories: readonly InboxCategory[] = [
  decisionCategory,
  infoCategory,
];

export const defaultInboxRegistry: InboxRegistry = {
  renderers: [],
  feeds: [],
  categories: defaultInboxCategories,
};

/** The registry in effect below `InboxRegistryProvider` (`registry-scope.tsx`). */
export const InboxRegistryContext: Context<InboxRegistry | null> =
  createContext<InboxRegistry | null>(null);

/** The registry a provider gives, or null. */
export function useProvidedInboxRegistry(): InboxRegistry | null {
  return useContext(InboxRegistryContext);
}

/** The registry in effect: the one a provider gives, or `defaultInboxRegistry`. */
export function useInboxRegistry(): InboxRegistry {
  return useProvidedInboxRegistry() ?? defaultInboxRegistry;
}

/** The categories of `registry`. */
export function categoriesOfRegistry(
  registry: InboxRegistry,
): readonly InboxCategory[] {
  return registry.categories ?? defaultInboxCategories;
}

/** The entry category an item belongs to: the first that matches, else the last. */
export function categoryOf(
  categories: readonly InboxCategory[],
  entry: InboxEntry,
): InboxEntryCategory | undefined {
  const sorted = entryCategories(categories);
  return sorted.find((category) => category.match(entry)) ?? sorted.at(-1);
}

/**
 * The renderer of an item nobody renders: what the in-app item says as sent, never the contributor's data, and
 * nothing to act on.
 */
export const fallbackRenderer: InboxEntryRenderer<null> = {
  source: '*',
  icon: () => BellIcon,
  useWording() {
    const { t } = useTranslation();
    const categories = categoriesOfRegistry(useInboxRegistry());
    return {
      label: (entry) =>
        categoryOf(categories, entry)?.title(t) ??
        t('inbox.tabs.info', { defaultValue: 'Notifications' }),
      text: ({ item }) => ({
        title: item.title,
        sentence: item.body && item.body !== item.title ? item.body : null,
      }),
    };
  },
};

/** The renderer of an item: the first registered for its source and type, else the fallback. */
export function rendererFor(
  registry: InboxRegistry,
  entry: InboxEntry,
): InboxEntryRenderer<never> {
  const notice = entry.notice;
  const found = notice
    ? registry.renderers.find(
        (renderer) =>
          renderer.source === notice.source &&
          (!renderer.types || renderer.types.includes(notice.type)),
      )
    : undefined;
  return found ?? (fallbackRenderer as unknown as InboxEntryRenderer<never>);
}

/** A renderer's identity, to key what renders an item: an item's renderer changes once its notice arrives. */
export function rendererKey(renderer: InboxEntryRenderer<never>): string {
  return `${renderer.source}/${renderer.types?.join(',') ?? '*'}`;
}

/** The renderer of an item in the registry in effect. */
export function useRendererOf(): (
  entry: InboxEntry,
) => InboxEntryRenderer<never> {
  const registry = useInboxRegistry();
  return (entry) => rendererFor(registry, entry);
}

export interface FeedItems {
  readonly feed: InboxFeed<never>;
  readonly items: readonly unknown[];
}

/** The feeds of `registry` with the items each has waiting on the viewer. */
export function useFeedItems(registry: InboxRegistry): readonly FeedItems[] {
  const { feeds } = registry;
  const api = useApiClient();
  const combine = useCallback(
    (results: readonly { readonly data?: unknown }[]): FeedItems[] =>
      feeds.map((feed, index) => ({
        feed,
        items: (results[index]?.data as readonly unknown[] | undefined) ?? [],
      })),
    [feeds],
  );
  return useQueries({
    queries: feeds.map((feed) => {
      const query = feed.query(api);
      return {
        queryKey: query.queryKey,
        queryFn: query.queryFn,
        select: query.select,
        retry: false,
        staleTime: query.staleTime ?? 30_000,
      };
    }),
    combine,
  });
}
