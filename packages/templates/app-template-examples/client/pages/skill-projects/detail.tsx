import { ApiClientError, usePageBreadcrumb } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useMemo } from 'react';
import {
  Link,
  Outlet,
  useLocation,
  useParams,
  useResolvedPath,
  useOutletContext,
} from 'react-router';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { RouteChildPage } from '#components/route-child-page';
import { Alert, AlertDescription } from '#components/ui/alert';
import { Button } from '#components/ui/button';
import { Skeleton } from '#components/ui/skeleton';
import { useListData } from '#hooks/use-list-data';
import { TABLE_URL_KEYS } from '#hooks/use-table-url-state';
import { useAncestorSearch } from '../../routing/route-context.js';
import type { SkillProject } from './index.js';

/** A record always names its list, including on a direct open or an unsuccessful load. */
export default function SkillProjectDetailPage() {
  const { t } = useTranslation();
  const { projectId } = useParams();
  const location = useLocation();
  const owner = useResolvedPath('..').pathname;
  // The list's own keys: after a reload of this page or its edit dialog, they come from the URL the list linked to.
  const ownerSearch = useAncestorSearch(owner, TABLE_URL_KEYS);
  const ownerContext = useOutletContext<{
    reload: () => void;
    onSaved: (project: SkillProject) => void;
  }>();
  const request = useListData<{ data: SkillProject }>(
    `skillProjects/${encodeURIComponent(projectId ?? '')}`,
  );
  const { reload, replaceData } = request;
  const context = useMemo(
    () => ({
      reload: () => {
        reload();
        ownerContext.reload();
      },
      onSaved: (project: SkillProject) => {
        replaceData({ data: project });
        ownerContext.onSaved(project);
      },
    }),
    [reload, replaceData, ownerContext],
  );
  const status =
    request.error instanceof ApiClientError ? request.error.status : undefined;
  const project = request.error ? undefined : request.data?.data;
  usePageBreadcrumb([
    {
      label: t('skillProjects.title'),
      to: { pathname: owner, search: ownerSearch },
    },
    { label: project?.name ?? t('skillProjects.detail') },
  ]);
  return (
    <RouteChildPage>
      <PageContainer>
        <PageHeader
          title={project?.name ?? t('skillProjects.detail')}
          actions={
            project ? (
              <Button
                render={
                  <Link to={{ pathname: 'edit', search: location.search }} />
                }
              >
                {t('skillProjects.editAction')}
              </Button>
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
        ) : request.loading ? (
          <Skeleton
            className='h-16 w-full'
            aria-label={t('skillProjects.loading')}
          />
        ) : (
          <p>{project?.name}</p>
        )}
        {/* Editing is a dialog: its Cancel closes the dialog rather than leaving the detail. */}
        <Outlet context={context} />
      </PageContainer>
    </RouteChildPage>
  );
}
