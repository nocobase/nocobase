/**
 * The viewer's conversations, last message first, in the panel's history view and the full-page view's history
 * dialog: search over titles and messages, filters by agent and by where a conversation started, open or archived
 * ones. Each row opens its conversation; its menu opens it full screen (when the application has a page for it),
 * renames it in place, or archives it (undo in the toast) or brings it back. `ChatHistoryDialog` shows the list in a
 * dialog, for a page rather than the panel.
 */
import {
  CHAT_PANEL_ATTRIBUTE,
  useAgentText,
  useChatAgents,
  useConversationActions,
  useConversationList,
  useConversationSources,
  useFormatters,
} from '@nocobase/app-plugin-agents/client/chat';
import {
  CONVERSATION_TITLE_MAX,
  PANEL_SOURCE,
  type ConversationListQuery,
  type ConversationSummary,
} from '@nocobase/app-plugin-agents/shared/conversations';
import {
  ArchiveIcon,
  ArchiveRestoreIcon,
  Maximize2Icon,
  MessagesSquareIcon,
  MoreHorizontalIcon,
  PencilIcon,
  SearchIcon,
} from 'lucide-react';
import { useEffect, useState, type ReactElement } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from 'cn';

import { useChatTranslation } from './chat-i18n.js';
import { ChatTag, LoadError, Pulse } from './chat-ui.js';

const ALL = '__all__';

export interface HistoryListProps {
  readonly activeId: string | null;
  readonly onOpen: (conversationId: string) => void;
  /** Offered in each row's menu: open the conversation on the application's full-page view. */
  readonly onOpenPage?: ((conversationId: string) => void) | null;
}

