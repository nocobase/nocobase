# Detail drawer: `detail/index.tsx`

Part of the [projects worked example](../example.md).

**Depends on**: [delete dialog](delete-dialog.md), [status badge](../i18n.md#dynamic-keys), [session alert](session-expired-alert.md), [types](types.md), [copy](copy.md); its routes, which `projectDetailRoutes` declares under every page that opens a project, in [section 1 of `page.md`](../page.md#1-declare-the-route).

**Add first**: `yes n | pnpm exec shadcn add alert skeleton`, then format the files it creates ([how](../shadcn.md#1-what-the-template-ships-and-how-to-add-the-rest)).

**Links to**: the [edit dialog](edit-dialog.md) is its child route, stacked on it.

Rules: [section 2 of `overlay.md`](../overlay.md#2-overlays-as-child-routes); guidelines T2, R2 and R3.

```tsx
// client/pages/projects/detail/index.tsx
import { ApiClientError, useApiClient } from '@nocobase/app-client';
import { useLocale, useTranslation } from '@nocobase/i18n/client';
import { AlertCircleIcon } from 'lucide-react';
import { type ReactElement, useEffect, useMemo, useState } from 'react';
import {
  Link,
  Outlet,
  useLocation,
  useOutletContext,
  useParams,
} from 'react-router';

import { RouteDrawer } from '@/components/route-drawer';
import { useRouteOverlay } from '@/components/use-route-overlay';
import { SessionExpiredAlert } from '@/components/session-expired-alert';
import { Alert, AlertAction, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

import { ProjectDeleteDialog } from '../project-delete-dialog.js';
import { ProjectStatusBadge } from '../status-badge.js';
import type {
  Project,
  ProjectEditOutletContext,
  ProjectsOutletContext,
} from '../types.js';

/** Route `/projects/:projectId`, and `:projectId` under every other page that opens a project: the project detail drawer. */
export default function ProjectDetailPage(): ReactElement {
  const { projectId = '' } = useParams();
  // Key by id: when forward or back switches to another record, the drawer's state starts over.
  return <ProjectDetail key={projectId} projectId={projectId} />;
}

function ProjectDetail({
  projectId,
}: {
  readonly projectId: string;
}): ReactElement {
  const { t } = useTranslation();
  const api = useApiClient();
  // Functions of the page behind the drawer, through <Outlet context>: the list, or another page that opens projects.
  const { reload: reloadPage, afterDelete } =
    useOutletContext<ProjectsOutletContext>();

  const [reloadCount, setReloadCount] = useState(0);
  const requestKey = `${projectId}:${reloadCount}`;
  const [result, setResult] = useState<{
    readonly key: string;
    readonly project?: Project;
    readonly error?: unknown;
  }>();

  useEffect(() => {
    // Abort the request when the parameters change or the component unmounts, so an old result never overwrites a new one.
    const controller = new AbortController();
    const key = `${projectId}:${reloadCount}`;
    api
      .request<{ data: Project }>({
        path: `projects/${encodeURIComponent(projectId)}`,
        signal: controller.signal,
      })
      .then(
        ({ data }) => {
          if (!controller.signal.aborted) setResult({ key, project: data });
        },
        (error: unknown) => {
          if (controller.signal.aborted) return;
          setResult({ key, error });
          // The record no longer exists: the page behind may still show it, so refresh that page (guideline R3).
          if (error instanceof ApiClientError && error.status === 404) {
            reloadPage();
          }
        },
      );
    return () => controller.abort();
  }, [api, projectId, reloadCount, reloadPage]);

  const loading = result?.key !== requestKey;
  const error = loading ? undefined : result?.error;
  const status = error instanceof ApiClientError ? error.status : undefined;

  // After an edit is saved, show the record the endpoint returned right away instead of waiting for a reload (guideline R2).
  const [saved, setSaved] = useState<Project>();
  // The edit dialog found that the record no longer exists.
  const [gone, setGone] = useState(false);

  const notFound = gone || status === 404;
  const project = notFound ? undefined : (saved ?? result?.project);

  // The edit dialog (child route edit) gets these two callbacks through <Outlet context>.
  // Keep them stable with useMemo: the dialog's loading effect depends on them.
  const outletContext = useMemo<ProjectEditOutletContext>(
    () => ({
      onSaved: (updated) => {
        setSaved(updated);
        reloadPage();
      },
      onNotFound: () => {
        setGone(true);
        reloadPage();
      },
    }),
    [reloadPage],
  );

  let body: ReactElement;
  if (status === 401) {
    body = <SessionExpiredAlert />;
  } else if (notFound || status === 403) {
    // Record not found or no permission: a retry will not succeed either, so only explain the situation (guidelines R3 and S4).
    body = (
      <Alert variant='destructive'>
        <AlertCircleIcon />
        <AlertDescription>
          {notFound
            ? t('projects.error.notFound')
            : t('projects.error.forbidden')}
        </AlertDescription>
      </Alert>
    );
  } else if (error) {
    body = (
      <Alert variant='destructive'>
        <AlertCircleIcon />
        <AlertDescription>{t('projects.error.requestFailed')}</AlertDescription>
        <AlertAction>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setReloadCount((count) => count + 1)}
          >
            {t('status.retry')}
          </Button>
        </AlertAction>
      </Alert>
    );
  } else if (!project) {
    body = (
      <div
        role='status'
        aria-label={t('status.loading')}
        className='flex flex-col gap-3'
      >
        <Skeleton className='h-4 w-1/2' />
        <Skeleton className='h-4 w-1/3' />
        <Skeleton className='h-4 w-2/3' />
      </div>
    );
  } else {
    body = <ProjectFields project={project} />;
  }

  return (
    <RouteDrawer
      title={project?.name ?? t('projects.detail.title')}
      // Show no record actions before the record has loaded or when it does not exist.
      footer={
        project ? (
          <ProjectDetailActions project={project} onDeleted={afterDelete} />
        ) : undefined
      }
    >
      {body}
      {/* The edit dialog (child route edit) renders inside the drawer, stacked on it; placed outside the state branches, it is not unmounted when the drawer switches state. */}
      <Outlet context={outletContext} />
    </RouteDrawer>
  );
}

/**
 * Record actions at the bottom of the drawer. The footer renders inside the drawer, so useRouteOverlay() can be called here.
 * The footer is justify-end: the two buttons sit together on the right, and "Edit" is the only primary button in this view (guidelines T2.2 and L2).
 */
function ProjectDetailActions({
  project,
  onDeleted,
}: {
  readonly project: Project;
  readonly onDeleted: () => void;
}): ReactElement {
  const { t } = useTranslation();
  const location = useLocation();
  const { close } = useRouteOverlay();
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <Button variant='destructive' onClick={() => setDeleteOpen(true)}>
        {t('projects.actions.delete')}
      </Button>
      {/* Edit is a child route: the button renders as a link that keeps the query parameters, so the filters of the list behind stay the same. */}
      <Button
        nativeButton={false}
        render={<Link to={{ pathname: 'edit', search: location.search }} />}
      >
        {t('projects.actions.edit')}
      </Button>
      {/* The delete confirmation uses component state. On success, first let the list refresh and arrange focus, then close the drawer. */}
      <ProjectDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        project={project}
        onDeleted={() => {
          onDeleted();
          void close();
        }}
      />
    </>
  );
}

function ProjectFields({
  project,
}: {
  readonly project: Project;
}): ReactElement {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const dateFormat = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    [locale],
  );
  return (
    <dl className='grid grid-cols-[8rem_1fr] gap-x-4 gap-y-3 text-sm'>
      <dt className='text-muted-foreground'>{t('projects.fields.owner')}</dt>
      {/* Long text without spaces still wraps instead of widening the drawer. */}
      <dd className='min-w-0 wrap-anywhere'>{project.owner ?? '—'}</dd>
      <dt className='text-muted-foreground'>{t('projects.fields.status')}</dt>
      <dd>
        <ProjectStatusBadge status={project.status} />
      </dd>
      <dt className='text-muted-foreground'>
        {t('projects.fields.updatedAt')}
      </dt>
      <dd>{dateFormat.format(new Date(project.updatedAt))}</dd>
    </dl>
  );
}
```

- **Key by id**: when browser forward or back switches to another record, state such as `saved` and `gone` starts over.
- **One drawer for every page**: the list and every other page that opens a project declare this module under themselves ([section 2.1 of `overlay.md`](../overlay.md#21-declare-the-child-routes)) and pass it the same `ProjectsOutletContext`, so it opens over whichever page the user is on and refreshes that page.
- **States**: while loading, show a skeleton in the "label — value" shape; 404 and 403 only explain the situation and offer no "Retry"; other failures offer "Retry" (guidelines S1 and S4). A 404 also refreshes the page behind (guideline R3).
- **Record actions in the footer** (guideline T2.2): shown only after the record has loaded. "Delete" and "Edit" sit together on the right, and "Edit" is the only primary button. `ProjectDetailActions` renders inside the drawer as its `footer`, so it can call `useRouteOverlay()` directly.
- **Edit is a link**: `nativeButton={false}` + `render={<Link to={{ pathname: 'edit', search: location.search }} />}` resolves relative to the drawer's route — `/projects/12/edit` over the list, `/project-dashboard/12/edit` over the dashboard — so the dialog stacks on the drawer wherever it is, and the query parameters stay.
- **Close the drawer after deleting**: first call `afterDelete` of the page behind, then `close()`. After the drawer closes, focus first returns to the link that opened it; when the page refreshes, that link disappears with its record, and `afterDelete` then moves focus to a stable place: the list's search box, the dashboard's "View all" link (guideline A6).
- **The edit dialog's Outlet goes inside the drawer, outside the state branches**: the dialog stacks on the drawer, and Esc closes only the dialog; when the drawer switches to "not found", a dialog that is already open is not unmounted along with it.
- **Update immediately after saving**: the edit dialog calls `onSaved`, the drawer updates at once with the record the endpoint returned (`saved`), and then the page behind refreshes (guideline R2).
