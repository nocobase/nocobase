/**
 * Route `/issues/:issueId`: an issue's page, a covering child page over the issues list so the list keeps its filters
 * and scroll. The same page is declared under the other lists that open issues (`issueDetailRoute` in `routes.ts`): a
 * tab of `/my-issues` and a project's Issues tab; its trail and its links to other issues follow the list it is under
 * (`issues/detail/issue-parent.tsx`). The parameter is an id or an identifier (`/issues/PM-12`); the API answers either.
 * The page is the installed `issue-detail` block and its sibling items over the projects plugin's headless hooks
 * (`issues/detail/`), with Studio's own sections placed between the plugin's, and the live summary, feed and composer it
 * shares with "My follow-ups" (`issues/live/`). The main column, top to bottom:
 *
 * - the summary, pinned while the page scrolls: the title (the page's heading, renamed in place), key, status, pull
 *   request and checks, "Now" with "Start", what waits for the viewer, the delivery in review, and the follow star. It
 *   folds to a one-line bar with what waits for the viewer (Merge, Answer, Take over) while the page is scrolled down
 *   and on a phone;
 * - the body card: the parent, the project, Studio's marks, "Ask agent" and "Delete", an agent comment the comment run limit held back,
 *   "Waiting for you", the description, the add bar, sub-issues, dependencies, files, related plans, project setup,
 *   then Code and deployments;
 * - the activity card, newest first, conversation only by default, its composer pinned to the bottom edge.
 *
 * The side column keeps properties, notifications, dates and execution history. The page polls the issue and its runs
 * even while idle, speeds up after an action, and reloads on run transitions. Its child routes (`new-subtask`, the
 * plugin's; a run's transcript at `runs/:runId`) render beside the covering page.
 */
