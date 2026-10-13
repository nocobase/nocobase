/**
 * Route `/follow-ups`, "My follow-ups": the issues the viewer follows (left), one issue live (middle: the summary, feed
 * and composer the issue page has too), and the issues they own with what each needs from them (right). On a wide
 * screen the three columns fill the visible area below the heading and each scrolls on its own; a narrower screen shows
 * one list at a time under two bottom tabs, and choosing an issue shows it alone, with a way back. The issue shown is in the URL (`?issue=<id>`), the first followed one by default. Everything comes from `GET /api/followUps`
 * (`client/follow-ups/`), kept current by the projects plugin's realtime refresh; starring an issue writes what the
 * viewer follows, and showing one records that they looked.
 */
import { pmKeys, usePmApi } from '@nocobase/app-plugin-projects/client/kit';
import { useTranslation } from '@nocobase/i18n/client';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo, useState, type ReactElement } from 'react';
import { useSearchParams } from 'react-router';

import { PageContainer } from '@/components/page-container';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from 'cn';
import { useMediaQuery } from '@/extensions/nocobase-agent-chat/use-media-query';

import {
  FOLLOW_UPS_MAX,
  type FollowUpStatus,
} from '../../../shared/follow-ups.js';
import { useNotify } from '../../access/notify.js';
import {
  useFollowUps,
  useFollowIssue,
  useMarkSeen,
} from '../../follow-ups/api.js';
import { FollowingRail } from '../../follow-ups/following-rail.js';
import { IssuePanel } from '../../follow-ups/issue-panel.js';
import {
  DEFAULT_FILTER,
  followedIssues,
  ownedRows,
} from '../../follow-ups/model.js';
import { OwnedList } from '../../follow-ups/owned-list.js';
import { useFillHeight } from '../../follow-ups/use-fill-height.js';
import { StatusPill } from '../../issues/live/status.js';
import { needsViewer } from '../../issues/live/summary-model.js';
import { PhoneBar } from '../../layouts/components/phone-bar.js';
import { useFollowUpStatusName } from '../../issues/live/status-colors.js';

/** A side column on a wide screen: it stays in view while the middle scrolls, and scrolls on its own. */
const SIDE_COLUMN = 'lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain';

/** The page's bottom padding on a wide screen (`PageContainer`'s `md:p-8`), kept below the columns. */
const PAGE_BOTTOM = 32;

/** The statuses the header counts. */
const COUNTED: readonly FollowUpStatus[] = [
  'in_review',
  'blocked',
  'in_progress',
];

