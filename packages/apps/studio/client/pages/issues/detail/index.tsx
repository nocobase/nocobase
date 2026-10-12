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
 * - "Now" under the header: what the issue waits for and the project manager's next step, with "Start" on a backlog
 *   issue (`issues/detail/issue-progress.tsx`), then an agent comment the comment run limit held back;
 * - "Waiting for you" above the description;
 * - the add bar (files, sub-issues, dependencies, and Studio's "Pull request");
 * - after the sub-issues, dependencies and files: the related plans, then Code and
 *   deployments (one row per pull request, unfolding into its previews and the environments it was deployed to);
 * - the agents' runs on the activity line. The side column keeps properties, followers, dates and execution history.
 *
 * The page polls the issue and its runs even while idle, speeds up after an action, and reloads on run transitions.
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
} from '@nocobase/app-plugin-projects/client/kit';
import type { IssueDetail } from '@nocobase/app-plugin-projects/shared/issues';
import { IN_PROGRESS_STATUS } from '@nocobase/app-plugin-projects/shared/statuses';
import { useTranslation } from '@nocobase/i18n/client';
import { useMemo, useState, type ReactElement } from 'react';
import { Link, useParams } from 'react-router';

import { RouteChildPage } from '@/components/route-child-page';
import { Button } from '@/components/ui/button';
import {
  ISSUE_SURFACE,
  IssueDetailLayout,
  IssueFileDrop,
} from '@/extensions/nocobase-issue-detail/issue-detail';
import { cn } from 'cn';

import { AskAgent } from '../../../agents/ask-agent.js';
import { IssueLiveRun, IssueRunRow } from '../../../agents/issue-runs.js';
import { IssueInitSection } from '../../../projects/init-card.js';
import { IssueWaitingSection } from '../../../inbox/issue-waiting.js';
import { IssueActivity } from '../../../issues/detail/issue-activity.js';
import {
  IssueCodeAddButton,
  IssueCodeSection,
} from '../../../issues/detail/code-section.js';
import {
  IssueAddSection,
  IssueDependenciesSection,
  IssueDescriptionSection,
  IssueFilesSection,
  IssueHeaderSection,
  IssueSubtasksSection,
} from '../../../issues/detail/issue-main.js';
import { useIssueMainState } from '../../../issues/detail/main-state.js';
import { IssueCommentRunLimit } from '../../../issues/detail/comment-run-limit.js';
import { IssueProgressLine } from '../../../issues/detail/issue-progress.js';
import { IssuePlansSection } from '../../../issues/detail/issue-plans.js';
import { IssueParentOutlet } from '../../../issues/detail/issue-parent-outlet.js';
import { useIssueParent } from '../../../issues/detail/issue-parent.js';
import { useIssuePageWording } from '../../../issues/detail/labels.js';
import { IssueMarks } from '../../../issues/issue-marks.js';
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
            <IssueProgressLine
              issue={detail}
              refresh={progressRefresh}
              starting={update.isPending}
              onStart={() => update.mutate({ statusKey: IN_PROGRESS_STATUS })}
            />
            <IssueCommentRunLimit
              issue={detail}
              onContinued={() => setRunRefresh((value) => value + 1)}
            />
            <IssueWaitingSection issue={detail} />
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