export function HistoryList({
  activeId,
  onOpen,
  onOpenPage,
}: HistoryListProps): ReactElement {
  const { t } = useChatTranslation();
  const agents = useChatAgents();
  const sources = useConversationSources();
  const agentText = useAgentText();
  const [text, setText] = useState('');
  const [q, setQ] = useState('');
  const [archived, setArchived] = useState(false);
  const [agentId, setAgentId] = useState(ALL);
  const [source, setSource] = useState(ALL);
  useEffect(() => {
    const timer = window.setTimeout(() => setQ(text.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [text]);
  const query: ConversationListQuery = {
    archived,
    ...(q ? { q } : {}),
    ...(agentId === ALL ? {} : { agentId }),
    ...(source === ALL ? {} : { source }),
  };
  const pages = useConversationList(query);
  const items = pages.data?.pages.flatMap((page) => page.items) ?? [];
  const agentItems = [
    { value: ALL, label: t('chat.history.allAgents') },
    ...(agents.data ?? []).map((agent) => ({
      value: agent.id,
      label: agentText.name(agent),
    })),
  ];
  const sourceItems = [
    { value: ALL, label: t('chat.history.allSources') },
    { value: PANEL_SOURCE, label: t('chat.sources.panel') },
    ...sources.map((source) => ({ value: source.key, label: source.label })),
  ];
  const filtered = Boolean(q) || agentId !== ALL || source !== ALL;

  return (
    <div className='flex min-h-0 flex-col gap-3' data-testid='chat-history'>
      <div className='relative'>
        <SearchIcon
          className='pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground'
          aria-hidden='true'
        />
        <Input
          type='search'
          value={text}
          className='pl-8'
          placeholder={t('chat.history.search')}
          aria-label={t('chat.history.search')}
          onChange={(event) => setText(event.target.value)}
        />
      </div>
      <div className='flex flex-wrap items-center gap-2'>
        <Tabs
          value={archived ? 'archived' : 'active'}
          onValueChange={(value) => setArchived(value === 'archived')}
        >
          <TabsList variant='line' aria-label={t('chat.history.show')}>
            <TabsTrigger value='active'>{t('chat.history.active')}</TabsTrigger>
            <TabsTrigger value='archived'>
              {t('chat.history.archived')}
            </TabsTrigger>
          </TabsList>
        </Tabs>
        {/* The filters keep their width and move to a row of their own when the tabs leave them too little. */}
        <div className='flex min-w-0 flex-wrap items-center gap-2'>
          <Select
            items={agentItems}
            value={agentId}
            onValueChange={(next: string | null) => setAgentId(next ?? ALL)}
          >
            <SelectTrigger
              size='sm'
              className='max-w-48 min-w-0'
              aria-label={t('chat.history.agent')}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
              {agentItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            items={sourceItems}
            value={source}
            onValueChange={(next: string | null) => setSource(next ?? ALL)}
          >
            <SelectTrigger
              size='sm'
              className='max-w-48 min-w-0'
              aria-label={t('chat.history.source')}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
              {sourceItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {pages.isError && !pages.data ? (
        <LoadError
          title={t('chat.history.loadFailed')}
          error={pages.error}
          onRetry={() => void pages.refetch()}
        />
      ) : !pages.data ? (
        <div
          role='status'
          aria-label={t('chat.loading')}
          className='space-y-2 rounded-lg border bg-card p-3'
        >
          {[0, 1, 2, 3].map((row) => (
            <Skeleton key={row} className='h-7 w-full' />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Empty className='min-h-48 border border-dashed'>
          <EmptyHeader>
            <EmptyMedia variant='icon'>
              <MessagesSquareIcon />
            </EmptyMedia>
            <EmptyTitle>
              {filtered
                ? t('chat.history.noMatch')
                : archived
                  ? t('chat.history.noArchived')
                  : t('chat.history.empty')}
            </EmptyTitle>
          </EmptyHeader>
        </Empty>
      ) : (
        <ul
          className='flex flex-col gap-1'
          aria-label={t('chat.history.title')}
        >
          {items.map((item) => (
            <HistoryRow
              key={item.id}
              item={item}
              active={item.id === activeId}
              onOpen={() => onOpen(item.id)}
              onOpenPage={onOpenPage ? () => onOpenPage(item.id) : null}
            />
          ))}
        </ul>
      )}
      {pages.hasNextPage ? (
        <Button
          variant='outline'
          size='sm'
          className='self-center'
          disabled={pages.isFetchingNextPage}
          onClick={() => void pages.fetchNextPage()}
        >
          {t('chat.history.more')}
        </Button>
      ) : null}
    </div>
  );
}

function HistoryRow({
  item,
  active,
  onOpen,
  onOpenPage,
}: {
  readonly item: ConversationSummary;
  readonly active: boolean;
  readonly onOpen: () => void;
  readonly onOpenPage: (() => void) | null;
}): ReactElement {
  const { t } = useChatTranslation();
  const format = useFormatters();
  const actions = useConversationActions();
  const sources = useConversationSources();
  const agentText = useAgentText();
  const shown = item.title?.trim() ? item.title : t('chat.untitled');
  const [renaming, setRenaming] = useState(false);
  const [title, setTitle] = useState(item.title ?? '');

  function save(): void {
    const next = title.trim().slice(0, CONVERSATION_TITLE_MAX);
    setRenaming(false);
    if (!next || next === item.title) {
      setTitle(item.title ?? '');
      return;
    }
    actions.rename.mutate({ id: item.id, title: next });
  }

  return (
    <li
      className={cn(
        'group flex min-w-0 items-center gap-1 rounded-md pr-1 hover:bg-muted',
        active && 'bg-muted',
      )}
      data-conversation={item.id}
    >
      {renaming ? (
        <Input
          autoFocus
          value={title}
          maxLength={CONVERSATION_TITLE_MAX}
          className='m-1 h-8'
          aria-label={t('chat.rename')}
          onChange={(event) => setTitle(event.target.value)}
          onBlur={save}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
              event.preventDefault();
              save();
            } else if (event.key === 'Escape') {
              event.preventDefault();
              event.stopPropagation();
              setTitle(item.title ?? '');
              setRenaming(false);
            }
          }}
        />
      ) : (
        <button
          type='button'
          className='flex min-h-12 min-w-0 flex-1 flex-col items-start gap-0.5 rounded-md px-2.5 py-1.5 text-left focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none'
          aria-current={active ? 'true' : undefined}
          onClick={onOpen}
        >
          <span className='flex w-full min-w-0 items-center gap-1.5'>
            {item.run ? <Pulse /> : null}
            <span
              className={cn(
                'truncate text-sm',
                item.read ? 'font-medium' : 'font-semibold',
              )}
              title={shown}
            >
              {shown}
            </span>
            {!item.read ? (
              <span
                className='ml-auto size-2 shrink-0 rounded-full bg-primary'
                role='img'
                aria-label={t('chat.history.unread')}
              />
            ) : null}
          </span>
          <span className='flex w-full min-w-0 items-center gap-1.5 text-xs text-muted-foreground'>
            <time dateTime={item.lastMessageAt}>
              {format.relative(item.lastMessageAt)}
            </time>
            <span aria-hidden='true'>·</span>
            <span className='truncate'>
              {agentText.name(item.agent) ?? t('chat.agentGone')}
            </span>
            {item.source === 'panel' ? null : (
              <ChatTag tone='grey' className='ml-auto'>
                {sources.find((candidate) => candidate.key === item.source)
                  ?.label ?? item.source}
              </ChatTag>
            )}
          </span>
        </button>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant='ghost'
              size='icon-sm'
              aria-label={t('chat.history.actions', { title: shown })}
            />
          }
        >
          <MoreHorizontalIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-auto min-w-40'>
          <DropdownMenuGroup>
            {onOpenPage ? (
              <DropdownMenuItem onClick={onOpenPage}>
                <Maximize2Icon />
                {t('chat.openPage')}
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem
              onClick={() => {
                setTitle(item.title ?? '');
                setRenaming(true);
              }}
            >
              <PencilIcon />
              {t('chat.rename')}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                actions.archive.mutate({
                  id: item.id,
                  archived: !item.archivedAt,
                })
              }
            >
              {item.archivedAt ? <ArchiveRestoreIcon /> : <ArchiveIcon />}
              {item.archivedAt ? t('chat.unarchive') : t('chat.archive')}
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}

/**
 * The person's conversations in a dialog (search, filters, rename, archive), for a page rather than the panel: a row
 * opens the conversation with `onOpen` and closes the dialog.
 */
export interface ChatHistoryDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onOpen: (conversationId: string) => void;
  readonly activeId?: string | null;
}

export function ChatHistoryDialog({
  open,
  onOpenChange,
  onOpen,
  activeId = null,
}: ChatHistoryDialogProps): ReactElement {
  const { t } = useChatTranslation();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className='flex max-h-[calc(100dvh-2rem)] flex-col gap-3 sm:max-w-lg'
        {...{ [CHAT_PANEL_ATTRIBUTE]: '' }}
        data-testid='chat-history-dialog'
      >
        <DialogHeader>
          <DialogTitle>{t('chat.history.title')}</DialogTitle>
        </DialogHeader>
        <div className='-mx-1 min-h-0 flex-1 overflow-y-auto px-1'>
          {open ? (
            <HistoryList
              activeId={activeId}
              onOpen={(id) => {
                onOpenChange(false);
                onOpen(id);
              }}
            />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
