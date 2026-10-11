/** An issue's previews (`preview-entry.tsx`), polled while one moves and slowly otherwise, so a stop shows up. */
import { useApiClient } from '@nocobase/app-client';
import {
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from '@tanstack/react-query';

import {
  PREVIEW_BUSY,
  type IssuePreviews,
  type PreviewView,
} from '../../shared/previews.js';
import { previewKeys, readPreviews } from './api.js';

const POLL_MS = 3000;
/** While ready: often enough that a stop or hibernation shows up. */
const IDLE_POLL_MS = 30_000;

/** Whether anything of the preview is on its way: a deployment, a build, a start. */
function moving(preview: PreviewView): boolean {
  if (PREVIEW_BUSY.includes(preview.status)) return true;
  if (preview.build?.state === 'queued' || preview.build?.state === 'building')
    return true;
  const runtime = preview.runtime?.state;
  return runtime === 'starting' || runtime === 'pending';
}

export interface IssuePreviewsState {
  readonly query: UseQueryResult<IssuePreviews>;
  /** Replaces them with what an action answered. */
  readonly replace: (next: IssuePreviews) => void;
}

export function useIssuePreviews(issueId: string): IssuePreviewsState {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: previewKeys.issue(issueId),
    queryFn: () => readPreviews(api, issueId),
    refetchInterval: (state) => {
      const previews = state.state.data?.previews ?? [];
      if (previews.some(moving)) return POLL_MS;
      return previews.some((preview) => preview.status !== 'destroyed')
        ? IDLE_POLL_MS
        : false;
    },
  });
  return {
    query,
    replace: (next) =>
      queryClient.setQueryData(previewKeys.issue(issueId), next),
  };
}
