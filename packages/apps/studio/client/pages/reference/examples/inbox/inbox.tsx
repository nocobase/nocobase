/**
 * Inbox — a shared support inbox: a filterable conversation list beside a
 * message thread with assignment, snooze and a reply composer.
 *
 * Skeleton: `PageHeader` → `ResizablePanelGroup` at a fixed height. Left
 * panel: search `Input`, status `ToggleGroup`, `ScrollArea` of
 * `ConversationRow`s. Right panel: thread header with avatar, badges, tooltip
 * actions and an overflow menu → subject bar → `MessageScroller` thread →
 * composer with `Textarea`, a `ButtonGroup` and Send. An empty panel shows
 * when nothing is selected.
 *
 * Patterns, by the component or block that holds them:
 * - Selectable list row as a button: `ConversationRow`, with `aria-current`.
 * - Resizable master/detail: the `ResizablePanelGroup` block.
 * - Chat message with day separators and attachments: `ThreadMessage`,
 *   `ThreadAttachment`.
 * - Scrolling thread that resets per conversation and offers a jump button:
 *   the `MessageScrollerProvider` keyed by `selected.id`.
 * - Tooltip icon button: `ThreadAction`.
 * - Grouped overflow menu with a disabled item: the assign/snooze/close
 *   `DropdownMenu` and `SNOOZE_OPTIONS`.
 * - Optimistic local reply and mark-read on open: `sendReply`,
 *   `openConversation`, `updateSelected`.
 *
 * Demonstration filler to leave behind: Refresh only toasts, the attach and
 * emoji buttons are stubs, suggest-reply pastes a template, snooze changes
 * status without scheduling and the ⌘↵ hint is not bound.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { format, isSameDay, isToday, isYesterday } from 'date-fns';
import {
  CheckCheckIcon,
  ClockIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  ImageIcon,
  MailCheckIcon,
  MoreHorizontalIcon,
  PaperclipIcon,
  RefreshCwIcon,
  SendIcon,
  SmilePlusIcon,
  SparklesIcon,
  StarIcon,
  TagIcon,
  UserPlusIcon,
  XCircleIcon,
} from 'lucide-react';
import {
  type ReactElement,
  type ReactNode,
  useCallback,
  useMemo,
  useState,
} from 'react';

import {
  Attachment,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from '@/components/ui/attachment';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Bubble, BubbleContent } from '@/components/ui/bubble';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item';
import { Kbd } from '@/components/ui/kbd';
import { Marker, MarkerContent } from '@/components/ui/marker';
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageHeader,
} from '@/components/ui/message';
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from '@/components/ui/message-scroller';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Toaster, toast } from '@/components/ui/toast';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from 'cn';

import { ExamplePage } from '../../shared';
import {
  AGENTS,
  CONVERSATIONS,
  CONVERSATION_STATUSES,
  CURRENT_AGENT,
  REPLY_TEMPLATES,
  agentById,
  lastMessage,
  totalUnread,
  type AttachmentKind,
  type Conversation,
  type ConversationStatus,
  type InboxAttachment,
  type InboxMessage,
} from './inbox.data';

type StatusFilter = 'all' | ConversationStatus;

const STATUS_FILTERS: readonly StatusFilter[] = [
  'all',
  ...CONVERSATION_STATUSES,
];

const STATUS_BADGE: Record<
  ConversationStatus,
  'default' | 'secondary' | 'outline'
> = {
  open: 'default',
  pending: 'secondary',
  closed: 'outline',
};

const ATTACHMENT_ICON: Record<AttachmentKind, typeof FileTextIcon> = {
  pdf: FileTextIcon,
  image: ImageIcon,
  spreadsheet: FileSpreadsheetIcon,
};

/** Snooze presets the thread menu offers; each one is a translation key. */
const SNOOZE_OPTIONS: readonly {
  readonly id: string;
  readonly hours: number;
}[] = [
  { id: 'oneHour', hours: 1 },
  { id: 'tomorrow', hours: 24 },
  { id: 'nextWeek', hours: 168 },
];

