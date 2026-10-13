/**
 * What an issue is at now, on the issue page (pinned above its feed) and on "My follow-ups": a title row (key, status,
 * title, the page's `actions`, and "Collapse summary" when `collapsible`), then its pull request with checks and
 * conflicts, the "Now" line with "Start" and the hand-over (`../detail/issue-progress.tsx`), what the viewer has to do
 * when it waits for them, and in review the delivery: the agent comment that tells what was delivered, cut short, with
 * Merge, View changes and Send back (to In progress).
 */
import {
  canEditIssues,
  type IssueUpdate,
} from '@nocobase/app-plugin-projects/client/issues';
import { useViewer } from '@nocobase/app-plugin-projects/client/kit';
import type { IssueDetail } from '@nocobase/app-plugin-projects/shared/issues';
import {
  BLOCKED_STATUS,
  IN_PROGRESS_STATUS,
  IN_REVIEW_STATUS,
} from '@nocobase/app-plugin-projects/shared/statuses';
import { useTranslation } from '@nocobase/i18n/client';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  ExternalLinkIcon,
  MessageSquareIcon,
  PencilIcon,
  UndoIcon,
} from 'lucide-react';
import {
  useCallback,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { cn } from 'cn';

import type { IssuePullRequests } from '../../../shared/git.js';
import type { IssueProgress } from '../../../shared/project-manager.js';
import { useIssuePullRequests, usePullRequestMark } from '../../git/api.js';
import { MergeButtons } from '../../git/pull-requests.js';
import { IssueProgressLine } from '../detail/issue-progress.js';
import { OwnerHandoffActions } from '../detail/owner-handoff.js';
import {
  handoffWaitsOn,
  useOwnerHandoffView,
} from '../detail/use-owner-handoff.js';
import { absoluteUrl } from '../../previews/api.js';
import { useIssuePreviews } from '../../previews/use-issue-previews.js';
import { progressSentence } from '../detail/progress-text.js';
import { useIssueProgress } from '../detail/use-issue-progress.js';
import { IssueMarkdown } from '../markdown.js';
import { Clamped } from './clamped.js';
import { useOptionalIssueConversation } from './conversation-state.js';
import { deliveryCommentOf } from './feed-rows.js';
import { StatusPill } from './status.js';
import { askOf } from './summary-model.js';
import { useOutOfView } from './use-out-of-view.js';

/** Renaming the issue from its title, with the words for the pencil and the input. */
export interface SummaryRename {
  readonly onRename: (title: string) => Promise<void>;
  readonly editLabel: string;
  readonly inputLabel: string;
}

export function IssueSummary({
  issue,
  update,
  refresh,
  progressFallback,
  actions,
  collapsible = false,
  defaultCollapsed = false,
  pinnedBar = false,
  pinnedBarClassName,
  headingLevel = 2,
  rename,
  runsBase,
  className,
}: {
  readonly issue: IssueDetail;
  readonly update: IssueUpdate;
  /** Changes whenever the issue or its runs do, to read the "Now" line again. */
  readonly refresh: string;
  /** What "Now" says until the server answers, such as an overview's copy. */
  readonly progressFallback?: IssueProgress | null;
  /** On the second row, such as the follow star. */
  readonly actions?: ReactNode;
  readonly collapsible?: boolean;
  /** Starts as the one-line bar, as on a phone. */
  readonly defaultCollapsed?: boolean;
  /** Pins the one-line bar to the top once the summary has scrolled away. */
  readonly pinnedBar?: boolean;
  /** The pinned bar's frame, such as a margin that cancels its parent's gap. */
  readonly pinnedBarClassName?: string;
  /** The title's heading level: 1 where it is the page's title. */
  readonly headingLevel?: 1 | 2;
  readonly rename?: SummaryRename;
  /** Where the live run's record opens from, such as `/issues/PM-12`; the issue's own path by default. */
  readonly runsBase?: string;
  /** The summary's frame. */
  readonly className?: string;
}): ReactElement {
  const { t } = useTranslation();
  const Title = headingLevel === 1 ? 'h1' : 'h2';
  const viewer = useViewer();
  const ref = useRef<HTMLElement>(null);
  const away = useOutOfView(ref);
  const [folded, setFolded] = useState<boolean | null>(null);
  const mark = usePullRequestMark(issue.id, issue.revision).data;
  const pullRequests = useIssuePullRequests(issue.id, issue.revision).data;
  const progress = useIssueProgress(issue.id, refresh, progressFallback).data;
  const owned = Boolean(viewer?.userId) && issue.ownerUserId === viewer?.userId;
  const ask = askOf(
    t,
    { owned, statusKey: issue.statusKey, progress: progress ?? null },
    mark,
  );
  const collapsed = collapsible && (folded ?? defaultCollapsed);
  const checks =
    mark && mark.state === 'open' && mark.ciState
      ? t(`issueLive.summary.checks.${mark.ciState}`)
      : null;
  // From the pinned bar: open the summary and bring it into view.
  const showWhole = useCallback(() => {
    setFolded(false);
    requestAnimationFrame(() =>
      ref.current?.scrollIntoView({ block: 'start' }),
    );
  }, []);
  return (
    <>
      {pinnedBar ? (
        // Takes no room: once the summary has scrolled away its bar floats at the top of the scrolling area.
        <div
          className={cn('sticky top-0 z-20 h-0', pinnedBarClassName)}
          aria-hidden={away ? undefined : true}
        >
          {away ? (
            <div
              className='absolute inset-x-0 top-0 rounded-b-lg border bg-card/95 px-4 py-2 text-card-foreground shadow-sm backdrop-blur-md'
              data-testid='issue-summary-bar'
            >
              <SummaryBar
                pinned
                Title={Title}
                issue={issue}
                progress={progress ?? null}
                ask={ask}
                pullRequests={pullRequests}
                expand={<ToggleSummary open={false} onClick={showWhole} />}
              />
            </div>
          ) : null}
        </div>
      ) : null}
      <section
        ref={ref}
        aria-label={t('issueLive.summary.label')}
        data-testid='issue-summary'
        data-collapsed={collapsed ? '' : undefined}
        className={cn(
          'flex flex-col',
          collapsed ? 'gap-2' : 'gap-3',
          className,
        )}
      >
        {collapsed ? (
          <SummaryBar
            pinned={false}
            Title={Title}
            issue={issue}
            progress={progress ?? null}
            ask={ask}
            pullRequests={pullRequests}
            expand={
              collapsible ? (
                <ToggleSummary open={false} onClick={() => setFolded(false)} />
              ) : null
            }
          />
        ) : (
          <>
            <SummaryTitle
              title={issue.title}
              Title={Title}
              {...(rename ? { rename } : {})}
            />
            {/* Key and status, then the actions: one row on a wide screen, two left-aligned rows on a phone. */}
            <div className='flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center'>
              <span className='flex items-center gap-2'>
                <span className='font-mono text-sm text-muted-foreground'>
                  {issue.identifier}
                </span>
                <StatusPill statusKey={issue.statusKey} />
              </span>
              <span className='flex flex-wrap items-center gap-2 sm:ml-auto max-sm:[&_[data-slot=button]]:h-7 max-sm:[&_[data-slot=button]]:px-2 max-sm:[&_[data-slot=button]]:text-xs'>
                {actions}
                {collapsible ? (
                  <ToggleSummary open onClick={() => setFolded(true)} />
                ) : null}
              </span>
            </div>
            <IssueProgressLine
              issue={issue}
              refresh={refresh}
              starting={update.isPending}
              onStart={() => update.mutate({ statusKey: IN_PROGRESS_STATUS })}
              {...(runsBase ? { runsBase } : {})}
            />
            <NeedsYouCard
              issue={issue}
              update={update}
              ask={ask}
              checks={checks}
              conflict={Boolean(mark?.conflict)}
              pullRequests={pullRequests}
              fallback={
                <PullRequestLine
                  issue={issue}
                  pullRequests={pullRequests}
                  checks={checks}
                  conflict={Boolean(mark?.conflict)}
                />
              }
            />
          </>
        )}
      </section>
    </>
  );
}

/** Opens or folds the summary. */
function ToggleSummary({
  open,
  onClick,
}: {
  readonly open: boolean;
  readonly onClick: () => void;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <Button size='sm' variant='ghost' aria-expanded={open} onClick={onClick}>
      {open ? (
        <ChevronUpIcon data-icon='inline-start' />
      ) : (
        <ChevronDownIcon data-icon='inline-start' />
      )}
      {open ? t('issueLive.summary.collapse') : t('issueLive.summary.expand')}
    </Button>
  );
}

/** The one-line bar: status, title, what waits for the viewer, and the way to the whole summary. */
function SummaryBar({
  pinned,
  Title,
  issue,
  progress,
  ask,
  pullRequests,
  expand,
}: {
  /** The copy pinned at the top, whose title is not a heading again. */
  readonly pinned: boolean;
  readonly Title: 'h1' | 'h2';
  readonly issue: IssueDetail;
  readonly progress: IssueProgress | null;
  readonly ask: string | null;
  readonly pullRequests: IssuePullRequests | undefined;
  readonly expand: ReactNode;
}): ReactElement {
  const titleClass =
    'min-w-0 flex-1 basis-32 truncate text-base leading-snug font-semibold';
  return (
    <div className='flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1.5'>
      <StatusPill statusKey={issue.statusKey} />
      {pinned ? (
        <span className={titleClass}>{issue.title}</span>
      ) : (
        <Title className={titleClass}>{issue.title}</Title>
      )}
      <NeedsYou
        issue={issue}
        progress={progress}
        ask={ask}
        pullRequests={pullRequests}
      />
      {expand}
    </div>
  );
}

/** The title on a line of its own, wrapping between words; the pencil edits it in place. */
function SummaryTitle({
  title,
  Title,
  rename,
}: {
  readonly title: string;
  readonly Title: 'h1' | 'h2';
  readonly rename?: SummaryRename;
}): ReactElement {
  const [draft, setDraft] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // Enter saves and then blurs the disabled input, which would save a second time without this guard.
  const savingRef = useRef(false);
  const save = (): void => {
    if (savingRef.current) return;
    const next = draft?.trim() ?? '';
    if (!next || next === title || !rename) {
      setDraft(null);
      return;
    }
    savingRef.current = true;
    setSaving(true);
    void rename
      .onRename(next)
      .catch(() => undefined)
      .finally(() => {
        savingRef.current = false;
        setSaving(false);
        setDraft(null);
      });
  };
  if (draft !== null)
    return (
      <div className='flex items-center gap-2'>
        <Input
          value={draft}
          autoFocus
          aria-label={rename?.inputLabel}
          className='h-9 text-base font-semibold'
          disabled={saving}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={save}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
              event.preventDefault();
              save();
            } else if (event.key === 'Escape') {
              event.preventDefault();
              setDraft(null);
            }
          }}
        />
        {saving ? <Spinner /> : null}
      </div>
    );
  return (
    <div className='group flex min-w-0 items-start gap-1'>
      <Title className='min-w-0 flex-1 font-heading text-lg leading-snug font-semibold text-pretty wrap-break-word'>
        {title}
      </Title>
      {rename ? (
        <Button
          variant='ghost'
          size='icon-sm'
          aria-label={rename.editLabel}
          className='shrink-0 opacity-60 group-hover:opacity-100 focus-visible:opacity-100'
          onClick={() => setDraft(title)}
        >
          <PencilIcon />
        </Button>
      ) : null}
    </div>
  );
}

