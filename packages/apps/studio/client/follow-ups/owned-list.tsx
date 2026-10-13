/**
 * The right column of "My follow-ups": the issues the viewer owns, narrowed by status (several at once; In review when
 * the page opens) and by title or key, in review first, then blocked, in progress and backlog, each by latest activity.
 * A row says what the viewer has to do, or what is going on; choosing it shows the issue in the middle column, and its
 * star follows or stops following it.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { SearchIcon, StarIcon } from 'lucide-react';
import type { ReactElement } from 'react';

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { relativeTime } from '@/extensions/nocobase-inbox/model';
import { cn } from 'cn';

import {
  FOLLOW_UP_STATUSES,
  FOLLOW_UPS_MAX,
  OWNED_PER_STATUS_MAX,
  type FollowUpIssue,
  type FollowUpStatus,
  type FollowUpsView,
} from '../../shared/follow-ups.js';
import { usePullRequestMark } from '../git/api.js';
import { nowLine } from '../issues/live/summary-model.js';
import { StatusPill } from '../issues/live/status.js';
import {
  STATUS_CHIP,
  statusColor,
  useFollowUpStatusName,
} from '../issues/live/status-colors.js';

export function OwnedList({
  view,
  rows,
  filter,
  onFilter,
  query,
  onQuery,
  selectedId,
  onSelect,
  onToggleFollow,
  className,
}: {
  readonly view: FollowUpsView;
  readonly className?: string;
  readonly rows: readonly FollowUpIssue[];
  readonly filter: readonly FollowUpStatus[];
  readonly onFilter: (next: readonly FollowUpStatus[]) => void;
  readonly query: string;
  readonly onQuery: (next: string) => void;
  readonly selectedId: string | null;
  readonly onSelect: (issueId: string) => void;
  readonly onToggleFollow: (issueId: string) => void;
}): ReactElement {
  const { t } = useTranslation();
  const statusName = useFollowUpStatusName();
  const full = view.following.length >= FOLLOW_UPS_MAX;
  const following = new Set(view.following);
  const ownsAny = FOLLOW_UP_STATUSES.some((status) => view.counts[status] > 0);
  return (
    <section
      aria-labelledby='follow-ups-mine'
      className={cn('flex min-w-0 flex-col gap-2.5', className)}
      data-testid='follow-ups-mine'
    >
      <h2
        id='follow-ups-mine'
        className='text-sm font-semibold text-muted-foreground'
      >
        {t('followUps.mine.title')}
      </h2>
      <div
        role='group'
        aria-label={t('followUps.mine.filters')}
        className='flex flex-wrap gap-1.5'
      >
        {FOLLOW_UP_STATUSES.map((status) => {
          const on = filter.includes(status);
          return (
            <button
              key={status}
              type='button'
              aria-pressed={on}
              onClick={() =>
                onFilter(
                  on
                    ? filter.filter((value) => value !== status)
                    : [...filter, status],
                )
              }
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                on
                  ? STATUS_CHIP[statusColor(status)]
                  : 'bg-background text-foreground hover:bg-accent',
              )}
            >
              {statusName(status)}
              <span className='tabular-nums opacity-70'>
                {view.counts[status]}
              </span>
            </button>
          );
        })}
      </div>
      <InputGroup>
        <InputGroupAddon>
          <SearchIcon />
        </InputGroupAddon>
        <InputGroupInput
          type='search'
          aria-label={t('followUps.mine.search')}
          placeholder={t('followUps.mine.search')}
          value={query}
          onChange={(event) => onQuery(event.target.value)}
        />
      </InputGroup>
      {rows.length === 0 ? (
        <p className='rounded-lg border border-dashed px-3 py-4 text-sm text-muted-foreground'>
          {ownsAny ? t('followUps.mine.empty') : t('followUps.mine.emptyAll')}
        </p>
      ) : (
        <ul className='overflow-hidden rounded-xl border bg-card text-card-foreground'>
          {rows.map((issue) => (
            <OwnedRow
              key={issue.id}
              issue={issue}
              selected={issue.id === selectedId}
              followed={following.has(issue.id)}
              full={full}
              onSelect={() => onSelect(issue.id)}
              onToggleFollow={() => onToggleFollow(issue.id)}
            />
          ))}
        </ul>
      )}
      {view.truncated ? (
        <p className='text-xs text-muted-foreground'>
          {t('followUps.mine.truncated', { max: OWNED_PER_STATUS_MAX })}
        </p>
      ) : null}
    </section>
  );
}

function OwnedRow({
  issue,
  selected,
  followed,
  full,
  onSelect,
  onToggleFollow,
}: {
  readonly issue: FollowUpIssue;
  readonly selected: boolean;
  readonly followed: boolean;
  readonly full: boolean;
  readonly onSelect: () => void;
  readonly onToggleFollow: () => void;
}): ReactElement {
  const { t, i18n } = useTranslation();
  const mark = usePullRequestMark(
    issue.id,
    Date.parse(issue.lastActivityAt),
  ).data;
  const line = nowLine(t, issue, mark);
  const blocked = !followed && full;
  return (
    <li
      className={cn(
        'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2.5 border-b px-3.5 py-3 last:border-b-0',
        selected && 'bg-primary/5',
      )}
      data-issue={issue.identifier}
    >
      <button
        type='button'
        aria-current={selected ? 'true' : undefined}
        onClick={onSelect}
        className='flex min-w-0 flex-col gap-1 rounded-md text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none'
      >
        <span className='flex w-full items-center gap-2'>
          <span className='font-mono text-xs text-muted-foreground'>
            {issue.identifier}
          </span>
          <StatusPill statusKey={issue.statusKey} />
          <time
            dateTime={issue.lastActivityAt}
            className='ml-auto shrink-0 text-xs text-muted-foreground'
          >
            {relativeTime(issue.lastActivityAt, i18n.language)}
          </time>
        </span>
        <span className='w-full truncate text-sm'>{issue.title}</span>
        {line ? (
          <span
            className={cn(
              'line-clamp-2 text-xs',
              issue.statusKey === 'blocked'
                ? 'text-amber-700 dark:text-amber-300'
                : issue.statusKey === 'in_review'
                  ? 'text-violet-700 dark:text-violet-300'
                  : 'text-muted-foreground',
            )}
          >
            {line.text}
          </span>
        ) : null}
      </button>
      <button
        type='button'
        aria-pressed={followed}
        aria-label={
          followed
            ? t('followUps.mine.unfollow', { key: issue.identifier })
            : t('followUps.mine.follow', { key: issue.identifier })
        }
        title={
          blocked
            ? t('issueLive.follow.fullHint', { max: FOLLOW_UPS_MAX })
            : undefined
        }
        // Not `disabled`, so the hint still shows on hover and focus.
        aria-disabled={blocked || undefined}
        onClick={blocked ? undefined : onToggleFollow}
        className='inline-flex size-8 items-center justify-center rounded-md border bg-background text-muted-foreground transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none aria-disabled:cursor-not-allowed aria-disabled:opacity-50'
      >
        <StarIcon
          className={cn('size-4', followed && 'fill-amber-400 text-amber-500')}
        />
      </button>
    </li>
  );
}
