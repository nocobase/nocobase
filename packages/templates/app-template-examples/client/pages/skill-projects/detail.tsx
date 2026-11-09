import {
  ApiClientError,
  useApiClient,
  usePageBreadcrumb,
  useSubmission,
  useToaster,
} from '@nocobase/app-client';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import { useTranslation } from '@nocobase/i18n/client';
import { useState } from 'react';
import {
  Link,
  Outlet,
  useNavigate,
  useParams,
  useResolvedPath,
} from 'react-router';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { RouteChildPage } from '#components/route-child-page';
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
import { useRouteSearches } from '../../routing/route-context.js';
import type { SkillProject } from './index.js';
import { projectScope } from './scopes.js';

/** A record always names its list, including on a direct open or an unsuccessful load. */
export default function SkillProjectDetailPage() {
  const { t } = useTranslation();
  const { projectId = '' } = useParams();
  const owner = useResolvedPath('..').pathname;
  const searches = useRouteSearches();
  const scope = projectScope(projectId);
  const [deleted, setDeleted] = useState(false);
  // Its edit dialog announces the saved project, which replaces this read.
  const request = useListData<{ data: SkillProject }>(
    `skillProjects/${encodeURIComponent(projectId)}`,
    { scopes: [scope], active: !deleted },
  );
  const status =
    request.error instanceof ApiClientError ? request.error.status : undefined;
  const project = request.error ? undefined : request.data?.data;
  const source = { pathname: owner, search: searches.get(owner) ?? '' };
  usePageBreadcrumb([
    { label: t('skillProjects.title'), to: source },
    { label: project?.name ?? t('skillProjects.detail') },
  ]);
  return (
    <RouteChildPage>
      <PageContainer>
        <PageHeader
          title={project?.name ?? t('skillProjects.detail')}
          actions={
            project && !deleted ? (
              <>
                <DeleteProject
                  project={project}
                  onDeleted={() => {
                    setDeleted(true);
                    return source;
                  }}
                />
                <Button render={<Link to='edit' />} nativeButton={false}>
                  {t('skillProjects.editAction')}
                </Button>
              </>
            ) : undefined
          }
        />
        {request.error ? (
          <Alert variant='destructive'>
            <AlertDescription>
              {t(
                status === 404
                  ? 'skillProjects.detailGone'
                  : status === 403
                    ? 'skillProjects.denied'
                    : status === 401
                      ? 'skillProjects.expired'
                      : 'skillProjects.failed',
              )}
              {![401, 403, 404].includes(status ?? 0) ? (
                <Button variant='outline' onClick={request.reload}>
                  {t('skillProjects.retry')}
                </Button>
              ) : null}
            </AlertDescription>
          </Alert>
        ) : !project ? (
          <Skeleton
            className='h-16 w-full'
            aria-label={t('skillProjects.loading')}
          />
        ) : (
          <p>{project.name}</p>
        )}
        {/* Editing is a dialog: its Cancel closes the dialog rather than leaving the detail. */}
        <Outlet />
      </PageContainer>
    </RouteChildPage>
  );
}

/**
 * Deletes with an operation key. Success or an already-missing record returns
 * to the source list; an unknown outcome keeps the dialog for a same-key retry
 * and asks every affected view to read the server again.
 */
function DeleteProject({
  project,
  onDeleted,
}: {
  readonly project: SkillProject;
  readonly onDeleted: () => { pathname: string; search: string };
}) {
  const { t } = useTranslation();
  const api = useApiClient();
  const toaster = useToaster();
  const navigate = useNavigate();
  const { session } = useAuthentication();
  const submission = useSubmission({
    scope: `${session?.user.id}:skillProjects:${project.id}:delete`,
  });
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<'denied' | 'failed' | 'uncertain'>();
  const scope = projectScope(project.id);
  const finish = async (message: string) => {
    const source = onDeleted();
    announceDataChange({ scopes: [scope], results: { [scope]: null } });
    toaster.show({ type: 'success', title: message });
    setOpen(false);
    await navigate(source);
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