/** The bar's part of what waits on the viewer: taking over a handoff, merging, or answering. */
function NeedsYou({
  issue,
  progress,
  ask,
  pullRequests,
}: {
  readonly issue: IssueDetail;
  readonly progress: IssueProgress | null;
  readonly ask: string | null;
  readonly pullRequests: IssuePullRequests | undefined;
}): ReactElement | null {
  const { t } = useTranslation();
  const conversation = useOptionalIssueConversation();
  if (progress?.waiting?.reason === 'waitingOwner')
    return (
      <span
        className='flex min-w-0 flex-wrap items-center gap-2 text-sm'
        data-testid='issue-needs-you-bar'
      >
        <span className='text-muted-foreground'>
          {progressSentence(t, progress)}
        </span>
        <OwnerHandoffActions issueId={issue.id} />
      </span>
    );
  if (!ask) return null;
  const open = pullRequests?.data.find((pr) => pr.state === 'open') ?? null;
  return (
    <span
      className='flex min-w-0 items-center gap-2 text-sm'
      data-testid='issue-needs-you-bar'
    >
      <span className='hidden max-w-64 truncate text-amber-700 lg:inline dark:text-amber-300'>
        {ask}
      </span>
      {issue.statusKey === IN_REVIEW_STATUS &&
      open &&
      pullRequests?.canMerge ? (
        <MergeButtons issue={issue} pullRequest={open} mergeOnly />
      ) : issue.statusKey === BLOCKED_STATUS && conversation?.mayComment ? (
        <Button size='sm' onClick={() => conversation.openComposer()}>
          <MessageSquareIcon data-icon='inline-start' />
          {t('issueLive.summary.answer')}
        </Button>
      ) : null}
    </span>
  );
}

