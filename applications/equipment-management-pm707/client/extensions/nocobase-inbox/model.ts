/**
 * The inbox as the page shows it: each in-app item of `@nocobase/app-plugin-notification-in-app` with what the
 * application's `InboxSource` knows about it (`source.ts`), sorted into categories, and the small rules the list
 * follows. How each item reads is its contributor's (`registry.ts`).
 */
import type { InboxItem } from '@nocobase/app-plugin-notification-in-app/client/inbox';
import type { ComponentType, ReactNode } from 'react';

/** What an item is about, when it is about one thing: an issue (`{ type: 'issue', id, label: 'PM-12' }`), an app… */
export interface InboxSubject {
  readonly type: string;
  readonly id: string;
  /** How to name it in a list, such as an issue's identifier. */
  readonly label: string | null;
}

/** A JSON value. */
export type InboxJson =
  | string
  | number
  | boolean
  | null
  | readonly InboxJson[]
  | { readonly [key: string]: InboxJson };

/** The sender's own values, as JSON: what its renderer words and shows the item from. */
export interface InboxData {
  readonly [key: string]: InboxJson;
}

/** What the application knows about one in-app item, found by the item's `notificationId`. */
export interface InboxNotice {
  readonly notificationId: string;
  /** Who sent it: the contributor's id, such as `projects`; its renderer is registered under it. */
  readonly source: string;
  /** What kind of item it is, such as `decision` or `info`; the categories sort by it. */
  readonly kind: string;
  /** What happened, such as `approval_requested`; the contributor's renderer words it. */
  readonly type: string;
  readonly subject: InboxSubject | null;
  /** The contributor's own key of the decision it asks for; null for information. */
  readonly decisionKey: string | null;
  readonly data: InboxData | null;
  /** How many notices of the same group this item stands for (`×N` when more than one). */
  readonly count: number;
  /** Set once a decision no longer waits, or once information no longer holds. */
  readonly resolvedAt: string | null;
  /** How a decision ended, in its contributor's words (`approved`, `rejected`, `withdrawn`…). */
  readonly outcome: string | null;
}

export interface InboxEntry {
  readonly item: InboxItem;
  /** Null for an item the source knows nothing about: shown as information. */
  readonly notice: InboxNotice | null;
}

/** The kind of an item the source knows nothing about. */
export const INBOX_INFO_KIND = 'info';

export function kindOf(entry: InboxEntry): string {
  return entry.notice?.kind ?? INBOX_INFO_KIND;
}

/**
 * An item is settled once its decision no longer waits, or once its contributor said its information no longer holds;
 * it stays listed, dimmed, until deleted.
 */
export function isSettled(entry: InboxEntry): boolean {
  return entry.notice?.resolvedAt != null;
}

/** Translates a key of the inbox's own wording, as `useTranslation()` does. */
export type InboxTranslate = (
  key: string,
  options?: Readonly<Record<string, unknown>>,
) => string;

/**
 * The inbox's two views: everything (`all`), or only what waits on the viewer (`todo`): the items of a waiting
 * category not yet settled, and what each collection lists there.
 */
export type InboxView = 'all' | 'todo';

export const INBOX_VIEWS: readonly InboxView[] = ['all', 'todo'];

/** A category of in-app items, such as the decisions or the notifications. */
export interface InboxEntryCategory {
  readonly type: 'entries';
  /** Its value of `?kind=`. */
  readonly id: string;
  /** Its name in the kind filter. */
  readonly label: (t: InboxTranslate) => string;
  /** The heading of its group in the list. */
  readonly title: (t: InboxTranslate) => string;
  /** What the list says when the kind filter selects it and nothing is there. */
  readonly empty: (t: InboxTranslate) => string;
  /** Whether an item belongs to it; an item no category takes belongs to the last one. */
  readonly match: (entry: InboxEntry) => boolean;
  /**
   * Whether its items wait on the viewer until settled: listed unsettled first, offered by To do, and counted as what
   * waits.
   */
  readonly waits?: boolean;
}

/** What the inbox gives a collection's hook. */
export interface InboxCollectionInput {
  readonly filter: InboxFilter;
  /** Every in-app item loaded, such as to leave out what an item already stands for. */
  readonly entries: readonly InboxEntry[];
  /** The id in its own parameter, or null. */
  readonly selectedId: string | null;
  readonly onSelect: (id: string) => void;
  /** The page's search parameters, and how to replace them, for a filter of its own. */
  readonly params: URLSearchParams;
  readonly onParams: (next: URLSearchParams) => void;
}

/** What a collection shows, as its hook answers on every render. */
export interface InboxCollectionState {
  /** How many records its group lists; the group shows only above zero. */
  readonly count: number;
  /** Whether its group has loaded; the list waits for it while every kind shows. */
  readonly loaded: boolean;
  /** Its group in the list while every kind shows, placed after the category `after` names. */
  readonly group: ReactNode;
  /** The list shown in place of the items while the kind filter selects it. */
  readonly list: ReactNode;
}

