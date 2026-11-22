import {
  ApiClientError,
  useApiClient,
  useSubmission,
  useToaster,
} from '@nocobase/app-client';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { useTranslation } from '@nocobase/i18n/client';
import { useState, type ReactElement } from 'react';
import { Link, Outlet, useLocation, useParams } from 'react-router';
import { RouteDrawer } from '#components/route-drawer';
import { useRouteOverlay } from '#components/use-route-overlay';
import { Alert, AlertDescription } from '#components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '#components/ui/alert-dialog';
import { Button } from '#components/ui/button';
import { Skeleton } from '#components/ui/skeleton';
import { announceDataChange } from '#hooks/use-data-changes';
import { useListData } from '#hooks/use-list-data';
import { projectPermissions } from './access.js';
import type { SkillProject } from './index.js';
import { projectScope } from './scopes.js';

export default function SkillProjectDetailPage(): ReactElement {
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
  const scope = projectScope(projectId);
  // The project this drawer deleted stays on screen while the drawer closes.
  const [deleted, setDeleted] = useState<SkillProject>();
  // One scope: the edit dialog's announced save shows here at once, without a request.
  const request = useListData<{ data: SkillProject }>(
    `skillProjects/${encodeURIComponent(projectId)}`,
    { scopes: [scope], active: !deleted },
  );
  const status =
    request.error instanceof ApiClientError ? request.error.status : undefined;
  const project = deleted ?? (request.error ? undefined : request.data?.data);
  return (
    <RouteDrawer
      title={project?.name ?? t('skillProjects.detail')}
      className='sm:max-w-md'
      footer={
        project && !deleted ? (
          <DetailActions project={project} onDeleted={setDeleted} />
        ) : undefined
      }
    >
      {request.error && !deleted ? (
        <Alert variant='destructive'>
          <AlertDescription className='flex flex-col items-start gap-2'>
            <p>
              {t(
                status === 404
                  ? 'skillProjects.detailGone'
                  : status === 403
                    ? 'skillProjects.denied'
                    : status === 401
                      ? 'skillProjects.expired'
                      : 'skillProjects.failed',
              )}
            </p>
            {status === 401 ? (
              <Link to='/login'>{t('skillProjects.signIn')}</Link>
            ) : [403, 404].includes(status ?? 0) ? null : (
              <Button variant='outline' onClick={request.reload}>
                {t('skillProjects.retry')}
              </Button>
            )}
          </AlertDescription>
        </Alert>
      ) : project ? (
        <dl className='grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm'>
          <dt className='text-muted-foreground'>{t('skillProjects.name')}</dt>
          <dd className='min-w-0 wrap-anywhere'>{project.name}</dd>
        </dl>
      ) : (
        <div
          role='status'
          aria-label={t('skillProjects.loading')}
          className='flex flex-col gap-3'
        >
          <Skeleton className='h-4 w-2/3' />
          <Skeleton className='h-4 w-1/2' />
        </div>
      )}
      {/* The edit dialog stacks on the drawer; outside the state branches, so it survives a switch to "not found". */}
      <Outlet />
    </RouteDrawer>
  );
}

/** The drawer's footer, inside the overlay so it can close it; each action is shown only when permitted. */
function DetailActions({
  project,
  onDeleted,
}: {
  readonly project: SkillProject;
  readonly onDeleted: (project: SkillProject) => void;
}): ReactElement {
  const { t } = useTranslation();
  const location = useLocation();
  const canUpdate = useCan(projectPermissions.update).can;
  const canDelete = useCan(projectPermissions.delete).can;
  return (
    <>
      {canDelete ? (
        <DeleteProject project={project} onDeleted={onDeleted} />
      ) : null}
      {canUpdate ? (
        <Button
          nativeButton={false}
          render={<Link to={{ pathname: 'edit', search: location.search }} />}
        >
          {t('skillProjects.editAction')}
        </Button>
      ) : null}
    </>
  );
}

/**
 * Deletes with an operation key. Success or an already-missing record closes the drawer back to the source list;
 * an unknown outcome keeps the dialog for a same-key retry and asks every affected view to read the server again.
 */
function DeleteProject({
  project,
  onDeleted,
}: {
  readonly project: SkillProject;
  readonly onDeleted: (project: SkillProject) => void;
}): ReactElement {
  const { t } = useTranslation();
  const api = useApiClient();
  const toaster = useToaster();
  const { close } = useRouteOverlay();
  const { session } = useAuthentication();
  const submission = useSubmission({
    scope: `${session?.user.id}:skillProjects:${project.id}:delete`,
  });
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<'denied' | 'failed' | 'uncertain'>();
  const scope = projectScope(project.id);
  const finish = async (message: string) => {
    // Stop reading the record first, so the announced removal cannot replace what the drawer shows while it closes.
    onDeleted(project);
    announceDataChange({ scopes: [scope], results: { [scope]: null } });
    toaster.show({ type: 'success', title: message });
    setOpen(false);
    await close();
  };
  const confirm = async () => {
    const recovering = submission.pending;
    setError(undefined);
    try {
      const done = await submission.run({ id: project.id }, (key, signal) =>
        api.request<{ data: { id: string } }>({
          path: `skillProjects/${encodeURIComponent(project.id)}`,
          method: 'DELETE',
          headers: { 'Idempotency-Key': key },
          signal,
        }),
      );
      if (done)
        await finish(t('skillProjects.deleted', { name: project.name }));
    } catch (failure) {
      const code = failure instanceof ApiClientError ? failure.status : 0;
      if (code === 404) {
        // The record is gone, whoever removed it: what the user wanted has happened.
        await finish(t('skillProjects.alreadyDeleted', { name: project.name }));
        return;
      }
      if (recovering || code === 0 || code >= 500) {
        // Never resubmit on its own: affected views read the server instead.
        announceDataChange({ scopes: [scope] });
        setError('uncertain');
      } else setError(code === 403 ? 'denied' : 'failed');
    }
  };
  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (submission.submitting) return;
        if (!next) setError(undefined);
        setOpen(next);
      }}
    >
      <Button variant='outline' onClick={() => setOpen(true)}>
        {t('skillProjects.deleteAction')}
      </Button>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t('skillProjects.deleteTitle', { name: project.name })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t('skillProjects.deleteHint')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error ? (
          <Alert variant='destructive'>
            <AlertDescription>
              {t(
                error === 'uncertain'
                  ? 'skillProjects.deleteUncertain'
                  : error === 'denied'
                    ? 'skillProjects.denied'
                    : 'skillProjects.deleteFailed',
              )}
            </AlertDescription>
          </Alert>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={submission.submitting}>
            {t('skillProjects.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            variant='destructive'
            disabled={submission.submitting || error === 'denied'}
            onClick={(event) => {
              event.preventDefault();
              void confirm();
            }}
          >
            {t(
              submission.submitting
                ? 'skillProjects.deleting'
                : 'skillProjects.deleteAction',
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
