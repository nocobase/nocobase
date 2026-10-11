/**
 * The design decision from the issue page's comment box: while the issue waits in Proposal review, "Approve proposal"
 * and "Send back" sit beside the send button for whoever may decide, with what is written as the decision's comment
 * (the reason, when sending back). A comment alone decides nothing, so people who answered the proposal with "go ahead"
 * had to be sent to the proposal card first.
 *
 * Approving goes through the card's `useDesignApproval`, so an issue without an executor who can implement it asks for
 * a developer in the same dialog; the page renders that `dialog`.
 */
import type { IssueDetail } from '@nocobase/app-plugin-projects/shared/issues';
import { useTranslation } from '@nocobase/i18n/client';
import { CheckIcon, Undo2Icon } from 'lucide-react';
import { useEffect, useRef, type ReactElement } from 'react';

import type { CommentComposerAction } from '@/components/comment-thread';

import { useNotify } from '../../access/notify.js';
import { useDesignDecision, useDesignState } from './api.js';
import { useDesignApproval } from './approval.js';

export function useDesignComposerActions(issue: IssueDetail): {
  readonly actions: readonly CommentComposerAction[];
  readonly dialog: ReactElement | null;
} {
  const { t } = useTranslation();
  const notify = useNotify();
  const state = useDesignState(issue.id, issue.revision);
  const decide = useDesignDecision(issue.id);
  // The approval running from the box: `true` clears it, `false` (the developer dialog dismissed) keeps the draft.
  const settleRef = useRef<((approved: boolean) => void) | null>(null);
  const busyRef = useRef(false);
  const approval = useDesignApproval(issue.id, state.data, () => {
    notify.success(t('design.done.approve'));
    settleRef.current?.(true);
    settleRef.current = null;
  });
  const active = approval.open || approval.pending;
  useEffect(() => {
    if (active) busyRef.current = true;
    else if (busyRef.current) {
      busyRef.current = false;
      settleRef.current?.(false);
      settleRef.current = null;
    }
  }, [active]);
  const design = approval.latest ?? state.data;
  if (!design?.inReview || !design.proposal)
    return { actions: [], dialog: null };
  return {
    dialog: approval.dialog,
    actions: [
      ...(design.canApprove
        ? [
            {
              key: 'approve',
              label: t('design.composer.approve'),
              title: t('design.composer.approveHint'),
              icon: <CheckIcon data-icon='inline-start' />,
              onRun: (comment: string) =>
                new Promise<boolean>((resolve) => {
                  // `approve` ignores a click while a decision is already under way.
                  if (approval.pending) return resolve(false);
                  settleRef.current?.(false);
                  settleRef.current = resolve;
                  approval.approve(comment);
                }),
            },
          ]
        : []),
      ...(design.canRequestChanges
        ? [
            {
              key: 'requestChanges',
              label: t('design.composer.requestChanges'),
              title: t('design.composer.requestChangesHint'),
              icon: <Undo2Icon data-icon='inline-start' />,
              needsContent: true,
              onRun: async (comment: string): Promise<boolean> => {
                try {
                  await decide.mutateAsync({
                    decision: 'requestChanges',
                    comment,
                  });
                  notify.success(t('design.done.requestChanges'));
                  return true;
                } catch (error) {
                  notify.error(error);
                  return false;
                }
              },
            },
          ]
        : []),
    ],
  };
}
