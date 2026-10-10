/**
 * The design decision from the issue page's comment box: while the issue waits in Proposal review, "Approve proposal"
 * and "Send back" sit beside the send button for whoever may decide, with what is written as the decision's comment
 * (the reason, when sending back). A comment alone decides nothing, so people who answered the proposal with "go ahead"
 * had to be sent to the proposal card first.
 */
import type { IssueDetail } from '@nocobase/app-plugin-projects/shared/issues';
import { useTranslation } from '@nocobase/i18n/client';
import { CheckIcon, Undo2Icon } from 'lucide-react';

import type { CommentComposerAction } from '@/components/comment-thread';

import { useNotify } from '../../access/notify.js';
import {
  useDesignDecision,
  useDesignState,
  type DesignDecision,
} from './api.js';

export function useDesignComposerActions(
  issue: IssueDetail,
): readonly CommentComposerAction[] {
  const { t } = useTranslation();
  const notify = useNotify();
  const state = useDesignState(issue.id, issue.revision);
  const decide = useDesignDecision(issue.id);
  const design = state.data;
  if (!design?.inReview || !design.proposal) return [];
  const decision =
    (key: DesignDecision) =>
    async (comment: string): Promise<boolean> => {
      try {
        await decide.mutateAsync({ decision: key, comment });
        notify.success(t(`design.done.${key}`));
        return true;
      } catch (error) {
        notify.error(error);
        return false;
      }
    };
  return [
    ...(design.canApprove
      ? [
          {
            key: 'approve',
            label: t('design.composer.approve'),
            title: t('design.composer.approveHint'),
            icon: <CheckIcon data-icon='inline-start' />,
            onRun: decision('approve'),
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
            onRun: decision('requestChanges'),
          },
        ]
      : []),
  ];
}
