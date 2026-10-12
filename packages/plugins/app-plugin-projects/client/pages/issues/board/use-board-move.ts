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
import { isRejectedTransition, planBoardMove } from './board-model.js';

export interface BoardMove {
  /** Issue id → the status it is being moved to, shown until the server answers. */
  readonly overrides: ReadonlyMap<string, string>;
  readonly drop: (
    issue: IssueListItem,
    to: StatusDefinition | undefined,
    statuses?: readonly StatusDefinition[],
  ) => void;
}

/**
 * Drag-to-change-status for the board. A drop moves the card at once and the change follows, based on the revision
 * the card was read at. A refused move (the viewer's rights, a change made meanwhile) or any other
 * failure snaps the card back with a notice. The override goes only after the list has been refetched, so an accepted
 * card does not flicker back to its old column in between. Moving an issue to `in_progress` starts its work.
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

  function setOverride(issueId: string, statusKey: string | null): void {
    setOverrides((current) => {
      const next = new Map(current);
      if (statusKey) next.set(issueId, statusKey);
      else next.delete(issueId);
      return next;
    });
  }

  async function send(issue: IssueListItem, statusKey: string): Promise<void> {
    try {
      await api.updateIssue(issue.id, {
        revision: issue.revision,
        statusKey,
      });
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
    drop(issue, to) {
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
      void send(issue, plan.statusKey);
    },
  };
}
