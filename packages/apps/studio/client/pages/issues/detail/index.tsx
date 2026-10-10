/**
 * Route `/issues/:issueId`: an issue's page, a covering child page over the issues list so the list keeps its filters
 * and scroll. The same page is declared under the other lists that open issues (`issueDetailRoute` in `routes.ts`): a
 * tab of `/my-issues` and a project's Issues tab; its trail and its links to other issues follow the list it is under
 * (`issues/detail/issue-parent.tsx`). The parameter is an id or an identifier (`/issues/PM-12`); the API answers either. The page is the
 * installed `issue-detail` block and its sibling items over the projects plugin's headless hooks
 * (`issues/detail/`), with Studio's own sections placed between the plugin's. The main column is two cards on the page's
 * background, as on Jira, Plane or GitHub. The first is the body: the title and the description, then every other part
 * as one `IssueSection` (heading row over content, a thin divider between), and a part with nothing to show takes no
 * room: the add bar under the description adds its first item. Files dropped or pasted on the body upload. The second
 * card is the activity, its composer pinned at the bottom; the side column is the properties' cards.
 *
 * - the header's "Ask agent", and in its meta line Studio's marks (pull requests, deployments) and who is working now;
 * - "Waiting for you" above the description, which leaves out the approval card while it decides it, and what the
 *   viewer asked of agents here that still waits for the owner (`agents/issue-run-requests.tsx`);
 * - the add bar (files, sub-issues, dependencies, and Studio's "Pull request");
 * - after the checklist, sub-issues, dependencies and files: the design proposal, the related plans, then Code and
 *   deployments (one row per pull request, unfolding into its previews and the environments it was deployed to) and
 *   the agents' execution log;
 * - the agents' runs on the activity line. The side column keeps the properties, the people and the dates.
 *
 * While a run is open the issue may change under it, so the page polls it, and reloads it when a run opens or ends.
 * Its child routes (`new-subtask`, the plugin's; a run's transcript at `runs/:runId`) render beside the covering page.
 */
import { ApiClientError } from '@nocobase/app-client';
import {
  useIssueDetail,
  useIssuePageActions,
  useIssueUpdate,
} from '@nocobase/app-plugin-projects/client/issues';
import {
  PmDetailSkeleton,
  PmLoadError,
  pmKeys,
  usePageContextSource,
  usePmApi,
} from '@nocobase/app-plugin-projects/client/kit';
import type { IssueDetail } from '@nocobase/app-plugin-projects/shared/issues';
import { useTranslation } from '@nocobase/i18n/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { Link, useParams } from 'react-router';

import { RouteChildPage } from '@/components/route-child-page';
import { Button } from '@/components/ui/button';
import {
  ISSUE_SURFACE,
  IssueDetailLayout,
  IssueFileDrop,
} from '@/extensions/nocobase-issue-detail/issue-detail';
import { cn } from 'cn';

import { DESIGN_PROPOSAL_KIND } from '../../../../shared/design.js';
import { AskAgent } from '../../../agents/ask-agent.js';
import { IssueRunRequestsSection } from '../../../agents/issue-run-requests.js';
import { DesignSection } from '../../../agents/design/section.js';
import {
  IssueLiveRun,
  IssueRunPanel,
  IssueRunRow,
} from '../../../agents/issue-runs.js';
import { useIssueRuns } from '../../../agents/use-issue-runs.js';
import { IssueInitSection } from '../../../projects/init-card.js';
import { IssueWaitingSection } from '../../../inbox/issue-waiting.js';
import { useWaitingCoversApproval } from '../../../inbox/use-waiting.js';
import { IssueActivity } from '../../../issues/detail/issue-activity.js';
import {
  IssueCodeAddButton,
  IssueCodeSection,
} from '../../../issues/detail/code-section.js';
import {
  IssueAddSection,
  IssueApprovalsSection,
  IssueChecklistSection,
  IssueDependenciesSection,
  IssueDescriptionSection,
  IssueFilesSection,
  IssueHeaderSection,
  IssueSubtasksSection,
} from '../../../issues/detail/issue-main.js';
import { useIssueMainState } from '../../../issues/detail/main-state.js';
import { IssueStageRunLimit } from '../../../issues/detail/stage-run-limit.js';
import { IssuePlansSection } from '../../../issues/detail/issue-plans.js';
import { IssueParentOutlet } from '../../../issues/detail/issue-parent-outlet.js';
import { useIssueParent } from '../../../issues/detail/issue-parent.js';
import { useIssuePageWording } from '../../../issues/detail/labels.js';
import { IssueMarks } from '../../../issues/issue-marks.js';
import { IssuePageAside } from './aside.js';

