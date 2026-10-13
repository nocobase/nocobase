/**
 * The comment box of an issue, under its feed: rich text, `@` mentions of agents and the project's members, files, a
 * note mode when some kind can be woken, and the reply the feed started. Nothing renders without `issues/comment`.
 */
import {
  canUploadAttachments,
  useAttachmentUploads,
  useAuthorLabel,
  useHasMentionableKinds,
} from '@nocobase/app-plugin-projects/client/issues';
import { useViewer } from '@nocobase/app-plugin-projects/client/kit';
import { useTranslation } from '@nocobase/i18n/client';
import { useMemo, type ReactElement } from 'react';

import { PendingAttachments } from '@/components/attachment-list';
import { CommentComposer } from '@/components/comment-thread';

import { useIssuePageWording } from '../detail/labels.js';
import { MentionMembersLoadError } from '../detail/mention-members-load-error.js';
import { useIssueConversation } from './conversation-state.js';

export function IssueComposer({
  className,
}: {
  readonly className?: string;
}): ReactElement | null {
  const { i18n, t: appT } = useTranslation();
  const wording = useIssuePageWording();
  const { t } = wording;
  const viewer = useViewer();
  const authorLabel = useAuthorLabel();
  const wakeable = useHasMentionableKinds();
  const uploads = useAttachmentUploads();
  const conversation = useIssueConversation();
  const { replyTo, setReplyTo } = conversation;
  const modes = useMemo(
    () =>
      wakeable
        ? [
            {
              value: 'comment',
              label: t('comments.modeComment'),
              placeholder: t('comments.placeholder'),
            },
            {
              value: 'note',
              label: t('comments.modeNote'),
              placeholder: t('comments.notePlaceholder'),
              send: t('comments.sendNote'),
            },
          ]
        : undefined,
    [wakeable, t],
  );
  if (!conversation.mayComment) return null;
  return (
    <div className={className} data-testid='issue-composer'>
      {conversation.memberSearchFailed ? (
        <MentionMembersLoadError
          message={appT('issuesPage.mentionMembersLoadFailed')}
          retryLabel={appT('common.retry')}
          onRetry={conversation.retryMembers}
          retrying={conversation.retryingMembers}
          onRetryMouseDown={(event) => event.preventDefault()}
        />
      ) : null}
      <CommentComposer
        editorRef={conversation.editorRef}
        replyingTo={replyTo ? authorLabel(replyTo) : null}
        onCancelReply={() => setReplyTo(null)}
        {...(modes ? { modes } : {})}
        onMentionSearch={conversation.searchMentions}
        mentionSearchRevision={conversation.mentionSearchRevision}
        {...(canUploadAttachments(viewer) ? { onAttach: uploads.add } : {})}
        attachments={
          <PendingAttachments
            files={uploads.uploads.map((upload) => ({
              key: upload.key,
              name: upload.name,
              size: upload.size,
              done: upload.attachment !== null,
              thumbnailUrl: upload.attachment?.previewable
                ? upload.attachment.contentUrl
                : null,
            }))}
            onRemove={uploads.remove}
            locale={i18n.language}
            labels={wording.attachments}
          />
        }
        busy={uploads.uploading}
        onSubmit={async (content, mode) => {
          const comment = await conversation.actions.create({
            content,
            ...(replyTo ? { parentId: replyTo.id } : {}),
            attachmentIds: uploads.ids,
            note: mode === 'note',
          });
          uploads.clear();
          setReplyTo(null);
          return comment.id;
        }}
        labels={wording.composer}
      />
    </div>
  );
}
