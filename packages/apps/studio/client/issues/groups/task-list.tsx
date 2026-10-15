/**
 * The grouped task list of the split view and the phone (`split-view.tsx`, `phone-list.tsx`): each group a card whose
 * heading folds it and stays at the top while the list scrolls, "Waiting for you" the one warm card, then a row per task
 * with its status shape, title, unread count and time, and a second line saying where it stands. On a desktop the
 * follow star replaces the time under the pointer; on a phone a row slides left to reveal Follow.
 */
import { useViewer } from '@nocobase/app-plugin-projects/client/kit';
import { useTranslation } from '@nocobase/i18n/client';
import { BellIcon, ChevronDownIcon, StarIcon } from 'lucide-react';
import {
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactElement,
  type ReactNode,
} from 'react';

import { StatusIcon, StatusShapeIcon } from '@/components/status-icon';
import { Button } from '@/components/ui/button';
import { cn } from 'cn';

import {
  STATUS_GROUPS,
  type TaskGroupId,
  type TaskGroupItem,
  type WaitReason,
} from '../../../shared/task-groups.js';
import { FOLLOW_UPS_MAX } from '../../../shared/follow-ups.js';
import { statusShape } from '@/components/status-shapes';
import { shortTime } from './format.js';
import type { ListGroup } from './model.js';

/** "Needs your acceptance" and its kind, amber; a failed run red. */
export function WaitChip({
  reason,
  quiet = false,
  className,
}: {
  readonly reason: WaitReason;
  /** Coloured words without a tint behind them, for a list where the title should lead. */
  readonly quiet?: boolean;
  readonly className?: string;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <span
      data-wait={reason}
      className={cn(
        'inline-flex shrink-0 items-center text-xs whitespace-nowrap',
        quiet ? '' : 'h-5 rounded px-1.5 font-medium',
        reason === 'failed'
          ? cn(
              'text-red-700 dark:text-red-300',
              !quiet && 'bg-red-500/10 dark:bg-red-400/15',
            )
          : cn(
              'text-amber-700 dark:text-amber-300',
              !quiet && 'bg-amber-500/15 dark:bg-amber-400/15',
            ),
        className,
      )}
    >
      {t(`taskGroups.waits.${reason}`)}
    </span>
  );
}

/** A group's icon: a star, a bell, else its status's shape. */
export function GroupIcon({
  group,
  className,
}: {
  readonly group: TaskGroupId;
  readonly className?: string;
}): ReactElement {
  if (group === 'follow')
    return (
      <StarIcon
        aria-hidden
        className={cn(
          'size-4 fill-amber-400 text-amber-500 dark:fill-amber-400/80',
          className,
        )}
      />
    );
  if (group === 'wait')
    return (
      <BellIcon
        aria-hidden
        className={cn('size-4 text-amber-600 dark:text-amber-400', className)}
      />
    );
  return (
    <StatusShapeIcon
      shape={statusShape(STATUS_GROUPS[group])}
      {...(className ? { className } : {})}
    />
  );
}

