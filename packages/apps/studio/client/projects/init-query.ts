/**
 * The project's initialization as the browser reads it (`GET /api/projectSetups/:projectId`), polled until it is done,
 * and what an issue's properties show as the executor of the "Initialize project" issue a workflow runs.
 */
import { useApiClient } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useQuery } from '@tanstack/react-query';

import { ProjectInitApi, projectInitKeys } from './init-api.js';

const POLL_MS = 15_000;

export function useProjectInit(projectId: string | null) {
  const api = new ProjectInitApi(useApiClient());
  return useQuery({
    queryKey: projectInitKeys.init(projectId ?? ''),
    queryFn: ({ signal }) => api.init(projectId!, signal),
    enabled: projectId !== null,
    refetchInterval: (query) => {
      const view = query.state.data;
      return view && view.state !== 'done' ? POLL_MS : false;
    },
  });
}

/**
 * The executor an issue's properties show when it has none: "GitHub Actions" for the "Initialize project" issue of a
 * template whose init workflow runs it; null otherwise.
 */
export function useInitExecutorLabel(issue: {
  readonly id: string;
  readonly projectId: string | null;
}): string | null {
  const { t } = useTranslation();
  const init = useProjectInit(issue.projectId).data;
  if (!init || init.issueId !== issue.id) return null;
  if (init.method !== 'template' || !init.workflow) return null;
  return t('projectPage.init.executor.githubActions');
}
