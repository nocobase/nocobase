/**
 * The middle column of "My follow-ups": one issue's live activity. Its header (key, status, pull request with its
 * checks and conflicts, follow, open), what it waits for now and the project manager's "Next" line (the issue page's
 * `GET /api/issueProgress/:issueId`), what the viewer has to do when it waits for them, and its activity told as a
 * timeline (`feed.ts`) rather than raw comments. The issue is read with the issue page's own query, which the projects
 * plugin's realtime refresh keeps current; reading it records that the viewer looked (`markSeen`).
 */
import { useApiClient } from '@nocobase/app-client';
import { AgentAvatar } from '@nocobase/app-plugin-agents/client/kit';
import { useAgentNames } from '@nocobase/app-plugin-agents/client/runs';
import { pmKeys, usePmApi } from '@nocobase/app-plugin-projects/client/kit';
import { ACCESS_NAMESPACE as PROJECTS_NS } from '@nocobase/app-plugin-projects/shared/access';
import type { IssueDetail } from '@nocobase/app-plugin-projects/shared/issues';
import { useTranslation } from '@nocobase/i18n/client';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangleIcon,
  ArrowRightIcon,
  CheckCircle2Icon,
  GitPullRequestIcon,
  HistoryIcon,
  MessageSquareIcon,
  SendIcon,
  StarIcon,
  UserIcon,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState, type ReactElement } from 'react';
import { Link } from 'react-router';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { relativeTime } from '@/extensions/nocobase-inbox/model';
import { cn } from 'cn';

import { FOLLOW_UPS_MAX, type FollowUpIssue } from '../../shared/follow-ups.js';
import {
  PROJECT_MANAGER_ID,
  type IssueProgress,
} from '../../shared/project-manager.js';
import { useIssuePullRequests, usePullRequestMark } from '../git/api.js';
import { PR_ACTIVITY_LABELS } from '../git/lib.js';
import {
  actionLabel,
  isOwnerHandoffActivity,
} from '../issues/detail/activity-labels.js';
import {
  issueProgressKey,
  progressSentence,
} from '../issues/detail/progress-text.js';
import { IssueMarkdown } from '../issues/markdown.js';
import { buildFeed, type FeedEvent } from './feed.js';
import { askOf, pullRequestLabel } from './model.js';
import { StatusPill } from './status.js';

/** The issue and its progress read again this often besides the realtime refresh. */
const POLL_MS = 15_000;

export function IssuePanel({
  issueId,
  summary,
  viewerId,
  followed,
  followingCount,
  onToggleFollow,
  onSeen,
}: {
  readonly issueId: string;
  /** The overview's entry for it, when the viewer owns or follows it. */
  readonly summary: FollowUpIssue | null;
  readonly viewerId: string | null;
  readonly followed: boolean;
  readonly followingCount: number;
  readonly onToggleFollow: () => void;
  /** The viewer looked at the issue as it is now. */
  readonly onSeen: (issueId: string) => void;
}): ReactElement {
  const { t } = useTranslation();
  const api = usePmApi();
  const detail = useQuery({
    queryKey: pmKeys.issue(issueId),
    queryFn: () => api.issue(issueId),
    refetchInterval: POLL_MS,
  });
  const data = detail.data;
  const latest = data
    ? [
        data.activities.at(-1)?.id ?? '',
        data.threads.length,
        data.threads.at(-1)?.replies.length ?? 0,
      ].join(':')
    : null;
  // Whatever arrived while the issue is shown counts as seen.
  useEffect(() => {
    if (latest !== null && document.visibilityState !== 'hidden')
      onSeen(issueId);
  }, [issueId, latest, onSeen]);

  if (!data)
    return (
      <PanelFrame>
        {detail.isError ? (
          <p className='p-5 text-sm text-muted-foreground'>
            {t('followUps.activity.loadFailed')}
          </p>
        ) : (
          <div className='flex flex-col gap-3 p-5' aria-busy='true'>
            <Skeleton className='h-5 w-40' />
            <Skeleton className='h-6 w-3/4' />
            <Skeleton className='h-16 w-full' />
            <Skeleton className='h-24 w-full' />
          </div>
        )}
      </PanelFrame>
    );
  return (
    <PanelFrame>
      <IssueHeader
        issue={data}
        summary={summary}
        viewerId={viewerId}
        followed={followed}
        followingCount={followingCount}
        onToggleFollow={onToggleFollow}
      />
      <Timeline issue={data} viewerId={viewerId} />
    </PanelFrame>
  );
}

