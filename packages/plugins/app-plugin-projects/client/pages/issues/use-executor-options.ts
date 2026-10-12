import { useMemo } from 'react';

import { USER_KIND } from '../../../shared/kinds.js';
import type { ExecutorOption } from '../../components/pm-executor-select.js';
import {
  useExecutorOptions as useKindExecutorOptions,
  useKinds,
} from '../../lib/kinds.js';

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
 * Executors of the other registered kinds, offered before the members in the executor picker and the executor filter:
 * the ones each kind lets the viewer give an issue to (`GET /api/projects/executors`), such as the agents' project
 * manager, each with a note when nothing can run its work now, or how much it is doing.
 */
export function useExecutorOptions(enabled = true): readonly ExecutorOption[] {
  return useKindExecutorOptions(enabled);
}