/** The second line's account of where the task stands. */
export function TaskLine({
  item,
  workingAgent,
}: {
  readonly item: TaskGroupItem;
  /** The agent working on it now, when one is. */
  readonly workingAgent?: string | null;
}): ReactElement {
  const { t } = useTranslation();
  const viewer = useViewer();
  const { issue } = item;
  const bits: ReactNode[] = [
    <span key='key' className='font-mono'>
      {issue.identifier}
    </span>,
  ];
  if (item.parent)
    bits.push(
      <span key='parent'>
        {t('taskGroups.row.inParent', { identifier: item.parent.identifier })}
      </span>,
    );
  else if (issue.owner && issue.ownerUserId !== viewer?.userId)
    bits.push(
      <span key='owner' className='truncate'>
        {t('taskGroups.row.ownedBy', { name: issue.owner.name })}
      </span>,
    );
  const wait = item.waits[0];
  const finished = ['done', 'cancelled'].includes(issue.statusKey);
  if (wait) bits.push(<WaitChip key='wait' reason={wait} quiet />);
  else if (workingAgent)
    bits.push(
      <span key='working' className='inline-flex min-w-0 items-center gap-1.5'>
        <span
          aria-hidden
          className='size-1.5 shrink-0 animate-pulse rounded-full bg-blue-600 dark:bg-blue-400'
        />
        <span className='truncate'>
          {t('taskGroups.row.working', { name: workingAgent })}
        </span>
      </span>,
    );
  else if (issue.statusKey === 'blocked' && issue.blockedCount > 0)
    bits.push(
      <span key='blocked'>
        {t('taskGroups.row.waitingOn', { count: issue.blockedCount })}
      </span>,
    );
  else if (item.progress.total > 0 && !finished)
    bits.push(
      <span key='subs'>{t('taskGroups.row.subtasks', item.progress)}</span>,
    );
  else if (!finished)
    bits.push(
      <span key='executor' className='truncate'>
        {issue.executor?.type === 'user' && issue.executor.id === viewer?.userId
          ? t('taskGroups.row.youExecute')
          : (issue.executorName ?? t('taskGroups.row.unassigned'))}
      </span>,
    );
  return (
    <span className='flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground'>
      {bits.map((bit, index) => (
        <span
          key={(bit as { key?: string | null }).key ?? `bit-${String(index)}`}
          className='flex min-w-0 shrink-0 items-center gap-1.5 last:shrink'
        >
          {index > 0 ? (
            <span
              aria-hidden
              className='size-0.5 shrink-0 rounded-full bg-current opacity-60'
            />
          ) : null}
          {bit}
        </span>
      ))}
    </span>
  );
}

