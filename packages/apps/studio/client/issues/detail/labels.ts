/**
 * The wording of the UI Library items on an issue's page, from the projects plugin's own translations (its
 * namespace): i18next's `{{name}}` placeholders are turned into the items' `{name}` ones.
 */
import { ACCESS_NAMESPACE as PROJECTS_NS } from '@nocobase/app-plugin-projects/shared/access';
import { useTranslation } from '@nocobase/i18n/client';
import { useMemo } from 'react';

import type { AttachmentLabels } from '@/components/attachment-list';
import type { IssueDetailLabels } from '@/extensions/nocobase-issue-detail/labels';
import type {
  CommentComposerLabels,
  CommentThreadLabels,
} from '@/components/comment-thread';
import type { RichTextLabels } from '@/components/rich-text-editor';

export type Translate = (
  key: string,
  options?: Record<string, unknown>,
) => string;

/** `{ name: '{name}' }` for each name, so a translation keeps the item's placeholder. */
export function keep(...names: string[]): Record<string, string> {
  return Object.fromEntries(names.map((name) => [name, `{${name}}`]));
}

export interface IssuePageWording {
  /** The projects plugin's `t`. */
  readonly t: Translate;
  readonly thread: CommentThreadLabels;
  readonly composer: CommentComposerLabels;
  readonly attachments: AttachmentLabels;
  readonly richText: RichTextLabels;
  readonly detail: IssueDetailLabels;
}