/** How often the issue is reloaded while a run on it is open, in case an announcement is missed. */
const RUN_POLL_MS = 5000;

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
  const detail = useIssueDetail(issueId);
  if (detail.isError && !detail.data) {
    const missing =
      detail.error instanceof ApiClientError &&
      [403, 404].includes(detail.error.status);
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
                        to={{ pathname: parent.path, search: parent.search }}
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
  const api = usePmApi();
  const queryClient = useQueryClient();
  const detailKey = useMemo(() => pmKeys.issue(issueId), [issueId]);
  const update = useIssueUpdate(detail, detailKey);
  const pageActions = useIssuePageActions(detail);
  const [stageRunRefresh, setStageRunRefresh] = useState(0);
  const runs = useIssueRuns(detail, stageRunRefresh);
  const approvalCovered = useWaitingCoversApproval(detail);
  const main = useIssueMainState(pageActions);
  const [linkingPullRequest, setLinkingPullRequest] = useState(false);
  const linking = {
    linking: linkingPullRequest,
    setLinking: setLinkingPullRequest,
  };
  const kindLabels = useMemo(
    () => ({ [DESIGN_PROPOSAL_KIND]: t('design.tag') }),
    [t],
  );
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

  // While a run is open the issue may change under it: poll it, and reload it when a run opens or ends.
  const working = runs.some((run) => run.open);
  useQuery({
    queryKey: detailKey,
    queryFn: () => api.issue(issueId),
    refetchInterval: working ? RUN_POLL_MS : false,
  });
  const openRuns = runs
    .filter((run) => run.open)
    .map((run) => run.id)
    .join(',');
  const seenRef = useRef(openRuns);
  useEffect(() => {
    if (seenRef.current === openRuns) return;
    seenRef.current = openRuns;
    void queryClient.invalidateQueries({ queryKey: detailKey });
  }, [openRuns, queryClient, detailKey]);

  return (
    <IssueDetailLayout
      asideLabel={wording.detail.properties}
      main={
        <IssueActivity
          detail={detail}
          detailKey={detailKey}
          runs={runs}
          renderRun={(runId) => <IssueRunRow issue={detail} runId={runId} />}
          kindLabels={kindLabels}
        >
          <IssueFileDrop
            {...(main.canUpload ? { onFiles: main.upload } : {})}
            className={cn(ISSUE_SURFACE, 'flex flex-col gap-6')}
          >
            <IssueHeaderSection
              detail={detail}
              update={update}
              pageActions={pageActions}
              actions={<AskAgent placement='issue' entry={entry} />}
              meta={
                <>
                  <IssueMarks issue={detail} placement='detail' />
                  <span className='flex min-w-0 sm:ml-auto'>
                    <IssueLiveRun issue={detail} />
                  </span>
                </>
              }
            />
            <IssueStageRunLimit
              issue={detail}
              onContinued={() => setStageRunRefresh((value) => value + 1)}
            />
            <IssueWaitingSection issue={detail} />
            <IssueRunRequestsSection issue={detail} />
            <IssueDescriptionSection detail={detail} update={update} />
            <IssueAddSection detail={detail} state={main}>
              <IssueCodeAddButton issue={detail} {...linking} />
            </IssueAddSection>
            <IssueApprovalsSection
              detail={detail}
              pageActions={pageActions}
              hidePending={approvalCovered}
            />
            <IssueChecklistSection detail={detail} pageActions={pageActions} />
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
            <DesignSection issue={detail} />
            <IssuePlansSection issue={detail} />
            <IssueInitSection issue={detail} />
            <IssueCodeSection issue={detail} {...linking} />
            <IssueRunPanel issue={detail} />
          </IssueFileDrop>
        </IssueActivity>
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
