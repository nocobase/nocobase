/**
 * The left column of "My follow-ups": the followed issues in order, one compact card each (status, key, title, one
 * line on what is going on or what the viewer has to do, and how much is new since they last looked). Choosing a card
 * shows the issue in the middle column; an issue shown there that is not followed sits below the list.
 */
import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';

import { relativeTime } from '@/extensions/nocobase-inbox/model';
import { cn } from 'cn';

import { FOLLOW_UPS_MAX, type FollowUpIssue } from '../../shared/follow-ups.js';
import { usePullRequestMark } from '../git/api.js';
import { nowLine } from '../issues/live/summary-model.js';
import { StatusDot } from '../issues/live/status.js';

export function FollowingRail({
  issues,
  stored,
  selectedId,
  viewing,
  onSelect,
  className,
}: {
  readonly issues: readonly FollowUpIssue[];
  readonly className?: string;
  /** The viewer chose them, rather than seeing the default. */
  readonly stored: boolean;
  readonly selectedId: string | null;
  /** The selected issue when it is not followed. */
  readonly viewing: {
    readonly identifier: string;
    readonly title: string;
  } | null;
  readonly onSelect: (issueId: string) => void;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <nav
      aria-labelledby='follow-ups-following'
      className={cn('flex min-w-0 flex-col gap-2', className)}
      data-testid='follow-ups-following'
    >
      <h2
        id='follow-ups-following'
        className='text-sm font-semibold text-muted-foreground max-md:px-4 max-md:text-[13px] max-md:tracking-wide max-md:uppercase'
      >
        {t('followUps.following.title', {
          count: issues.length,
          max: FOLLOW_UPS_MAX,
        })}
      </h2>
      {issues.length === 0 ? (
        <p className='rounded-lg border border-dashed px-3 py-4 text-sm text-muted-foreground max-md:mx-4'>
          {t('followUps.following.empty')}
        </p>
      ) : (
        <ul className='flex flex-col gap-2 max-md:gap-0 max-md:border-y max-md:bg-card'>
          {issues.map((issue) => (
            // On a phone a full-width row, its divider inset to the text.
            <li key={issue.id} className='max-md:pl-4'>
              <FollowingCard
                issue={issue}
                selected={issue.id === selectedId}
                onSelect={() => onSelect(issue.id)}
              />
            </li>
          ))}
        </ul>
      )}
      {!stored && issues.length > 0 ? (
        <p className='text-xs text-muted-foreground max-md:px-4'>
          {t('followUps.following.defaults')}
        </p>
      ) : null}
      {viewing ? (
        <div className='mt-1 flex flex-col gap-1.5 border-t border-dashed pt-3'>
          <span className='text-xs text-muted-foreground'>
            {t('followUps.following.viewing')}
          </span>
          <div className='flex flex-col gap-1 rounded-lg border border-primary bg-primary/5 px-3 py-2.5'>
            <span className='font-mono text-xs text-muted-foreground'>
              {viewing.identifier}
            </span>
            <span className='line-clamp-2 text-sm font-medium'>
              {viewing.title}
            </span>
          </div>
        </div>
      ) : null}
    </nav>
  );
}

function FollowingCard({
  issue,
  selected,
  onSelect,
}: {
  readonly issue: FollowUpIssue;
  readonly selected: boolean;
  readonly onSelect: () => void;
}): ReactElement {
  const { t, i18n } = useTranslation();
  const mark = usePullRequestMark(
    issue.id,
    Date.parse(issue.lastActivityAt),
  ).data;
  const line = nowLine(t, issue, mark);
  const showUnread = issue.unread > 0 && !selected;
  return (
    <button
      type='button'
      aria-current={selected ? 'true' : undefined}
      onClick={onSelect}
      data-issue={issue.identifier}
      className={cn(
        'flex w-full flex-col gap-1 rounded-lg border bg-card px-3 py-2.5 text-left text-card-foreground transition-colors hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none max-md:rounded-none max-md:border-0 max-md:border-b max-md:bg-transparent max-md:py-3 max-md:pr-4 max-md:pl-0 max-md:in-[li:last-child]:border-b-0',
        selected && 'border-primary bg-primary/5 hover:bg-primary/5',
      )}
    >
      <span className='flex items-center gap-1.5'>
        <StatusDot statusKey={issue.statusKey} />
        <span className='font-mono text-xs text-muted-foreground'>
          {issue.identifier}
        </span>
        <time
          dateTime={issue.lastActivityAt}
          className='text-xs text-muted-foreground md:hidden'
        >
          · {relativeTime(issue.lastActivityAt, i18n.language)}
        </time>
        {showUnread ? (
          <span
            className='ml-auto min-w-4.5 rounded-full bg-primary px-1.5 text-center text-[11px] leading-[18px] text-primary-foreground tabular-nums'
            aria-label={t('followUps.following.unread', {
              count: issue.unread,
            })}
            data-testid='follow-ups-unread'
          >
            {issue.unread}
          </span>
        ) : null}
      </span>
      <span className='line-clamp-2 text-sm leading-snug font-medium max-md:text-[15px] max-md:font-semibold'>
        {issue.title}
      </span>
      {line ? (
        <span
          className={cn(
            'line-clamp-2 text-xs leading-snug max-md:line-clamp-1 max-md:text-[13px]',
            line.needsViewer
              ? 'text-amber-700 dark:text-amber-300'
              : 'text-muted-foreground',
          )}
        >
          {line.needsViewer
            ? t('followUps.following.needsYou', { ask: line.text })
            : line.text}
        </span>
      ) : null}
    </button>
  );
}