export default function FollowUpsPage(): ReactElement {
  const { t } = useTranslation();
  const notify = useNotify();
  const overview = useFollowUps();
  const view = overview.data;
  const [params, setParams] = useSearchParams();
  const [filter, setFilter] =
    useState<readonly FollowUpStatus[]>(DEFAULT_FILTER);
  const [query, setQuery] = useState('');
  const followIssue = useFollowIssue((error) =>
    notify.error(error, t('followUps.saveFailed')),
  );
  const markSeen = useMarkSeen();
  const statusName = useFollowUpStatusName();

  const followed = useMemo(() => (view ? followedIssues(view) : []), [view]);
  const rows = useMemo(
    () => (view ? ownedRows(view, filter, query) : []),
    [view, filter, query],
  );
  const chosen = params.get('issue');
  const wide = useMediaQuery('(min-width: 64rem)', true);
  const selectedId = chosen ?? followed[0]?.id ?? rows[0]?.id ?? null;
  // A narrow screen shows one list at a time under its tab, or the chosen issue alone.
  const tab: PhoneTab = params.get('tab') === 'mine' ? 'mine' : 'following';
  const showPanel = wide || chosen !== null;
  const showFollowing = wide || (chosen === null && tab === 'following');
  const showOwned = wide || (chosen === null && tab === 'mine');
  const showTabs = !wide && chosen === null;
  // On a wide screen the columns fill the rest of the visible area and scroll on their own.
  const [columnsHeight, fill] = useFillHeight(wide, PAGE_BOTTOM);
  const badges = useMemo(
    () => ({
      following: followed.filter(
        (issue) => issue.unread > 0 || needsViewer(issue),
      ).length,
      mine: view ? ownedRows(view, DEFAULT_FILTER, '').length : 0,
    }),
    [followed, view],
  );
  const summary = view?.issues.find((issue) => issue.id === selectedId) ?? null;
  // The issue shown when the overview does not hold it: the middle column reads it with the same query.
  const pm = usePmApi();
  const shown = useQuery({
    queryKey: pmKeys.issue(selectedId ?? ''),
    queryFn: () => pm.issue(selectedId ?? ''),
    enabled: selectedId !== null && view !== undefined && summary === null,
  }).data;
  const following = useMemo(() => view?.following ?? [], [view]);
  const isFollowed = selectedId !== null && following.includes(selectedId);

  const back = useCallback(
    () =>
      setParams(
        (current) => {
          const next = new URLSearchParams(current);
          next.delete('issue');
          return next;
        },
        { replace: true },
      ),
    [setParams],
  );
  const pickTab = useCallback(
    (next: PhoneTab) =>
      setParams(
        (current) => {
          const params = new URLSearchParams(current);
          if (next === 'mine') params.set('tab', 'mine');
          else params.delete('tab');
          return params;
        },
        { replace: true },
      ),
    [setParams],
  );
  const select = useCallback(
    (issueId: string) =>
      setParams(
        (current) => {
          const next = new URLSearchParams(current);
          next.set('issue', issueId);
          return next;
        },
        { replace: true },
      ),
    [setParams],
  );
  const toggleFollow = useCallback(
    (issueId: string) => {
      const followed = following.includes(issueId);
      if (!followed && following.length >= FOLLOW_UPS_MAX) return;
      followIssue.mutate({ issueId, follow: !followed });
    },
    [following, followIssue],
  );

  return (
    <PageContainer
      className={cn(
        'flex flex-col gap-6 space-y-0',
        // Room for the tab bar, and a phone's issue view starts right at its Back row.
        showTabs && 'pb-24 lg:pb-6',
        chosen !== null && 'max-md:pt-2',
      )}
    >
      <div className={cn('max-md:hidden', chosen !== null && 'max-lg:hidden')}>
        <PageHeader
          title={t('followUps.title')}
          description={
            <span className='flex flex-wrap items-center gap-x-3 gap-y-1'>
              <span
                className='inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300'
                data-testid='follow-ups-live'
              >
                <span
                  aria-hidden
                  className='size-1.5 animate-pulse rounded-full bg-emerald-500'
                />
                {t('followUps.live')}
              </span>
              <span>{t('followUps.description')}</span>
            </span>
          }
          actions={
            view ? (
              <ul
                aria-label={t('followUps.countsLabel')}
                className='flex flex-wrap items-center gap-2'
              >
                {COUNTED.map((status) => (
                  <li
                    key={status}
                    className='inline-flex items-center gap-1.5 text-sm'
                    aria-label={`${statusName(status)} ${view.counts[status]}`}
                  >
                    <StatusPill statusKey={status} />
                    <span className='tabular-nums'>{view.counts[status]}</span>
                  </li>
                ))}
              </ul>
            ) : null
          }
        />
      </div>
      {chosen === null ? (
        // A phone's heading row, with the navigation and the agent chat the hidden header would give.
        <PhoneBar className='-mt-2'>
          <h1 className='truncate font-heading text-2xl font-semibold tracking-tight'>
            {t('followUps.title')}
          </h1>
          <span className='inline-flex shrink-0 items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-300'>
            <span
              aria-hidden
              className='size-1.5 animate-pulse rounded-full bg-emerald-500'
            />
            {t('followUps.live')}
          </span>
        </PhoneBar>
      ) : null}
      {!view ? (
        overview.isError ? (
          <div className='flex flex-col items-start gap-3 rounded-xl border p-6 text-sm'>
            <p className='text-muted-foreground'>{t('followUps.loadFailed')}</p>
            <Button
              size='sm'
              variant='outline'
              onClick={() => void overview.refetch()}
            >
              {t('common.retry')}
            </Button>
          </div>
        ) : (
          <div className='grid gap-5 lg:grid-cols-[15rem_minmax(0,1fr)_22rem]'>
            <Skeleton className='h-64' />
            <Skeleton className='h-96' />
            <Skeleton className='h-80' />
          </div>
        )
      ) : (
        <div
          ref={fill}
          style={columnsHeight === null ? undefined : { height: columnsHeight }}
          className='grid items-start gap-5 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)_minmax(0,22rem)] lg:grid-rows-[minmax(0,1fr)] lg:items-stretch'
          data-testid='follow-ups-columns'
        >
          {showFollowing ? (
            <FollowingRail
              className={SIDE_COLUMN}
              issues={followed}
              stored={view.followingStored}
              selectedId={wide ? selectedId : null}
              viewing={
                wide && selectedId && !isFollowed
                  ? (summary ?? shown ?? null)
                  : null
              }
              onSelect={select}
            />
          ) : null}
          {!showPanel ? null : selectedId ? (
            <IssuePanel
              className='lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain'
              key={selectedId}
              issueId={selectedId}
              summary={summary}
              onSeen={markSeen}
              {...(wide ? {} : { onBack: back })}
            />
          ) : (
            <p className='rounded-xl border border-dashed p-6 text-sm text-muted-foreground'>
              {t('followUps.activity.select')}
            </p>
          )}
          {showOwned ? (
            <OwnedList
              className={SIDE_COLUMN}
              view={view}
              rows={rows}
              filter={filter}
              onFilter={setFilter}
              query={query}
              onQuery={setQuery}
              selectedId={wide ? selectedId : null}
              onSelect={select}
              onToggleFollow={toggleFollow}
            />
          ) : null}
        </div>
      )}
      {showTabs ? (
        <PhoneTabs tab={tab} badges={badges} onPick={pickTab} />
      ) : null}
    </PageContainer>
  );
}

type PhoneTab = 'following' | 'mine';

/** A narrow screen's two lists, as tabs fixed at the bottom with what needs the viewer counted on each. */
function PhoneTabs({
  tab,
  badges,
  onPick,
}: {
  readonly tab: PhoneTab;
  readonly badges: Readonly<Record<PhoneTab, number>>;
  readonly onPick: (tab: PhoneTab) => void;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <nav
      aria-label={t('followUps.tabs.label')}
      className='fixed inset-x-0 bottom-0 z-30 grid grid-cols-2 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden'
      data-testid='follow-ups-tabs'
    >
      {(['following', 'mine'] as const).map((id) => (
        <button
          key={id}
          type='button'
          aria-current={tab === id ? 'page' : undefined}
          onClick={() => onPick(id)}
          className={cn(
            'flex min-h-13 items-center justify-center gap-2 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset',
            tab === id ? 'font-semibold text-primary' : 'text-muted-foreground',
          )}
        >
          {t(`followUps.tabs.${id}`)}
          {badges[id] > 0 ? (
            <span
              className='min-w-5 rounded-full bg-primary px-1.5 text-center text-xs leading-5 text-primary-foreground tabular-nums'
              aria-label={t('followUps.tabs.badge', { count: badges[id] })}
            >
              {badges[id]}
            </span>
          ) : null}
        </button>
      ))}
    </nav>
  );
}
