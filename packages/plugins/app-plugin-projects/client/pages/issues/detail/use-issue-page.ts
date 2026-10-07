/**
 * The headless parts of an issue's page beyond its activity, for the application that presents it (for example, with the UI
 * Library's `issue-detail` block): the issue itself, and every change the page makes, each refreshing what it changed
 * and reporting what failed (the returned promise then rejects, so a presenter can keep its draft open).
 */
import {
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import {
  ATTACHMENTS_PER_REQUEST_MAX,
  ATTACHMENT_SIZE_MAX,
} from '../../../../shared/attachments.js';
import { COLORS, type Color } from '../../../../shared/common.js';
import type { IssueDetail, IssueListItem } from '../../../../shared/issues.js';
import type { Label } from '../../../../shared/labels.js';
import { ACCESS_NAMESPACE } from '../../../../shared/access.js';
import { useTranslation } from '@nocobase/i18n/client';
import { pmKeys } from '../../../api/keys.js';
import { ATTACHMENT_SIZE_MB } from '../../../hooks/use-attachment-uploads.js';
import { useNotify } from '../../../hooks/use-notify.js';
import { usePmApi } from '../../../hooks/use-pm-api.js';
import { refreshIssue } from './comment-cache.js';

/** One issue, by its id or identifier (`PM-12`): the API answers either. */
export function useIssueDetail(issueId: string): UseQueryResult<IssueDetail> {
  const api = usePmApi();
  return useQuery({
    queryKey: pmKeys.issue(issueId),
    queryFn: () => api.issue(issueId),
  });
}

/** A colour for a new label, spread over the palette by name so labels created in a row differ. */
function colorFor(name: string): Color {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return COLORS[hash % COLORS.length] ?? 'gray';
}

export interface IssuePageActions {
  /** Checks or unchecks an item of the current status's checklist. */
  readonly toggleChecklistItem: (
    itemKey: string,
    checked: boolean,
  ) => Promise<void>;
  /** Decides or withdraws the pending approval request. */
  readonly decideApproval: (
    requestId: string,
    decision: 'approve' | 'reject' | 'withdraw',
    comment?: string,
  ) => Promise<void>;
  /** The issue waits for `dependsOnIssueId`. */
  readonly addBlocker: (dependsOnIssueId: string) => Promise<void>;
  readonly removeDependency: (dependencyId: string) => Promise<void>;
  /** Issues matching the text, for the dependency search. */
  readonly searchIssues: (query: string) => Promise<readonly IssueListItem[]>;
  /** Uploads files onto the issue, one by one; answers when all are done. */
  readonly uploadFiles: (files: readonly File[]) => Promise<void>;
  readonly removeFile: (attachmentId: string) => Promise<void>;
  readonly setFollowing: (follow: boolean) => Promise<void>;
  /** Gives a label another colour, everywhere it is used. */
  readonly recolorLabel: (labelId: string, color: Color) => Promise<void>;
  /** Creates a label (coloured by its name) and answers its id. */
  readonly createLabel: (name: string) => Promise<string | undefined>;
  readonly deleteIssue: () => Promise<void>;
}

/** Every change the issue's page makes, other than its properties (`useIssueUpdate`) and comments. */
export function useIssuePageActions(detail: IssueDetail): IssuePageActions {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const api = usePmApi();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const run = useCallback(
    async <T>(action: () => Promise<T>, done?: string): Promise<T> => {
      try {
        const result = await action();
        if (done) notify.success(done);
        return result;
      } catch (error: unknown) {
        notify.error(error);
        throw error;
      } finally {
        refreshIssue(queryClient);
      }
    },
    [notify, queryClient],
  );

  return useMemo(
    () => ({
      toggleChecklistItem: (itemKey, checked) =>
        run(async () => {
          if (!detail.checklist) return;
          await api.setChecklistItem(
            detail.id,
            detail.checklist.statusKey,
            itemKey,
            { checked },
          );
        }),
      decideApproval: (requestId, decision, comment) =>
        run(async () => {
          const decided =
            decision === 'withdraw'
              ? await api.withdrawApproval(requestId)
              : await api.decideApproval(requestId, decision, comment);
          if (decided.status === 'stale')
            notify.info(t('approvals.stale'), t('approvals.staleDescription'));
          else notify.success(t(`approvals.${decided.status}`));
        }),
      addBlocker: (dependsOnIssueId) =>
        run(async () => {
          await api.addDependency(detail.id, {
            dependsOnIssueId,
            type: 'blockedBy',
          });
        }, t('dependencies.added')),
      removeDependency: (dependencyId) =>
        run(
          () => api.removeDependency(detail.id, dependencyId),
          t('dependencies.removed'),
        ),
      searchIssues: async (query) =>
        (await api.issuePage({ ...(query ? { q: query } : {}), limit: 20 }))
          .data,
      uploadFiles: async (files) => {
        if (files.length > ATTACHMENTS_PER_REQUEST_MAX)
          notify.error(
            null,
            t('attachments.tooMany', { count: ATTACHMENTS_PER_REQUEST_MAX }),
          );
        for (const file of files.slice(0, ATTACHMENTS_PER_REQUEST_MAX)) {
          if (file.size > ATTACHMENT_SIZE_MAX) {
            notify.error(
              null,
              t('attachments.tooLarge', {
                name: file.name,
                size: ATTACHMENT_SIZE_MB,
              }),
            );
            continue;
          }
          try {
            await api.uploadIssueAttachment(detail.id, file);
          } catch (error: unknown) {
            notify.error(
              error,
              t('attachments.uploadFailed', { name: file.name }),
            );
          }
        }
        refreshIssue(queryClient);
      },
      removeFile: (attachmentId) =>
        run(() => api.removeAttachment(attachmentId)),
      setFollowing: (follow) =>
        run(
          async () => {
            await api.setSubscription(detail.id, follow);
          },
          follow ? t('subscribers.subscribed') : t('subscribers.unsubscribed'),
        ),
      recolorLabel: async (labelId, color) => {
        try {
          await api.updateLabel(labelId, { color });
        } catch (error: unknown) {
          notify.error(error);
          throw error;
        } finally {
          void queryClient.invalidateQueries({ queryKey: pmKeys.labels });
          refreshIssue(queryClient);
        }
      },
      createLabel: async (name) => {
        try {
          const label = await api.createLabel({ name, color: colorFor(name) });
          queryClient.setQueryData<Label[]>(pmKeys.labels, (current) => [
            ...(current ?? []),
            label,
          ]);
          void queryClient.invalidateQueries({ queryKey: pmKeys.labels });
          return label.id;
        } catch (error: unknown) {
          notify.error(error, t('labels.createFailed'));
          return undefined;
        }
      },
      deleteIssue: () =>
        run(
          () => api.deleteIssue(detail.id),
          t('issue.deleted', { identifier: detail.identifier }),
        ),
    }),
    [api, detail, notify, queryClient, run, t],
  );
}
