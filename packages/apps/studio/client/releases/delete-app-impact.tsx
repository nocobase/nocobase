/**
 * What deleting an App stops, in release management's Delete App confirmation (`ReleasesDeleteAppImpactContext`):
 * for each repository that builds it (`GET /api/repositoryDeployments/apps/:appId/usage`), "This App is built by
 * <repo> (<project>); deleting it stops that repository's staging, production or previews", with the running
 * previews that go with it. Nothing when no repository the viewer can see builds it. After the deletion the
 * repository's CI creates the App again on its next staging or production deploy.
 */
import { useApiClient } from '@nocobase/app-client';
import {
  ReleasesDeleteAppImpactContext,
  type DeleteAppImpact,
  type DeleteAppImpactProps,
} from '@nocobase/app-plugin-releases/client';
import { useTranslation } from '@nocobase/i18n/client';
import { useQuery } from '@tanstack/react-query';
import { TriangleAlertIcon } from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';

import type { AppUsage } from '../../shared/releases.js';
import { useRoleParts } from './role-parts.js';

function Impact({ appId }: DeleteAppImpactProps): ReactElement | null {
  const { t } = useTranslation();
  const api = useApiClient();
  const partsOf = useRoleParts();
  const usage = useQuery({
    queryKey: ['studio', 'releases', 'appUsage', appId],
    queryFn: async () =>
      (
        await api.request<{ data: AppUsage }>({
          path: `repositoryDeployments/apps/${encodeURIComponent(appId)}/usage`,
        })
      ).data,
    retry: false,
  });
  const repositories = usage.data?.repositories ?? [];
  if (repositories.length === 0) return null;
  const previews = usage.data?.runningPreviews ?? 0;
  const lines: ReactNode[] = repositories.map((repository, index) => {
    const values = {
      repo: repository.repo ?? repository.projectName,
      project: repository.projectName,
      parts: partsOf(repository),
    };
    // The running previews are the App's, said once.
    return (
      <p key={repository.resourceId}>
        {index === repositories.length - 1 && previews > 0
          ? t('previews.deleteImpact.sentenceWithPreviews', {
              ...values,
              count: previews,
            })
          : t('previews.deleteImpact.sentence', values)}
      </p>
    );
  });
  return (
    <Alert data-delete-app-impact>
      <TriangleAlertIcon />
      <AlertDescription className='[&_p:not(:last-child)]:mb-1'>
        {lines}
        <p>{t('previews.deleteImpact.recreate')}</p>
      </AlertDescription>
    </Alert>
  );
}

const impact: DeleteAppImpact = { Impact };

export function ReleaseDeleteAppImpact({
  children,
}: {
  readonly children?: ReactNode;
}): ReactElement {
  return (
    <ReleasesDeleteAppImpactContext.Provider value={impact}>
      {children}
    </ReleasesDeleteAppImpactContext.Provider>
  );
}