export function useIssuePageWording(): IssuePageWording {
  const { t } = useTranslation(PROJECTS_NS);
  const { t: appT } = useTranslation();
  return useMemo(
    () => ({
      t,
      thread: {
        title: t('activity.title'),
        empty: t('activity.empty'),
        loadOlder: t('activity.loadOlder'),
        reply: t('comments.reply'),
        replyTo: t('comments.replyTo', keep('name')),
        edit: t('comments.edit'),
        editLabel: t('comments.editLabel'),
        delete: t('comments.delete'),
        deleteTitle: t('comments.deleteTitle'),
        deleteDescription: t('comments.deleteDescription'),
        deleted: t('comments.deleted'),
        edited: t('comments.edited'),
        more: t('comments.more'),
        cancel: t('actions.cancel'),
        save: t('actions.save'),
        resolve: t('threads.resolve'),
        resolved: t('threads.resolved'),
        resolvedBy: t('threads.resolvedBy', keep('name')),
        reopen: t('threads.unresolve'),
        expand: t('threads.expand', keep('name')),
        collapse: t('threads.collapse'),
        replies: t('threads.replies_other', keep('count')),
        reactions: t('reactions.label'),
        addReaction: t('reactions.add'),
        toggleReaction: t('reactions.toggle', keep('emoji', 'count', 'names')),
        nameSeparator: t('comments.nameSeparator'),
      },
      composer: {
        label: t('comments.label'),
        placeholder: t('comments.placeholder'),
        send: t('comments.send'),
        sendReply: t('comments.sendReply'),
        replyingTo: t('comments.replyingTo', keep('name')),
        cancelReply: t('comments.cancelReply'),
        attach: t('attachments.attach'),
        hint: `Enter ${t('composer.quickSend')} · Shift + Enter ${t('composer.newLine')}`,
      },
      attachments: {
        title: t('attachments.title'),
        images: t('attachments.images'),
        files: t('attachments.files'),
        pending: t('attachments.pending'),
        upload: t('attachments.upload'),
        preview: t('attachments.preview', keep('name')),
        download: t('attachments.download', keep('name')),
        remove: t('attachments.remove', keep('name')),
        uploading: t('attachments.uploading', keep('name')),
        removeTitle: t('attachments.removeTitle'),
        removeDescription: t('attachments.removeDescription', keep('name')),
        removeConfirm: t('attachments.removeConfirm'),
        cancel: t('actions.cancel'),
        previous: t('attachments.previous'),
        next: t('attachments.next'),
      },
      detail: {
        editTitle: t('issue.editTitle'),
        titleLabel: t('issueForm.titleLabel'),
        parent: t('issue.parent'),
        description: t('issueForm.descriptionLabel'),
        descriptionPlaceholder: t('issueForm.descriptionPlaceholder'),
        editDescription: t('issue.editDescription'),
        noDescription: t('issue.noDescription'),
        save: t('actions.save'),
        cancel: t('actions.cancel'),
        delete: t('issue.delete'),
        deleteTitle: t('issue.deleteTitle', keep('identifier')),
        deleteDescription: t('issue.deleteDescription'),
        properties: t('properties.title'),
        saving: t('common.saving'),
        createNamed: t('common.createNamed', keep('name')),
        noOptions: t('common.noOptions'),
        checklist: {
          title: t('checklist.title'),
          label: t('checklist.cardLabel'),
          progress: t('checklist.progress', keep('done', 'total')),
          required: t('checklist.required'),
          checkedBy: t('checklist.checkedBy', keep('name', 'time')),
          incomplete: t('checklist.incomplete'),
        },
        approvals: {
          label: t('approvals.cardLabel'),
          pending: t('approvals.pendingTitle'),
          requester: t('approvals.requester'),
          approvers: t('approvals.approvers'),
          comment: t('approvals.comment'),
          commentPlaceholder: t('approvals.commentPlaceholder'),
          approve: t('approvals.approve'),
          reject: t('approvals.reject'),
          withdraw: t('approvals.withdraw'),
          waiting: t('approvals.waiting'),
          recent: t('approvals.recentTitle'),
        },
        subtasks: {
          title: t('subtasks.title'),
          none: t('issueAdd.none'),
          stage: t('subtasks.stage', keep('stage')),
          noStage: t('subtasks.noStage'),
        },
        dependencies: {
          title: t('dependencies.title'),
          blockedBy: t('dependencies.blockedBy'),
          blocks: t('dependencies.blocks'),
          related: t('dependencies.related'),
          remove: t('dependencies.remove', keep('identifier')),
          add: appT('issuesPage.relationships.add'),
          type: appT('issuesPage.relationships.type'),
          prerequisite: appT('issuesPage.relationships.prerequisite'),
          hint: appT('issuesPage.relationships.hint'),
          changeType: appT('issuesPage.relationships.changeType'),
          toRelated: appT('issuesPage.relationships.toRelated'),
          toBlocker: appT('issuesPage.relationships.toBlocker'),
          addPlaceholder: t('dependencies.addPlaceholder'),
          addLabel: t('issueAdd.label'),
          addDependency: t('issueAdd.dependency'),
          searchEmpty: t('issuePicker.empty'),
        },
        labelColors: {
          open: t('labelColors.open'),
          title: t('labelColors.title'),
          for: t('labelColors.for', keep('name')),
        },
        followers: {
          title: t('subscribers.title'),
          none: t('subscribers.none'),
          follow: t('subscribers.subscribe'),
          unfollow: t('subscribers.unsubscribe'),
          label: t('subscribers.label', keep('count')),
        },
        dates: {
          title: t('properties.details'),
          created: t('properties.created'),
          updated: t('properties.updated'),
        },
        start: {
          title: t('start.title'),
          later: t('start.later'),
          start: t('start.start'),
        },
      },
      richText: {
        mentionList: t('richText.mentionList'),
        noMatches: t('richText.noMatches'),
        toolbar: t('richText.toolbar'),
        uploading: t('common.saving'),
        tools: {
          bold: t('richText.tools.bold'),
          italic: t('richText.tools.italic'),
          strike: t('richText.tools.strike'),
          code: t('richText.tools.code'),
          bulletList: t('richText.tools.bulletList'),
          orderedList: t('richText.tools.orderedList'),
          quote: t('richText.tools.quote'),
        },
      },
    }),
    [t, appT],
  );
}
