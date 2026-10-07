import { ApiClientError } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import type {
  IssueListItem,
  StatusDefinition,
} from '../../../../shared/issues.js';
import { ACCESS_NAMESPACE } from '../../../../shared/access.js';
import { pmKeys } from '../../../api/keys.js';
import { useNotify } from '../../../hooks/use-notify.js';
import { usePmApi } from '../../../hooks/use-pm-api.js';
import { useViewer } from '../../../hooks/use-viewer.js';
import { startingExecutor } from '../../../lib/kinds.js';
import type { StartRequest } from '../detail/start-dialog.js';
import { isRejectedTransition, planBoardMove } from './board-model.js';

export interface BoardMove {
  /** Issue id → the status it is being moved to, shown until the server answers. */
  readonly overrides: ReadonlyMap<string, string>;
  readonly drop: (
    issue: IssueListItem,
    to: StatusDefinition | undefined,
    statuses?: readonly StatusDefinition[],
  ) => void;
  /** The move waiting for a "Start now?" answer, for `StartDialog`. */
  readonly startRequest: StartRequest | null;
  readonly decide: (start: boolean) => void;
  readonly cancel: () => void;
}

/**
 * Drag-to-change-status for the board. A drop moves the card at once and the change follows, based on the revision
 * the card was read at. A refused move (the workflow, the viewer's rights, a change made meanwhile) or any other
 * failure snaps the card back with a notice. The override goes only after the list has been refetched, so an accepted
 * card does not flicker back to its old column in between. Moving an issue an agent executes out of backlog asks
 * "Start now?" first (`startingExecutor`), with the card already in its new column; closing the dialog snaps it back.
 */
export function useBoardMove(): BoardMove {
  // Named: the application calls this from its own page, in its own namespace.
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const api = usePmApi();
  const notify = useNotify();
  const viewer = useViewer();
  const queryClient = useQueryClient();
  const [overrides, setOverrides] = useState<ReadonlyMap<string, string>>(
    () => new Map(),
  );
  const [pending, setPending] = useState<{
    readonly issue: IssueListItem;
    readonly statusKey: string;
    readonly request: StartRequest;
  } | null>(null);

  function setOverride(issueId: string, statusKey: string | null): void {
    setOverrides((current) => {
      const next = new Map(current);
      if (statusKey) next.set(issueId, statusKey);
      else next.delete(issueId);
      return next;
    });
  }

  async function send(
    issue: IssueListItem,
    statusKey: string,
    start?: boolean,
  ): Promise<void> {
    try {
      const { pendingApproval } = await api.updateIssue(issue.id, {
        revision: issue.revision,
        statusKey,
        ...(start === undefined ? {} : { start }),
      });
      if (pendingApproval)
        notify.info(
          t('approvals.pendingToast'),
          t('approvals.pendingToastDescription'),
        );
      await queryClient.invalidateQueries({ queryKey: pmKeys.issues });
      void queryClient.invalidateQueries({ queryKey: pmKeys.issue(issue.id) });
    } catch (error) {
      if (
        error instanceof ApiClientError &&
        isRejectedTransition(error.status, error.reason)
      )
        notify.error(
          error,
          t('board.moveRejected', { identifier: issue.identifier }),
        );
      else notify.error(error);
      void queryClient.invalidateQueries({ queryKey: pmKeys.issues });
    } finally {
      setOverride(issue.id, null);
    }
  }

  return {
    overrides,
    startRequest: pending?.request ?? null,
    decide(start) {
      if (!pending) return;
      setPending(null);
      void send(pending.issue, pending.statusKey, start);
    },
    cancel() {
      if (!pending) return;
      setPending(null);
      setOverride(pending.issue.id, null);
    },
    drop(issue, to, statuses) {
      const plan = planBoardMove(issue, to, viewer);
      if (plan.kind === 'none') return;
      if (plan.kind === 'denied') {
        notify.error(
          null,
          t('board.closeDenied', { identifier: issue.identifier }),
        );
        return;
      }
      setOverride(issue.id, plan.statusKey);
      const starting = startingExecutor({
        fromStatus: issue.statusKey,
        toStatus: plan.statusKey,
        executorBefore: issue.executor,
        ...(statuses ? { statuses } : {}),
      });
      if (starting) {
        setPending({
          issue,
          statusKey: plan.statusKey,
          request: {
            kind: starting.type,
            names: [issue.executorName ?? starting.id],
            identifier: issue.identifier,
          },
        });
        return;
      }
      void send(issue, plan.statusKey);
    },
  };
}
