# Detail drawer: `detail/index.tsx`

Part of the [projects worked example](../example.md). **Depends on**: [types](types.md), [delete dialog](delete-dialog.md); the `:projectId` route under the list ([routes](../example.md#routes)). **Links to**: `edit`, the [edit dialog](edit-dialog.md), stacked on the drawer.

Rules: guideline T2 (a record with few fields opens in a `RouteDrawer` at `:id`; record actions in the footer), [`overlay.md`](../overlay.md), [data changes](../data-changes.md).

```tsx
// client/pages/projects/detail/index.tsx
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { useLocale, useTranslation } from '@nocobase/i18n/client';
import { type ReactElement, useState } from 'react';
import { Link, Outlet, useLocation, useParams } from 'react-router';

import { RouteDrawer } from '#components/route-drawer';
import { Button } from '#components/ui/button';
import { Skeleton } from '#components/ui/skeleton';
import { useRouteOverlay } from '#components/use-route-overlay';
import { useListData } from '#hooks/use-list-data';

import { ProjectDeleteDialog } from '../project-delete-dialog.js';
import { RequestError } from '../request-error.js';
import { ProjectStatusBadge } from '../status-badge.js';
import { type Project, projectPermission, projectScope } from '../types.js';

export default function ProjectDetailPage(): ReactElement {
  const { projectId = '' } = useParams();
  // Key by id: when back or forward switches to another record, the drawer's state starts over.
  return <ProjectDetail key={projectId} projectId={projectId} />;
}

function ProjectDetail({
  projectId,
}: {
  readonly projectId: string;
}): ReactElement {
  const { t } = useTranslation();
  const { locale } = useLocale();
  // One scope: a save announced for it shows here at once, a delete switches to the missing state.
  const request = useListData<{ data: Project }>(
    `projects/${encodeURIComponent(projectId)}`,
    { scopes: [projectScope(projectId)] },
  );
  const project = request.error ? undefined : request.data?.data;
  const fields = project
    ? [
        [t('projects.fields.owner'), project.owner ?? '—'],
        [
          t('projects.fields.status'),
          <ProjectStatusBadge key='status' status={project.status} />,
        ],
        [
          t('projects.fields.updatedAt'),
          new Intl.DateTimeFormat(locale, {
            dateStyle: 'medium',
            timeStyle: 'short',
          }).format(new Date(project.updatedAt)),
        ],
      ]
    : [];
  return (
    <RouteDrawer
      title={project?.name ?? t('projects.detail.title')}
      footer={project ? <DetailActions project={project} /> : undefined}
    >
      {request.error ? (
        <RequestError error={request.error} retry={request.reload} />
      ) : project ? (
        <dl className='grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm'>
          {fields.map(([label, value]) => (
            <div key={String(label)} className='contents'>
              <dt className='text-muted-foreground'>{label}</dt>
              <dd className='min-w-0 wrap-anywhere'>{value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <div
          role='status'
          aria-label={t('projects.loading')}
          className='flex flex-col gap-3'
        >
          <Skeleton className='h-4 w-2/3' />
          <Skeleton className='h-4 w-1/2' />
          <Skeleton className='h-4 w-1/3' />
        </div>
      )}
      {/* The edit dialog stacks on the drawer; outside the state branches, so it survives a switch to "not found". */}
      <Outlet />
    </RouteDrawer>
  );
}

// Inside the drawer (its footer), so it can call useRouteOverlay().
function DetailActions({
  project,
}: {
  readonly project: Project;
}): ReactElement {
  const { t } = useTranslation();
  const location = useLocation();
  const { close } = useRouteOverlay();
  const canUpdate = useCan(projectPermission('update')).can;
  const canDelete = useCan(projectPermission('delete')).can;
  const [deleting, setDeleting] = useState(false);
  return (
    <>
      {canDelete ? (
        <Button variant='outline' onClick={() => setDeleting(true)}>
          {t('projects.actions.delete')}
        </Button>
      ) : null}
      {canUpdate ? (
        <Button
          nativeButton={false}
          render={<Link to={{ pathname: 'edit', search: location.search }} />}
        >
          {t('projects.actions.edit')}
        </Button>
      ) : null}
      <ProjectDeleteDialog
        open={deleting}
        project={project}
        onOpenChange={setDeleting}
        // The delete was announced; the list behind drops the row. Close the drawer as well.
        onDeleted={() => void close()}
      />
    </>
  );
}
```

- **Edit is a link** relative to the drawer's route, so the dialog stacks on the drawer wherever the drawer is declared (a dashboard declaring the same routes gets the same behavior, guideline I9), and the list's query stays.
- **States**: a skeleton in the label–value shape while loading; 403 and 404 explain without Retry (guidelines S1 and S4).
- **A complex record** (more than about 15 fields, sections, related lists or tabs) gets a detail page at `:id/details` instead, built as in [`child-routes.md`](../child-routes.md); the [customer/contact example](../executable-relation-batch.md) runs one with a related list.