export function TaskRow({
  item,
  selected,
  onSelect,
  onToggleFollow,
  workingAgent,
  phone = false,
  locale,
}: {
  readonly item: TaskGroupItem;
  readonly selected: boolean;
  readonly onSelect: (id: string) => void;
  readonly onToggleFollow: (item: TaskGroupItem) => void;
  readonly workingAgent?: string | null;
  /** The phone's row: taller, two lines of title, slides left to follow. */
  readonly phone?: boolean;
  readonly locale: string;
}): ReactElement {
  const { t } = useTranslation();
  const { issue } = item;
  const finished = ['done', 'cancelled'].includes(issue.statusKey);
  const [offset, setOffset] = useState(0);
  const startRef = useRef<{ x: number; y: number; base: number } | null>(null);
  const REVEAL = 96;

  const onPointerDown = (event: PointerEvent) => {
    if (!phone || event.pointerType === 'mouse') return;
    startRef.current = { x: event.clientX, y: event.clientY, base: offset };
  };
  const onPointerMove = (event: PointerEvent) => {
    const from = startRef.current;
    if (!from) return;
    const dx = event.clientX - from.x;
    if (Math.abs(event.clientY - from.y) > Math.abs(dx)) return;
    // Only leftwards: a right swipe does nothing, so nothing happens by accident.
    setOffset(Math.max(-REVEAL, Math.min(0, from.base + dx)));
  };
  const onPointerUp = () => {
    if (!startRef.current) return;
    startRef.current = null;
    setOffset((current) => (current < -REVEAL / 2 ? -REVEAL : 0));
  };

  const row = (
    <div
      role='option'
      id={`task-option-${issue.id}`}
      aria-selected={selected}
      tabIndex={selected ? 0 : -1}
      data-task-id={issue.id}
      data-task-key={issue.identifier}
      onClick={() => {
        if (offset !== 0) {
          setOffset(0);
          return;
        }
        onSelect(issue.id);
      }}
      onKeyDown={(event: KeyboardEvent) => {
        if (event.key === ' ' && event.target === event.currentTarget) {
          event.preventDefault();
          onSelect(issue.id);
        }
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={phone ? { transform: `translateX(${offset}px)` } : undefined}
      className={cn(
        'group/row relative grid cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1 bg-card px-3 py-2 outline-none transition-[background-color,transform] hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
        phone && 'min-h-14 touch-pan-y py-2.5',
        selected &&
          'bg-primary/8 shadow-[inset_2px_0_0_var(--primary)] hover:bg-primary/10',
        finished && !selected && 'opacity-70',
      )}
    >
      <StatusIcon
        statusKey={issue.statusKey}
        className={cn('size-4', phone && 'self-start mt-0.5')}
      />
      <span
        className={cn(
          'min-w-0 text-sm font-medium',
          phone ? 'line-clamp-2' : 'truncate',
        )}
        title={issue.title}
      >
        {issue.title}
      </span>
      {/* A fixed-height cell: the star covers the time under the pointer, so the row never changes height. */}
      <span
        className={cn(
          'relative flex h-5 items-center gap-1.5',
          phone && 'self-start',
        )}
      >
        {item.followed && item.unread > 0 ? (
          <span
            className='inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-semibold text-primary-foreground tabular-nums'
            title={t('taskGroups.row.unread', { count: item.unread })}
          >
            {item.unread}
          </span>
        ) : null}
        <time
          dateTime={issue.updatedAt}
          className={cn(
            'text-xs text-muted-foreground tabular-nums',
            !phone &&
              'group-focus-within/row:invisible group-hover/row:invisible',
          )}
        >
          {shortTime(issue.updatedAt, locale)}
        </time>
        {phone ? null : (
          <Button
            variant='ghost'
            size='icon-xs'
            className='absolute top-1/2 right-0 -translate-y-1/2 opacity-0 group-focus-within/row:opacity-100 group-hover/row:opacity-100 focus-visible:opacity-100'
            aria-label={
              item.followed
                ? t('taskGroups.row.unfollow')
                : t('taskGroups.row.follow')
            }
            title={
              item.followed
                ? t('taskGroups.row.unfollow')
                : t('taskGroups.row.follow')
            }
            tabIndex={-1}
            onClick={(event) => {
              event.stopPropagation();
              onToggleFollow(item);
            }}
          >
            <StarIcon
              className={cn(item.followed && 'fill-amber-400 text-amber-500')}
            />
          </Button>
        )}
      </span>
      <span className='col-start-2 col-end-4 min-w-0'>
        <TaskLine item={item} workingAgent={workingAgent ?? null} />
      </span>
    </div>
  );
  if (!phone) return row;
  return (
    <div className='relative overflow-hidden' data-swipe-row>
      <div className='absolute inset-y-0 right-0 flex w-24 items-stretch'>
        <button
          type='button'
          className='flex flex-1 flex-col items-center justify-center gap-1 bg-amber-500 text-xs font-medium text-white dark:bg-amber-600'
          tabIndex={offset === 0 ? -1 : 0}
          aria-hidden={offset === 0}
          onClick={() => {
            setOffset(0);
            onToggleFollow(item);
          }}
        >
          <StarIcon className={cn('size-4', item.followed && 'fill-white')} />
          {item.followed
            ? t('taskGroups.phone.unfollow')
            : t('taskGroups.phone.follow')}
        </button>
      </div>
      {row}
    </div>
  );
}

export function TaskGroupCard({
  group,
  folded,
  onToggle,
  children,
  phone = false,
}: {
  readonly group: ListGroup;
  readonly folded: boolean;
  readonly onToggle: () => void;
  readonly children: ReactNode;
  readonly phone?: boolean;
}): ReactElement {
  const { t } = useTranslation();
  const title = t(`taskGroups.groups.${group.group}`);
  const warm = group.group === 'wait';
  return (
    <section
      aria-label={title}
      data-group={group.group}
      className={cn(
        'overflow-clip rounded-lg border bg-card text-card-foreground',
      )}
    >
      <button
        type='button'
        aria-expanded={!folded}
        aria-label={t(folded ? 'taskGroups.unfold' : 'taskGroups.fold', {
          group: title,
        })}
        onClick={onToggle}
        className={cn(
          'sticky top-0 z-10 flex w-full items-center gap-2 bg-card px-3 py-2 text-left text-sm font-semibold outline-none hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
          !folded && 'border-b',
          warm &&
            'bg-amber-50 hover:bg-amber-100/70 dark:bg-amber-950/40 dark:hover:bg-amber-950/60',
          phone && 'min-h-11',
        )}
      >
        <GroupIcon group={group.group} />
        <span>{title}</span>
        <span
          className={cn(
            'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs tabular-nums',
            warm
              ? 'bg-amber-500/20 font-semibold text-amber-800 dark:text-amber-300'
              : 'bg-muted font-medium text-muted-foreground',
          )}
        >
          {group.group === 'follow'
            ? `${group.count}/${FOLLOW_UPS_MAX}`
            : group.count}
        </span>
        <ChevronDownIcon
          aria-hidden
          className={cn(
            'ml-auto size-4 text-muted-foreground transition-transform',
            folded && '-rotate-90',
          )}
        />
      </button>
      {folded ? null : children}
    </section>
  );
}
