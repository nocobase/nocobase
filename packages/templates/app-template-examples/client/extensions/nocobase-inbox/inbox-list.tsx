import { AlertCircleIcon, InboxIcon } from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';

import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Kbd } from '@/components/ui/kbd';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from 'cn';

import { useInboxFrameText } from './frame.js';
import type { InboxAction } from './inbox-actions.js';
import { InboxItemCard } from './inbox-item.js';
import {
  categoriesOf,
  INBOX_VIEWS,
  kindsOf,
  shownGroups,
  type InboxEntry,
  type InboxFilter,
  type InboxGroups,
  type InboxView,
} from './model.js';
import { categoriesOfRegistry, useInboxRegistry } from './registry.js';

export interface InboxListQuery {
  readonly isError: boolean;
  readonly error: unknown;
  readonly hasNextPage: boolean;
  readonly isFetchingNextPage: boolean;
  refetch(): unknown;
  fetchNextPage(): unknown;
}

/** What a collection category shows in the list: its group while every kind shows, its list while selected. */
export interface InboxListCollection {
  /** Its group, after the category it follows. */
  readonly group?: ReactNode;
  /** How many records its group lists; the group shows only above zero. */
  readonly count?: number;
  /** Its list, in place of the items while the kind filter selects it. */
  readonly list?: ReactNode;
}

export interface InboxListProps {
  readonly filter: InboxFilter;
  /** Unread items among those loaded, the count on All. */
  readonly unread: number;
  /** What waits on the viewer, the count on To do and the header badge's. */
  readonly pending: number;
  /** What waits in each waiting category, beside its group's heading; its unsettled items when left out. */
  readonly waiting?: Readonly<Record<string, number>>;
  readonly groups: InboxGroups;
  readonly loaded: boolean;
  readonly query: InboxListQuery;
  readonly selectedId: string | null;
  /** Items that arrived after the list first loaded. */
  readonly fresh?: ReadonlySet<string>;
  readonly busy: boolean;
  readonly onFilter: (filter: InboxFilter) => void;
  readonly onSelect: (entry: InboxEntry) => void;
  readonly onOpen: (entry: InboxEntry) => void;
  readonly onAction: (entry: InboxEntry, action: InboxAction) => void;
  /** The feeds' sections (decisions kept in a contributor's own API), shown first with every kind or decisions. */
  readonly feeds?: ReactNode;
  readonly feedCount?: number;
  /** What each collection category shows, by its id. */
  readonly collections?: Readonly<Record<string, InboxListCollection>>;
  /** Beside the kind filter, such as a sound reminder switch. */
  readonly footer?: ReactNode;
  /** The prefix of the element ids it renders. */
  readonly idPrefix?: string;
}

/**
 * The inbox's left column: two views — All, and To do with the count of what waits on the viewer, the same number
 * as the header badge — then one filter by kind (every kind, then the registry's categories) and the `footer` slot.
 * Below, the items in groups: the feeds' sections, each entry category's group with each collection's group after the
 * category it follows, and "load more". To do lists only what still waits; its kind filter offers only the waiting
 * categories and the collections offered there. A collection selected by the kind filter lists its own records in
 * place of the items. The keyboard hint sits at the bottom.
 */
