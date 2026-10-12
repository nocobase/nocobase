/**
 * Route `/follow-ups`, "My follow-ups": the issues the viewer follows (left), one issue's live activity (middle), and
 * the issues they own with what each needs from them (right); the columns stack on a phone. The issue shown is in the
 * URL (`?issue=<id>`), the first followed one by default. Everything comes from `GET /api/followUps`
 * (`client/follow-ups/`), kept current by the projects plugin's realtime refresh; starring an issue writes what the
 * viewer follows, and showing one records that they looked.
 */
import {
  pmKeys,
  usePmApi,
  useViewer,
} from '@nocobase/app-plugin-projects/client/kit';
import { useTranslation } from '@nocobase/i18n/client';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo, useState, type ReactElement } from 'react';
import { useSearchParams } from 'react-router';

import { PageContainer } from '@/components/page-container';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

import {
  FOLLOW_UPS_MAX,
  type FollowUpStatus,
} from '../../../shared/follow-ups.js';
import { useNotify } from '../../access/notify.js';
import {
  useFollowUps,
  useMarkSeen,
  useSetFollowing,
} from '../../follow-ups/api.js';
import { FollowingRail } from '../../follow-ups/following-rail.js';
import { IssuePanel } from '../../follow-ups/issue-panel.js';
import {
  DEFAULT_FILTER,
  followedIssues,
  ownedRows,
  toggledFollowing,
} from '../../follow-ups/model.js';
import { OwnedList } from '../../follow-ups/owned-list.js';
import { StatusPill } from '../../follow-ups/status.js';
import { useFollowUpStatusName } from '../../follow-ups/status-colors.js';

/** The statuses the header counts. */
const COUNTED: readonly FollowUpStatus[] = [
  'in_review',
  'blocked',
  'in_progress',
];

export default function FollowUpsPage(): ReactElement {
  const { t } = useTranslation();
  const notify = useNotify();
  const viewer = useViewer();
  const overview = useFollowUps();
  const view = overview.data;
  const [params, setParams] = useSearchParams();
  const [filter, setFilter] =
    useState<readonly FollowUpStatus[]>(DEFAULT_FILTER);
  const [query, setQuery] = useState('');
  const setFollowing = useSetFollowing((error) =>
    notify.error(error, t('followUps.saveFailed')),
  );
  const markSeen = useMarkSeen();
  const statusName = useFollowUpStatusName();

  const followed = useMemo(() => (view ? followedIssues(view) : []), [view]);
  const rows = useMemo(
    () => (view ? ownedRows(view, filter, query) : []),
    [view, filter, query],
  );
  const selectedId =
    params.get('issue') ?? followed[0]?.id ?? rows[0]?.id ?? null;
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
      const next = toggledFollowing(following, issueId, FOLLOW_UPS_MAX);
      if (next.length !== following.length) setFollowing.mutate(next);
    },
    [following, setFollowing],
  );

  return (
    <PageContainer className='flex flex-col gap-6 space-y-0'>
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
        <div className='grid items-start gap-5 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)_minmax(0,22rem)]'>
          <FollowingRail
            issues={followed}
            stored={view.followingStored}
            selectedId={selectedId}
            viewing={
              selectedId && !isFollowed ? (summary ?? shown ?? null) : null
            }
            onSelect={select}
          />
          {selectedId ? (
            <IssuePanel
              key={selectedId}
              issueId={selectedId}
              summary={summary}
              viewerId={viewer?.userId ?? null}
              followed={isFollowed}
              followingCount={following.length}
              onToggleFollow={() => toggleFollow(selectedId)}
              onSeen={markSeen}
            />
          ) : (
            <p className='rounded-xl border border-dashed p-6 text-sm text-muted-foreground'>
              {t('followUps.activity.select')}
            </p>
          )}
          <OwnedList
            view={view}
            rows={rows}
            filter={filter}
            onFilter={setFilter}
            query={query}
            onQuery={setQuery}
            selectedId={selectedId}
            onSelect={select}
            onToggleFollow={toggleFollow}
          />
        </div>
      )}
    </PageContainer>
  );
}
