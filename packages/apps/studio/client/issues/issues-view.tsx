/**
 * Studio's issues view, shared by `/issues` and `/my-issues`: the toolbar written here over one of three views — the
 * Agent queue (Studio's own, from the agent board), the list (`IssueTable`) and the board (`kanban`) — each fed by the
 * projects plugin's headless issue queries (`@nocobase/app-plugin-projects/client/issues`). The view is `?view=`,
 * else the person's last choice on the page, else the page's default.
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
  KanbanSquareIcon,
  ListIcon,
  Trash2Icon,
} from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';
import { useLocation, useNavigate, useResolvedPath } from 'react-router';

import { Alert, AlertAction, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

import { AgentQueueView } from './agent-view.js';
import { IssueBoardView } from './board-view.js';
import { IssueListView } from './list-view.js';
import { IssueToolbar, type IssueViewOption } from './toolbar.js';
import { useIssuesPage } from './use-issues-page.js';

export type StudioIssueView = 'agent' | 'list' | 'board';

const ICONS: Readonly<Record<StudioIssueView, IssueViewOption['icon']>> = {
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
}

export function IssuesView({
  fixedFilters,
  hiddenFilters,
  viewKey,
  views,
  defaultView,
  empty,
  mineToggle = true,
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

  // An issue opens over the list's page, keeping the query string: the issue page is declared under each list's route
  // (`issueDetailRoute` in `routes.ts`), so its trail and Back lead to this list as it was left.
  const listPath = useResolvedPath('.').pathname.replace(/\/$/u, '');
  const issueHref = (issueId: string) =>
    `${listPath}/${encodeURIComponent(issueId)}${location.search}`;
  const open = (issueId: string) => void navigate(issueHref(issueId));

  const options = views.map((key) => ({
    key,
    label: t(`issuesPage.views.${key}`),
    icon: ICONS[key],
  }));

  return (
    <div className='flex h-full min-h-0 flex-col gap-2'>
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
      />
      <div className='min-h-0 flex-1' data-testid='issues-view-content'>
        {view === 'agent' ? (
          <AgentQueueView
            page={page}
            issueHref={issueHref}
            mineToggle={mineToggle}
          />
        ) : view === 'board' ? (
          <IssueBoardView page={page} issueHref={issueHref} onOpen={open} />
        ) : (
          <IssueListView
            page={page}
            issueHref={issueHref}
            onOpen={open}
            deleted={deleted}
            empty={empty}
          />
        )}
      </div>
    </div>
  );
}
