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
import { useRef, useState, type ReactElement, type ReactNode } from 'react';

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
import { progressSentence } from '../detail/progress-text.js';
import { useIssueProgress } from '../detail/use-issue-progress.js';
import { IssueMarkdown } from '../markdown.js';
import { Clamped } from './clamped.js';
import { useOptionalIssueConversation } from './conversation-state.js';
import { deliveryCommentOf } from './feed-rows.js';
import { StatusPill } from './status.js';
import { askOf, pullRequestLabel } from './summary-model.js';
import { useScrollCompact } from './use-scroll-compact.js';

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
  autoCompact = false,
  headingLevel = 2,
  rename,
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
  /** Folds to the bar while the page is scrolled down. */
  readonly autoCompact?: boolean;
  /** The title's heading level: 1 where it is the page's title. */
  readonly headingLevel?: 1 | 2;
  readonly rename?: SummaryRename;
  readonly className?: string;
}): ReactElement {
  const { t } = useTranslation();
  const Title = headingLevel === 1 ? 'h1' : 'h2';
  const viewer = useViewer();
  const ref = useRef<HTMLElement>(null);
  const scroll = useScrollCompact(ref, collapsible && autoCompact);
  // What the viewer chose, until the page is next scrolled down.
  const [folded, setFolded] = useState<{
    readonly value: boolean;
    readonly epoch: number;
  } | null>(null);
  const mark = usePullRequestMark(issue.id, issue.revision).data;
  const pullRequests = useIssuePullRequests(issue.id, issue.revision).data;
  const progress = useIssueProgress(issue.id, refresh, progressFallback).data;
  const owned = Boolean(viewer?.userId) && issue.ownerUserId === viewer?.userId;
  const ask = askOf(
    t,
    { owned, statusKey: issue.statusKey, progress: progress ?? null },
    mark,
  );
  const auto = defaultCollapsed || scroll.scrolled;
  const collapsed =
    collapsible &&
    (folded && folded.epoch === scroll.epoch ? folded.value : auto);
  const checks =
    mark && mark.state === 'open' && mark.ciState
      ? t(`issueLive.summary.checks.${mark.ciState}`)
      : null;
  const toggle = collapsible ? (
    <Button
      size='sm'
      variant='ghost'
      aria-expanded={!collapsed}
      onClick={() => setFolded({ value: !collapsed, epoch: scroll.epoch })}
    >
      {collapsed ? (
        <ChevronDownIcon data-icon='inline-start' />
      ) : (
        <ChevronUpIcon data-icon='inline-start' />
      )}
      {collapsed
        ? t('issueLive.summary.expand')
        : t('issueLive.summary.collapse')}
    </Button>
  ) : null;
  return (
    <section
      ref={ref}
      aria-label={t('issueLive.summary.label')}
      data-testid='issue-summary'
      data-collapsed={collapsed ? '' : undefined}
      className={cn('flex flex-col', collapsed ? 'gap-2' : 'gap-3', className)}
    >
      {collapsed ? (
        <div className='flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1.5'>
          <StatusPill statusKey={issue.statusKey} />
          <Title className='min-w-0 flex-1 basis-32 truncate text-base leading-snug font-semibold'>
            {issue.title}
          </Title>
          <NeedsYou
            issue={issue}
            progress={progress ?? null}
            ask={ask}
            pullRequests={pullRequests}
          />
          {toggle}
        </div>
      ) : (
        <>
          <SummaryTitle
            title={issue.title}
            Title={Title}
            {...(rename ? { rename } : {})}
          />
          <div className='flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1.5'>
            <span className='font-mono text-sm text-muted-foreground'>
              {issue.identifier}
            </span>
            <StatusPill statusKey={issue.statusKey} />
            <span className='ml-auto flex flex-wrap items-center gap-2'>
              {actions}
              {toggle}
            </span>
          </div>
          {mark?.state === 'open' ? (
            <p className='flex flex-wrap items-center gap-x-2 text-sm'>
              <a
                href={mark.url}
                target='_blank'
                rel='noreferrer'
                className='hover:underline'
              >
                {pullRequestLabel(mark)}
              </a>
              {checks || mark.conflict ? (
                <span className='text-muted-foreground'>
                  {[
                    checks,
                    mark.conflict ? t('issueLive.summary.conflict') : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              ) : null}
            </p>
          ) : null}
          <IssueProgressLine
            issue={issue}
            refresh={refresh}
            starting={update.isPending}
            onStart={() => update.mutate({ statusKey: IN_PROGRESS_STATUS })}
          />
          {ask ? (
            <div
              className='flex flex-wrap items-center gap-x-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-sm'
              data-testid='issue-needs-you'
            >
              <strong className='font-semibold'>
                {t('issueLive.summary.needsYou')}
              </strong>
              <span className='min-w-0 wrap-anywhere'>{ask}</span>
            </div>
          ) : null}
          {issue.statusKey === IN_REVIEW_STATUS ? (
            <Delivery
              issue={issue}
              update={update}
              canEdit={canEditIssues(viewer)}
            />
          ) : null}
        </>
      )}
    </section>
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
        <Button
          size='sm'
          onClick={() => conversation.editorRef.current?.focus()}
        >
          <MessageSquareIcon data-icon='inline-start' />
          {t('issueLive.summary.answer')}
        </Button>
      ) : null}
    </span>
  );
}

/** In review: what was delivered, and the decisions on it. */
function Delivery({
  issue,
  update,
  canEdit,
}: {
  readonly issue: IssueDetail;
  readonly update: IssueUpdate;
  readonly canEdit: boolean;
}): ReactElement {
  const { t } = useTranslation();
  const pullRequests = useIssuePullRequests(issue.id, issue.revision).data;
  const open = pullRequests?.data.find((pr) => pr.state === 'open') ?? null;
  const shown = open ?? pullRequests?.data[0] ?? null;
  const comment = deliveryCommentOf(issue);
  return (
    <section
      aria-label={t('issueLive.summary.delivery')}
      data-testid='issue-delivery'
      className='flex flex-col gap-2 rounded-lg border px-3 py-2.5 text-sm'
    >
      <h3 className='text-xs font-medium text-muted-foreground'>
        {t('issueLive.summary.delivery')}
        {comment?.authorName ? ` · ${comment.authorName}` : null}
      </h3>
      {comment ? (
        <Clamped>
          <IssueMarkdown content={comment.content} className='text-sm' />
        </Clamped>
      ) : (
        <p className='text-muted-foreground'>
          {t('issueLive.summary.deliveryNone')}
        </p>
      )}
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
        {canEdit ? (
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