/**
 * What waits for the viewer, as one card: accepting the work in review (the pull request, its checks, the manager's
 * delivery report and the decisions on it), an owner handoff to take over, or a question to answer. Without any, the
 * `fallback` (the pull request's line).
 */
function NeedsYouCard({
  issue,
  update,
  ask,
  checks,
  conflict,
  pullRequests,
  fallback,
}: {
  readonly issue: IssueDetail;
  readonly update: IssueUpdate;
  readonly ask: string | null;
  readonly checks: string | null;
  readonly conflict: boolean;
  readonly pullRequests: IssuePullRequests | undefined;
  readonly fallback: ReactNode;
}): ReactNode {
  const { t } = useTranslation();
  const viewer = useViewer();
  const conversation = useOptionalIssueConversation();
  const handoff = useOwnerHandoffView(issue.id).data;
  const frame =
    'flex flex-col gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-3 text-sm';
  const heading = (text: string, extra?: ReactNode): ReactElement => (
    <div
      className='flex flex-wrap items-baseline gap-x-2 gap-y-1'
      data-testid='issue-needs-you'
    >
      <strong className='font-semibold'>
        {t('issueLive.summary.needsYou')}
      </strong>
      <span className='min-w-0 font-medium wrap-break-word'>{text}</span>
      {extra}
    </div>
  );
  if (issue.statusKey === IN_REVIEW_STATUS && ask) {
    const open = pullRequests?.data.find((pr) => pr.state === 'open') ?? null;
    const shown = open ?? pullRequests?.data[0] ?? null;
    const delivery = deliveryCommentOf(issue);
    const state = [checks, conflict ? t('issueLive.summary.conflict') : null]
      .filter(Boolean)
      .join(' · ');
    return (
      <section
        aria-label={t('issueLive.summary.needsYou')}
        data-testid='issue-delivery'
        className={frame}
      >
        {heading(
          open
            ? t('issueLive.summary.acceptPullRequest', {
                label: `PR #${open.number}`,
                title: open.title,
              })
            : ask,
          state ? (
            <span className='text-xs text-muted-foreground'>{state}</span>
          ) : null,
        )}
        <div className='flex flex-col gap-1 rounded-md bg-background/70 px-3 py-2'>
          <h3 className='text-xs font-medium text-muted-foreground'>
            {delivery?.report
              ? t('issueLive.summary.delivery')
              : t('issueLive.summary.latestAgentComment')}
            {delivery?.comment.authorName
              ? ` · ${delivery.comment.authorName}`
              : null}
          </h3>
          {delivery ? (
            <Clamped>
              <IssueMarkdown
                content={delivery.comment.content}
                className='text-sm'
              />
            </Clamped>
          ) : (
            <p className='text-muted-foreground'>
              {t('issueLive.summary.deliveryNone')}
            </p>
          )}
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          {open && pullRequests?.canMerge ? (
            <MergeButtons issue={issue} pullRequest={open} />
          ) : null}
          {shown ? (
            <Button
              size='sm'
              variant='outline'
              nativeButton={false}
              render={<a href={shown.url} target='_blank' rel='noreferrer' />}
            >
              <ExternalLinkIcon data-icon='inline-start' />
              {t('issueLive.summary.viewChanges')}
            </Button>
          ) : null}
          {canEditIssues(viewer) ? (
            <Button
              size='sm'
              variant='outline'
              title={t('issueLive.summary.sendBackHint')}
              disabled={update.isPending}
              onClick={() => update.mutate({ statusKey: IN_PROGRESS_STATUS })}
            >
              {update.isPending ? (
                <Spinner data-icon='inline-start' />
              ) : (
                <UndoIcon data-icon='inline-start' />
              )}
              {t('issueLive.summary.sendBack')}
            </Button>
          ) : null}
        </div>
      </section>
    );
  }
  if (handoffWaitsOn(handoff))
    return (
      <section aria-label={t('issueLive.summary.needsYou')} className={frame}>
        {heading(t('issueLive.summary.takeOver'))}
        <OwnerHandoffActions issueId={issue.id} />
      </section>
    );
  if (ask)
    return (
      <section aria-label={t('issueLive.summary.needsYou')} className={frame}>
        {heading(ask)}
        {conversation?.mayComment ? (
          <div>
            <Button size='sm' onClick={() => conversation.openComposer()}>
              <MessageSquareIcon data-icon='inline-start' />
              {t('issueLive.summary.answer')}
            </Button>
          </div>
        ) : null}
      </section>
    );
  return fallback;
}