function PanelFrame({
  children,
}: {
  readonly children: ReactElement | ReactElement[];
}): ReactElement {
  const { t } = useTranslation();
  return (
    <section
      aria-label={t('followUps.activity.label')}
      className='flex min-w-0 flex-col rounded-xl border bg-card text-card-foreground'
      data-testid='follow-ups-activity'
    >
      {children}
    </section>
  );
}

function IssueHeader({
  issue,
  summary,
  viewerId,
  followed,
  followingCount,
  onToggleFollow,
}: {
  readonly issue: IssueDetail;
  readonly summary: FollowUpIssue | null;
  readonly viewerId: string | null;
  readonly followed: boolean;
  readonly followingCount: number;
  readonly onToggleFollow: () => void;
}): ReactElement {
  const { t } = useTranslation();
  const api = useApiClient();
  const mark = usePullRequestMark(issue.id, issue.revision).data;
  const progress = useQuery({
    queryKey: [...issueProgressKey(issue.id), issue.revision],
    queryFn: async () =>
      (
        await api.request<{ data: IssueProgress }>({
          path: `issueProgress/${encodeURIComponent(issue.id)}`,
        })
      ).data,
    placeholderData: (previous) => previous ?? summary?.progress ?? undefined,
    refetchInterval: POLL_MS,
  }).data;
  const full = !followed && followingCount >= FOLLOW_UPS_MAX;
  const owned = viewerId !== null && issue.ownerUserId === viewerId;
  const ask = askOf(
    t,
    { owned, statusKey: issue.statusKey, progress: progress ?? null },
    mark,
  );
  const checks =
    mark && mark.state === 'open' && mark.ciState
      ? t(`followUps.activity.checks.${mark.ciState}`)
      : null;
  const issuePath = `/issues/${encodeURIComponent(issue.identifier)}`;
  return (
    <div className='flex flex-col gap-3 border-b px-5 py-4'>
      <div className='flex flex-wrap items-center gap-2'>
        <span className='font-mono text-sm text-muted-foreground'>
          {issue.identifier}
        </span>
        <StatusPill statusKey={issue.statusKey} />
        {mark?.state === 'open' ? (
          <a
            href={mark.url}
            target='_blank'
            rel='noreferrer'
            className='text-sm hover:underline'
          >
            {pullRequestLabel(mark)}
          </a>
        ) : null}
        {checks || mark?.conflict ? (
          <span className='text-sm text-muted-foreground'>
            {[checks, mark?.conflict ? t('followUps.activity.conflict') : null]
              .filter(Boolean)
              .join(' · ')}
          </span>
        ) : null}
        <span className='flex flex-wrap gap-2 sm:ml-auto'>
          <Button
            size='sm'
            variant='outline'
            aria-pressed={followed}
            aria-disabled={full || undefined}
            className='aria-disabled:cursor-not-allowed aria-disabled:opacity-60'
            title={
              full
                ? t('followUps.activity.fullHint', { max: FOLLOW_UPS_MAX })
                : undefined
            }
            onClick={full ? undefined : onToggleFollow}
          >
            <StarIcon
              data-icon='inline-start'
              className={cn(followed && 'fill-amber-400 text-amber-500')}
            />
            {followed
              ? t('followUps.activity.unfollow')
              : full
                ? t('followUps.activity.full', { max: FOLLOW_UPS_MAX })
                : t('followUps.activity.follow')}
          </Button>
          <Button
            size='sm'
            variant='outline'
            nativeButton={false}
            render={<Link to={issuePath} />}
          >
            {t('followUps.activity.open')}
          </Button>
        </span>
      </div>
      <h3 className='text-lg leading-snug font-semibold text-balance'>
        {issue.title}
      </h3>
      <div
        className='flex flex-col gap-1 rounded-lg bg-muted/50 px-3 py-2.5 text-sm'
        data-testid='follow-ups-now'
      >
        <span className='font-medium wrap-anywhere'>
          {progress
            ? t('followUps.activity.now', {
                now: progressSentence(t, progress),
              })
            : t('followUps.activity.nowUnknown')}
        </span>
        {progress?.next ? (
          <span className='text-muted-foreground wrap-anywhere'>
            {t('followUps.activity.next', { next: progress.next })}
          </span>
        ) : null}
      </div>
      {ask ? (
        <div
          className='flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-sm'
          data-testid='follow-ups-needs-you'
        >
          <span className='flex min-w-0 flex-wrap gap-x-2'>
            <strong className='font-semibold'>
              {t('followUps.activity.needsYou')}
            </strong>
            <span className='wrap-anywhere'>{ask}</span>
          </span>
          <Button
            size='sm'
            nativeButton={false}
            render={<Link to={issuePath} />}
          >
            {issue.statusKey === 'in_review'
              ? t('followUps.activity.accept')
              : t('followUps.activity.reply')}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function Timeline({
  issue,
  viewerId,
}: {
  readonly issue: IssueDetail;
  readonly viewerId: string | null;
}): ReactElement {
  const { t } = useTranslation();
  const pullRequests = useIssuePullRequests(issue.id, issue.revision).data;
  const events = useMemo(
    () =>
      buildFeed({
        activities: issue.activities,
        threads: issue.threads,
        pullRequests: pullRequests?.data ?? [],
        viewerId,
        managerId: PROJECT_MANAGER_ID,
      }),
    [issue.activities, issue.threads, pullRequests, viewerId],
  );
  if (events.length === 0)
    return (
      <p className='px-5 py-6 text-sm text-muted-foreground'>
        {t('followUps.activity.empty')}
      </p>
    );
  return (
    <ol
      aria-label={t('followUps.activity.label')}
      className='flex flex-col gap-4 px-5 py-4'
      data-testid='follow-ups-feed'
    >
      {events.map((event) => (
        <FeedRow key={event.id} event={event} />
      ))}
    </ol>
  );
}

const MARKS: Readonly<
  Record<
    FeedEvent['kind'] | 'mine' | 'approved' | 'changesRequested',
    { readonly icon: LucideIcon; readonly tone: string }
  >
> = {
  handOver: { icon: SendIcon, tone: 'bg-primary/10 text-primary' },
  manager: { icon: SendIcon, tone: 'bg-primary/10 text-primary' },
  agentReply: { icon: MessageSquareIcon, tone: 'bg-muted text-foreground' },
  review: { icon: CheckCircle2Icon, tone: 'bg-muted text-foreground' },
  approved: {
    icon: CheckCircle2Icon,
    tone: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  },
  changesRequested: {
    icon: AlertTriangleIcon,
    tone: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  },
  comment: { icon: MessageSquareIcon, tone: 'bg-muted text-foreground' },
  status: { icon: ArrowRightIcon, tone: 'bg-muted text-foreground' },
  pullRequest: { icon: GitPullRequestIcon, tone: 'bg-muted text-foreground' },
  change: { icon: HistoryIcon, tone: 'bg-muted text-muted-foreground' },
  mine: {
    icon: UserIcon,
    tone: 'bg-violet-500/10 text-violet-700 dark:text-violet-300',
  },
};

function markOf(event: FeedEvent): (typeof MARKS)[keyof typeof MARKS] {
  if (event.mine) return MARKS.mine;
  if (event.kind === 'review' && event.verdict) return MARKS[event.verdict];
  return MARKS[event.kind];
}

/** A time today as `14:03`, otherwise how long ago. */
function shortTime(at: string, locale: string, now: Date = new Date()): string {
  const date = new Date(at);
  return date.toDateString() === now.toDateString()
    ? new Intl.DateTimeFormat(locale, {
        hour: '2-digit',
        minute: '2-digit',
      }).format(date)
    : relativeTime(at, locale, now.getTime());
}

function FeedRow({ event }: { readonly event: FeedEvent }): ReactElement {
  const { t, i18n } = useTranslation();
  // The projects plugin's wording of a change, as the issue page's activity line says it.
  const { t: projects } = useTranslation(PROJECTS_NS);
  const agentName = useAgentNames();
  const [expanded, setExpanded] = useState(false);
  const mark = markOf(event);
  const Icon = mark.icon;
  const who = event.mine
    ? t('followUps.activity.you')
    : event.actor.type === 'agent' && event.actor.id === PROJECT_MANAGER_ID
      ? t('followUps.activity.projectManager')
      : ((event.actor.type === 'agent' && event.actor.id
          ? agentName(event.actor.id)
          : null) ??
        event.actor.name ??
        t('followUps.activity.someone'));
  const { what, detail } = describe(event, t, projects);
  return (
    <li
      className='grid grid-cols-[3.25rem_1.5rem_minmax(0,1fr)] items-start gap-2.5'
      data-feed-kind={event.kind}
    >
      <time
        dateTime={event.at}
        title={new Date(event.at).toLocaleString(i18n.language)}
        className='pt-0.5 text-xs text-muted-foreground tabular-nums'
      >
        {shortTime(event.at, i18n.language)}
      </time>
      <span
        aria-hidden
        className={cn(
          'inline-flex size-6 items-center justify-center rounded-full',
          mark.tone,
        )}
      >
        {event.actor.type === 'agent' &&
        event.actor.id !== PROJECT_MANAGER_ID &&
        !event.mine &&
        event.kind === 'agentReply' ? (
          <AgentAvatar name={who} size='xs' className='size-full' />
        ) : (
          <Icon className='size-3.5' />
        )}
      </span>
      <div className='flex min-w-0 flex-col gap-1 text-sm'>
        <p className='min-w-0 wrap-anywhere'>
          <strong className='font-semibold'>{who}</strong> {what}
        </p>
        {event.kind === 'status' && event.to ? (
          <span className='flex flex-wrap items-center gap-1.5'>
            {event.from ? <StatusPill statusKey={event.from} /> : null}
            {event.from ? <span aria-hidden>→</span> : null}
            <StatusPill statusKey={event.to} />
          </span>
        ) : null}
        {expanded && event.body ? (
          <IssueMarkdown
            content={event.body}
            className='text-sm text-muted-foreground'
          />
        ) : detail ? (
          <p className='leading-relaxed text-muted-foreground wrap-anywhere'>
            {detail}
          </p>
        ) : null}
        {event.body ? (
          <button
            type='button'
            className='self-start text-xs text-primary hover:underline'
            aria-expanded={expanded}
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded
              ? t('followUps.activity.less')
              : t('followUps.activity.more')}
          </button>
        ) : null}
      </div>
    </li>
  );
}

type Translate = (key: string, options?: Record<string, unknown>) => string;

function text(value: unknown): string | null {
  return typeof value === 'string' && value ? value : null;
}

/** What an entry says after who did it, and the line under it. */
function describe(
  event: FeedEvent,
  t: Translate,
  projects: Translate,
): { readonly what: ReactElement | string; readonly detail: string | null } {
  const joined = [event.summary, event.excerpt].filter(Boolean).join(' ');
  switch (event.kind) {
    case 'handOver':
      return {
        what: event.summary
          ? t('followUps.activity.events.handOver', {
              agents: event.agents.join(', '),
              step: event.summary,
            })
          : t('followUps.activity.events.handOverNoStep', {
              agents: event.agents.join(', '),
            }),
        detail: event.excerpt,
      };
    case 'manager':
      return {
        what: event.summary ?? t('followUps.activity.events.manager'),
        detail: event.excerpt,
      };
    case 'agentReply':
      return { what: t('followUps.activity.events.replied'), detail: joined };
    case 'review':
      return {
        what: t(`followUps.activity.events.${event.verdict ?? 'replied'}`),
        detail: joined,
      };
    case 'comment':
      return { what: t('followUps.activity.events.commented'), detail: joined };
    case 'status':
      return { what: t('followUps.activity.events.status'), detail: null };
    case 'pullRequest': {
      if (event.pullRequest)
        return {
          what: (
            <a
              href={event.pullRequest.url}
              target='_blank'
              rel='noreferrer'
              className='hover:underline'
            >
              {t(`followUps.activity.events.${event.pullRequest.event}`, {
                label: `PR ${event.pullRequest.label}`,
              })}
            </a>
          ),
          detail: null,
        };
      const activity = event.activity;
      const label = activity ? PR_ACTIVITY_LABELS[activity.action] : undefined;
      const number = activity?.details.number;
      return {
        what: label ? t(label) : '',
        detail: typeof number === 'number' ? `PR #${number}` : null,
      };
    }
    case 'change': {
      const activity = event.activity;
      if (!activity) return { what: '', detail: null };
      return {
        what: (isOwnerHandoffActivity(activity.action, activity.details)
          ? t
          : projects)(actionLabel(activity.action, activity.details), {
          name: text(activity.details.name) ?? projects('common.unknown'),
        }),
        detail: null,
      };
    }
  }
}
