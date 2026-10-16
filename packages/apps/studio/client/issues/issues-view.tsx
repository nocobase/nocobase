/**
 * Studio's issues view, shared by `/issues`, `/my-issues` and a project's Issues tab: the toolbar written here over one
 * of four views, in this order — the split view (`groups/split-view.tsx`: grouped tasks beside the selected one), the
 * table (`groups/table-view.tsx`: the same groups, task trees), the board (`kanban`) and the Agent queue (Studio's
 * own, from the agent board). The split view and the table read the grouped tasks (`GET /api/taskGroups`); the board
 * and the queue the projects plugin's headless issue queries. The view is `?view=`, else the person's last choice on
 * the page, else the page's default. On a phone the split view and the table are the grouped list
 * (`groups/phone-list.tsx`), and the trash keeps the flat table with Restore.
 */
import {
  canDeleteIssues,
  withDeleted,
  type IssueFilterKey,
  type IssueFilters,
} from '@nocobase/app-plugin-projects/client/issues';
import { pmKeys, useViewer } from '@nocobase/app-plugin-projects/client/kit';
import { useTranslation } from '@nocobase/i18n/client';
import { useIsFetching } from '@tanstack/react-query';
import {
  ArrowLeftIcon,
  BotIcon,
  Columns2Icon,
  KanbanSquareIcon,
  ListIcon,
  Trash2Icon,
} from 'lucide-react';
import {
  useContext,
  useLayoutEffect,
  type ReactElement,
  type ReactNode,
} from 'react';
import { useLocation, useNavigate, useResolvedPath } from 'react-router';