/** The issue's pull request on one line: number, title, checks, conflicts and its ready preview. */
function PullRequestLine({
  issue,
  pullRequests,
  checks,
  conflict,
}: {
  readonly issue: IssueDetail;
  readonly pullRequests: IssuePullRequests | undefined;
  readonly checks: string | null;
  readonly conflict: boolean;
}): ReactElement | null {
  const { t } = useTranslation();
  const previews = useIssuePreviews(issue.id).query.data?.previews ?? [];
  const pr =
    pullRequests?.data.find((item) => item.state === 'open') ??
    pullRequests?.data[0] ??
    null;
  if (!pr) return null;
  const preview = previews.find(
    (item) =>
      item.status === 'ready' &&
      item.url &&
      item.pullRequest?.repo === pr.repo &&
      item.pullRequest.number === pr.number,
  );
  const open = pr.state === 'open';
  return (
    <p
      className='flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-sm'
      data-testid='issue-pull-request-line'
    >
      <a
        href={pr.url}
        target='_blank'
        rel='noreferrer'
        className='min-w-0 font-medium hover:underline'
      >
        PR #{pr.number}
        <span className='font-normal text-muted-foreground'> {pr.title}</span>
      </a>
      {open && (checks || conflict) ? (
        <span className='text-muted-foreground'>
          {[checks, conflict ? t('issueLive.summary.conflict') : null]
            .filter(Boolean)
            .join(' · ')}
        </span>
      ) : null}
      {preview?.url ? (
        <a
          href={absoluteUrl(preview.url)}
          target='_blank'
          rel='noreferrer'
          className='inline-flex items-center gap-1 text-primary hover:underline'
        >
          <ExternalLinkIcon className='size-3.5' aria-hidden />
          {t('issueLive.summary.preview')}
        </a>
      ) : null}
    </p>
  );
}
