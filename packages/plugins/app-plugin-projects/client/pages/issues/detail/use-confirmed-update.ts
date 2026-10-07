import { useState } from 'react';

import type { IssueDetail } from '../../../../shared/issues.js';
import type { ExecutorOption } from '../../../components/pm-executor-select.js';
import { startingExecutor } from '../../../lib/kinds.js';
import type { StartRequest } from './start-dialog.js';
import type { IssueChanges, IssueUpdate } from './use-issue-update.js';

export interface ConfirmedUpdate {
  /** Applies a change, asking "Start now?" first when it would start an executor of another kind working. */
  readonly apply: (changes: IssueChanges) => void;
  readonly startRequest: StartRequest | null;
  readonly decide: (start: boolean) => void;
  readonly cancel: () => void;
}

/**
 * The issue PATCH of the properties panel behind the "Start now?" step (the old NocoProject's
 * `use-confirmed-update.ts`): setting an agent as the executor, or moving an issue an agent executes out of backlog,
 * asks first (`startingExecutor`), and the answer goes with the change as `start`. A change that leaves the issue in
 * backlog or a finished status starts nothing, so it asks nothing. Closing the dialog drops the change.
 */
export function useConfirmedUpdate({
  issue,
  others,
  update,
}: {
  readonly issue: IssueDetail;
  readonly others: readonly ExecutorOption[];
  readonly update: IssueUpdate;
}): ConfirmedUpdate {
  const [pending, setPending] = useState<{
    readonly changes: IssueChanges;
    readonly request: StartRequest;
  } | null>(null);

  function apply(changes: IssueChanges): void {
    const next = startingExecutor({
      fromStatus: issue.statusKey,
      ...(changes.statusKey === undefined
        ? {}
        : { toStatus: changes.statusKey }),
      executorBefore: issue.executor,
      ...(changes.executor === undefined
        ? {}
        : { executorAfter: changes.executor }),
      statuses: issue.statuses,
    });
    if (!next) {
      update.mutate(changes);
      return;
    }
    const name =
      others.find(
        (option) => option.type === next.type && option.id === next.id,
      )?.name ?? next.id;
    setPending({
      changes,
      request: {
        kind: next.type,
        names: [name],
        identifier: issue.identifier,
      },
    });
  }

  return {
    apply,
    startRequest: pending?.request ?? null,
    decide: (start) => {
      if (!pending) return;
      setPending(null);
      update.mutate({ ...pending.changes, start });
    },
    cancel: () => setPending(null),
  };
}
