/**
 * Route `/issues/:issueId`: an issue's page, a covering child page over the issues list so the list keeps its filters
 * and scroll. The same page is declared under the other lists that open issues (`issueDetailRoute` in `routes.ts`): a
 * tab of `/my-issues` and a project's Issues tab; its trail and its links to other issues follow the list it is under
 * (`issues/detail/issue-parent.tsx`). The parameter is an id or an identifier (`/issues/PM-12`); the API answers either.
 *
 * The page is the task detail the split view shows beside its list (`issues/groups/detail-pane.tsx`), in the whole
 * content area: the same top row, summary, properties, tabs and comment box, so a task reads and works the same way
 * wherever it is opened. Wide enough, its properties take a column of their own on the right. On a phone the top row
 * is the page's only row: it starts with the way back to the list and ends with the navigation. Its child routes
 * (`new-subtask`, the plugin's; a run's transcript at `runs/:runId`) render beside the covering page.
 */
import { ApiClientError } from '@nocobase/app-client';
import { useIssueDetail } from '@nocobase/app-plugin-projects/client/issues';
import {
  PmDetailSkeleton,
  PmLoadError,
} from '@nocobase/app-plugin-projects/client/kit';
import type { IssueDetail } from '@nocobase/app-plugin-projects/shared/issues';
import { ArrowLeftIcon } from 'lucide-react';
import { useEffect, useState, type ReactElement } from 'react';
import { Link, useNavigate, useParams } from 'react-router';

import { RouteChildPage } from '@/components/route-child-page';
import { Button } from '@/components/ui/button';
import { useMediaQuery } from '@/extensions/nocobase-agent-chat/use-media-query';

import type {
  DetailTab,
  TaskNav,
} from '../../../issues/groups/detail-model.js';
import { typingIn } from '../../../issues/groups/keys.js';
import { useOpenOrder } from '../../../issues/groups/open-order.js';
import { TaskDetailPane } from '../../../issues/groups/detail-pane.js';
import { IssueParentOutlet } from '../../../issues/detail/issue-parent-outlet.js';
import {
  issueHrefUnder,
  issueUnder,
  useIssueParent,
} from '../../../issues/detail/issue-parent.js';
import { useIssueTrail } from '../../../issues/detail/issue-trail.js';
import { useIssuePageWording } from '../../../issues/detail/labels.js';
import { AppSidebarToggle } from '../../../layouts/components/app-sidebar.js';

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
  const wording = useIssuePageWording();
  const parent = useIssueParent();
  const navigate = useNavigate();
  const narrow = useMediaQuery('(max-width: 767px)');
  const [tab, setTab] = useState<DetailTab>('feed');
  useIssueTrail(detail);
  const list = { pathname: parent.path, search: parent.search };
  // Opened from the table or the split view, previous and next move through that list, replacing this page's entry so
  // Back still returns to the list.
  const order = useOpenOrder(parent.path);
  const index = order ? order.indexOf(detail.id) : -1;
  const go = (step: number): (() => void) | undefined => {
    const id = order?.[index + step];
    return id === undefined || index < 0
      ? undefined
      : () => void navigate(issueHrefUnder(parent, id), { replace: true });
  };
  const nav: TaskNav | undefined =
    order && index >= 0
      ? {
          index: index + 1,
          total: order.length,
          onPrevious: go(-1),
          onNext: go(1),
        }
      : undefined;
  useEffect(() => {
    if (!nav) return;
    const onKey = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        typingIn(event.target)
      )
        return;
      const move =
        event.key === 'j' || event.key === 'ArrowDown'
          ? nav.onNext
          : event.key === 'k' || event.key === 'ArrowUp'
            ? nav.onPrevious
            : undefined;
      if (!move) return;
      event.preventDefault();
      move();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
  const back = (
    <Button
      variant='ghost'
      size='icon'
      nativeButton={false}
      aria-label={wording.t('issue.backToList')}
      title={wording.t('issue.backToList')}
      render={<Link to={list} />}
      data-testid='task-back'
    >
      <ArrowLeftIcon />
    </Button>
  );
  return (
    <TaskDetailPane
      issueId={issueId}
      issuePath={issueUnder(parent, issueId).pathname}
      variant={narrow ? 'phone' : 'page'}
      headingLevel={1}
      {...(nav ? { nav } : {})}
      tab={tab}
      onTabChange={setTab}
      // The header's trail leads back on a wider screen; a phone hides the header, so its row draws the way back.
      {...(narrow ? { leading: back, trailing: <AppSidebarToggle /> } : {})}
      onGoto={(id) => void navigate(issueHrefUnder(parent, id))}
      onDeleted={() => void navigate(list)}
      className='h-full'
    />
  );
}
