/**
 * The comment box of an issue, under its feed: rich text, `@` mentions of agents and the project's members, files, a
 * note mode when some kind can be woken, and the reply the feed started. Nothing renders without `issues/comment`.
 */
import {
  canUploadAttachments,
  useAttachmentUploads,
  useHasMentionableKinds,
} from '@nocobase/app-plugin-projects/client/issues';
import { useViewer } from '@nocobase/app-plugin-projects/client/kit';
import { useTranslation } from '@nocobase/i18n/client';
import { SendIcon } from 'lucide-react';
import { useMemo, useRef, type FocusEvent, type ReactElement } from 'react';

import { PendingAttachments } from '@/components/attachment-list';
import { CommentComposer } from '@/components/comment-thread';
import type { ComposerSession } from '@/components/composer-session';

import { useIssuePageWording } from '../detail/labels.js';
import { MentionMembersLoadError } from '../detail/mention-members-load-error.js';
import { useIssueConversation } from './conversation-state.js';

export function IssueComposer({
  foldable = false,
  session,
  className,
}: {
  /** Keeps the draft's text outside the composer, one per task (the split view's `useTaskDraft`). */
  readonly session?: ComposerSession;
  /** Starts as a slim bar that opens the composer when tapped, and folds again once sent or left empty; for a phone. */
  readonly foldable?: boolean;
  readonly className?: string;
}): ReactElement | null {
  const { i18n, t: appT } = useTranslation();
  const wording = useIssuePageWording();
  const { t } = wording;
  const viewer = useViewer();
  const wakeable = useHasMentionableKinds();
  const uploads = useAttachmentUploads();
  const conversation = useIssueConversation();
  const { replyTo, setReplyTo, composerOpen, setComposerOpen } = conversation;
  const rootRef = useRef<HTMLDivElement>(null);
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
  if (foldable && !composerOpen)
    return (
      <div className={className} data-testid='issue-composer' data-folded=''>
        <button
          type='button'
          className='flex h-11 w-full items-center gap-2 rounded-full border bg-background pr-1.5 pl-4 text-left text-sm text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none'
          onClick={conversation.openComposer}
        >
          <span className='min-w-0 flex-1 truncate'>
            {wording.composer.placeholder}
          </span>
          <span
            aria-hidden
            className='inline-flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground'
          >
            <SendIcon className='size-4' />
          </span>
        </button>
      </div>
    );
  return (
    <div
      ref={rootRef}
      className={className}
      data-testid='issue-composer'
      {...(foldable
        ? {
            // Left empty, it folds back to the slim bar.
            onBlur: (event: FocusEvent<HTMLDivElement>) => {
              const next = event.relatedTarget;
              if (next instanceof Node && rootRef.current?.contains(next))
                return;
              const text =
                rootRef.current
                  ?.querySelector('[contenteditable]')
                  ?.textContent?.trim() ?? '';
              if (!text && uploads.uploads.length === 0 && !replyTo)
                setComposerOpen(false);
            },
          }
        : {})}
    >
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
        replyingTo={
          replyTo ? (replyTo.authorName ?? appT('common.unknown')) : null
        }
        onCancelReply={() => setReplyTo(null)}
        {...(session ? { session } : {})}
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
          if (foldable) setComposerOpen(false);
          return comment.id;
        }}
        labels={wording.composer}
      />
    </div>
  );
}