function matchesQuery(conversation: Conversation, query: string): boolean {
  if (query.trim().length === 0) return true;
  const needle = query.trim().toLowerCase();
  return (
    conversation.subject.toLowerCase().includes(needle) ||
    conversation.contact.name.toLowerCase().includes(needle) ||
    conversation.contact.company.toLowerCase().includes(needle) ||
    conversation.tags.some((tag) => tag.includes(needle))
  );
}

interface ConversationRowProps {
  readonly conversation: Conversation;
  readonly selected: boolean;
  readonly onSelect: (id: string) => void;
}

function ConversationRow({
  conversation,
  selected,
  onSelect,
}: ConversationRowProps): ReactElement {
  const { t } = useTranslation();
  const latest = lastMessage(conversation);
  const sentAt = new Date(latest.sentAt);

  return (
    <Item
      variant={selected ? 'muted' : 'default'}
      className={cn(
        'w-full cursor-pointer text-left hover:bg-muted/50',
        selected && 'bg-muted',
      )}
      render={<button type='button' />}
      onClick={() => onSelect(conversation.id)}
      aria-current={selected ? 'true' : undefined}
    >
      <ItemMedia>
        <Avatar size='sm'>
          <AvatarFallback>{conversation.contact.initials}</AvatarFallback>
        </Avatar>
      </ItemMedia>
      <ItemContent className='min-w-0'>
        <ItemTitle className='flex min-w-0 items-center gap-2'>
          <span className='truncate'>{conversation.contact.name}</span>
          <span className='ml-auto shrink-0 text-xs font-normal text-muted-foreground tabular-nums'>
            {isToday(sentAt) ? format(sentAt, 'p') : format(sentAt, 'MMM d')}
          </span>
        </ItemTitle>
        <ItemDescription className='line-clamp-1'>
          {conversation.subject}
        </ItemDescription>
        <ItemDescription className='line-clamp-1 text-xs'>
          {latest.body}
        </ItemDescription>
      </ItemContent>
      {conversation.unread > 0 ? (
        <ItemActions>
          <Badge
            className='tabular-nums'
            aria-label={t('examples.inbox.unreadCount', {
              count: conversation.unread,
            })}
          >
            {conversation.unread}
          </Badge>
        </ItemActions>
      ) : null}
    </Item>
  );
}

interface ThreadAttachmentProps {
  readonly attachment: InboxAttachment;
}

function ThreadAttachment({ attachment }: ThreadAttachmentProps): ReactElement {
  const { t } = useTranslation();
  const Icon = ATTACHMENT_ICON[attachment.kind];

  return (
    <Attachment size='sm'>
      <AttachmentMedia>
        <Icon />
      </AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle>{attachment.name}</AttachmentTitle>
        <AttachmentDescription>
          {t(`examples.inbox.attachmentKind.${attachment.kind}`)} ·{' '}
          {attachment.size}
        </AttachmentDescription>
      </AttachmentContent>
    </Attachment>
  );
}

interface ThreadMessageProps {
  readonly message: InboxMessage;
  readonly showDay: boolean;
}

function ThreadMessage({ message, showDay }: ThreadMessageProps): ReactElement {
  const { t } = useTranslation();
  const sentAt = new Date(message.sentAt);
  const fromAgent = message.from === 'agent';

  const dayLabel = isToday(sentAt)
    ? t('reference.today')
    : isYesterday(sentAt)
      ? t('reference.yesterday')
      : format(sentAt, 'PP');

  return (
    <>
      {showDay ? (
        <MessageScrollerItem messageId={`${message.id}-day`}>
          <Marker variant='separator'>
            <MarkerContent>{dayLabel}</MarkerContent>
          </Marker>
        </MessageScrollerItem>
      ) : null}
      <MessageScrollerItem messageId={message.id} scrollAnchor={!fromAgent}>
        <Message align={fromAgent ? 'end' : 'start'}>
          <MessageAvatar>
            <Avatar size='sm'>
              <AvatarFallback>{message.author.initials}</AvatarFallback>
            </Avatar>
          </MessageAvatar>
          <MessageContent>
            {fromAgent ? null : (
              <MessageHeader>{message.author.name}</MessageHeader>
            )}
            <Bubble variant={fromAgent ? 'default' : 'muted'}>
              <BubbleContent>{message.body}</BubbleContent>
            </Bubble>
            {message.attachment ? (
              <ThreadAttachment attachment={message.attachment} />
            ) : null}
            <MessageFooter>
              {fromAgent ? (
                <CheckCheckIcon className='size-3.5' aria-hidden='true' />
              ) : null}
              {format(sentAt, 'p')}
            </MessageFooter>
          </MessageContent>
        </Message>
      </MessageScrollerItem>
    </>
  );
}

