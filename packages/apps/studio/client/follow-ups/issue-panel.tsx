/**
 * The middle column of "My follow-ups": one issue live, with what the issue page shares (`../issues/live/`): its
 * summary (status, pull request, "Now", what the viewer has to do, the delivery in review) with the follow star and
 * "Open issue", its feed newest first, and the composer to reply without leaving the page. The issue is read with the
 * issue page's own query, which the projects plugin's realtime refresh keeps current; reading it records that the
 * viewer looked (`markSeen`). On a phone it carries a way back to the lists.
 */
import { useIssueUpdate } from '@nocobase/app-plugin-projects/client/issues';
import { pmKeys, usePmApi } from '@nocobase/app-plugin-projects/client/kit';
import type { IssueDetail } from '@nocobase/app-plugin-projects/shared/issues';
import { useTranslation } from '@nocobase/i18n/client';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeftIcon, ExternalLinkIcon } from 'lucide-react';
import { useEffect, useMemo, type ReactElement, type ReactNode } from 'react';
import { Link } from 'react-router';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useMediaQuery } from '@/extensions/nocobase-agent-chat/use-media-query';
import { cn } from 'cn';

import type { FollowUpIssue } from '../../shared/follow-ups.js';
import { IssueConversation } from '../issues/live/conversation.js';
import { FollowToggle } from '../issues/live/follow-toggle.js';
import { IssueComposer } from '../issues/live/issue-composer.js';
import { IssueFeed } from '../issues/live/issue-feed.js';
import { IssueSummary } from '../issues/live/issue-summary.js';
import { PhoneBar } from '../layouts/components/phone-bar.js';

/** The issue is read again this often besides the realtime refresh, as a fallback. */
const POLL_MS = 60_000;

export function IssuePanel({
  issueId,
  summary,
  onSeen,
  onBack,
  className,
}: {
  readonly issueId: string;
  /** The overview's entry for it, when the viewer owns or follows it. */
  readonly summary: FollowUpIssue | null;
  /** The viewer looked at the issue as it is now. */
  readonly onSeen: (issueId: string) => void;
  /** Back to the lists, on a phone. */
  readonly onBack?: () => void;
  readonly className?: string;
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

  const backButton = onBack ? (
    <Button
      size='sm'
      variant='ghost'
      className='self-start lg:hidden'
      onClick={onBack}
    >
      <ArrowLeftIcon data-icon='inline-start' />
      {t('followUps.activity.back')}
    </Button>
  ) : null;
  // A phone's only top row is Back, with the navigation and the agent chat; a tablet keeps the shell's header.
  const back = backButton ? (
    <>
      <PhoneBar>{backButton}</PhoneBar>
      <div className='max-md:hidden'>{backButton}</div>
    </>
  ) : null;
  if (!data)
    return (
      <PanelFrame className={className}>
        <div className='flex flex-col gap-3 p-5'>
          {back}
          {detail.isError ? (
            <p className='text-sm text-muted-foreground'>
              {t('followUps.activity.loadFailed')}
            </p>
          ) : (
            <div className='flex flex-col gap-3' aria-busy='true'>
              <Skeleton className='h-5 w-40' />
              <Skeleton className='h-6 w-3/4' />
              <Skeleton className='h-16 w-full' />
              <Skeleton className='h-24 w-full' />
            </div>
          )}
        </div>
      </PanelFrame>
    );
  return (
    <PanelFrame className={className}>
      <LiveIssue
        issue={data}
        summary={summary}
        back={back}
        narrow={Boolean(onBack)}
      />
    </PanelFrame>
  );
}

function LiveIssue({
  issue,
  summary,
  back,
  narrow,
}: {
  readonly issue: IssueDetail;
  readonly summary: FollowUpIssue | null;
  readonly back: ReactNode;
  /** On a phone, where the summary starts as its bar. */
  readonly narrow: boolean;
}): ReactElement {
  const { t } = useTranslation();
  const detailKey = useMemo(() => pmKeys.issue(issue.id), [issue.id]);
  const update = useIssueUpdate(issue, detailKey);
  const issuePath = `/issues/${encodeURIComponent(issue.identifier)}`;
  const phone = useMediaQuery('(max-width: 767px)');
  return (
    <IssueConversation detail={issue} detailKey={detailKey}>
      {back ? <div className='px-2 pt-1 md:px-5 md:pt-4'>{back}</div> : null}
      {/* It scrolls with the activity; its one-line bar stays at the top once it is gone. */}
      <IssueSummary
        issue={issue}
        update={update}
        refresh={`${issue.revision}|${issue.statusKey}`}
        progressFallback={summary?.progress ?? null}
        collapsible
        defaultCollapsed={narrow}
        pinnedBar
        className='border-b px-5 py-4 max-md:px-4 max-md:py-3'
        actions={
          <>
            <FollowToggle issueId={issue.id} defaults />
            <Button
              size='sm'
              variant='outline'
              nativeButton={false}
              render={<Link to={issuePath} />}
            >
              <ExternalLinkIcon
                data-icon='inline-start'
                className='md:hidden'
              />
              <span className='max-md:sr-only'>
                {t('issueLive.summary.open')}
              </span>
            </Button>
          </>
        }
      />
      <IssueFeed className='px-5 py-4 max-md:px-4 max-md:py-3' />
      <IssueComposer
        foldable={phone}
        className='sticky bottom-0 z-10 rounded-b-xl border-t bg-card/95 px-5 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-md max-md:rounded-none max-md:px-4 max-md:pt-2 max-md:pb-[calc(0.5rem+env(safe-area-inset-bottom))]'
      />
    </IssueConversation>
  );
}

function PanelFrame({
  children,
  className,
}: {
  readonly children: ReactNode;
  readonly className?: string;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <section
      aria-label={t('followUps.activity.label')}
      className={cn(
        'flex min-w-0 flex-col rounded-xl border bg-card text-card-foreground max-md:rounded-none max-md:border-0',
        className,
      )}
      data-testid='follow-ups-activity'
    >
      {children}
    </section>
  );
}
