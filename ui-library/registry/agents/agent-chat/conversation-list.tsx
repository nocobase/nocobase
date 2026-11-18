/**
 * The viewer's conversations, newest message first, grouped by day, for the chat workspace: search, All / Needs me /
 * In progress with counts, unread dots, what waits for the viewer, and archive (hover or E) with Archived at the foot.
 * An application adds what only it knows through narrow slots: `row.extra` (a line under the title),
 * `row.facts` (what else makes a row need the viewer or count as in progress), `row.status` (a status in place of the
 * default one), `filters` with `filter` (more filters, such as a project), and `heading` (such as a switch between
 * kinds of sessions).
 */
import {
  chatIsRunning,
  useConversationActions,
  useConversationList,
} from '@nocobase/app-plugin-agents/client/chat';
import type {
  ConversationMode,
  ConversationSummary,
} from '@nocobase/app-plugin-agents/shared/conversations';
import { useTranslation } from '@nocobase/i18n/client';
import {
  ArchiveIcon,
  ArchiveRestoreIcon,
  ArrowLeftIcon,
  PanelLeftCloseIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
} from 'lucide-react';
import {
  useMemo,
  useState,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
} from 'react';
import { cn } from 'cn';
import { Button } from '#components/ui/button';
import { Input } from '#components/ui/input';
import { Skeleton } from '#components/ui/skeleton';
import { LoadError } from './chat-ui.js';
import { DeleteConversationDialog } from './delete-conversation.js';
import { useChatTranslation } from './chat-i18n.js';

type Filter = 'all' | 'waiting' | 'active';
type DayGroup = 'today' | 'yesterday' | 'week' | 'earlier';
const DAY_GROUPS: readonly DayGroup[] = [
  'today',
  'yesterday',
  'week',
  'earlier',
];

function dayGroup(at: string, now: Date = new Date()): DayGroup {
  const day = (date: Date): number =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const days = Math.round((day(now) - day(new Date(at))) / 86_400_000);
  return days <= 0
    ? 'today'
    : days === 1
      ? 'yesterday'
      : days < 7
        ? 'week'
        : 'earlier';
}

/** A time of day today and yesterday, a weekday this week, a date before. */
function shortTime(at: string, locale: string): string {
  const group = dayGroup(at);
  const options: Intl.DateTimeFormatOptions =
    group === 'today' || group === 'yesterday'
      ? { hour: '2-digit', minute: '2-digit' }
      : group === 'week'
        ? { weekday: 'short', hour: '2-digit', minute: '2-digit' }
        : { month: 'short', day: 'numeric' };
  return new Intl.DateTimeFormat(locale, options).format(new Date(at));
}

/** What an application adds to a row. */
export interface ConversationRowSlots {
  /** A line under the title, such as the work the conversation drives. */
  readonly extra?:
    ((conversation: ConversationSummary) => ReactNode) | undefined;
  /** What else makes the row need the viewer, or count as in progress. */
  readonly facts?:
    | ((conversation: ConversationSummary) => {
        readonly needsMe?: boolean;
        readonly active?: boolean;
      })
    | undefined;
  /** A status in place of the default one; undefined keeps the default. */
  readonly status?:
    ((conversation: ConversationSummary) => ReactNode | undefined) | undefined;
}

export interface ConversationListProps {
  readonly activeId: string | null;
  readonly onOpen: (conversationId: string) => void;
  readonly onNew: () => void;
  /** Replaces the title above the search, such as tabs between kinds of sessions. */
  readonly heading?: ReactNode;
  /** After New, such as a panel's Close. */
  readonly headerActions?: ReactNode;
  /** Folds the list to a rail; without it the list has no fold button. */
  readonly onFold?: (() => void) | undefined;
  readonly row?: ConversationRowSlots | undefined;
  /** More filters under the default ones; `filter` applies them. */
  readonly filters?: ReactNode;
  readonly filter?:
    ((conversation: ConversationSummary) => boolean) | undefined;
  /** Only this kind of agent's conversations; all of them when null. */
  readonly mode?: ConversationMode | null | undefined;
  readonly className?: string;
}

interface Facts {
  readonly offline: boolean;
  readonly needsMe: boolean;
  readonly active: boolean;
}

