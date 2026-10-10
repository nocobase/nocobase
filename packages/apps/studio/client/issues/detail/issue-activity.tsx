/**
 * An issue's main column: what the page places above the activity (`children`, the body, a card of its own), then the
 * activity in a second card: the comment threads, changes and the agents' runs on one line, and the comment composer
 * pinned to the card's bottom edge while it scrolls. A separate card rather than the body's: the activity is what
 * happened, not what the issue is, it grows without bound, and its composer needs an edge to pin to. It is the
 * installed `comment-thread` over
 * the projects plugin's headless hooks (`useIssueTimeline`, `useIssueCommentActions`, `useMentionSearch`), in the
 * projects plugin's words. A link with `?comment=<id>` highlights that comment and loads older threads until it is
 * found. Without `issues/comment` the composer and the reply buttons do not render.
 *
 * Someone other than the issue's owner may also "Comment and run as me": the agents the comment wakes would wait for
 * the owner to confirm them (`agents/run-requests.ts`); this runs them as the commenter now, on a runtime they may use,
 * and leaves them to the owner when there is none.
 */
import { useApiClient } from '@nocobase/app-client';
import { AgentAvatar } from '@nocobase/app-plugin-agents/client/kit';
import {
  canComment,
  canDeleteComment,
  canEditComment,
  canUploadAttachments,
  isBuiltInKind,
  ISSUE_REACTION_EMOJIS,
  useAttachmentUploads,
  useAuthorLabel,
  useHasMentionableKinds,
  useIssueCommentActions,
  useIssueTimeline,
  useKindLabel,
  useMentionSearch,
  type IssueComment,
  type TimelineRun,
} from '@nocobase/app-plugin-projects/client/issues';
import {
  pmKeys,
  useApiKeyActors,
  usePmApi,
  useViewer,
} from '@nocobase/app-plugin-projects/client/kit';
import type { IssueDetail } from '@nocobase/app-plugin-projects/shared/issues';
import { useTranslation } from '@nocobase/i18n/client';
import { useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { BotIcon } from 'lucide-react';
import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import { useSearchParams } from 'react-router';

import {
  AttachmentList,
  PendingAttachments,
} from '@/components/attachment-list';
import {
  CommentComposer,
  CommentTimeline,
  type CommentItem,
  type CommentTag,
  type CommentTimelineEntry,
} from '@/components/comment-thread';
import type { RichTextHandle } from '@/components/rich-text-editor';
import { IssueSurface } from '@/extensions/nocobase-issue-detail/issue-detail';
import { cn } from 'cn';

import { useNotify } from '../../access/notify.js';
import { runCommentAsMe, runRequestKeys } from '../../agents/run-requests.js';
import { IssueMarkdown } from '../markdown.js';
import { ActivityRow } from './activity-row.js';
import { attachmentFile, useFilePreviewState } from './files.js';
import { useIssuePageWording } from './labels.js';
import { MentionMembersLoadError } from './mention-members-load-error.js';
import { issueMentionCandidates } from './mention-candidates.js';

/** The composer's mode that runs what a comment asks of agents as the commenter. */
const MINE = 'mine';

export function IssueActivity({
  detail,
  detailKey,
  runs,
  renderRun,
  kindLabels,
  children,
}: {
  readonly detail: IssueDetail;
  readonly detailKey: QueryKey;
  readonly runs: readonly TimelineRun[];
  readonly renderRun: (runId: string) => ReactNode;
  /** The names of the comment kinds Studio writes, tagged on their comments. */
  readonly kindLabels: Readonly<Record<string, string>>;
  readonly children?: ReactNode;
}): ReactElement {
  const { i18n, t: appT } = useTranslation();
  const wording = useIssuePageWording();
  const { t } = wording;
  const api = usePmApi();
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  const notify = useNotify();
  const viewer = useViewer();
  const apiKeys = useApiKeyActors();
  const authorLabel = useAuthorLabel();
  const kindLabel = useKindLabel();
  const [params] = useSearchParams();
  const targetId = params.get('comment');
  const timeline = useIssueTimeline(detail, runs, targetId);
  const actions = useIssueCommentActions(detail.id, detailKey);
  const mentionSearch = useMentionSearch(detail.id);
  const wakeable = useHasMentionableKinds();
  const [memberSearchFailed, setMemberSearchFailed] = useState(false);
  const [mentionSearchRevision, setMentionSearchRevision] = useState(0);
  const project = useQuery({
    queryKey: pmKeys.project(detail.projectId ?? ''),
    queryFn: () => {
      if (!detail.projectId) throw new Error('Issue has no project');
      return api.project(detail.projectId);
    },
    enabled: Boolean(detail.projectId),
  });
  const projectData = project.data;
  const refetchProject = project.refetch;
  const searchMentions = useCallback(
    async (query: string) => {
      const candidates = await mentionSearch(query);
      let projectDetail = projectData;
      if (detail.projectId && !projectDetail) {
        projectDetail = (await refetchProject()).data;
      }
      if (detail.projectId && !projectDetail) {
        setMemberSearchFailed(true);
        return candidates
          .filter((candidate) => candidate.kind !== 'user')
          .map((candidate) => ({
            ...candidate,
            kindLabel: kindLabel(candidate.kind),
          }));
      }
      setMemberSearchFailed(false);
      return issueMentionCandidates(
        query,
        candidates,
        projectDetail?.members ?? [],
        kindLabel,
      );
    },
    [detail.projectId, kindLabel, mentionSearch, projectData, refetchProject],
  );
  const retryProjectMembers = useCallback(() => {
    void refetchProject().then((result) => {
      if (result.data) {
        setMemberSearchFailed(false);
        setMentionSearchRevision((revision) => revision + 1);
      }
    });
  }, [refetchProject]);
  const uploads = useAttachmentUploads();
  const preview = useFilePreviewState();
  const editorRef = useRef<RichTextHandle>(null);
  const [replyTo, setReplyTo] = useState<IssueComment | null>(null);
  const members = useQuery({
    queryKey: pmKeys.members,
    queryFn: () => api.members(),
  });
  const userName = (userId: string): string =>
    members.data?.find((member) => member.userId === userId)?.name ??
    (userId === viewer?.userId ? viewer.name : userId);
  const mayComment = canComment(viewer);

  const comments = new Map<string, IssueComment>();
  const toItem = (comment: IssueComment): CommentItem => {
    comments.set(comment.id, comment);
    const keyName =
      comment.authorType === 'user' && comment.authorId
        ? apiKeys.get(comment.authorId)
        : undefined;
    const kind = kindLabels[comment.kind];
    const tags: CommentTag[] = [
      ...(keyName ? [{ key: 'apiKey', label: t('common.apiKey') }] : []),
      ...(isBuiltInKind(comment.authorType)
        ? []
        : [
            {
              key: 'author',
              label: kindLabel(comment.authorType),
              tone: 'violet' as const,
            },
          ]),
      ...(kind ? [{ key: 'kind', label: kind, tone: 'blue' as const }] : []),
      ...(comment.note ? [{ key: 'note', label: t('comments.note') }] : []),
    ];
    const files = comment.attachments.map(attachmentFile);
    return {
      id: comment.id,
      authorName:
        comment.authorName === null && keyName ? keyName : authorLabel(comment),
      authorKind: comment.authorType,
      authorIcon:
        comment.authorType === 'agent' ? (
          <AgentAvatar
            name={comment.authorName}
            size='sm'
            className='size-full'
          />
        ) : (
          <BotIcon />
        ),
      tags,
      accent: Boolean(kind),
      createdAt: comment.createdAt,
      editedAt: comment.editedAt,
      deleted: comment.deleted,
      content: comment.content,
      footer:
        files.length > 0 ? (
          <AttachmentList
            files={files}
            locale={i18n.language}
            labels={wording.attachments}
            onPreview={(shown, index) =>
              preview.open(comment.attachments, shown, index)
            }
          />
        ) : null,
      reactions: comment.reactions.map((reaction) => ({
        emoji: reaction.emoji,
        count: reaction.count,
        names: reaction.userIds.map(userName),
        mine: Boolean(viewer && reaction.userIds.includes(viewer.userId)),
      })),
      canEdit: canEditComment(viewer, comment),
      canDelete: canDeleteComment(viewer, comment, detail),
    };
  };

  const entries: CommentTimelineEntry[] = timeline.entries.map((entry) => {
    if (entry.kind === 'thread')
      return {
        kind: 'thread',
        key: entry.key,
        thread: {
          root: toItem(entry.thread.root),
          replies: entry.thread.replies.map(toItem),
          resolved: Boolean(entry.thread.root.resolvedAt),
          resolvedBy: entry.thread.root.resolvedByName,
        },
      };
    if (entry.kind === 'run')
      return { kind: 'custom', key: entry.key, node: renderRun(entry.run.id) };
    return {
      kind: 'custom',
      key: entry.key,
      node: (
        <ActivityRow
          activity={entry.activity}
          statuses={detail.statuses}
          t={t}
        />
      ),
    };
  });
  const original = (item: CommentItem): IssueComment | undefined =>
    comments.get(item.id);

  // Only someone other than the owner is asked to wait for the owner's confirmation.
  const foreign = Boolean(viewer && viewer.userId !== detail.ownerUserId);
  const modes = useMemo(
    () =>
      wakeable
        ? [
            {
              value: 'comment',
              label: t('comments.modeComment'),
              placeholder: t('comments.placeholder'),
            },
            ...(foreign
              ? [
                  {
                    value: MINE,
                    label: appT('runRequests.commentMode'),
                    placeholder: appT('runRequests.commentModePlaceholder'),
                    send: appT('runRequests.commentModeSend'),
                  },
                ]
              : []),
            {
              value: 'note',
              label: t('comments.modeNote'),
              placeholder: t('comments.notePlaceholder'),
              send: t('comments.sendNote'),
            },
          ]
        : undefined,
    [wakeable, foreign, t, appT],
  );

  /** Runs what the comment asked of agents as the viewer; left to the owner when no runtime of theirs can. */
  const runAsMe = async (commentId: string): Promise<void> => {
    try {
      const count = await runCommentAsMe(apiClient, detail.id, commentId);
      if (count > 0) notify.success(appT('runRequests.commentRan', { count }));
    } catch (error) {
      notify.error(error, appT('runRequests.commentNotRun'));
    } finally {
      void queryClient.invalidateQueries({ queryKey: runRequestKeys.all });
    }
  };

  return (
    <>
      {children}
      <IssueSurface
        className={cn(mayComment && 'rounded-b-none border-b-0')}
        aria-label={wording.thread.title}
      >
        <CommentTimeline
          entries={entries}
          renderMarkdown={(content) => <IssueMarkdown content={content} />}
          emojis={ISSUE_REACTION_EMOJIS}
          {...(mayComment
            ? {
                onReply: (item: CommentItem) => {
                  setReplyTo(original(item) ?? null);
                  editorRef.current?.focus();
                },
                onResolve: (thread, resolved: boolean) =>
                  actions.resolve(thread.root.id, resolved),
              }
            : {})}
          onEdit={(item, content) => actions.update(item.id, content)}
          onDelete={(item) => actions.remove(item.id)}
          onReact={(item, emoji) => {
            const comment = original(item);
            if (comment && viewer) actions.react(comment, emoji, viewer.userId);
          }}
          onMentionSearch={searchMentions}
          mentionSearchRevision={mentionSearchRevision}
          replyingToId={replyTo?.id ?? null}
          targetId={targetId}
          hasOlder={timeline.hasOlder}
          loadingOlder={timeline.loadingOlder}
          onLoadOlder={timeline.loadOlder}
          locale={i18n.language}
          labels={wording.thread}
        />
      </IssueSurface>
      {/* The activity card's bottom edge, a sibling of the cards so it stays pinned while the body is read too. */}
      {mayComment ? (
        <div className='sticky bottom-0 z-10 -mt-4 rounded-b-lg border bg-card/95 text-card-foreground backdrop-blur-md md:-mt-6'>
          <div className='w-full px-4 py-3 md:px-6'>
            {memberSearchFailed ? (
              <MentionMembersLoadError
                message={appT('issuesPage.mentionMembersLoadFailed')}
                retryLabel={appT('common.retry')}
                onRetry={retryProjectMembers}
                retrying={project.isFetching}
                onRetryMouseDown={(event) => event.preventDefault()}
              />
            ) : null}
            <CommentComposer
              editorRef={editorRef}
              replyingTo={replyTo ? authorLabel(replyTo) : null}
              onCancelReply={() => setReplyTo(null)}
              {...(modes ? { modes } : {})}
              onMentionSearch={searchMentions}
              mentionSearchRevision={mentionSearchRevision}
              {...(canUploadAttachments(viewer)
                ? { onAttach: uploads.add }
                : {})}
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
                const comment = await actions.create({
                  content,
                  ...(replyTo ? { parentId: replyTo.id } : {}),
                  attachmentIds: uploads.ids,
                  note: mode === 'note',
                });
                uploads.clear();
                setReplyTo(null);
                if (mode === MINE) await runAsMe(comment.id);
                else
                  void queryClient.invalidateQueries({
                    queryKey: runRequestKeys.all,
                  });
                return comment.id;
              }}
              labels={wording.composer}
            />
          </div>
        </div>
      ) : null}
      {preview.dialog}
    </>
  );
}
