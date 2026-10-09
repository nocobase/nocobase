/**
 * A record's conversation and history on one line, presented: comment threads (a root and its replies, with reactions,
 * reply, edit, delete, resolve and reopen), the consumer's own entries between them (changes, runs, approvals), older
 * entries on demand, and the composer pinned under it. Purely presentational: the consumer gives the entries, decides
 * who may do what, performs every action through the callbacks (they answer a promise; the item waits for it), and
 * renders Markdown and files. Every word comes from `labels`, English by default; `{name}`-style placeholders are
 * filled in here.
 */
import {
  CheckCircle2Icon,
  ChevronDownIcon,
  ChevronRightIcon,
  Loader2Icon,
  MoreHorizontalIcon,
  PaperclipIcon,
  PencilIcon,
  ReplyIcon,
  RotateCcwIcon,
  SendIcon,
  SmilePlusIcon,
  Trash2Icon,
  XIcon,
} from 'lucide-react';
import {
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';
import { Virtuoso, type ItemProps, type ListProps } from 'react-virtuoso';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '#components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '#components/ui/avatar';
import { Badge } from '#components/ui/badge';
import { Button } from '#components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '#components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '#components/ui/popover';
import { Tabs, TabsList, TabsTrigger } from '#components/ui/tabs';
import { Toggle } from '#components/ui/toggle';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '#components/ui/tooltip';
import { cn } from 'cn';

import {
  RichTextEditor,
  type RichTextHandle,
  type RichTextMention,
} from './rich-text-editor.js';

export interface CommentTag {
  readonly key: string;
  readonly label: string;
  readonly tone?: 'grey' | 'blue' | 'violet' | 'green' | 'amber';
}

export interface CommentReaction {
  readonly emoji: string;
  readonly count: number;
  /** Who reacted, by name. */
  readonly names: readonly string[];
  /** The reader is among them. */
  readonly mine: boolean;
}

export interface CommentItem {
  readonly id: string;
  readonly authorName: string;
  /** `user` is a person (their picture, if any); `system` a cog; anything else a square with `authorIcon`. */
  readonly authorKind: string;
  readonly authorIcon?: ReactNode;
  /** A person's picture; without one only the name shows. */
  readonly authorAvatar?: string | null;
  /** Beside the name: an API key, the author's kind, a note, the comment's kind. */
  readonly tags?: readonly CommentTag[];
  /** Marks the comment with an accent, such as one of a kind the consumer writes. */
  readonly accent?: boolean;
  readonly createdAt: string;
  readonly editedAt?: string | null;
  readonly deleted?: boolean;
  /** Markdown. */
  readonly content: string;
  /** Under the text, such as its files. */
  readonly footer?: ReactNode;
  readonly reactions?: readonly CommentReaction[];
  readonly canEdit?: boolean;
  readonly canDelete?: boolean;
}

export interface CommentThreadItem {
  readonly root: CommentItem;
  readonly replies: readonly CommentItem[];
  readonly resolved?: boolean;
  /** Who resolved it, when known. */
  readonly resolvedBy?: string | null;
}

export type CommentTimelineEntry =
  | {
      readonly kind: 'thread';
      readonly key: string;
      readonly thread: CommentThreadItem;
    }
  | { readonly kind: 'custom'; readonly key: string; readonly node: ReactNode };

export interface CommentThreadLabels {
  readonly title: string;
  readonly empty: string;
  readonly loadOlder: string;
  readonly reply: string;
  /** `{name}` is the author. */
  readonly replyTo: string;
  readonly edit: string;
  readonly editLabel: string;
  readonly delete: string;
  readonly deleteTitle: string;
  readonly deleteDescription: string;
  readonly deleted: string;
  readonly edited: string;
  readonly more: string;
  readonly cancel: string;
  readonly save: string;
  readonly resolve: string;
  readonly resolved: string;
  /** `{name}` resolved it. */
  readonly resolvedBy: string;
  readonly reopen: string;
  /** `{name}` is the root's author. */
  readonly expand: string;
  readonly collapse: string;
  /** `{count}` replies. */
  readonly replies: string;
  readonly reactions: string;
  readonly addReaction: string;
  /** `{emoji}`, `{count}` and `{names}`. */
  readonly toggleReaction: string;
  readonly nameSeparator: string;
}

const defaultLabels: CommentThreadLabels = {
  title: 'Activity',
  empty: 'Nothing has happened yet.',
  loadOlder: 'Load older',
  reply: 'Reply',
  replyTo: 'Reply to {name}',
  edit: 'Edit',
  editLabel: 'Edit comment',
  delete: 'Delete',
  deleteTitle: 'Delete this comment?',
  deleteDescription: 'The comment is replaced by a note that it was deleted.',
  deleted: 'This comment was deleted.',
  edited: 'edited',
  more: 'More actions',
  cancel: 'Cancel',
  save: 'Save',
  resolve: 'Resolve',
  resolved: 'Resolved',
  resolvedBy: 'Resolved by {name}',
  reopen: 'Reopen',
  expand: 'Show the thread by {name}',
  collapse: 'Collapse the thread',
  replies: '{count} replies',
  reactions: 'Reactions',
  addReaction: 'Add a reaction',
  toggleReaction: '{emoji} {count}: {names}',
  nameSeparator: ', ',
};

function fill(
  text: string,
  values: Readonly<Record<string, string | number>>,
): string {
  return text.replace(/\{(\w+)\}/gu, (whole, key: string) =>
    key in values ? String(values[key]) : whole,
  );
}

function parse(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

const UNITS: readonly [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['week', 7 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
  ['second', 1],
];

function relative(iso: string, locale: string | undefined): string {
  const date = parse(iso);
  if (!date) return '—';
  const format = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  for (const [unit, size] of UNITS)
    if (Math.abs(seconds) >= size || unit === 'second')
      return format.format(Math.round(seconds / size), unit);
  return '—';
}

function absolute(iso: string, locale: string | undefined): string {
  const date = parse(iso);
  return date
    ? new Intl.DateTimeFormat(locale, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(date)
    : '—';
}

const TAG_TONE: Readonly<Record<NonNullable<CommentTag['tone']>, string>> = {
  grey: 'bg-muted text-muted-foreground',
  blue: 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
  violet: 'bg-violet-500/10 text-violet-700 dark:text-violet-300',
  green: 'bg-green-500/10 text-green-700 dark:text-green-300',
  amber: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
};

function Tag({
  tone = 'grey',
  icon,
  children,
}: {
  readonly tone?: CommentTag['tone'];
  readonly icon?: ReactNode;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <Badge
      variant='secondary'
      className={cn('gap-1 font-normal [&_svg]:size-3', TAG_TONE[tone])}
    >
      {icon}
      {children}
    </Badge>
  );
}

/**
 * How an actor's shadcn Avatar is drawn beside their name: a person's picture in a circle (a person without one draws
 * nothing, since initials beside the name say nothing more), the system dashed, anything else a square with its icon.
 */
function actorAvatarClass(kind: string): string | undefined {
  if (kind === 'system')
    return 'after:border-dashed after:border-muted-foreground/50';
  return kind === 'user' ? undefined : 'rounded-md after:rounded-md';
}

function actorFallbackClass(kind: string): string {
  return cn(
    '[&_svg]:size-3',
    kind === 'system' && 'bg-transparent text-muted-foreground',
    kind !== 'user' && kind !== 'system' && 'rounded-md',
  );
}

/** A change on the timeline, as a compact row: an icon, who, then what the consumer says about it, and when. */
export function TimelineActivity({
  actorName,
  actorKind,
  actorIcon,
  actorAvatar,
  at,
  locale,
  icon,
  children,
}: {
  readonly actorName: string;
  readonly actorKind: string;
  readonly actorIcon?: ReactNode;
  /** A person's picture; without one only the name shows. */
  readonly actorAvatar?: string | null;
  readonly at: string;
  readonly locale?: string;
  /** Before the avatar; a dot by default. */
  readonly icon?: ReactNode;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <div className='flex flex-wrap items-center gap-x-2 gap-y-1 px-1 text-sm text-muted-foreground'>
      {icon ?? (
        <span
          className='size-1.5 shrink-0 rounded-full bg-muted-foreground/50'
          aria-hidden='true'
        />
      )}
      {actorKind === 'user' && !actorAvatar ? null : (
        <Avatar
          size='sm'
          aria-hidden
          title={actorName}
          className={cn('size-4', actorAvatarClass(actorKind))}
        >
          {actorKind === 'user' && actorAvatar ? (
            <AvatarImage src={actorAvatar} alt='' />
          ) : null}
          <AvatarFallback className={actorFallbackClass(actorKind)}>
            {actorKind === 'user' ? null : actorIcon}
          </AvatarFallback>
        </Avatar>
      )}
      <span className='font-medium text-foreground'>{actorName}</span>
      {children}
      <time
        dateTime={at}
        title={absolute(at, locale)}
        className='ml-auto text-xs'
      >
        {relative(at, locale)}
      </time>
    </div>
  );
}

/** Past this many entries the timeline renders only what is on screen. */
const VIRTUALIZE_AFTER = 100;

/** The nearest ancestor that scrolls vertically; null means the window scrolls. */
function scrollParentOf(element: HTMLElement | null): HTMLElement | null {
  let current = element?.parentElement ?? null;
  while (current && current !== document.body) {
    const { overflowY } = window.getComputedStyle(current);
    if (overflowY === 'auto' || overflowY === 'scroll') return current;
    current = current.parentElement;
  }
  return null;
}

function VirtualItem({
  children,
  style,
  item: _item,
  ...data
}: ItemProps<unknown>): ReactElement {
  return (
    <li
      style={style}
      data-index={data['data-index']}
      data-known-size={data['data-known-size']}
      className='pb-3'
    >
      {children}
    </li>
  );
}

function VirtualList({ ref, style, children }: ListProps): ReactElement {
  return (
    <ul ref={ref as Ref<HTMLUListElement>} style={style}>
      {children}
    </ul>
  );
}

/**
 * The entries as a list: short ones plain (find-in-page and tests keep working), long ones a `react-virtuoso` window
 * measured against the nearest scrolling ancestor, so a long history renders only what is on screen.
 */
function TimelineEntries({
  entries,
  label,
  renderEntry,
}: {
  readonly entries: readonly CommentTimelineEntry[];
  readonly label: string;
  readonly renderEntry: (entry: CommentTimelineEntry) => ReactNode;
}): ReactElement {
  const [anchor, setAnchor] = useState<HTMLDivElement | null>(null);
  if (entries.length <= VIRTUALIZE_AFTER)
    return (
      <ul className='space-y-3' aria-label={label}>
        {entries.map((entry) => (
          <li key={entry.key}>{renderEntry(entry)}</li>
        ))}
      </ul>
    );
  const scrollParent = scrollParentOf(anchor);
  return (
    <div ref={setAnchor} role='group' aria-label={label} data-virtualized=''>
      {anchor ? (
        <Virtuoso
          data={entries}
          {...(scrollParent
            ? { customScrollParent: scrollParent }
            : { useWindowScroll: true })}
          increaseViewportBy={400}
          computeItemKey={(_, entry) => entry.key}
          itemContent={(_, entry) => renderEntry(entry)}
          components={{ List: VirtualList, Item: VirtualItem }}
        />
      ) : null}
    </div>
  );
}

export interface CommentTimelineProps {
  readonly entries: readonly CommentTimelineEntry[];
  /** Draws a comment's Markdown; plain text by default. */
  readonly renderMarkdown?: (content: string) => ReactNode;
  /** The emoji a reaction may be. */
  readonly emojis?: readonly string[];
  /** Without it, comments offer no Reply. */
  readonly onReply?: (comment: CommentItem) => void;
  /** Saves new text; the editor stays open until it resolves. */
  readonly onEdit?: (comment: CommentItem, content: string) => Promise<void>;
  readonly onDelete?: (comment: CommentItem) => Promise<void>;
  /** Without it, threads offer no Resolve or Reopen. */
  readonly onResolve?: (
    thread: CommentThreadItem,
    resolved: boolean,
  ) => Promise<void>;
  /** Without it, reactions are read-only. */
  readonly onReact?: (comment: CommentItem, emoji: string) => void;
  /** Mention candidates while editing. */
  readonly onMentionSearch?: (
    query: string,
  ) => Promise<readonly RichTextMention[]>;
  /** The comment being answered, highlighted. */
  readonly replyingToId?: string | null;
  /** The comment a link points at, highlighted and its thread expanded. */
  readonly targetId?: string | null;
  readonly hasOlder?: boolean;
  readonly loadingOlder?: boolean;
  readonly onLoadOlder?: () => void;
  readonly locale?: string;
  readonly labels?: CommentThreadLabels;
  readonly className?: string;
}

const DEFAULT_EMOJIS = ['👍', '👎', '😄', '🎉', '😕', '❤️', '🚀', '👀'];

/** The timeline: its heading with "Load older", then every entry oldest first. */
export function CommentTimeline({
  entries,
  hasOlder = false,
  loadingOlder = false,
  onLoadOlder,
  labels = defaultLabels,
  className,
  ...context
}: CommentTimelineProps): ReactElement {
  return (
    <section
      className={cn('space-y-4', className)}
      aria-label={labels.title}
      data-slot='comment-timeline'
    >
      <div className='flex items-center justify-between gap-2'>
        <h2 className='font-heading text-sm font-semibold'>{labels.title}</h2>
        {hasOlder && onLoadOlder ? (
          <Button
            variant='ghost'
            size='sm'
            disabled={loadingOlder}
            onClick={onLoadOlder}
          >
            {loadingOlder ? (
              <Loader2Icon data-icon='inline-start' className='animate-spin' />
            ) : null}
            {labels.loadOlder}
          </Button>
        ) : null}
      </div>
      {entries.length === 0 ? (
        <p className='text-sm text-muted-foreground'>{labels.empty}</p>
      ) : (
        <TimelineEntries
          entries={entries}
          label={labels.title}
          renderEntry={(entry) =>
            entry.kind === 'thread' ? (
              <ThreadCard thread={entry.thread} labels={labels} {...context} />
            ) : (
              entry.node
            )
          }
        />
      )}
    </section>
  );
}

type Context = Omit<
  CommentTimelineProps,
  | 'entries'
  | 'hasOlder'
  | 'loadingOlder'
  | 'onLoadOlder'
  | 'labels'
  | 'className'
> & { readonly labels: CommentThreadLabels };

function snippet(content: string): string {
  return content
    .replace(/\[@([^\]]*)\]\([^)]*\)/gu, '@$1')
    .replace(/[#*_`>[\]]/gu, '')
    .replace(/\s+/gu, ' ')
    .trim()
    .slice(0, 140);
}

/**
 * A comment thread: the root and its replies, oldest first. A resolved thread collapses to one line and can be
 * expanded or reopened; an open one offers Resolve on its root.
 */
export function ThreadCard({
  thread,
  ...context
}: Context & { readonly thread: CommentThreadItem }): ReactElement {
  const { labels } = context;
  const resolved = Boolean(thread.resolved);
  const holdsTarget =
    Boolean(context.targetId) &&
    (thread.root.id === context.targetId ||
      thread.replies.some((reply) => reply.id === context.targetId));
  const [expanded, setExpanded] = useState(holdsTarget);
  const [resolving, setResolving] = useState(false);
  const resolve = (next: boolean): void => {
    if (!context.onResolve) return;
    setResolving(true);
    void context
      .onResolve(thread, next)
      .catch(() => undefined)
      .finally(() => setResolving(false));
  };
  const name = thread.root.authorName;

  if (resolved && !expanded)
    return (
      <article
        className='flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-sm text-muted-foreground'
        data-testid='thread-resolved'
      >
        <Button
          variant='ghost'
          size='icon-xs'
          aria-expanded={false}
          aria-label={fill(labels.expand, { name })}
          onClick={() => setExpanded(true)}
        >
          <ChevronRightIcon />
        </Button>
        <Tag tone='green' icon={<CheckCircle2Icon aria-hidden='true' />}>
          {labels.resolved}
        </Tag>
        <span className='shrink-0 font-medium text-foreground'>{name}</span>
        <span className='min-w-0 flex-1 truncate'>
          {thread.root.deleted ? labels.deleted : snippet(thread.root.content)}
        </span>
        {thread.replies.length > 0 ? (
          <span className='shrink-0 text-xs tabular-nums'>
            {fill(labels.replies, { count: thread.replies.length })}
          </span>
        ) : null}
      </article>
    );

  return (
    <article className='rounded-lg border bg-card text-card-foreground'>
      {resolved ? (
        <div className='flex items-center gap-2 border-b bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground'>
          <Button
            variant='ghost'
            size='icon-xs'
            aria-expanded
            aria-label={labels.collapse}
            onClick={() => setExpanded(false)}
          >
            <ChevronDownIcon />
          </Button>
          <CheckCircle2Icon className='size-3.5' aria-hidden='true' />
          <span>
            {thread.resolvedBy
              ? fill(labels.resolvedBy, { name: thread.resolvedBy })
              : labels.resolved}
          </span>
          {context.onResolve ? (
            <Button
              variant='ghost'
              size='xs'
              className='ml-auto'
              disabled={resolving}
              onClick={() => resolve(false)}
            >
              <RotateCcwIcon data-icon='inline-start' />
              {labels.reopen}
            </Button>
          ) : null}
        </div>
      ) : null}
      <CommentBlock
        comment={thread.root}
        {...context}
        {...(!resolved && context.onResolve
          ? { onResolveThread: () => resolve(true) }
          : {})}
        resolving={resolving}
      />
      {thread.replies.length > 0 ? (
        <div className='border-t bg-muted/30'>
          {thread.replies.map((reply) => (
            <CommentBlock key={reply.id} comment={reply} {...context} nested />
          ))}
        </div>
      ) : null}
    </article>
  );
}

function CommentBlock({
  comment,
  onResolveThread,
  resolving = false,
  nested = false,
  ...context
}: Context & {
  readonly comment: CommentItem;
  readonly onResolveThread?: () => void;
  readonly resolving?: boolean;
  readonly nested?: boolean;
}): ReactElement {
  const { labels, locale } = context;
  const [editing, setEditing] = useState(false);
  const markdown =
    context.renderMarkdown ??
    ((content: string) => (
      <p className='text-sm whitespace-pre-wrap wrap-anywhere'>{content}</p>
    ));
  const mayEdit = Boolean(comment.canEdit && context.onEdit);
  const mayDelete = Boolean(comment.canDelete && context.onDelete);
  return (
    <div
      data-comment-id={comment.id}
      className={cn(
        'group space-y-1.5 p-3',
        nested && 'pl-9',
        context.replyingToId === comment.id && 'bg-accent/50',
        context.targetId === comment.id && 'ring-2 ring-primary/40 ring-inset',
        comment.accent && !comment.deleted && 'border-l-2 border-primary/60',
      )}
    >
      <header className='flex flex-wrap items-center gap-x-2 gap-y-1 text-sm'>
        {comment.authorKind === 'user' && !comment.authorAvatar ? null : (
          <Avatar
            size='sm'
            aria-hidden
            title={comment.authorName}
            className={actorAvatarClass(comment.authorKind)}
          >
            {comment.authorKind === 'user' && comment.authorAvatar ? (
              <AvatarImage src={comment.authorAvatar} alt='' />
            ) : null}
            <AvatarFallback className={actorFallbackClass(comment.authorKind)}>
              {comment.authorKind === 'user' ? null : comment.authorIcon}
            </AvatarFallback>
          </Avatar>
        )}
        <span className='truncate font-medium'>{comment.authorName}</span>
        {(comment.tags ?? []).map((tag) => (
          <Tag key={tag.key} tone={tag.tone}>
            {tag.label}
          </Tag>
        ))}
        <time
          dateTime={comment.createdAt}
          title={absolute(comment.createdAt, locale)}
          className='text-xs text-muted-foreground'
        >
          {relative(comment.createdAt, locale)}
        </time>
        {comment.editedAt && !comment.deleted ? (
          <span
            className='text-xs text-muted-foreground'
            title={absolute(comment.editedAt, locale)}
          >
            {labels.edited}
          </span>
        ) : null}
        {comment.deleted ? null : (
          <div className='ml-auto flex items-center gap-1'>
            {onResolveThread ? (
              <Button
                variant='ghost'
                size='xs'
                className='text-muted-foreground'
                disabled={resolving}
                onClick={onResolveThread}
              >
                <CheckCircle2Icon data-icon='inline-start' />
                {labels.resolve}
              </Button>
            ) : null}
            {context.onReply ? (
              <Button
                variant='ghost'
                size='xs'
                className='text-muted-foreground'
                aria-label={fill(labels.replyTo, { name: comment.authorName })}
                onClick={() => context.onReply?.(comment)}
              >
                <ReplyIcon data-icon='inline-start' />
                {labels.reply}
              </Button>
            ) : null}
            {mayEdit || mayDelete ? (
              <CommentMenu
                labels={labels}
                {...(mayEdit ? { onEdit: () => setEditing(true) } : {})}
                {...(mayDelete && context.onDelete
                  ? { onDelete: () => context.onDelete?.(comment) }
                  : {})}
              />
            ) : null}
          </div>
        )}
      </header>
      {comment.deleted ? (
        <p className='pl-8 text-sm text-muted-foreground italic'>
          {labels.deleted}
        </p>
      ) : editing && context.onEdit ? (
        <CommentEditor
          comment={comment}
          onSave={context.onEdit}
          onDone={() => setEditing(false)}
          {...(context.onMentionSearch
            ? { onMentionSearch: context.onMentionSearch }
            : {})}
          labels={labels}
        />
      ) : (
        <>
          <div className='pl-8'>{markdown(comment.content)}</div>
          {comment.footer ? <div className='pl-8'>{comment.footer}</div> : null}
          <div className='pl-8'>
            <Reactions
              comment={comment}
              emojis={context.emojis ?? DEFAULT_EMOJIS}
              labels={labels}
              {...(context.onReact ? { onReact: context.onReact } : {})}
            />
          </div>
        </>
      )}
    </div>
  );
}

function CommentMenu({
  onEdit,
  onDelete,
  labels,
}: {
  readonly onEdit?: () => void;
  readonly onDelete?: () => Promise<void> | undefined;
  readonly labels: CommentThreadLabels;
}): ReactElement {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant='ghost'
              size='icon-xs'
              className='text-muted-foreground'
              aria-label={labels.more}
            />
          }
        >
          <MoreHorizontalIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-auto min-w-40'>
          <DropdownMenuGroup>
            {onEdit ? (
              <DropdownMenuItem onClick={onEdit}>
                <PencilIcon />
                {labels.edit}
              </DropdownMenuItem>
            ) : null}
            {onDelete ? (
              <DropdownMenuItem
                variant='destructive'
                onClick={() => setConfirming(true)}
              >
                <Trash2Icon />
                {labels.delete}
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{labels.deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {labels.deleteDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>
              {labels.cancel}
            </AlertDialogCancel>
            <AlertDialogAction
              variant='destructive'
              disabled={deleting}
              onClick={() => {
                setDeleting(true);
                void Promise.resolve(onDelete?.())
                  .then(() => setConfirming(false))
                  .catch(() => undefined)
                  .finally(() => setDeleting(false));
              }}
            >
              {labels.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function CommentEditor({
  comment,
  onSave,
  onDone,
  onMentionSearch,
  labels,
}: {
  readonly comment: CommentItem;
  readonly onSave: (comment: CommentItem, content: string) => Promise<void>;
  readonly onDone: () => void;
  readonly onMentionSearch?: (
    query: string,
  ) => Promise<readonly RichTextMention[]>;
  readonly labels: CommentThreadLabels;
}): ReactElement {
  const [content, setContent] = useState(comment.content);
  const [saving, setSaving] = useState(false);
  const unchanged = content.trim() === comment.content.trim();
  const submit = (): void => {
    if (unchanged) {
      onDone();
      return;
    }
    if (!content.trim()) return;
    setSaving(true);
    void onSave(comment, content.trim())
      .then(onDone)
      .catch(() => undefined)
      .finally(() => setSaving(false));
  };
  return (
    <div className='space-y-2 pl-8'>
      <RichTextEditor
        value={content}
        onChange={setContent}
        {...(onMentionSearch ? { onMentionSearch } : {})}
        onSubmit={submit}
        onEscape={onDone}
        submitOnEnter
        autoFocus
        disabled={saving}
        toolbar={false}
        aria-label={labels.editLabel}
        contentClassName='max-h-64 overflow-y-auto'
      />
      <div className='flex justify-end gap-2'>
        <Button variant='ghost' size='sm' disabled={saving} onClick={onDone}>
          {labels.cancel}
        </Button>
        <Button size='sm' disabled={saving || !content.trim()} onClick={submit}>
          {saving ? (
            <Loader2Icon data-icon='inline-start' className='animate-spin' />
          ) : null}
          {labels.save}
        </Button>
      </div>
    </div>
  );
}

function Reactions({
  comment,
  emojis,
  onReact,
  labels,
}: {
  readonly comment: CommentItem;
  readonly emojis: readonly string[];
  readonly onReact?: (comment: CommentItem, emoji: string) => void;
  readonly labels: CommentThreadLabels;
}): ReactElement | null {
  const [picking, setPicking] = useState(false);
  const rank = (emoji: string): number => {
    const index = emojis.indexOf(emoji);
    return index < 0 ? emojis.length : index;
  };
  const shown = (comment.reactions ?? [])
    .filter((reaction) => reaction.count > 0)
    .sort((a, b) => rank(a.emoji) - rank(b.emoji));
  if (shown.length === 0 && !onReact) return null;
  return (
    <div
      className='flex flex-wrap items-center gap-1'
      aria-label={labels.reactions}
      role='group'
    >
      {shown.map((reaction) => {
        const names = reaction.names.join(labels.nameSeparator);
        return (
          <Tooltip key={reaction.emoji}>
            <TooltipTrigger
              render={
                <Toggle
                  variant='outline'
                  size='sm'
                  pressed={reaction.mine}
                  aria-label={fill(labels.toggleReaction, {
                    emoji: reaction.emoji,
                    count: reaction.count,
                    names,
                  })}
                  disabled={!onReact}
                  onPressedChange={() => onReact?.(comment, reaction.emoji)}
                  className='h-6 min-w-0 rounded-full px-2 text-xs font-normal tabular-nums aria-pressed:border-primary aria-pressed:bg-primary/10'
                />
              }
            >
              <span aria-hidden='true'>{reaction.emoji}</span>
              <span>{reaction.count}</span>
            </TooltipTrigger>
            <TooltipContent>{names}</TooltipContent>
          </Tooltip>
        );
      })}
      {onReact ? (
        <Popover open={picking} onOpenChange={setPicking}>
          <PopoverTrigger
            render={
              <button
                type='button'
                aria-label={labels.addReaction}
                className='inline-flex size-6 items-center justify-center rounded-full text-muted-foreground opacity-60 transition-opacity group-hover:opacity-100 hover:bg-muted hover:text-foreground focus-visible:opacity-100'
              />
            }
          >
            <SmilePlusIcon className='size-3.5' aria-hidden='true' />
          </PopoverTrigger>
          <PopoverContent className='w-auto p-1' align='start'>
            <div className='flex gap-0.5' role='group'>
              {emojis.map((emoji) => (
                <button
                  key={emoji}
                  type='button'
                  aria-pressed={shown.some(
                    (reaction) => reaction.emoji === emoji && reaction.mine,
                  )}
                  aria-label={emoji}
                  className='inline-flex size-8 items-center justify-center rounded-md text-base hover:bg-muted aria-pressed:bg-muted'
                  onClick={() => {
                    setPicking(false);
                    onReact(comment, emoji);
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      ) : null}
    </div>
  );
}

export interface CommentComposerLabels {
  readonly label: string;
  readonly placeholder: string;
  readonly send: string;
  readonly sendReply: string;
  /** `{name}` is the comment being answered. */
  readonly replyingTo: string;
  readonly cancelReply: string;
  readonly attach: string;
  readonly hint: string;
}

const defaultComposerLabels: CommentComposerLabels = {
  label: 'Comment',
  placeholder: 'Leave a comment… Type @ to mention someone',
  send: 'Comment',
  sendReply: 'Reply',
  replyingTo: 'Replying to {name}',
  cancelReply: 'Cancel reply',
  attach: 'Attach files',
  hint: 'Enter to send · Shift + Enter for a new line',
};

export interface CommentComposerMode {
  readonly value: string;
  readonly label: string;
  /** The placeholder and send button while this mode is chosen. */
  readonly placeholder?: string;
  readonly send?: string;
}

export interface CommentComposerProps {
  /**
   * Posts the comment in `mode` and answers the posted comment's id: the box clears and the comment, once the timeline
   * draws it, is brought into view just above the composer and kept there while the timeline settles. Answering
   * `false` keeps the draft, as does a failure.
   */
  readonly onSubmit: (
    content: string,
    mode: string | null,
  ) => Promise<string | false>;
  /** The comment being answered, by its author's name. */
  readonly replyingTo?: string | null;
  readonly onCancelReply?: () => void;
  /** Tabs above the box, such as a comment and a note. */
  readonly modes?: readonly CommentComposerMode[];
  readonly onMentionSearch?: (
    query: string,
  ) => Promise<readonly RichTextMention[]>;
  /** Files picked, pasted or dropped; without it, no paperclip. */
  readonly onAttach?: (files: readonly File[]) => void;
  /** Under the box, such as the files waiting to go with the comment. */
  readonly attachments?: ReactNode;
  /** Something must finish (an upload) before the comment can go. */
  readonly busy?: boolean;
  readonly editorRef?: Ref<RichTextHandle>;
  readonly labels?: CommentComposerLabels;
  readonly className?: string;
}

/** Space kept between a revealed comment and the edges it is fitted between. */
const GAP = 12;
/** Frames a sent comment is kept fitted for: until it renders and the refetch that follows a send has settled. */
const REVEAL_FRAMES = 60;

/** The composer's pinned frame: its nearest sticky ancestor, or itself. */
function pinnedFrame(element: HTMLElement): HTMLElement {
  for (
    let current: HTMLElement | null = element;
    current;
    current = current.parentElement
  )
    if (window.getComputedStyle(current).position === 'sticky') return current;
  return element;
}

/**
 * Scrolls the least that fits `target` between the top of the scroll container and the top of the composer; a target
 * taller than that space is aligned by its top.
 */
function fitAboveComposer(
  target: HTMLElement,
  composer: HTMLElement,
  container: HTMLElement | null,
): void {
  const top = container ? container.getBoundingClientRect().top : 0;
  const bottom = composer.getBoundingClientRect().top;
  const rect = target.getBoundingClientRect();
  let delta = 0;
  if (rect.bottom > bottom - GAP)
    delta = Math.min(rect.bottom - bottom + GAP, rect.top - top - GAP);
  else if (rect.top < top + GAP) delta = rect.top - top - GAP;
  if (delta === 0) return;
  if (container) container.scrollTop += delta;
  else window.scrollBy(0, delta);
}

/**
 * Brings a sent comment into view above the composer over the next frames, and keeps it there while rows land above it
 * (the refetch a send starts). A new thread ends the timeline, so until its row renders (a long, virtualized timeline)
 * the container scrolls to its end.
 */
function revealSentComment(
  root: HTMLElement | null,
  id: string,
  reply: boolean,
): void {
  if (!root) return;
  const composer = pinnedFrame(root);
  const container = scrollParentOf(composer);
  let frame = 0;
  const step = (): void => {
    frame += 1;
    const target = [
      ...(container ?? document).querySelectorAll<HTMLElement>(
        '[data-comment-id]',
      ),
    ].find((element) => element.dataset.commentId === id);
    if (target) fitAboveComposer(target, composer, container);
    else if (!reply) {
      if (container) container.scrollTop = container.scrollHeight;
      else window.scrollTo(0, document.documentElement.scrollHeight);
    }
    if (frame < REVEAL_FRAMES) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/** The comment box: Markdown out, `@` mentions, Enter to send, an optional mode and files. */
export function CommentComposer({
  onSubmit,
  replyingTo,
  onCancelReply,
  modes,
  onMentionSearch,
  onAttach,
  attachments,
  busy = false,
  editorRef,
  labels = defaultComposerLabels,
  className,
}: CommentComposerProps): ReactElement {
  const [content, setContent] = useState('');
  const [mode, setMode] = useState<string | null>(modes?.[0]?.value ?? null);
  const [pending, setPending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = modes?.find((item) => item.value === mode);

  const submit = (): void => {
    if (!content.trim() || pending || busy) return;
    setPending(true);
    const reply = Boolean(replyingTo);
    void onSubmit(content.trim(), mode)
      .then((sent) => {
        if (sent === false) return;
        setContent('');
        revealSentComment(rootRef.current, sent, reply);
      })
      .catch(() => undefined)
      .finally(() => setPending(false));
  };

  const files = (list: FileList | null | undefined): File[] => [
    ...(list ?? []),
  ];

  return (
    <div
      ref={rootRef}
      className={cn('space-y-2', className)}
      data-slot='comment-composer'
    >
      {(modes && modes.length > 1) || replyingTo ? (
        <div className='flex items-center gap-2'>
          {modes && modes.length > 1 ? (
            <Tabs
              value={mode}
              onValueChange={(value: string) => setMode(value)}
            >
              <TabsList variant='line' className='h-7'>
                {modes.map((item) => (
                  <TabsTrigger key={item.value} value={item.value}>
                    {item.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          ) : null}
          {replyingTo ? (
            <div className='flex min-w-0 items-center gap-1 text-xs text-muted-foreground'>
              <span className='truncate'>
                {fill(labels.replyingTo, { name: replyingTo })}
              </span>
              {onCancelReply ? (
                <Button
                  variant='ghost'
                  size='icon-xs'
                  aria-label={labels.cancelReply}
                  onClick={onCancelReply}
                >
                  <XIcon />
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
      <div
        {...(onAttach
          ? {
              onPasteCapture: (event) => {
                const pasted = files(event.clipboardData.files);
                if (pasted.length === 0) return;
                event.preventDefault();
                event.stopPropagation();
                onAttach(pasted);
              },
              onDragOverCapture: (event) => {
                if (event.dataTransfer.types.includes('Files'))
                  event.preventDefault();
              },
              onDropCapture: (event) => {
                const dropped = files(event.dataTransfer.files);
                if (dropped.length === 0) return;
                event.preventDefault();
                event.stopPropagation();
                onAttach(dropped);
              },
            }
          : {})}
      >
        <RichTextEditor
          {...(editorRef ? { ref: editorRef } : {})}
          value={content}
          onChange={setContent}
          {...(onMentionSearch ? { onMentionSearch } : {})}
          onSubmit={submit}
          submitOnEnter
          disabled={pending}
          toolbar={false}
          placeholder={current?.placeholder ?? labels.placeholder}
          aria-label={labels.label}
          contentClassName='max-h-64 overflow-y-auto'
        />
      </div>
      {attachments}
      <div className='flex items-center gap-2'>
        {onAttach ? (
          <>
            <Button
              variant='ghost'
              size='icon-sm'
              className='text-muted-foreground'
              aria-label={labels.attach}
              disabled={pending}
              onClick={() => fileInputRef.current?.click()}
            >
              <PaperclipIcon />
            </Button>
            <input
              ref={fileInputRef}
              type='file'
              multiple
              hidden
              data-testid='comment-file-input'
              onChange={(event) => {
                onAttach(files(event.target.files));
                event.target.value = '';
              }}
            />
          </>
        ) : null}
        <span className='mr-auto hidden text-xs text-muted-foreground sm:inline'>
          {labels.hint}
        </span>
        <Button
          size='sm'
          className='ml-auto'
          disabled={pending || busy || content.trim() === ''}
          onClick={submit}
        >
          {pending ? (
            <Loader2Icon data-icon='inline-start' className='animate-spin' />
          ) : (
            <SendIcon data-icon='inline-start' />
          )}
          {replyingTo ? labels.sendReply : (current?.send ?? labels.send)}
        </Button>
      </div>
    </div>
  );
}
