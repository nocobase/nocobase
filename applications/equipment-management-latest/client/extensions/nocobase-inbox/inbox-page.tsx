import { ApiClientError, useToaster } from '@nocobase/app-client';
import {
  useInboxActions,
  useInboxItems,
  useInboxRefresh,
  useInboxUnreadCount,
} from '@nocobase/app-plugin-notification-in-app/client/inbox';
import { useTranslation } from '@nocobase/i18n/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCheckIcon } from 'lucide-react';
import {
  type ReactElement,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useNavigate, useSearchParams } from 'react-router';

import { PageHeader } from '#components/page-header';
import { Button } from '#components/ui/button';
import { Spinner } from '#components/ui/spinner';
import { cn } from 'cn';

import type { InboxAction } from './inbox-actions.js';
import { InboxDetail, type InboxDetailToolbarInput } from './inbox-detail.js';
import { InboxList, type InboxListCollection } from './inbox-list.js';
import {
  activeCollection,
  collectionCategories,
  entriesOf,
  entryLink,
  freshIds,
  groupEntries,
  inboxFilterParams,
  mergeWaiting,
  readInboxFilter,
  shownEntries,
  stepSelection,
  unreadByCategory,
  waitingByCategory,
  type InboxCollectionState,
  type InboxEntry,
} from './model.js';
import { ContributorScope, InboxRegistryProvider } from './registry-scope.js';
import {
  categoriesOfRegistry,
  useFeedItems,
  useInboxRegistry,
  type InboxRegistry,
} from './registry.js';
import {
  defaultInboxSource,
  inboxSourceKeys,
  useInboxNotices,
  useInboxPending,
  useInboxWaiting,
  type InboxSource,
} from './source.js';

/** How the inbox reports what it did: a deletion and "mark all read", and a request that failed. */
export interface InboxNotify {
  success(title: string): void;
  error(error: unknown): void;
}

export interface InboxPageProps {
  /** What the application adds to the in-app items; `defaultInboxSource` adds nothing. */
  readonly source?: InboxSource;
  /** The contributors and categories; the provided registry, or `defaultInboxRegistry`, when left out. */
  readonly registry?: InboxRegistry;
  /** The page title; `inbox.title` when left out. */
  readonly title?: ReactNode;
  /** The sentence under the title; `inbox.description` when left out. */
  readonly description?: ReactNode;
  /** What the detail pane shows before its read, delete and open buttons, such as an "Ask agent" button. */
  readonly detailToolbar?: (input: InboxDetailToolbarInput) => ReactNode;
  /** Beside the kind filter, such as a sound reminder switch. */
  readonly listFooter?: ReactNode;
  /** Called with what waits on the viewer, the count on To do, whenever it changes once loaded. */
  readonly onPendingChange?: (count: number) => void;
  /** The application's toasts; the application toaster when left out. */
  readonly notify?: InboxNotify;
  /** In-app items loaded per page. */
  readonly pageSize?: number;
  /** The prefix of the element ids it renders, such as `nocobase-inbox-detail`. */
  readonly idPrefix?: string;
}

function isEditableTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
  );
}

function useDefaultNotify(): InboxNotify {
  const toaster = useToaster();
  const { t } = useTranslation();
  return useMemo(
    () => ({
      success: (title: string) => void toaster.show({ type: 'success', title }),
      error: (error: unknown) =>
        void toaster.show({
          type: 'error',
          title:
            error instanceof ApiClientError && error.status === 403
              ? t('inbox.forbidden', {
                  defaultValue: 'You are not allowed to do this.',
                })
              : t('inbox.requestFailed', {
                  defaultValue: 'The request failed. Try again.',
                }),
        }),
    }),
    [toaster, t],
  );
}

/**
 * The inbox as a route's page: a master–detail page. The left column lists the viewer's items; the right pane shows
 * the selected one with what is needed to decide. There are two views and one filter by kind (`inbox-list.tsx`), all
 * in the URL so a view can be shared:
 *
 * - `?view=todo` lists what waits on the viewer; without it, everything, settled decisions and notifications included.
 * - `?kind=` narrows either view to one of the registry's categories; a collection category lists its own records in
 *   place of the items.
 * - The selection is `?item=` for an item, or a feed's or collection's own parameter, so a narrow screen shows the
 *   list, then the detail with a back button.
 *
 * The items are `@nocobase/app-plugin-notification-in-app`'s; what each is about and whether its decision still
 * waits is the `source`'s, and how each reads is its contributor's (`registry.ts`). What the source lists as waiting
 * comes first and in full, then the rest page by page. Keyboard: `j` / `k` move the selection among the items, Enter
 * opens its route. "Mark all read" marks the items shown.
 */