import { ApiClientError } from '@nocobase/app-client';
import {
  canEditIssues,
  useIssueDetail,
  useIssuePageActions,
  useIssueUpdate,
} from '@nocobase/app-plugin-projects/client/issues';
import {
  PmDetailSkeleton,
  PmLoadError,
  pmKeys,
  usePageContextSource,
  useViewer,
} from '@nocobase/app-plugin-projects/client/kit';
import type { IssueDetail } from '@nocobase/app-plugin-projects/shared/issues';
import { useTranslation } from '@nocobase/i18n/client';
import {
  useCallback,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import { ArrowLeftIcon } from 'lucide-react';
import { Link, useParams, useLocation } from 'react-router';

import { RouteChildPage } from '@/components/route-child-page';
import { Button } from '@/components/ui/button';
import { useMediaQuery } from '@/extensions/nocobase-agent-chat/use-media-query';
import {
  ISSUE_SURFACE,
  IssueDetailLayout,
  IssueFileDrop,
  IssueSurface,
} from '@/extensions/nocobase-issue-detail/issue-detail';
import { cn } from 'cn';

import { AskAgent } from '../../../agents/ask-agent.js';
import { IssueRunRow } from '../../../agents/issue-runs.js';
import { IssueInitSection } from '../../../projects/init-card.js';
import { IssueWaitingSection } from '../../../inbox/issue-waiting.js';
import {
  IssueCodeAddButton,
  IssueCodeSection,
} from '../../../issues/detail/code-section.js';
import {
  IssueAddSection,
  IssueDependenciesSection,
  IssueDescriptionSection,
  IssueFilesSection,
  IssueBodyHeader,
  IssueSubtasksSection,
} from '../../../issues/detail/issue-main.js';
import { useIssueMainState } from '../../../issues/detail/main-state.js';
import { IssueCommentRunLimit } from '../../../issues/detail/comment-run-limit.js';
import { IssuePlansSection } from '../../../issues/detail/issue-plans.js';
import { IssueParentOutlet } from '../../../issues/detail/issue-parent-outlet.js';
import { useIssueParent } from '../../../issues/detail/issue-parent.js';
import { useIssuePageWording } from '../../../issues/detail/labels.js';
import { IssueMarks } from '../../../issues/issue-marks.js';
import { IssueConversation } from '../../../issues/live/conversation.js';
import { useIssueConversation } from '../../../issues/live/conversation-state.js';
import { FollowToggle } from '../../../issues/live/follow-toggle.js';
import { IssueComposer } from '../../../issues/live/issue-composer.js';
import { IssueFeed } from '../../../issues/live/issue-feed.js';
import { IssueSummary } from '../../../issues/live/issue-summary.js';
import { PhoneBar } from '../../../layouts/components/phone-bar.js';
import {
  handoffWaitsOn,
  useOwnerHandoffView,
} from '../../../issues/detail/use-owner-handoff.js';
import { coveredBySummary } from '../../../issues/live/summary-model.js';
import type { InboxEntry } from '@/extensions/nocobase-inbox/model';
import { IN_REVIEW_STATUS } from '@nocobase/app-plugin-projects/shared/statuses';
import { IssuePageAside } from './aside.js';
import { useLiveIssue } from './use-live-issue.js';

export default function IssueDetailPage(): ReactElement {
  const { issueId = '' } = useParams();
  const parent = useIssueParent();
  return (
    <>
      <RouteChildPage>
        <IssueLoader key={issueId} issueId={issueId} />
      </RouteChildPage>
      {/* The pages under the issue (a plan, a run) are under the same list. */}
      <IssueParentOutlet parent={parent} />
    </>
  );
}

function IssueLoader({ issueId }: { readonly issueId: string }): ReactElement {
  const { t } = useIssuePageWording();
  const parent = useIssueParent();
  const { hash } = useLocation();
  const detail = useIssueDetail(issueId);
  const missing =
    detail.error instanceof ApiClientError &&
    [403, 404].includes(detail.error.status);
  // Scoped workspace detail links must also hide cached content after access is revoked.
  if (detail.isError && (!detail.data || missing)) {
    return (
      <div className='p-6 md:p-8'>
        <PmLoadError
          title={t('issue.loadFailed')}
          error={detail.error}
          {...(missing
            ? {
                action: (
                  <Button
                    variant='outline'
                    size='sm'
                    nativeButton={false}
                    render={
                      <Link
                        to={{
                          pathname: parent.path,
                          search: parent.search,
                          hash,
                        }}
                      />
                    }
                  >
                    {t('issue.backToList')}
                  </Button>
                ),
              }
            : { onRetry: () => void detail.refetch() })}
        />
      </div>
    );
  }
  if (!detail.data) return <PmDetailSkeleton />;
  return <IssuePage detail={detail.data} issueId={issueId} />;
}

function IssuePage({
  detail,
  issueId,
}: {
  readonly detail: IssueDetail;
  readonly issueId: string;
}): ReactElement {
  const { t } = useTranslation();
  const wording = useIssuePageWording();
  const parent = useIssueParent();
  const { hash } = useLocation();
  const detailKey = useMemo(() => pmKeys.issue(issueId), [issueId]);
  const update = useIssueUpdate(detail, detailKey);
  const pageActions = useIssuePageActions(detail);
  const [runRefresh, setRunRefresh] = useState(0);
  const runs = useLiveIssue(detail, issueId, detailKey, runRefresh);
  // The "Now" line reads again whenever the issue or one of its runs changes.
  const progressRefresh = [
    detail.revision,
    detail.statusKey,
    ...runs.map((run) => `${run.id}:${run.status}`),
  ].join('|');
  const main = useIssueMainState(pageActions);
  const narrow = useMediaQuery('(max-width: 767px)');
  const viewer = useViewer();
  // The decisions the summary's "Needs you" card shows are left out of "Waiting for you".
  const handoff = useOwnerHandoffView(detail.id).data;
  const covered = useCallback(
    (entry: InboxEntry) =>
      coveredBySummary(entry, {
        accepting:
          detail.statusKey === IN_REVIEW_STATUS &&
          Boolean(viewer?.userId) &&
          viewer?.userId === detail.ownerUserId,
        handoff: handoffWaitsOn(handoff),
      }),
    [detail.statusKey, detail.ownerUserId, viewer?.userId, handoff],
  );
  const [linkingPullRequest, setLinkingPullRequest] = useState(false);
  const linking = {
    linking: linkingPullRequest,
    setLinking: setLinkingPullRequest,
  };
  // Design proposals earlier versions posted stay tagged.
  const kindLabels = useMemo(() => ({ proposal: t('design.tag') }), [t]);
  const entry = useMemo(
    () =>
      ({
        kind: 'issue',
        id: detail.id,
        label: `${detail.identifier} ${detail.title}`,
      }) as const,
    [detail.id, detail.identifier, detail.title],
  );
  usePageContextSource(entry);

  return (
    <IssueDetailLayout
      asideLabel={wording.detail.properties}
      main={
        <IssueConversation detail={detail} detailKey={detailKey}>
          {/* A phone's only top row: back to the list, the navigation and the agent chat. */}
          <PhoneBar className='-mb-2 bg-card px-2'>
            <Button
              size='sm'
              variant='ghost'
              nativeButton={false}
              render={
                <Link
                  to={{ pathname: parent.path, search: parent.search, hash }}
                />
              }
            >
              <ArrowLeftIcon data-icon='inline-start' />
              {wording.t('issue.backToList')}
            </Button>
          </PhoneBar>
          {/* It scrolls with the page; its one-line bar stays at the top once it is gone. A phone starts with the bar. */}
          <IssueSummary
            issue={detail}
            update={update}
            refresh={progressRefresh}
            actions={<FollowToggle issueId={detail.id} />}
            collapsible
            defaultCollapsed={narrow}
            pinnedBar
            pinnedBarClassName='-mb-2 md:-mb-6'
            className='rounded-lg border bg-card px-4 py-3 text-card-foreground md:px-6 max-md:rounded-none max-md:border-0'
            headingLevel={1}
            {...(canEditIssues(viewer)
              ? {
                  rename: {
                    onRename: async (title: string) => {
                      await update.mutateAsync({ title });
                    },
                    editLabel: wording.detail.editTitle,
                    inputLabel: wording.detail.titleLabel,
                  },
                }
              : {})}
          />
          <IssueFileDrop
            {...(main.canUpload ? { onFiles: main.upload } : {})}
            className={cn(ISSUE_SURFACE, 'flex flex-col gap-6')}
          >
            <IssueBodyHeader
              detail={detail}
              pageActions={pageActions}
              actions={<AskAgent placement='issue' entry={entry} />}
              meta={<IssueMarks issue={detail} placement='detail' />}
            />
            <IssueCommentRunLimit
              issue={detail}
              onContinued={() => setRunRefresh((value) => value + 1)}
            />
            <IssueWaitingSection issue={detail} covered={covered} />
            <IssueDescriptionSection detail={detail} update={update} />
            <IssueAddSection detail={detail} state={main}>
              <IssueCodeAddButton issue={detail} {...linking} />
            </IssueAddSection>
            <IssueSubtasksSection detail={detail} />
            <IssueDependenciesSection
              detail={detail}
              pageActions={pageActions}
              state={main}
            />
            <IssueFilesSection
              detail={detail}
              pageActions={pageActions}
              state={main}
            />
            <IssuePlansSection issue={detail} />
            <IssueInitSection issue={detail} />
            <IssueCodeSection issue={detail} {...linking} />
          </IssueFileDrop>
          <ActivityCard>
            <IssueFeed
              runs={runs}
              renderRun={(runId) => (
                <IssueRunRow issue={detail} runId={runId} />
              )}
              kindLabels={kindLabels}
            />
          </ActivityCard>
          {/* The activity card's bottom edge, pinned while the page scrolls. */}
          <IssueComposer
            foldable={narrow}
            className='sticky bottom-0 z-10 -mt-2 rounded-b-lg border bg-card/95 px-4 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] text-card-foreground backdrop-blur-md max-md:rounded-none max-md:border-x-0 md:-mt-6 md:px-6 md:pt-3 md:pb-3'
          />
        </IssueConversation>
      }
      aside={
        <IssuePageAside
          detail={detail}
          update={update}
          pageActions={pageActions}
        />
      }
    />
  );
}

/** The activity's card; its bottom edge is the composer's when the viewer may comment. */
function ActivityCard({
  children,
}: {
  readonly children: ReactNode;
}): ReactElement {
  const { mayComment } = useIssueConversation();
  const { thread } = useIssuePageWording();
  return (
    <IssueSurface
      className={cn(mayComment && 'rounded-b-none border-b-0')}
      aria-label={thread.title}
    >
      {children}
    </IssueSurface>
  );
}
