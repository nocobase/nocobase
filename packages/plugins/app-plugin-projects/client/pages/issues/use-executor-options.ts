import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { MENTION_CANDIDATE_LIMIT } from '../../../shared/comments.js';
import { USER_KIND } from '../../../shared/kinds.js';
import { pmKeys } from '../../api/keys.js';
import type { ExecutorOption } from '../../components/pm-executor-select.js';
import { usePmApi } from '../../hooks/use-pm-api.js';
import { useKinds } from '../../lib/kinds.js';
import { usePrincipalName } from '../../lib/principal-name.js';

/** The registered kinds other than people that may execute issues and can be listed, such as agents. */
function useOtherExecutorKinds(): readonly string[] {
  const kinds = useKinds();
  return useMemo(
    () =>
      kinds
        .filter(
          (kind) => kind.executor && kind.mentionable && kind.key !== USER_KIND,
        )
        .map((kind) => kind.key),
    [kinds],
  );
}

/** Another plugin registered a kind that may execute issues, such as agents. */
export function useHasOtherExecutors(): boolean {
  return useOtherExecutorKinds().length > 0;
}

/**
 * Executors of the other registered kinds, offered before the members in the executor picker and the executor filter.
 * They come from those kinds' `@` candidates (`GET /api/projects/mentionCandidates`), which list the ones the viewer may give work to.
 */
export function useExecutorOptions(enabled = true): readonly ExecutorOption[] {
  const api = usePmApi();
  const nameOf = usePrincipalName();
  const keys = useOtherExecutorKinds();
  const candidates = useQuery({
    queryKey: pmKeys.mentions(null),
    queryFn: () =>
      api.mentionCandidates({ limit: MENTION_CANDIDATE_LIMIT.max }),
    enabled: enabled && keys.length > 0,
  });
  return useMemo(
    () =>
      (candidates.data ?? [])
        .filter((candidate) => keys.includes(candidate.kind))
        .map((candidate) => ({
          type: candidate.kind,
          id: candidate.id,
          name: nameOf(candidate),
        })),
    [candidates.data, keys, nameOf],
  );
}
