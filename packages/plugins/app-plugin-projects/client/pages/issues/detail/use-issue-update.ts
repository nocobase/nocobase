import { ApiClientError } from '@nocobase/app-client';
import {
  hashKey,
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

export type IssueChanges = Omit<UpdateIssueRequest, 'revision'> & {
  /** A text draft's starting revision; immediate property changes use the latest cache revision. */
  readonly revision?: number;
};

export type IssueUpdate = UseMutationResult<
  UpdateIssueResult,
  unknown,
  IssueChanges
>;

/**
 * Every change to an issue on its page: a PATCH using an explicit draft revision or the newest revision in the cache.
 * A 409 `REVISION_CONFLICT` rejects the change and refreshes the detail; text editors keep their draft and revision.
 * `detailKey` is the key the page reads the issue under (its id or identifier, as the URL has it).
 */
export function useIssueUpdate(issue: Issue, detailKey: QueryKey): IssueUpdate {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const api = usePmApi();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: detailKey });
    // Opened by its key, the page reads the issue under another key too; once is enough when they are the same.
    if (hashKey(detailKey) !== hashKey(pmKeys.issue(issue.id)))
      void queryClient.invalidateQueries({ queryKey: pmKeys.issue(issue.id) });
    void queryClient.invalidateQueries({ queryKey: pmKeys.issues });
  };

  return useMutation({
    mutationFn: (changes: IssueChanges) => {
      const cached = queryClient.getQueryData<IssueDetail>(detailKey);
      return api.updateIssue(issue.id, {
        ...changes,
        revision: changes.revision ?? cached?.revision ?? issue.revision,
      });
    },
    onSuccess: ({ issue: updated }) => {
      queryClient.setQueryData<IssueDetail>(detailKey, (previous) =>
        previous ? { ...previous, ...updated } : previous,
      );
      refresh();
    },
    onError: (error, changes) => {
      if (
        error instanceof ApiClientError &&
        error.reason === 'REVISION_CONFLICT'
      ) {
        // Text editors retain their draft while the detail refreshes underneath it.
        notify.error(
          null,
          t(
            changes.revision === undefined
              ? 'issue.conflict'
              : 'issue.draftConflict',
          ),
        );
        refresh();
        return;
      }
      notify.error(error);
      // A refusal from the issue's state may mean the page is behind.
      if (error instanceof ApiClientError) refresh();
    },
  });
}
