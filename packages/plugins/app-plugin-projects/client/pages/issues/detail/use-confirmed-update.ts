import { useCallback } from 'react';

import type { IssueDetail } from '../../../../shared/issues.js';
import type { ExecutorOption } from '../../../components/pm-executor-select.js';
import type { IssueChanges, IssueUpdate } from './use-issue-update.js';

export interface ConfirmedUpdate {
  /** Applies a change. */
  readonly apply: (changes: IssueChanges) => void;
}

/**
 * The issue PATCH of the properties panel. Nothing asks "Start now?" any more: moving an issue to `in_progress`, or
 * giving an issue in progress to an executor of another kind, starts the work.
 */
export function useConfirmedUpdate({
  update,
}: {
  readonly issue: IssueDetail;
  readonly others: readonly ExecutorOption[];
  readonly update: IssueUpdate;
}): ConfirmedUpdate {
  const { mutate } = update;
  const apply = useCallback(
    (changes: IssueChanges) => mutate(changes),
    [mutate],
  );
  return {
    apply,
  };
}