/**
 * A category whose records live in another API rather than in the in-app items, such as the plans an application
 * asks the viewer to decide: listed as a group of its own, or alone through the kind filter, and shown in the detail
 * pane by its own URL parameter.
 */
export interface InboxCollectionCategory {
  readonly type: 'collection';
  readonly id: string;
  readonly label: (t: InboxTranslate) => string;
  /** The URL parameter holding the selected record's id, such as `plan`. */
  readonly param: string;
  /** Further parameters it owns, such as a status filter; dropped when the filter changes. */
  readonly params?: readonly string[];
  /** The views whose kind filter offers it; both when left out. */
  readonly views?: readonly InboxView[];
  /** The category its group follows in the list; after every group when left out. */
  readonly after?: string;
  /**
   * Called on every render of the inbox page with what it shows; a hook, so it may query its API. The categories are
   * fixed for the page, so the hooks always run in the same order.
   */
  readonly useCollection: (input: InboxCollectionInput) => InboxCollectionState;
  /** The selected record, or what to say while none is, in the detail pane. */
  readonly Detail: ComponentType<{
    readonly id: string | null;
    readonly onBack: () => void;
  }>;
}

export type InboxCategory = InboxEntryCategory | InboxCollectionCategory;

/** The view and the kind shown: every kind (`all`) or a category's id. */
export interface InboxFilter {
  readonly view: InboxView;
  readonly kind: string;
}

export function entryCategories(
  categories: readonly InboxCategory[],
): InboxEntryCategory[] {
  return categories.filter(
    (category): category is InboxEntryCategory => category.type === 'entries',
  );
}

export function collectionCategories(
  categories: readonly InboxCategory[],
): InboxCollectionCategory[] {
  return categories.filter(
    (category): category is InboxCollectionCategory =>
      category.type === 'collection',
  );
}

/** The categories a view offers: To do only those that wait. */
export function categoriesOf(
  view: InboxView,
  categories: readonly InboxCategory[],
): InboxCategory[] {
  return categories.filter((category) =>
    category.type === 'entries'
      ? view === 'all' || category.waits === true
      : (category.views ?? INBOX_VIEWS).includes(view),
  );
}

/** The kinds a view's filter offers, every kind first. */
export function kindsOf(
  view: InboxView,
  categories: readonly InboxCategory[],
): string[] {
  return ['all', ...categoriesOf(view, categories).map(({ id }) => id)];
}

/** The filter in the URL (`?view=`, `?kind=`); a kind the view does not offer reads as every kind. */
export function readInboxFilter(
  params: URLSearchParams,
  categories: readonly InboxCategory[],
): InboxFilter {
  const view: InboxView = params.get('view') === 'todo' ? 'todo' : 'all';
  const kind =
    kindsOf(view, categories).find((value) => value === params.get('kind')) ??
    'all';
  return { view, kind };
}

/** The search of `filter` over `params`: the defaults left out, and what belonged to the previous filter dropped. */
export function inboxFilterParams(
  params: URLSearchParams,
  filter: InboxFilter,
  categories: readonly InboxCategory[],
): URLSearchParams {
  const next = new URLSearchParams(params);
  if (filter.view === 'all') next.delete('view');
  else next.set('view', filter.view);
  if (filter.kind === 'all') next.delete('kind');
  else next.set('kind', filter.kind);
  for (const collection of collectionCategories(categories))
    for (const name of [...(collection.params ?? []), collection.param])
      next.delete(name);
  return next;
}

/** The collection the filter selects, or whose record is selected by its parameter. */
export function activeCollection(
  filter: InboxFilter,
  params: URLSearchParams,
  categories: readonly InboxCategory[],
): InboxCollectionCategory | null {
  return (
    collectionCategories(categories).find(
      (category) =>
        filter.kind === category.id || params.get(category.param) !== null,
    ) ?? null
  );
}

/** The in-app items of each entry category, by id. */
export type InboxGroups = Readonly<Record<string, readonly InboxEntry[]>>;

/**
 * Sorts the items into the entry categories, in list order: each to the first category it matches, else the last.
 * A waiting category lists what still waits first and settled items after.
 */
export function groupEntries(
  entries: readonly InboxEntry[],
  categories: readonly InboxCategory[],
): Record<string, InboxEntry[]> {
  const sorted = entryCategories(categories);
  const last = sorted.at(-1);
  const members = new Map<string, InboxEntry[]>();
  for (const entry of entries) {
    const category = sorted.find((candidate) => candidate.match(entry)) ?? last;
    if (category)
      members.set(category.id, [...(members.get(category.id) ?? []), entry]);
  }
  return Object.fromEntries(
    sorted.map((category) => {
      const list = members.get(category.id) ?? [];
      return [
        category.id,
        category.waits
          ? [
              ...list.filter((entry) => !isSettled(entry)),
              ...list.filter((entry) => isSettled(entry)),
            ]
          : list,
      ];
    }),
  );
}