interface ThreadActionProps {
  readonly label: string;
  readonly icon: ReactNode;
  readonly onClick: () => void;
}

function ThreadAction({
  label,
  icon,
  onClick,
}: ThreadActionProps): ReactElement {
  return (
    <Tooltip>
      <TooltipTrigger
        render={<Button variant='ghost' size='icon-sm' aria-label={label} />}
        onClick={onClick}
      >
        {icon}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export default function InboxExamplePage(): ReactElement {
  const { t } = useTranslation();
  const [conversations, setConversations] =
    useState<readonly Conversation[]>(CONVERSATIONS);
  const [selectedId, setSelectedId] = useState<string>(
    CONVERSATIONS[0]?.id ?? '',
  );
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [draft, setDraft] = useState('');

  const visible = useMemo(
    () =>
      conversations.filter(
        (conversation) =>
          (statusFilter === 'all' || conversation.status === statusFilter) &&
          matchesQuery(conversation, query),
      ),
    [conversations, statusFilter, query],
  );

  const selected = useMemo(
    () =>
      conversations.find((conversation) => conversation.id === selectedId) ??
      null,
    [conversations, selectedId],
  );

  const assignee = agentById(selected?.assigneeId ?? null);

  const openConversation = useCallback((id: string): void => {
    setSelectedId(id);
    setDraft('');
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === id ? { ...conversation, unread: 0 } : conversation,
      ),
    );
  }, []);

  const updateSelected = useCallback(
    (patch: Partial<Conversation>): void => {
      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === selectedId
            ? { ...conversation, ...patch }
            : conversation,
        ),
      );
    },
    [selectedId],
  );

  const sendReply = (): void => {
    const body = draft.trim();
    if (!selected || body.length === 0) return;
    const reply: InboxMessage = {
      id: `msg_local_${selected.messages.length + 1}_${selected.id}`,
      from: 'agent',
      author: CURRENT_AGENT,
      body,
      sentAt: new Date().toISOString(),
    };
    updateSelected({
      messages: [...selected.messages, reply],
      status: selected.status === 'closed' ? 'open' : selected.status,
    });
    setDraft('');
    toast.add({
      type: 'success',
      title: t('examples.inbox.replySent'),
      description: selected.contact.name,
    });
  };

  const markAllRead = (): void => {
    setConversations((current) =>
      current.map((conversation) => ({ ...conversation, unread: 0 })),
    );
    toast.add({
      type: 'success',
      title: t('examples.inbox.allMarkedRead'),
    });
  };

  const unread = totalUnread(conversations);

  return (
    <ExamplePage
      title={t('examples.inbox.title')}
      description={t('examples.inbox.description')}
      actions={
        <>
          <Button
            variant='outline'
            onClick={() =>
              toast.add({
                type: 'success',
                title: t('examples.inbox.refreshed'),
                description: t('examples.inbox.unreadCount', { count: unread }),
              })
            }
          >
            <RefreshCwIcon data-icon='inline-start' />
            {t('reference.refresh')}
          </Button>
          <Button onClick={markAllRead} disabled={unread === 0}>
            <MailCheckIcon data-icon='inline-start' />
            {t('examples.inbox.markAllRead')}
          </Button>
        </>
      }
    >
      <Toaster />

      <TooltipProvider>
        <ResizablePanelGroup
          orientation='horizontal'
          className='h-[36rem] overflow-hidden rounded-lg border bg-card text-card-foreground'
        >
          <ResizablePanel defaultSize='34%' minSize='26%'>
            <div className='flex h-full min-h-0 flex-col'>
              <div className='space-y-3 border-b p-3'>
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t('examples.inbox.searchPlaceholder')}
                  aria-label={t('reference.search')}
                />
                <ToggleGroup
                  spacing={0}
                  size='sm'
                  variant='outline'
                  value={[statusFilter]}
                  onValueChange={(value: string[]) => {
                    const next = value[0];
                    if (next) setStatusFilter(next as StatusFilter);
                  }}
                  className='w-full'
                >
                  {STATUS_FILTERS.map((filter) => (
                    <ToggleGroupItem
                      key={filter}
                      value={filter}
                      className='flex-1'
                    >
                      {filter === 'all'
                        ? t('reference.all')
                        : t(`examples.inbox.status.${filter}`)}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
                <p className='text-xs text-muted-foreground'>
                  {t('examples.inbox.conversationCount', {
                    count: visible.length,
                  })}
                </p>
              </div>
              <ScrollArea className='min-h-0 flex-1'>
                {visible.length === 0 ? (
                  <p className='p-6 text-center text-sm text-muted-foreground'>
                    {t('examples.inbox.noConversations')}
                  </p>
                ) : (
                  <ItemGroup className='p-2'>
                    {visible.map((conversation) => (
                      <ConversationRow
                        key={conversation.id}
                        conversation={conversation}
                        selected={conversation.id === selectedId}
                        onSelect={openConversation}
                      />
                    ))}
                  </ItemGroup>
                )}
              </ScrollArea>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize='66%' minSize='40%'>
            {selected ? (
              <div className='flex h-full min-h-0 flex-col'>
                <div className='flex items-start gap-3 border-b p-3'>
                  <Avatar>
                    <AvatarFallback>{selected.contact.initials}</AvatarFallback>
                  </Avatar>
                  <div className='min-w-0 flex-1 leading-tight'>
                    <div className='flex min-w-0 items-center gap-2'>
                      <span className='truncate font-medium'>
                        {selected.contact.name}
                      </span>
                      <Badge variant={STATUS_BADGE[selected.status]}>
                        {t(`examples.inbox.status.${selected.status}`)}
                      </Badge>
                      <Badge variant='outline'>
                        {t(`examples.inbox.channel.${selected.channel}`)}
                      </Badge>
                    </div>
                    <p className='truncate text-xs text-muted-foreground'>
                      {selected.contact.company} · {selected.contact.email}
                    </p>
                    <p className='truncate text-xs text-muted-foreground'>
                      {assignee
                        ? t('examples.inbox.assignedTo', {
                            name: assignee.name,
                          })
                        : t('examples.inbox.unassigned')}
                    </p>
                  </div>
                  <div className='flex items-center gap-1'>
                    <ThreadAction
                      label={t('examples.inbox.star')}
                      icon={
                        <StarIcon
                          className={cn(
                            selected.starred && 'fill-current text-primary',
                          )}
                        />
                      }
                      onClick={() =>
                        updateSelected({ starred: !selected.starred })
                      }
                    />
                    <ThreadAction
                      label={t('examples.inbox.addTag')}
                      icon={<TagIcon />}
                      onClick={() =>
                        toast.add({
                          type: 'success',
                          title: t('examples.inbox.addTag'),
                          description: selected.tags.join(', '),
                        })
                      }
                    />
                    <ThreadAction
                      label={t('examples.inbox.suggestReply')}
                      icon={<SparklesIcon />}
                      onClick={() => {
                        const template = REPLY_TEMPLATES[0];
                        if (template) setDraft(template.body);
                      }}
                    />
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant='ghost'
                            size='icon-sm'
                            aria-label={t('reference.actions')}
                          />
                        }
                      >
                        <MoreHorizontalIcon />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align='end' className='w-56'>
                        {/* Base UI reads a label's group from context, so each label opens its own group. */}
                        <DropdownMenuGroup>
                          <DropdownMenuLabel>
                            {t('examples.inbox.assign')}
                          </DropdownMenuLabel>
                          {AGENTS.map((agent) => (
                            <DropdownMenuItem
                              key={agent.id}
                              onClick={() =>
                                updateSelected({ assigneeId: agent.id })
                              }
                            >
                              <UserPlusIcon />
                              {agent.name}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                          <DropdownMenuLabel>
                            {t('examples.inbox.snooze')}
                          </DropdownMenuLabel>
                          {SNOOZE_OPTIONS.map((option) => (
                            <DropdownMenuItem
                              key={option.id}
                              onClick={() => {
                                updateSelected({ status: 'pending' });
                                toast.add({
                                  type: 'success',
                                  title: t('examples.inbox.snoozed'),
                                  description: t(
                                    `examples.inbox.snoozeOption.${option.id}`,
                                  ),
                                });
                              }}
                            >
                              <ClockIcon />
                              {t(`examples.inbox.snoozeOption.${option.id}`)}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          disabled={selected.status === 'closed'}
                          onClick={() => {
                            updateSelected({ status: 'closed' });
                            toast.add({
                              type: 'success',
                              title: t('examples.inbox.closed'),
                              description: selected.subject,
                            });
                          }}
                        >
                          <XCircleIcon />
                          {t('examples.inbox.closeConversation')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className='border-b px-3 py-2'>
                  <p className='truncate text-sm font-medium'>
                    {selected.subject}
                  </p>
                </div>

                <MessageScrollerProvider key={selected.id}>
                  <div className='min-h-0 flex-1'>
                    <MessageScroller className='h-full'>
                      <MessageScrollerViewport aria-label={selected.subject}>
                        <MessageScrollerContent className='gap-4 p-4'>
                          {selected.messages.map((message, index) => {
                            const previous = selected.messages[index - 1];
                            const showDay =
                              !previous ||
                              !isSameDay(
                                new Date(previous.sentAt),
                                new Date(message.sentAt),
                              );
                            return (
                              <ThreadMessage
                                key={message.id}
                                message={message}
                                showDay={showDay}
                              />
                            );
                          })}
                        </MessageScrollerContent>
                      </MessageScrollerViewport>
                      <MessageScrollerButton
                        aria-label={t('examples.inbox.scrollToLatest')}
                      />
                    </MessageScroller>
                  </div>
                </MessageScrollerProvider>

                <Separator />

                <div className='space-y-2 p-3'>
                  <Textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder={t('examples.inbox.composerPlaceholder', {
                      name: selected.contact.name,
                    })}
                    rows={3}
                    className='resize-none'
                    aria-label={t('examples.inbox.composerLabel')}
                  />
                  <div className='flex flex-wrap items-center gap-2'>
                    <ButtonGroup>
                      <Button
                        variant='outline'
                        size='sm'
                        aria-label={t('examples.inbox.attachFile')}
                        onClick={() =>
                          toast.add({
                            type: 'success',
                            title: t('examples.inbox.attachFile'),
                          })
                        }
                      >
                        <PaperclipIcon />
                      </Button>
                      <Button
                        variant='outline'
                        size='sm'
                        aria-label={t('examples.inbox.insertEmoji')}
                        onClick={() => setDraft((text) => `${text} 🙂`)}
                      >
                        <SmilePlusIcon />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant='outline'
                              size='sm'
                              aria-label={t('examples.inbox.useTemplate')}
                            />
                          }
                        >
                          <FileTextIcon />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='start' className='w-64'>
                          <DropdownMenuGroup>
                            <DropdownMenuLabel>
                              {t('examples.inbox.useTemplate')}
                            </DropdownMenuLabel>
                            {REPLY_TEMPLATES.map((template) => (
                              <DropdownMenuItem
                                key={template.id}
                                onClick={() => setDraft(template.body)}
                              >
                                {template.title}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </ButtonGroup>
                    <p className='flex items-center gap-1.5 text-xs text-muted-foreground'>
                      <Kbd>⌘</Kbd>
                      <Kbd>↵</Kbd>
                      <span>{t('examples.inbox.sendHint')}</span>
                    </p>
                    <Button
                      className='ml-auto'
                      size='sm'
                      disabled={draft.trim().length === 0}
                      onClick={sendReply}
                    >
                      <SendIcon data-icon='inline-start' />
                      {t('examples.inbox.send')}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className='flex h-full items-center justify-center p-6 text-sm text-muted-foreground'>
                {t('examples.inbox.noSelection')}
              </div>
            )}
          </ResizablePanel>
        </ResizablePanelGroup>
      </TooltipProvider>
    </ExamplePage>
  );
}
