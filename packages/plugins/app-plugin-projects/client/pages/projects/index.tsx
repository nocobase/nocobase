import { useTranslation } from '@nocobase/i18n/client';
import { useQuery } from '@tanstack/react-query';
import { FolderKanbanIcon, PlusIcon, SearchIcon } from 'lucide-react';
import { type ReactElement, useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router';

import { pmKeys } from '../../api/keys.js';
import { DataTable } from '../../components/data-table.js';
import { PageContainer } from '../../components/page-container.js';
import { PageHeader } from '../../components/page-header.js';
import { PmShortcuts } from '../../components/pm-shortcuts.js';
import {
  PmEmpty,
  PmListSkeleton,
  PmLoadError,
} from '../../components/pm-states.js';
import { Button } from '../../components/ui/button.js';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '../../components/ui/input-group.js';
import { usePmApi } from '../../hooks/use-pm-api.js';
import { useViewer } from '../../hooks/use-viewer.js';
import { canCreateIssues, canCreateProjects } from '../../lib/permissions.js';
import { useProjectColumns } from './columns.js';

/**
 * Route `/projects`: every project the viewer can see, with status, lead, progress and membership. A private project
 * (visibility `members`) is left out by the server for those who did not join it. The list is small, so search and
 * sorting happen here. The page stays mounted under its `new` dialog and `:projectId` covering page.
 */
export default function ProjectsPage(): ReactElement {
  const { t } = useTranslation();
  const api = usePmApi();
  const navigate = useNavigate();
  const viewer = useViewer();
  const canCreate = canCreateProjects(viewer);
  const [search, setSearch] = useState('');
  const projects = useQuery({
    queryKey: pmKeys.projects,
    queryFn: () => api.projects(),
  });
  const columns = useProjectColumns();

  const newButton = canCreate ? (
    <Button nativeButton={false} render={<Link to='new' />}>
      <PlusIcon data-icon='inline-start' />
      {t('projects.new')}
    </Button>
  ) : null;

  const needle = search.trim().toLowerCase();
  const rows = (projects.data ?? []).filter(
    (project) => !needle || project.name.toLowerCase().includes(needle),
  );

  let content: ReactElement;
  if (projects.isError && !projects.isFetching)
    content = (
      <PmLoadError
        title={t('projects.loadFailed')}
        error={projects.error}
        onRetry={() => void projects.refetch()}
      />
    );
  else if (!projects.data) content = <PmListSkeleton />;
  else if (projects.data.length === 0)
    content = (
      <PmEmpty
        icon={<FolderKanbanIcon />}
        title={t('projects.emptyTitle')}
        description={t(
          canCreate ? 'projects.emptyDescription' : 'projects.emptyNoAccess',
        )}
        action={newButton}
      />
    );
  else
    content = (
      <div className='space-y-4'>
        <InputGroup className='max-w-sm'>
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            value={search}
            placeholder={t('projects.search')}
            aria-label={t('projects.search')}
            onChange={(event) => setSearch(event.target.value)}
          />
        </InputGroup>
        <DataTable
          columns={columns}
          data={rows}
          pageSize={20}
          showSelectedCount={false}
          getRowId={(project) => project.id}
          onRowClick={(row) =>
            void navigate(encodeURIComponent(row.original.id))
          }
          emptyMessage={t('projects.noResults')}
        />
      </div>
    );

  return (
    <PageContainer>
      <PageHeader
        title={t('projects.title')}
        description={t('projects.description')}
        actions={projects.data && projects.data.length > 0 ? newButton : null}
      />
      <PmShortcuts canCreate={canCreateIssues(viewer)} />
      {content}
      <Outlet />
    </PageContainer>
  );
}