/** The groups of in-app items `filter` shows, in order, each as the view lists it. */
export function shownGroups(
  filter: InboxFilter,
  groups: InboxGroups,
  categories: readonly InboxCategory[],
): {
  readonly category: InboxEntryCategory;
  readonly entries: readonly InboxEntry[];
}[] {
  const offered = entryCategories(categoriesOf(filter.view, categories));
  const shown =
    filter.kind === 'all'
      ? offered
      : offered.filter((category) => category.id === filter.kind);
  return shown.map((category) => {
    const entries = groups[category.id] ?? [];
    return {
      category,
      entries:
        filter.view === 'todo'
          ? entries.filter((entry) => !isSettled(entry))
          : entries,
    };
  });
}

/** The in-app items `filter` shows, in list order (for j / k and the default selection). */
export function shownEntries(
  filter: InboxFilter,
  groups: InboxGroups,
  categories: readonly InboxCategory[],
): InboxEntry[] {
  return shownGroups(filter, groups, categories).flatMap(
    ({ entries }) => entries,
  );
}

/** Unread items per entry category, among those loaded. */
export function unreadByCategory(
  groups: InboxGroups,
): Readonly<Record<string, number>> {
  return Object.fromEntries(
    Object.entries(groups).map(([id, entries]) => [
      id,
      entries.filter((entry) => !entry.item.readAt).length,
    ]),
  );
}

/**
 * What waits on the viewer in each waiting category: the source's count where it gives one (it knows every decision,
 * not only those loaded), else the loaded items not yet settled.
 */
export function waitingByCategory(
  groups: InboxGroups,
  categories: readonly InboxCategory[],
  pending: Readonly<Record<string, number>> | undefined,
): Readonly<Record<string, number>> {
  return Object.fromEntries(
    entryCategories(categories)
      .filter((category) => category.waits)
      .map((category) => [
        category.id,
        pending?.[category.id] ??
          (groups[category.id] ?? []).filter((entry) => !isSettled(entry))
            .length,
      ]),
  );
}

export function entriesOf(
  items: readonly InboxItem[],
  notices: readonly InboxNotice[],
): InboxEntry[] {
  const byNotification = new Map(
    notices.map((notice) => [notice.notificationId, notice]),
  );
  return items.map((item) => ({
    item,
    notice: byNotification.get(item.notificationId) ?? null,
  }));
}

/**
 * The list as the page shows it: what the source lists as waiting, in full, then the in-app items loaded page by page,
 * each once. A waiting decision therefore never falls past the first page.
 */
export function mergeWaiting(
  waiting: readonly InboxEntry[],
  paged: readonly InboxEntry[],
): InboxEntry[] {
  const shown = new Set(waiting.map((entry) => entry.item.id));
  return [...waiting, ...paged.filter((entry) => !shown.has(entry.item.id))];
}

/** The id `step` places away from `currentId` in `ids` (j / k), clamped to the ends; the first id when none. */
export function stepSelection(
  ids: readonly string[],
  currentId: string | null,
  step: number,
): string | null {
  if (ids.length === 0) return null;
  const index = currentId ? ids.indexOf(currentId) : -1;
  if (index === -1) return ids[0] ?? null;
  return ids[Math.min(ids.length - 1, Math.max(0, index + step))] ?? null;
}

/** The ids among `entries` that were not there when the list first loaded: they arrived since, and slide in. */
export function freshIds(
  entries: readonly InboxEntry[],
  initial: ReadonlySet<string> | null,
): ReadonlySet<string> {
  if (!initial) return new Set();
  return new Set(
    entries.map((entry) => entry.item.id).filter((id) => !initial.has(id)),
  );
}

/** Where opening an item goes: its route, or null without one. */
export function entryLink(entry: InboxEntry): string | null {
  const { target } = entry.item;
  return target?.type === 'route' ? target.path : null;
}

const UNITS: readonly (readonly [Intl.RelativeTimeFormatUnit, number])[] = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
];

/** "3 minutes ago" in `locale`; "now" under a minute. */
export function relativeTime(
  at: string,
  locale: string,
  now: number = Date.now(),
): string {
  const seconds = Math.round((new Date(at).getTime() - now) / 1000);
  const format = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  for (const [unit, size] of UNITS)
    if (Math.abs(seconds) >= size)
      return format.format(Math.round(seconds / size), unit);
  return format.format(0, 'second');
}
