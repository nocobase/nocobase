/**
 * A project's Issues tab: Studio's issues view (`issues/issues-view.tsx`) with the project fixed as a filter, its board
 * (the default), list and Agent queue (narrowed to the project on the server). Issues open over the tab
 * (`/projects/:projectId/issues/:issueId`, its route's `Outlet` in `pages/projects/detail/issues.tsx`); "Open in the issue list" goes to `/issues` with the project filtered.
 */
import { ListIcon, PlusIcon } from 'lucide-react';
import type { ReactElement } from 'react';
import { Link } from 'react-router';

import { Button } from '@/components/ui/button';

import { IssuesView } from '../../issues/issues-view.js';
import { useProjectPage } from './context.js';
import { useProjectPageWording } from './labels.js';

export function ProjectIssues(): ReactElement {
  const { project, canCreateIssues } = useProjectPage();
  const { t } = useProjectPageWording();
  const search = `?project=${encodeURIComponent(project.id)}`;
  return (
    <div className='flex h-[calc(100svh-16rem)] min-h-96 flex-col gap-3'>
      <div className='flex justify-end'>
        <Button
          variant='ghost'
          size='sm'
          nativeButton={false}
          render={
            <Link to={{ pathname: '/issues', search: `${search}&view=list` }} />
          }
        >
          <ListIcon data-icon='inline-start' />
          {t('projectPage.openInList')}
        </Button>
      </div>
      <div className='min-h-0 flex-1'>
        <IssuesView
          fixedFilters={{ projectId: project.id }}
          hiddenFilters={['projectId']}
          viewKey='project'
          views={['board', 'list', 'agent']}
          defaultView='board'
          empty={{
            title: t('projectPage.noIssues'),
            description: t('issues.emptyDescription'),
            action: canCreateIssues ? (
              <Button
                variant='outline'
                nativeButton={false}
                render={<Link to='new-issue' />}
              >
                <PlusIcon data-icon='inline-start' />
                {t('issues.new')}
              </Button>
            ) : null,
          }}
        />
      </div>
    </div>
  );
}
