/**
 * Where an App comes from, on its Overview in release management (`ReleasesAppOriginContext`): "Built by <repository>
 * (<project>)" for each repository that builds it (`GET /api/repositoryDeployments?appId=`), linking to the
 * repository's settings. Nothing for an App no repository the viewer may see builds. In lists and the App's header, a
 * pull request preview's labels give way to one line, "acme/crm #18" (`Summary`). The plugin stays unaware of
 * projects.
 */
import { useApiClient } from '@nocobase/app-client';
import {
  ReleasesAppOriginContext,
  type AppOriginProps,
  type AppOriginSummaryProps,
} from '@nocobase/app-plugin-releases/client';
import { useTranslation } from '@nocobase/i18n/client';
import { useQuery } from '@tanstack/react-query';
import { Fragment, type ReactElement, type ReactNode } from 'react';
import { Link } from 'react-router';

import { PREVIEW_LABEL, RELEASE_LABELS } from '../../shared/previews.js';
import {
  repositoryFullName,
  type AppRepository,
} from '../../shared/releases.js';
import { projectSettingsPath } from '../projects/settings/model.js';

/** Where the repository's link goes in the translated sentence. */
const SLOT = '⁣';

function repositoryName(repository: AppRepository): string {
  return repositoryFullName(repository);
}

/** The repositories that build the App, read once for its Overview and its summary. */
function useAppRepositories(appId: string, enabled = true) {
  const api = useApiClient();
  return useQuery({
    queryKey: ['studio', 'releases', 'app-repositories', appId],
    queryFn: async () =>
      (
        await api.request<{ data: AppRepository[] }>({
          path: 'repositoryDeployments',
          query: { appId },
        })
      ).data,
    retry: false,
    enabled,
  });
}

function AppOrigin({ appId }: AppOriginProps): ReactElement | null {
  const { t } = useTranslation();
  const found = useAppRepositories(appId);
  const repositories = found.data ?? [];
  if (repositories.length === 0) return null;
  return (
    <ul className='flex flex-col gap-1 text-sm text-muted-foreground'>
      {repositories.map((repository) => {
        const [before, after] = t('previews.appOrigin.builtBy', {
          repo: SLOT,
          project: repository.projectName,
        }).split(SLOT);
        const link: ReactNode = (
          <Link
            to={projectSettingsPath(
              repository.projectId,
              'ci',
              repository.resourceId,
            )}
            className='font-medium text-foreground underline-offset-4 hover:underline'
          >
            {repositoryName(repository)}
          </Link>
        );
        return (
          <li key={repository.resourceId} data-app-origin>
            {after === undefined ? (
              <Fragment>
                {before} {link}
              </Fragment>
            ) : (
              <Fragment>
                {before}
                {link}
                {after}
              </Fragment>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** "acme/crm #18" for a pull request preview; nothing for any other App. */
export function AppSummary({
  appId,
  labels,
}: AppOriginSummaryProps): ReactElement | null {
  const { t } = useTranslation();
  const preview = labels[RELEASE_LABELS.kind] === PREVIEW_LABEL;
  const number = labels[RELEASE_LABELS.pullRequestNumber];
  const found = useAppRepositories(appId, preview && !!number);
  if (!preview || !number) return null;
  const repository = found.data?.find((item) => item.pullRequest !== null);
  return (
    <span data-app-summary>
      {repository
        ? t('previews.appOrigin.pullRequestOf', {
            number,
            repo: repositoryName(repository),
          })
        : t('previews.appOrigin.pullRequest', { number })}
    </span>
  );
}

const origin = { Origin: AppOrigin, Summary: AppSummary };

export function ReleaseAppOrigin({
  children,
}: {
  readonly children?: ReactNode;
}): ReactElement {
  return (
    <ReleasesAppOriginContext.Provider value={origin}>
      {children}
    </ReleasesAppOriginContext.Provider>
  );
}