export function InboxPage({
  registry,
  ...props
}: InboxPageProps): ReactElement {
  if (!registry) return <InboxPageContent {...props} />;
  return (
    <InboxRegistryProvider registry={registry}>
      <InboxPageContent {...props} />
    </InboxRegistryProvider>
  );
}

function InboxPageContent({
  source = defaultInboxSource,
  title,
  description,
  detailToolbar,
  listFooter,
  onPendingChange,
  notify: givenNotify,
  pageSize,
  idPrefix = 'nocobase-inbox',
}: Omit<InboxPageProps, 'registry'>): ReactElement {
  const { t } = useTranslation();
  const defaultNotify = useDefaultNotify();
  const notify = givenNotify ?? defaultNotify;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const registry = useInboxRegistry();
  const categories = categoriesOfRegistry(registry);
  const collections = collectionCategories(categories);
  const [params, setParams] = useSearchParams();
  const filter = readInboxFilter(params, categories);
  const { view, kind } = filter;
  const collection = activeCollection(filter, params, categories);
  const collectionId = collection ? params.get(collection.param) : null;
  const selectedParam = collection ? null : params.get('item');
  // A feed's item (a contributor's decision kept in its own API, by its own parameter), shown instead of an inbox item.
  const feeds = useFeedItems(registry);
  const shownFeed = collection
    ? undefined
    : feeds.find(({ feed }) => params.get(feed.param));
  const feedSelection = shownFeed
    ? { feed: shownFeed.feed, id: params.get(shownFeed.feed.param) ?? '' }
    : null;
  const feedCount = feeds.reduce((sum, { items }) => sum + items.length, 0);
  useInboxRefresh(source.refreshTopics);

  const pages = useInboxItems(pageSize);
  const items = useMemo(
    () => pages.data?.pages.flatMap((page) => page.data) ?? [],
    [pages.data],
  );
  const ids = useMemo(
    () => [...new Set(items.map((item) => item.notificationId))],
    [items],
  );
  const notices = useInboxNotices(source, ids);
  const waiting = useInboxWaiting(source);
  const unreadTotal = useInboxUnreadCount();
  const pending = useInboxPending(source);
  const actions = useInboxActions();

  const entries = useMemo(
    () =>
      mergeWaiting(waiting.data ?? [], entriesOf(items, notices.data ?? [])),
    [waiting.data, items, notices.data],
  );
  const groups = groupEntries(entries, categories);
  const unread = Object.values(unreadByCategory(groups)).reduce(
    (sum, count) => sum + count,
    0,
  );
  const waitingCounts = waitingByCategory(groups, categories, pending.data);
  const pendingTotal =
    Object.values(waitingCounts).reduce((sum, count) => sum + count, 0) +
    feedCount;
  const visible = shownEntries(filter, groups, categories);

  function replaceParams(next: URLSearchParams): void {
    setParams(next, { replace: true });
  }

  function setParam(name: string, value: string | null): void {
    const next = new URLSearchParams(params);
    if (value) next.set(name, value);
    else next.delete(name);
    replaceParams(next);
  }

  /** The params with every selection removed: the item, a feed's and a collection's. */
  function withoutSelection(): URLSearchParams {
    const next = new URLSearchParams(params);
    next.delete('item');
    for (const { feed } of feeds) next.delete(feed.param);
    for (const category of collections) next.delete(category.param);
    return next;
  }

  // Each collection's hook runs on every render, in the registry's order, which is fixed for the page.
  const collectionStates: Record<string, InboxCollectionState> = {};
  for (const category of collections)
    collectionStates[category.id] = category.useCollection({
      filter,
      entries,
      selectedId: params.get(category.param),
      onSelect: (id) => {
        const next = withoutSelection();
        next.set(category.param, id);
        replaceParams(next);
      },
      params,
      onParams: replaceParams,
    });
  const listCollections: Record<string, InboxListCollection> = {};
  for (const [id, state] of Object.entries(collectionStates))
    listCollections[id] = {
      group: state.group,
      count: state.count,
      list: state.list,
    };

  const loaded =
    pages.data !== undefined &&
    waiting.data !== undefined &&
    (ids.length === 0 || notices.data !== undefined) &&
    (kind !== 'all' ||
      Object.values(collectionStates).every((state) => state.loaded));
  const selected =
    visible.find((entry) => entry.item.id === selectedParam) ??
    visible[0] ??
    null;

  const onPendingChangeRef = useRef(onPendingChange);
  useEffect(() => {
    onPendingChangeRef.current = onPendingChange;
  });
  useEffect(() => {
    if (loaded) onPendingChangeRef.current?.(pendingTotal);
  }, [loaded, pendingTotal]);

  // Items present when the list first loaded do not animate; later arrivals (realtime pushes) slide in. The first
  // loaded list is remembered while rendering (derived state, no effect).
  const [initialIds, setInitialIds] = useState<ReadonlySet<string> | null>(
    null,
  );
  if (initialIds === null && loaded)
    setInitialIds(new Set(entries.map((entry) => entry.item.id)));
  const fresh = useMemo(
    () => freshIds(entries, initialIds),
    [entries, initialIds],
  );

  const waitingKey = inboxSourceKeys(source).waiting();
  function act(entry: InboxEntry, action: InboxAction): void {
    // The plugin's hook updates the cached pages and count; what the source listed as waiting is updated here.
    queryClient.setQueryData<readonly InboxEntry[]>(waitingKey, (data) =>
      action === 'delete'
        ? data?.filter((candidate) => candidate.item.id !== entry.item.id)
        : data?.map((candidate) =>
            candidate.item.id === entry.item.id
              ? {
                  ...candidate,
                  item: {
                    ...candidate.item,
                    readAt:
                      action === 'read' ? new Date().toISOString() : undefined,
                  },
                }
              : candidate,
          ),
    );
    actions.mark(entry.item.id, action).then(
      () => {
        if (action === 'delete')
          notify.success(t('inbox.deleted', { defaultValue: 'Deleted.' }));
      },
      (error: unknown) => notify.error(error),
    );
  }
  // "Mark all read" acts on what is shown: everything in All with every kind, otherwise the loaded unread items listed.
  const everything = view === 'all' && kind === 'all';
  const unreadShown = everything
    ? (unreadTotal.data ?? 0)
    : visible.filter((entry) => !entry.item.readAt).length;
  const readAll = useMutation({
    mutationFn: async (): Promise<void> => {
      if (everything) {
        await actions.readAll();
        return;
      }
      const targets = visible.filter((entry) => !entry.item.readAt);
      await Promise.all(
        targets.map((entry) => actions.mark(entry.item.id, 'read')),
      );
    },
    onSuccess: () =>
      notify.success(
        t('inbox.allRead', { defaultValue: 'All marked as read.' }),
      ),
    onError: (error) => notify.error(error),
  });

  function select(entry: InboxEntry): void {
    const next = withoutSelection();
    next.set('item', entry.item.id);
    replaceParams(next);
    if (!entry.item.readAt) act(entry, 'read');
  }

  function open(entry: InboxEntry): void {
    if (!entry.item.readAt) act(entry, 'read');
    const link = entryLink(entry);
    if (link) void navigate(link);
  }

  function run(entry: InboxEntry, action: InboxAction): void {
    if (action === 'delete') {
      const next = stepSelection(
        visible.map((candidate) => candidate.item.id),
        entry.item.id,
        1,
      );
      setParam('item', next && next !== entry.item.id ? next : null);
    }
    act(entry, action);
  }

  // j / k / Enter, ignored while typing, with a modifier, or when a dialog is open.
  const keysRef = useRef({ visible, selected, select, open });
  useEffect(() => {
    keysRef.current = { visible, selected, select, open };
  });
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isEditableTarget(event.target)) return;
      if (document.querySelector('[role="dialog"], [role="alertdialog"]'))
        return;
      const current = keysRef.current;
      const key = event.key.toLowerCase();
      if (key === 'j' || key === 'k') {
        const id = stepSelection(
          current.visible.map((entry) => entry.item.id),
          current.selected?.item.id ?? null,
          key === 'j' ? 1 : -1,
        );
        const entry = current.visible.find(
          (candidate) => candidate.item.id === id,
        );
        if (!entry) return;
        event.preventDefault();
        current.select(entry);
        document
          .querySelector(
            `[data-inbox-item="${CSS.escape(entry.item.id)}"] button`,
          )
          ?.scrollIntoView?.({ block: 'nearest' });
      } else if (
        event.key === 'Enter' &&
        current.selected &&
        (event.target === document.body ||
          event.target === document.documentElement)
      ) {
        event.preventDefault();
        current.open(current.selected);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const showsDetail = Boolean(selectedParam || collectionId || feedSelection);

  return (
    <div className='flex h-full min-h-0 flex-col'>
      <div className='shrink-0 border-b px-6 py-5 md:px-8'>
        <PageHeader
          title={title ?? t('inbox.title', { defaultValue: 'Inbox' })}
          description={
            description ??
            t('inbox.description', {
              defaultValue: 'Notifications and requests sent to you.',
            })
          }
          actions={
            <>
              {(pages.isFetching || notices.isFetching || waiting.isFetching) &&
              pages.data ? (
                <Spinner
                  className='size-4 text-muted-foreground'
                  aria-label={t('inbox.loading', { defaultValue: 'Loading' })}
                />
              ) : null}
              <Button
                variant='outline'
                disabled={readAll.isPending || unreadShown === 0}
                onClick={() => readAll.mutate()}
              >
                {readAll.isPending ? (
                  <Spinner data-icon='inline-start' />
                ) : (
                  <CheckCheckIcon data-icon='inline-start' />
                )}
                {t('inbox.readAll', { defaultValue: 'Mark all as read' })}
              </Button>
            </>
          }
        />
      </div>
      <div className='flex min-h-0 flex-1'>
        <div
          className={cn(
            'flex min-h-0 w-full flex-col border-r bg-sidebar/60 lg:w-[26rem] lg:shrink-0',
            showsDetail ? 'max-lg:hidden' : undefined,
          )}
        >
          <InboxList
            filter={filter}
            unread={unread}
            pending={pendingTotal}
            waiting={waitingCounts}
            feedCount={feedCount}
            feeds={feeds.map(({ feed, items: feedItems }) =>
              feedItems.length === 0 ? null : (
                <ContributorScope
                  key={feed.id}
                  namespace={feed.namespace}
                  resources={feed.resources}
                >
                  <feed.List
                    items={feedItems as never[]}
                    selectedId={
                      feedSelection?.feed === feed ? feedSelection.id : null
                    }
                    onSelect={(id) => {
                      const next = withoutSelection();
                      next.set(feed.param, id);
                      replaceParams(next);
                    }}
                  />
                </ContributorScope>
              ),
            )}
            groups={groups}
            loaded={loaded}
            query={{
              isError: pages.isError,
              error: pages.error,
              isFetchingNextPage: pages.isFetchingNextPage,
              refetch: pages.refetch,
              fetchNextPage: pages.fetchNextPage,
              hasNextPage: pages.hasNextPage,
            }}
            selectedId={
              feedSelection || collectionId ? null : (selected?.item.id ?? null)
            }
            fresh={fresh}
            busy={actions.pending}
            onFilter={(value) =>
              replaceParams(inboxFilterParams(params, value, categories))
            }
            collections={listCollections}
            footer={listFooter}
            idPrefix={idPrefix}
            onSelect={select}
            onOpen={open}
            onAction={run}
          />
        </div>
        <div
          className={cn(
            'min-h-0 min-w-0 flex-1 overflow-y-auto',
            showsDetail ? undefined : 'max-lg:hidden',
          )}
        >
          {collection ? (
            <collection.Detail
              id={collectionId}
              onBack={() => setParam(collection.param, null)}
            />
          ) : feedSelection ? (
            <ContributorScope
              namespace={feedSelection.feed.namespace}
              resources={feedSelection.feed.resources}
            >
              <feedSelection.feed.Detail
                key={feedSelection.id}
                id={feedSelection.id}
                onBack={() => setParam(feedSelection.feed.param, null)}
              />
            </ContributorScope>
          ) : (
            <InboxDetail
              entry={selected}
              busy={actions.pending}
              onBack={() => setParam('item', null)}
              onAction={run}
              onOpen={open}
              toolbar={detailToolbar}
              idPrefix={idPrefix}
            />
          )}
        </div>
      </div>
    </div>
  );
}
