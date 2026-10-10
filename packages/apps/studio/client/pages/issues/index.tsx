/**
 * Route `/issues`: every issue the viewer may see, as a board (the default), a list or the Agent queue
 * (`issues/issues-view.tsx`). The header's "New issue" opens the projects plugin's `new` dialog; `C` opens it too and
 * ⌘K the search. Beside it, for those who may delete issues, the "…" menu's "Trash" lists the deleted issues
 * (`?deleted=1`, under a banner leading back), each to restore. The page stays mounted under the pages it hosts, which render in its `<Outlet />`: the projects
 * plugin's `new` dialog and a plan (`issueChildRoutes`), and an issue's covering page (`detail/`).
 */
import {
  canCreateIssues,
  canDeleteIssues,
  withDeleted,
} from '@nocobase/app-plugin-projects/client/issues';
import {
  NewIssueButton,
  PmShortcuts,
  useViewer,
} from '@nocobase/app-plugin-projects/client/kit';
import { useTranslation } from '@nocobase/i18n/client';
import { MoreHorizontalIcon, Trash2Icon } from 'lucide-react';
import type { ReactElement } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';

import { PageContainer } from '@/components/page-container';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { IssuesView } from '../../issues/issues-view.js';

export default function IssuesPage(): ReactElement {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const viewer = useViewer();
  const canCreate = canCreateIssues(viewer);
  const canDelete = canDeleteIssues(viewer);
  // The page is exactly the content area's height: header, toolbar, then the view filling the rest and scrolling
  // inside, so the page itself never scrolls.
  return (
    <PageContainer className='flex h-full min-h-0 flex-col gap-4 space-y-0 py-4 md:py-4'>
      <PageHeader
        title={t('issuesPage.title')}
        actions={
          <>
            <PmShortcuts
              showTrigger
              canCreate={canCreate}
              onCreate={() =>
                void navigate({ pathname: 'new', search: location.search })
              }
            />
            <NewIssueButton canCreate={canCreate} />
            {canDelete ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant='outline'
                      size='icon'
                      aria-label={t('issuesPage.more')}
                    />
                  }
                >
                  <MoreHorizontalIcon />
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end' className='w-auto min-w-40'>
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      onClick={() =>
                        void navigate({
                          search: `?${withDeleted(new URLSearchParams(location.search), true).toString()}`,
                        })
                      }
                    >
                      <Trash2Icon />
                      {t('issuesPage.trash')}
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </>
        }
      />
      <div className='min-h-0 flex-1'>
        <IssuesView
          viewKey='issues'
          views={['board', 'list', 'agent']}
          defaultView='board'
          empty={{
            title: t('issuesPage.emptyTitle'),
            description: t('issuesPage.emptyDescription'),
          }}
        />
      </div>
      <Outlet />
    </PageContainer>
  );
}