export function InboxList({
  filter,
  unread,
  pending,
  waiting,
  groups,
  loaded,
  query,
  selectedId,
  fresh,
  busy,
  onFilter,
  onSelect,
  onOpen,
  onAction,
  feeds,
  feedCount = 0,
  collections = {},
  footer,
  idPrefix = 'nocobase-inbox',
}: InboxListProps): ReactElement {
  const { t } = useInboxFrameText();
  const categories = categoriesOfRegistry(useInboxRegistry());
  const { view, kind } = filter;
  const shown = shownGroups(filter, groups, categories);
  const selectedCollection = categories.find(
    (category) => category.type === 'collection' && category.id === kind,
  );
  const shownCollections =
    kind === 'all'
      ? categoriesOf(view, categories).filter(
          (category) =>
            category.type === 'collection' &&
            (collections[category.id]?.count ?? 0) > 0,
        )
      : [];
  const firstEntries = shown[0]?.category.id;
  const showFeeds = (kind === 'all' || kind === firstEntries) && feedCount > 0;
  const empty =
    loaded &&
    !showFeeds &&
    shownCollections.length === 0 &&
    shown.every(({ entries }) => entries.length === 0);
  const kinds = kindsOf(view, categories).map((value) => ({
    value,
    label:
      value === 'all'
        ? t('inbox.kinds.all', { defaultValue: 'All types' })
        : (categories.find((category) => category.id === value)?.label(t) ??
          value),
  }));
  // Each collection's group follows the category it names; one naming no category shown comes last.
  const shownIds = new Set(shown.map(({ category }) => category.id));
  const after = (id: string | null): ReactNode =>
    shownCollections
      .filter((category) => {
        const target =
          category.type === 'collection' ? category.after : undefined;
        return id === null
          ? target === undefined || !shownIds.has(target)
          : target === id;
      })
      .map((category) => (
        <CollectionSlot key={category.id}>
          {collections[category.id]?.group}
        </CollectionSlot>
      ));

  let content: ReactNode;
  if (selectedCollection) content = collections[selectedCollection.id]?.list;
  else if (query.isError && !loaded)
    content = (
      <div className='px-1'>
        <Alert variant='destructive'>
          <AlertCircleIcon />
          <AlertTitle>
            {t('inbox.loadFailed', {
              defaultValue: 'Unable to load the inbox',
            })}
          </AlertTitle>
          <AlertDescription>
            {t('inbox.loadFailedDescription', {
              defaultValue: 'Check your connection and try again.',
            })}
          </AlertDescription>
          <AlertAction>
            <Button
              variant='outline'
              size='sm'
              onClick={() => void query.refetch()}
            >
              {t('inbox.retry', { defaultValue: 'Retry' })}
            </Button>
          </AlertAction>
        </Alert>
      </div>
    );
  else if (!loaded)
    content = (
      <div
        role='status'
        aria-label={t('inbox.loading', { defaultValue: 'Loading' })}
        className='space-y-2 px-1'
      >
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} className='h-16 w-full rounded-lg' />
        ))}
      </div>
    );
  else if (empty)
    content =
      kind === 'all' ? (
        <ListEmpty
          title={
            view === 'todo'
              ? t('inbox.empty.todo', {
                  defaultValue: 'Nothing waiting for you',
                })
              : t('inbox.emptyAll', { defaultValue: 'Nothing here' })
          }
          description={t('inbox.emptyDescription', {
            defaultValue:
              'Notifications and requests sent to you show up here.',
          })}
        />
      ) : (
        <ListEmpty
          title={shown[0]?.category.empty(t) ?? ''}
          description={t('inbox.noMatchDescription', {
            defaultValue: 'Clear the filter to see every type.',
          })}
          action={
            <Button
              variant='outline'
              size='sm'
              onClick={() => onFilter({ view, kind: 'all' })}
            >
              {t('inbox.clearFilter', { defaultValue: 'Clear filter' })}
            </Button>
          }
        />
      );
  else
    content = (
      <div className='space-y-5'>
        {showFeeds ? feeds : null}
        {shown.map(({ category, entries }) => {
          const heading = `${idPrefix}-group-${category.id}`;
          const count = category.waits
            ? (waiting?.[category.id] ??
              entries.filter((entry) => entry.notice?.resolvedAt == null)
                .length)
            : entries.length;
          return (
            <CollectionSlot key={category.id}>
              {entries.length === 0 && kind === 'all' ? null : (
                <section aria-labelledby={heading} className='space-y-1'>
                  <h2
                    id={heading}
                    className='flex items-center gap-2 px-3 text-xs font-medium tracking-wider text-muted-foreground uppercase'
                  >
                    {category.title(t)}
                    {/* What still waits, as To do counts it; handled items stay listed in All but are not counted. */}
                    {count > 0 ? (
                      <span className='tabular-nums'>{count}</span>
                    ) : null}
                  </h2>
                  <ul aria-label={category.title(t)} className='space-y-0.5'>
                    {entries.map((entry) => (
                      <li key={entry.item.id}>
                        <InboxItemCard
                          entry={entry}
                          selected={entry.item.id === selectedId}
                          busy={busy}
                          fresh={fresh?.has(entry.item.id)}
                          onSelect={onSelect}
                          onOpen={onOpen}
                          onAction={onAction}
                        />
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              {after(category.id)}
            </CollectionSlot>
          );
        })}
        {after(null)}
        {query.hasNextPage ? (
          <div className='flex justify-center pt-1'>
            <Button
              variant='ghost'
              size='sm'
              disabled={query.isFetchingNextPage}
              onClick={() => void query.fetchNextPage()}
            >
              {query.isFetchingNextPage ? (
                <Spinner data-icon='inline-start' />
              ) : null}
              {t('inbox.loadMore', { defaultValue: 'Load more' })}
            </Button>
          </div>
        ) : null}
      </div>
    );

  return (
    <>
      <div className='shrink-0 space-y-2 border-b px-3 py-2.5'>
        <Tabs
          value={view}
          onValueChange={(value) => {
            const next = value as InboxView;
            onFilter({
              view: next,
              kind: kindsOf(next, categories).includes(kind) ? kind : 'all',
            });
          }}
        >
          <TabsList variant='line' className='w-full'>
            {INBOX_VIEWS.map((value) => {
              const count = value === 'todo' ? pending : unread;
              return (
                <TabsTrigger key={value} value={value}>
                  {value === 'todo'
                    ? t('inbox.views.todo', { defaultValue: 'To do' })
                    : t('inbox.views.all', { defaultValue: 'All' })}
                  {count > 0 ? (
                    <Badge
                      variant={value === 'todo' ? 'outline' : 'secondary'}
                      className={cn(
                        'h-4 px-1.5 tabular-nums',
                        value === 'todo' &&
                          'border-transparent bg-amber-500/15 text-amber-700 dark:text-amber-300',
                      )}
                      aria-label={
                        value === 'todo'
                          ? t('inbox.pendingDecisions', {
                              count,
                              defaultValue: '{{count}} waiting',
                            })
                          : t('inbox.unreadCount', {
                              count,
                              defaultValue: '{{count}} unread',
                            })
                      }
                    >
                      {count}
                    </Badge>
                  ) : null}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
        <div className='flex flex-wrap items-center justify-between gap-2'>
          <Select
            items={kinds}
            value={kind}
            onValueChange={(next: string | null) => {
              if (next) onFilter({ view, kind: next });
            }}
          >
            <SelectTrigger
              size='sm'
              className='w-40'
              aria-label={t('inbox.kinds.label', { defaultValue: 'Type' })}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
              {kinds.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {footer}
        </div>
      </div>
      <div className='min-h-0 flex-1 overflow-y-auto px-2 py-3'>{content}</div>
      <p className='hidden shrink-0 items-center gap-3 border-t px-4 py-2 text-xs text-muted-foreground lg:flex'>
        <span className='inline-flex items-center gap-1'>
          <Kbd>J</Kbd>
          <Kbd>K</Kbd>
          {t('inbox.keyMove', { defaultValue: 'Move' })}
        </span>
        <span className='inline-flex items-center gap-1'>
          <Kbd>Enter</Kbd>
          {t('inbox.keyOpen', { defaultValue: 'Open' })}
        </span>
      </p>
    </>
  );
}

function ListEmpty({
  title,
  description,
  action,
}: {
  readonly title: string;
  readonly description: string;
  readonly action?: ReactNode;
}): ReactElement {
  return (
    <Empty className='mx-1 min-h-48'>
      <EmptyHeader>
        <EmptyMedia variant='icon'>
          <InboxIcon />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {action ? <EmptyContent>{action}</EmptyContent> : null}
    </Empty>
  );
}

/** A group of the list, followed by what comes right after it. */
function CollectionSlot({
  children,
}: {
  readonly children: ReactNode;
}): ReactElement {
  return <>{children}</>;
}
