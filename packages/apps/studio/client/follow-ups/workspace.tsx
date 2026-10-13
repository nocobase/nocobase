/** Personal task layout around the existing scope outlet. Shared table presentation remains owned by PM-336. */
import { ApiClientError } from '@nocobase/app-client';
import {
  readStoredIssueView,
  resolveIssueView,
} from '@nocobase/app-plugin-projects/client/issues';
import type { AttachmentUploads } from '@nocobase/app-plugin-projects/client/issues';
import { useTranslation } from '@nocobase/i18n/client';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
} from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';

import { Alert, AlertTitle, AlertAction } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { cn } from 'cn';

import { useFollowUps, useMarkSeen } from './api.js';
import { COLUMN_SCROLL } from './column-scroll.js';
import { useIssueDrafts } from './draft-state.js';
import { FollowingRail } from './following-rail.js';
import { IssuePanel } from './issue-panel.js';
import { followedIssues } from './model.js';
import {
  selectWorkspaceIssue,
  selectionAfterRemoval,
} from './workspace-state.js';

export function PersonalTaskWorkspace({
  children,
}: {
  readonly children: ReactNode;
}): ReactElement {
  const { t } = useTranslation();
  const overview = useFollowUps();
  const denied =
    overview.error instanceof ApiClientError &&
    [401, 403].includes(overview.error.status);
  const view = denied ? undefined : overview.data;
  const drafts = useIssueDrafts();
  const markSeen = useMarkSeen();
  const location = useLocation();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const chosen = params.get('issue');
  const [wide, setWide] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const focusTargetRef = useRef<HTMLHeadingElement>(null);
  const previousFollowingRef = useRef<readonly string[]>([]);
  const [unavailable, setUnavailable] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [storedView] = useState(() => readStoredIssueView('my-issues'));
  // Match the existing tab's view resolution until PM-336 supplies the shared resolved-view context/default.
  const table =
    resolveIssueView(
      params,
      storedView,
      ['board', 'list', 'agent'],
      'board',
    ) === 'list';
  const columns = wide && table;
  const following = view?.following.filter((id) => !unavailable.has(id)) ?? [];
  const followed = view
    ? followedIssues(view).filter((issue) => following.includes(issue.id))
    : [];
  const hasFollowing = following.length > 0;
  const tab = params.get('tab') === 'following' ? 'following' : 'mine';
  const selected = chosen ?? following[0] ?? null;
  const fullDetail = /^\/my-issues\/(owned|executing)\/[^/]+/u.test(
    location.pathname,
  );
  const showPanel =
    !fullDetail && selected !== null && (columns || chosen !== null);
  const showFollowing =
    !fullDetail &&
    hasFollowing &&
    (columns || (!showPanel && tab === 'following'));
  const showTasks =
    fullDetail ||
    (!showPanel && (!hasFollowing || tab === 'mine')) ||
    (columns && hasFollowing);
  const scope = location.pathname.startsWith('/my-issues/executing')
    ? 'executing'
    : 'owned';
  const select = useCallback(
    (id: string | null, replace = false) => {
      const next = selectWorkspaceIssue(
        new URLSearchParams(location.search),
        id,
      );
      void navigate(
        {
          pathname: location.pathname,
          search: next.toString(),
          hash: location.hash,
        },
        { replace },
      );
    },
    [navigate, location.pathname, location.search, location.hash],
  );
  const pickTab = (next: 'following' | 'mine'): void => {
    const updated = selectWorkspaceIssue(params, null);
    updated.set('tab', next);
    void navigate({
      pathname: location.pathname,
      search: updated.toString(),
      hash: location.hash,
    });
  };
  const firstFollowing = following[0] ?? null;
  useEffect(() => {
    // Canonicalize the desktop default so changing available width retains its selected content.
    if (columns && firstFollowing && !chosen && !fullDetail)
      select(firstFollowing, true);
  }, [columns, firstFollowing, chosen, fullDetail, select]);
  useEffect(() => {
    const element = rootRef.current;
    if (!element || typeof ResizeObserver === 'undefined') return;
    // 12rem rail + 30rem reading/reply + 24rem task view + gaps. Measure content, including sidebar effects.
    const observer = new ResizeObserver(([entry]) => {
      const rem =
        parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      setWide((entry?.contentRect.width ?? 0) >= 69 * rem);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const onFollow = (event: Event): void => {
      const { issueId, first } = (
        event as CustomEvent<{ issueId: string; first: boolean }>
      ).detail;
      if (first) select(issueId);
    };
    window.addEventListener('studio:issue-followed', onFollow);
    return () => window.removeEventListener('studio:issue-followed', onFollow);
  }, [select]);
  useEffect(() => {
    if (!view) return;
    const next = selectionAfterRemoval(
      chosen,
      previousFollowingRef.current,
      view.following,
    );
    const removedDefault =
      !chosen &&
      previousFollowingRef.current.length > 0 &&
      !view.following.includes(previousFollowingRef.current[0]);
    previousFollowingRef.current = view.following;
    if (next !== chosen) select(next, true);
    if (next !== chosen || removedDefault) focusTargetRef.current?.focus();
  }, [chosen, select, view]);
  const onUnavailable = useCallback(
    (id: string): void => {
      setUnavailable((current) => new Set([...current, id]));
      const remaining = previousFollowingRef.current.filter(
        (candidate) => candidate !== id && !unavailable.has(candidate),
      );
      select(remaining[0] ?? null, true);
      focusTargetRef.current?.focus();
    },
    [select, unavailable],
  );
  const onResolved = (id: string): void => {
    if (chosen && chosen !== id) select(id, true);
  };
  const summary =
    view?.issues.find(
      (issue) => issue.id === selected || issue.identifier === selected,
    ) ?? null;
  const [scrollPositions] = useState(() => new Map<string, number>());
  const fullIssueHref = (identifier: string): string =>
    `/my-issues/${scope}/${encodeURIComponent(identifier)}${location.search}${location.hash}`;

  return (
    <div
      ref={rootRef}
      className='flex h-full min-h-0 flex-col gap-3'
      data-testid='personal-task-workspace'
      data-columns={(columns && hasFollowing && !fullDetail) || undefined}
    >
      <h2
        ref={focusTargetRef}
        tabIndex={-1}
        className='sr-only focus:not-sr-only focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none'
      >
        {t('issuesPage.myTitle')}
      </h2>
      {overview.isError ? (
        <Alert variant='destructive'>
          <AlertTitle>
            {t(denied ? 'common.forbidden' : 'followUps.loadFailed')}
          </AlertTitle>
          {!denied ? (
            <AlertAction>
              <Button
                size='sm'
                variant='outline'
                onClick={() => void overview.refetch()}
              >
                {t('common.retry')}
              </Button>
            </AlertAction>
          ) : null}
        </Alert>
      ) : !view ? (
        <p role='status' className='text-sm text-muted-foreground'>
          {t('personalTasks.loading')}
        </p>
      ) : null}
      {drafts &&
        [...drafts.sessions.keys()]
          .filter(
            (id) => drafts.hasDraft(id) && (!showPanel || id !== selected),
          )
          .map((id) => (
            <Button
              key={id}
              variant='outline'
              size='sm'
              className='max-w-full self-start text-left break-all whitespace-normal'
              onClick={() => select(id)}
            >
              {t('personalTasks.returnDraft', {
                key: unavailable.has(id)
                  ? id
                  : (view?.issues.find((issue) => issue.id === id)
                      ?.identifier ?? id),
              })}
            </Button>
          ))}
      {hasFollowing && !columns && !showPanel ? (
        <nav
          aria-label={t('personalTasks.sections')}
          className='flex flex-wrap gap-2'
        >
          <Button
            variant={tab === 'following' ? 'secondary' : 'ghost'}
            aria-pressed={tab === 'following'}
            onClick={() => pickTab('following')}
          >
            {t('followUps.tabs.following')}
          </Button>
          <Button
            variant={tab === 'mine' ? 'secondary' : 'ghost'}
            aria-pressed={tab === 'mine'}
            onClick={() => pickTab('mine')}
          >
            {t('issuesPage.myTitle')}
          </Button>
        </nav>
      ) : null}
      {showPanel &&
      selected &&
      !following.includes(selected) &&
      !unavailable.has(selected) ? (
        <p className='text-sm text-muted-foreground' role='status'>
          {t('followUps.following.viewing')}
        </p>
      ) : null}
      <div
        className={cn(
          'grid min-h-0 flex-1 gap-4',
          columns && hasFollowing && !fullDetail
            ? 'grid-cols-[12rem_minmax(30rem,1fr)_minmax(24rem,1fr)] grid-rows-[minmax(0,1fr)]'
            : 'grid-cols-[minmax(0,1fr)] grid-rows-[minmax(0,1fr)]',
        )}
      >
        <FollowingScroll
          visible={showFollowing}
          positions={scrollPositions}
          issues={followed}
          stored={view?.followingStored ?? false}
          selectedId={selected}
          viewing={selected && !following.includes(selected) ? summary : null}
          onSelect={select}
        />
        {showPanel && selected && unavailable.has(selected) ? (
          <section className='flex min-h-0 flex-col gap-3 overflow-y-auto rounded-lg border p-4'>
            <p>{t('personalTasks.draftUnavailable')}</p>
            <p className='whitespace-pre-wrap'>
              {drafts?.sessions.get(selected)?.read('content', '')}
            </p>
            <ul>
              {drafts?.sessions
                .get(selected)
                ?.read<AttachmentUploads | null>('issueUploads', null)
                ?.uploads.map((upload) => (
                  <li key={upload.key}>{upload.name}</li>
                ))}
            </ul>
            <Button size='sm' variant='outline' onClick={() => select(null)}>
              {t('followUps.activity.back')}
            </Button>
          </section>
        ) : showPanel && selected ? (
          <ScrollPanel
            key={selected}
            issueId={selected}
            positions={scrollPositions}
            summary={summary}
            onSeen={markSeen}
            onUnavailable={onUnavailable}
            onResolved={onResolved}
            issueHref={fullIssueHref}
            {...(!columns || !hasFollowing
              ? { onBack: () => select(null) }
              : {})}
          />
        ) : null}
        {/* Keep one stable outlet container through every layout switch; no replacement owner-card data source. */}
        <div
          className={cn('min-h-0 min-w-0', !showTasks && 'hidden')}
          aria-hidden={!showTasks || undefined}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

/** Restore each viewed issue's vertical position without retaining a hidden detail query. */
function ScrollPanel({
  issueId,
  positions,
  ...panel
}: Omit<ComponentProps<typeof IssuePanel>, 'onReady'> & {
  readonly positions: Map<string, number>;
}): ReactElement {
  const scrollRef = useRef<HTMLDivElement>(null);
  const restore = useCallback(() => {
    const element = scrollRef.current;
    if (element) element.scrollTop = positions.get(issueId) ?? 0;
  }, [issueId, positions]);
  return (
    <div
      ref={scrollRef}
      className={cn('min-h-0 overflow-y-auto', COLUMN_SCROLL)}
      onScroll={(event) =>
        positions.set(issueId, event.currentTarget.scrollTop)
      }
    >
      <IssuePanel {...panel} issueId={issueId} onReady={restore} />
    </div>
  );
}

/** Narrow list/detail navigation keeps the rail's scroll without retaining hidden row queries. */
function FollowingScroll({
  visible,
  positions,
  ...rail
}: Omit<ComponentProps<typeof FollowingRail>, 'className'> & {
  readonly visible: boolean;
  readonly positions: Map<string, number>;
}): ReactElement {
  const railRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (visible && railRef.current)
      railRef.current.scrollTop = positions.get('following') ?? 0;
  }, [visible, positions]);
  return (
    <div
      ref={railRef}
      className={cn(
        'min-h-0 overflow-y-auto',
        COLUMN_SCROLL,
        !visible && 'hidden',
      )}
      aria-hidden={!visible || undefined}
      onScroll={(event) => {
        if (visible) positions.set('following', event.currentTarget.scrollTop);
      }}
    >
      {visible ? <FollowingRail {...rail} /> : null}
    </div>
  );
}
