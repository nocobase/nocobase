import { useParams, useSearchParams } from 'react-router';

/**
 * The project a new issue starts in: `?project=` (the issue list's project filter), or the project whose page the
 * dialog opens over (`/projects/:projectId/…/new-issue`); null otherwise.
 */
export function usePresetProjectId(): string | null {
  const [params] = useSearchParams();
  const { projectId } = useParams();
  return params.get('project') ?? projectId ?? null;
}
