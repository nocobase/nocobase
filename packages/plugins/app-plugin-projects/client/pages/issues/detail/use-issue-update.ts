import { ApiClientError } from '@nocobase/app-client';
import {
  type QueryKey,
  type UseMutationResult,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';

import { useTranslation } from '@nocobase/i18n/client';

import { ACCESS_NAMESPACE } from '../../../../shared/access.js';

import type {
  Issue,
  IssueDetail,
  UpdateIssueRequest,
  UpdateIssueResult,
} from '../../../../shared/issues.js';
import { pmKeys } from '../../../api/keys.js';
import { useNotify } from '../../../hooks/use-notify.js';
import { usePmApi } from '../../../hooks/use-pm-api.js';

export type IssueChanges = Omit<UpdateIssueRequest, 'revision'>;

export type IssueUpdate = UseMutationResult<
  UpdateIssueResult,
  unknown,
  IssueChanges
>;

/**
 * Every change to an issue on its page: a PATCH based on the newest `revision` the cache holds. A 409
 * `REVISION_CONFLICT` means someone changed the issue first: the change is dropped, the user told, and the detail
 * reloaded rather than overwriting their edit. A status change the workflow holds for approval changes nothing and
 * says so. `detailKey` is the key the page reads the issue under (its id or its identifier, as the URL has it).
 */
export function useIssueUpdate(issue: Issue, detailKey: QueryKey): IssueUpdate {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const api = usePmApi();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: detailKey });
    void queryClient.invalidateQueries({ queryKey: pmKeys.issue(issue.id) });
    void queryClient.invalidateQueries({ queryKey: pmKeys.issues });
  };

  return useMutation({
    mutationFn: (changes: IssueChanges) => {
      const cached = queryClient.getQueryData<IssueDetail>(detailKey);
      return api.updateIssue(issue.id, {
        ...changes,
        revision: cached?.revision ?? issue.revision,
      });
    },
    onSuccess: ({ issue: updated, pendingApproval }) => {
      queryClient.setQueryData<IssueDetail>(detailKey, (previous) =>
        previous ? { ...previous, ...updated } : previous,
      );
      if (pendingApproval)
        notify.info(
          t('approvals.pendingToast'),
          t('approvals.pendingToastDescription'),
        );
      refresh();
    },
    onError: (error) => {
      if (
        error instanceof ApiClientError &&
        error.reason === 'REVISION_CONFLICT'
      ) {
        // The issue's own wording ("reloading") rather than the generic one for the code.
        notify.error(null, t('issue.conflict'));
        refresh();
        return;
      }
      notify.error(error);
      // A refusal from the issue's state (a guard, a pending approval) may mean the page is behind.
      if (error instanceof ApiClientError) refresh();
    },
  });
}