import { Alert, AlertAction, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

import { AgentQueueView } from './agent-view.js';
import { IssueBoardView } from './board-view.js';
import { IssueListView } from './list-view.js';
import { useMediaQuery } from '@/extensions/nocobase-agent-chat/use-media-query';
import { PhoneTaskList } from './groups/phone-list.js';
import { rememberOpenOrder } from './groups/open-order.js';
import { SplitIssuesView } from './groups/split-view.js';
import { GroupedTableView } from './groups/table-view.js';
import { IssueToolbar, type IssueViewOption } from './toolbar.js';
import { useIssuesPage } from './use-issues-page.js';
import { TableCreateStateContext } from './table-create-state.js';

import type { StudioIssueView } from './views.js';

const ICONS: Readonly<Record<StudioIssueView, IssueViewOption['icon']>> = {
  split: Columns2Icon,
  agent: BotIcon,
  list: ListIcon,
  board: KanbanSquareIcon,
};

export interface IssuesViewProps {
  readonly fixedFilters?: IssueFilters;
  readonly hiddenFilters?: readonly IssueFilterKey[];
  /** The page the view is remembered for. */
  readonly viewKey: string;
  /** The views offered, in the switch's order. */
  readonly views: readonly StudioIssueView[];
  readonly defaultView: StudioIssueView;
  readonly empty: { title: string; description: string; action?: ReactNode };
  /** The Agent view offers "Only mine"; off where the page shows only the viewer's issues already. */
  readonly mineToggle?: boolean;
  /**
   * `all`: the follow group lists every followed task, beyond the page's role filter (My tasks); `scope`: the followed
   * tasks among the page's (the default).
   */
  readonly follow?: 'all' | 'scope';
  /** At the start of the toolbar's row, such as My tasks' tabs. */
  readonly toolbarStart?: ReactNode;
  /** Before the view switch, such as a project's "Open in the issue list". */
  readonly toolbarEnd?: ReactNode;
}

export function IssuesView({
  fixedFilters,
  hiddenFilters,
  viewKey,
  views,
  defaultView,
  empty,
  mineToggle = true,
  follow = 'scope',
  toolbarStart,
  toolbarEnd,
}: IssuesViewProps): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const page = useIssuesPage({
    ...(fixedFilters ? { fixedFilters } : {}),
    ...(hiddenFilters ? { hiddenFilters } : {}),
    viewKey,
    views,
    defaultView,
  });
  const fetching = useIsFetching({ queryKey: pmKeys.issues }) > 0;
  const canDelete = canDeleteIssues(useViewer());
  const deleted = canDelete && page.filters.deleted === true;
  const view = page.view;
  const phone = useMediaQuery('(max-width: 767px)');
  const reportCreate = useContext(TableCreateStateContext);
  useLayoutEffect(() => {
    if (view !== 'list' || deleted || phone) reportCreate?.(true);
  }, [view, deleted, phone, reportCreate]);

  // An issue opens over the list's page, keeping the query string: the issue page is declared under each list's route
  // (`issueDetailRoute` in `routes.ts`), so its trail and Back lead to this list as it was left.
  const listPath = useResolvedPath('.').pathname.replace(/\/$/u, '');
  const issueHref = (issueId: string) =>
    `${listPath}/${encodeURIComponent(issueId)}${location.search}`;
  const open = (issueId: string, order?: readonly string[]) => {
    if (order) rememberOpenOrder(listPath, order);
    void navigate(issueHref(issueId));
  };
  // The selected task replaces the entry and keeps the rest of the address, its fragment included.
  const selectIssue = (issueId: string | null) => {
    const next = new URLSearchParams(location.search);
    if (issueId) next.set('issue', issueId);
    else next.delete('issue');
    const search = next.toString();
    void navigate(
      { search: search ? `?${search}` : '', hash: location.hash },
      { replace: true },
    );
  };

  // A phone has no table or split view: the grouped list stands for both, beside the board.
  const options = views
    .filter(
      (key) =>
        !phone ||
        key === 'board' ||
        key === views.find((v) => v === 'split' || v === 'list'),
    )
    .map((key) => ({
      key,
      label:
        phone && key !== 'board'
          ? t('taskGroups.phone.list')
          : t(`issuesPage.views.${key}`),
      icon: phone && key !== 'board' ? ListIcon : ICONS[key],
    }));

  return (
    <div className='flex h-full min-h-0 flex-col gap-3'>
      {deleted ? (
        <Alert data-testid='issues-trash-banner'>
          <Trash2Icon />
          <AlertTitle>{t('issuesPage.trashBanner')}</AlertTitle>
          <AlertAction>
            <Button
              variant='outline'
              size='sm'
              onClick={() =>
                page.updateParams((current) => withDeleted(current, false))
              }
            >
              <ArrowLeftIcon data-icon='inline-start' />
              {t('issuesPage.backToIssues')}
            </Button>
          </AlertAction>
        </Alert>
      ) : null}
      <IssueToolbar
        page={page}
        views={options}
        fetching={fetching && view !== 'agent'}
        leading={toolbarStart}
        trailing={toolbarEnd}
      />
      <div className='min-h-0 flex-1'>
        {view === 'agent' ? (
          <AgentQueueView
            page={page}
            issueHref={issueHref}
            mineToggle={mineToggle}
          />
        ) : view === 'board' ? (
          <IssueBoardView page={page} issueHref={issueHref} onOpen={open} />
        ) : deleted ? (
          <IssueListView
            page={page}
            issueHref={issueHref}
            onOpen={open}
            deleted={deleted}
            empty={empty}
          />
        ) : phone ? (
          <PhoneTaskList
            filters={page.filters}
            filtered={page.filtered}
            follow={follow}
            pageKey={viewKey}
            issueHref={issueHref}
            onClearFilters={page.clearFilters}
            empty={empty}
          />
        ) : view === 'split' ? (
          <SplitIssuesView
            filters={page.filters}
            filtered={page.filtered}
            follow={follow}
            pageKey={viewKey}
            selectedParam={page.params.get('issue')}
            onSelect={selectIssue}
            listPath={listPath}
            searchRef={page.searchRef}
            onClearFilters={page.clearFilters}
            empty={empty}
          />
        ) : (
          <GroupedTableView
            page={page}
            pageKey={viewKey}
            follow={follow}
            issueHref={issueHref}
            onOpen={open}
            empty={empty}
          />
        )}
      </div>
    </div>
  );
}