export function ConversationList({
  activeId,
  onOpen,
  onNew,
  heading,
  headerActions,
  onFold,
  row,
  filters,
  filter: extraFilter,
  mode,
  className,
}: ConversationListProps): ReactElement {
  const { t } = useChatTranslation();
  const { i18n } = useTranslation();
  const [archived, setArchived] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const query = useConversationList({ archived, ...(mode ? { mode } : {}) });
  const actions = useConversationActions();
  const conversations = useMemo(
    () => query.data?.pages.flatMap((page) => page.items) ?? [],
    [query.data],
  );
  const facts = new Map<string, Facts>(
    conversations.map((conversation) => {
      const more = row?.facts?.(conversation) ?? {};
      return [
        conversation.id,
        {
          offline: Boolean(
            conversation.runner && conversation.runner.status !== 'online',
          ),
          needsMe:
            Boolean(conversation.needsYou) ||
            !conversation.read ||
            Boolean(more.needsMe),
          active: chatIsRunning(conversation) || Boolean(more.active),
        },
      ];
    }),
  );
  const counts = { waiting: 0, active: 0 };
  for (const fact of facts.values()) {
    if (fact.needsMe) counts.waiting += 1;
    if (fact.active) counts.active += 1;
  }
  const needle = search.trim().toLocaleLowerCase();
  const title = (conversation: ConversationSummary): string =>
    conversation.title?.trim() || t('chat.untitled');
  const shown = conversations.filter((conversation) => {
    const fact = facts.get(conversation.id)!;
    if (filter === 'waiting' && !fact.needsMe) return false;
    if (filter === 'active' && !fact.active) return false;
    if (!archived && extraFilter && !extraFilter(conversation)) return false;
    return !needle || title(conversation).toLocaleLowerCase().includes(needle);
  });

  return (
    <section
      className={cn(
        '@container/session-list flex h-full min-h-0 w-full min-w-0 flex-col',
        className,
      )}
      aria-label={t('chat.list.label')}
      aria-busy={query.isFetching}
      data-testid='session-list'
    >
      <div className='flex flex-col gap-2.5 px-3.5 pt-3.5 pb-2'>
        <div className='flex items-center gap-2'>
          {archived && (
            <Button
              variant='ghost'
              size='icon-sm'
              className='shrink-0'
              aria-label={t('chat.list.back')}
              title={t('chat.list.back')}
              onClick={() => setArchived(false)}
            >
              <ArrowLeftIcon />
            </Button>
          )}
          {heading && !archived ? (
            <div className='min-w-0 flex-1'>{heading}</div>
          ) : (
            <h2 className='min-w-0 flex-1 truncate text-base font-semibold'>
              {archived ? t('chat.list.archivedTitle') : t('chat.list.label')}
            </h2>
          )}
          <Button
            variant='ghost'
            size='icon-sm'
            className='size-9 shrink-0 [&_svg]:size-4'
            aria-label={t('chat.newConversation')}
            title={t('chat.newConversation')}
            onClick={() => {
              setArchived(false);
              onNew();
            }}
            data-testid='chat-new-conversation'
          >
            <PlusIcon />
          </Button>
          {headerActions}
          {onFold && (
            <Button
              variant='ghost'
              size='icon-sm'
              className='size-9 shrink-0 [&_svg]:size-4'
              aria-label={t('chat.history.fold')}
              title={t('chat.history.fold')}
              onClick={onFold}
              data-testid='session-list-fold'
            >
              <PanelLeftCloseIcon />
            </Button>
          )}
        </div>
        <div className='relative'>
          <SearchIcon className='pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            className='h-8 bg-card pl-8 text-base md:text-sm'
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('chat.history.search')}
            aria-label={t('chat.history.search')}
          />
        </div>
        {!archived && (
          <div
            className='flex flex-wrap gap-1'
            role='group'
            aria-label={t('chat.list.filters')}
          >
            {(['all', 'waiting', 'active'] as const).map((value) => {
              const label =
                value === 'all'
                  ? t('chat.list.all')
                  : t(`chat.list.${value}`, { count: counts[value] });
              return (
                <button
                  key={value}
                  type='button'
                  aria-pressed={filter === value}
                  title={label}
                  onClick={() => setFilter(value)}
                  className={cn(
                    'h-7.5 max-w-full truncate rounded-full border px-2.5 text-xs whitespace-nowrap',
                    filter === value
                      ? 'border-transparent bg-accent font-medium text-accent-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}
        {!archived ? filters : null}
      </div>

      <div className='min-h-0 flex-1 overflow-y-auto px-2 pb-2'>
        {query.isError && !query.data ? (
          <LoadError
            title={t('chat.history.loadFailed')}
            error={query.error}
            onRetry={() => void query.refetch()}
          />
        ) : query.isPending ? (
          <div className='flex flex-col gap-2 p-2'>
            {[0, 1, 2].map((index) => (
              <Skeleton key={index} className='h-12' />
            ))}
          </div>
        ) : shown.length === 0 ? (
          <p className='p-3 text-sm text-muted-foreground'>
            {conversations.length === 0
              ? archived
                ? t('chat.history.noArchived')
                : t('chat.history.empty')
              : t('chat.history.noMatch')}
          </p>
        ) : (
          DAY_GROUPS.map((group) => {
            const rows = shown.filter(
              (conversation) => dayGroup(conversation.lastMessageAt) === group,
            );
            if (rows.length === 0) return null;
            return (
              <div key={group}>
                <h3 className='px-2.5 pt-3 pb-1 text-xs font-normal text-muted-foreground'>
                  {t(`chat.list.${group}`)}
                </h3>
                {rows.map((conversation) => (
                  <ConversationRow
                    key={conversation.id}
                    conversation={conversation}
                    title={title(conversation)}
                    facts={facts.get(conversation.id)!}
                    active={conversation.id === activeId}
                    locale={i18n.language}
                    slots={row}
                    onOpen={() => onOpen(conversation.id)}
                    onArchive={() =>
                      actions.archive.mutate({
                        id: conversation.id,
                        archived: !conversation.archivedAt,
                      })
                    }
                  />
                ))}
              </div>
            );
          })
        )}
        {query.hasNextPage && (
          <Button
            variant='ghost'
            size='sm'
            className='w-full'
            onClick={() => void query.fetchNextPage()}
          >
            {t('chat.history.more')}
          </Button>
        )}
      </div>

      <div className='flex items-center gap-1 border-t px-2 py-2'>
        <button
          type='button'
          title={t('chat.list.archivedTitle')}
          aria-pressed={archived}
          onClick={() => setArchived(true)}
          className='inline-flex h-8 min-w-0 items-center gap-1.5 rounded-md px-2 text-xs whitespace-nowrap text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
        >
          <ArchiveIcon className='size-4 shrink-0' />
          <span className='truncate'>{t('chat.list.archivedTitle')}</span>
        </button>
        {!archived && (
          <span className='ml-auto hidden shrink-0 items-center gap-1 text-xs whitespace-nowrap text-muted-foreground @min-[220px]/session-list:inline-flex'>
            <kbd className='rounded-[3px] border bg-card px-1 font-sans text-[10.5px]'>
              E
            </kbd>
            {t('chat.archive')}
          </span>
        )}
      </div>
    </section>
  );
}

function ConversationRow({
  conversation,
  title,
  facts,
  active,
  locale,
  slots,
  onOpen,
  onArchive,
}: {
  readonly conversation: ConversationSummary;
  readonly title: string;
  readonly facts: Facts;
  readonly active: boolean;
  readonly locale: string;
  readonly slots: ConversationRowSlots | undefined;
  readonly onOpen: () => void;
  readonly onArchive: () => void;
}): ReactElement {
  const { t } = useChatTranslation();
  const restoring = conversation.archivedAt !== null;
  const [deleting, setDeleting] = useState(false);
  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.target !== event.currentTarget) return;
    if (event.key === 'Enter') onOpen();
    if (
      (event.key === 'e' || event.key === 'E') &&
      !event.metaKey &&
      !event.ctrlKey
    )
      onArchive();
  };
  const extra = slots?.extra?.(conversation);
  const custom = slots?.status?.(conversation);
  const status =
    custom !== undefined ? (
      custom
    ) : (
      <StatusChip facts={facts} conversation={conversation} />
    );
  return (
    <div
      role='link'
      tabIndex={0}
      aria-current={active ? 'page' : undefined}
      onClick={onOpen}
      onKeyDown={onKeyDown}
      data-conversation={conversation.id}
      className={cn(
        'group relative flex cursor-pointer flex-col gap-1.5 rounded-lg px-2.5 pt-2.5 pb-3 outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset',
        active ? 'bg-accent' : 'hover:bg-muted',
      )}
    >
      <div className='flex items-baseline gap-2'>
        {!conversation.read && (
          <span
            role='img'
            aria-label={t('chat.history.unread')}
            className='size-2 shrink-0 self-center rounded-full bg-primary'
            data-testid='session-unread'
          />
        )}
        <span
          className='min-w-0 flex-1 truncate text-sm font-medium'
          title={title}
        >
          {title}
        </span>
        <span className='shrink-0 text-xs whitespace-nowrap text-muted-foreground tabular-nums group-focus-within:invisible group-hover:invisible'>
          {shortTime(conversation.lastMessageAt, locale)}
        </span>
      </div>
      {extra != null || status != null ? (
        <div className='flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground'>
          {extra}
          <span className='ml-auto flex shrink-0 items-center gap-1.5'>
            {status}
          </span>
        </div>
      ) : null}
      {deleting ? (
        <span onClick={(event) => event.stopPropagation()}>
          <DeleteConversationDialog
            conversation={conversation}
            open={deleting}
            onOpenChange={setDeleting}
          />
        </span>
      ) : null}
      <div className='absolute top-2 right-2 hidden items-center gap-1 group-focus-within:flex group-hover:flex'>
        {restoring ? (
          <button
            type='button'
            onClick={(event) => {
              event.stopPropagation();
              setDeleting(true);
            }}
            aria-label={t('chat.delete')}
            title={t('chat.delete')}
            className='inline-flex size-6 items-center justify-center rounded-[5px] border bg-card text-muted-foreground hover:text-destructive'
            data-testid='session-delete'
          >
            <Trash2Icon className='size-3.5' />
          </button>
        ) : null}
        <button
          type='button'
          onClick={(event) => {
            event.stopPropagation();
            onArchive();
          }}
          aria-label={restoring ? t('chat.list.restore') : t('chat.archive')}
          className='group/archive inline-flex h-6 min-w-6 items-center justify-center gap-1 rounded-[5px] border bg-card px-1 text-xs text-muted-foreground hover:text-foreground'
        >
          {restoring ? (
            <ArchiveRestoreIcon className='size-3.5' />
          ) : (
            <ArchiveIcon className='size-3.5' />
          )}
          <span className='hidden pr-0.5 group-hover/archive:inline group-focus-visible/archive:inline'>
            {restoring ? t('chat.list.restore') : t('chat.archive')}
          </span>
        </button>
      </div>
    </div>
  );
}

/** The row's one status: what waits for the viewer says what it is. */
function StatusChip({
  facts,
  conversation,
}: {
  readonly facts: Facts;
  readonly conversation: ConversationSummary;
}): ReactElement | null {
  const { t } = useChatTranslation();
  const chip = 'inline-flex items-center gap-1.5 text-xs whitespace-nowrap';
  if (facts.offline)
    return (
      <span className={cn(chip, 'text-muted-foreground')}>
        <span className='size-2 rounded-full border-[1.5px] border-current' />
        {t('chat.list.offline')}
      </span>
    );
  if (facts.needsMe)
    return (
      <span
        className={cn(chip, 'font-medium text-amber-800 dark:text-amber-300')}
      >
        <span className='size-2 rounded-full bg-amber-400' />
        {conversation.needsYou
          ? t(`chat.list.${conversation.needsYou.reason}`)
          : !conversation.read
            ? t('chat.list.reply')
            : t('chat.list.needsMe')}
      </span>
    );
  if (facts.active)
    return (
      <span className={cn(chip, 'font-medium text-primary')}>
        <span className='size-2 animate-pulse rounded-full bg-primary' />
        {t('chat.list.working')}
      </span>
    );
  return null;
}
