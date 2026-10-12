/**
 * An issue's activity, newest first: the comment threads (reply, edit, delete, resolve, react, files), status moves and
 * pull request events, and the system records (agents' runs and other changes). "Conversation only", the default, folds
 * each stretch of system records into one row that unfolds in place; "All" shows each. Long comments are cut to a few
 * lines. The project manager's hand-overs and agents' reviews are tagged as `feed.ts` reads them. It is the installed
 * `comment-thread` over the projects plugin's headless hooks, inside an `IssueConversation`; a link with
 * `?comment=<id>` highlights that comment and loads older threads until it is found.
 */
import { AgentAvatar } from '@nocobase/app-plugin-agents/client/kit';
import {
  canDeleteComment,
  canEditComment,
  isBuiltInKind,
  ISSUE_REACTION_EMOJIS,
  useAuthorLabel,
  useIssueTimeline,
  useKindLabel,
  type IssueComment,
  type TimelineEntry,
  type TimelineRun,
} from '@nocobase/app-plugin-projects/client/issues';
import {
  pmKeys,
  useApiKeyActors,
  usePmApi,
  useViewer,
} from '@nocobase/app-plugin-projects/client/kit';
import { useTranslation } from '@nocobase/i18n/client';
import { useQuery } from '@tanstack/react-query';
import { BotIcon, ChevronRightIcon } from 'lucide-react';
import { useMemo, useState, type ReactElement, type ReactNode } from 'react';
import { useSearchParams } from 'react-router';

import { AttachmentList } from '@/components/attachment-list';
import {
  CommentTimeline,
  type CommentItem,
  type CommentTag,
  type CommentTimelineEntry,
} from '@/components/comment-thread';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from 'cn';

import { PROJECT_MANAGER_ID } from '../../../shared/project-manager.js';
import { ActivityRow } from '../detail/activity-row.js';
import { attachmentFile, useFilePreviewState } from '../detail/files.js';
import { useIssuePageWording } from '../detail/labels.js';
import { IssueMarkdown } from '../markdown.js';
import { Clamped } from './clamped.js';
import { useIssueConversation } from './conversation-state.js';
import { buildFeed, type FeedEvent } from './feed.js';
import {
  groupFeedRows,
  newestFirst,
  type FeedMode,
  type FeedRow,
} from './feed-rows.js';

const NO_RUNS: readonly TimelineRun[] = [];
const NO_KINDS: Readonly<Record<string, string>> = {};

export function IssueFeed({
  runs = NO_RUNS,
  renderRun,
  kindLabels = NO_KINDS,
  className,
}: {
  readonly runs?: readonly TimelineRun[];
  /** Draws an agent's run on the feed; without it runs are left out. */
  readonly renderRun?: (runId: string) => ReactNode;
  /** The names of the comment kinds Studio writes, tagged on their comments. */
  readonly kindLabels?: Readonly<Record<string, string>>;
  readonly className?: string;
}): ReactElement {
  const { i18n, t: appT } = useTranslation();
  const wording = useIssuePageWording();
  const { t } = wording;
  const conversation = useIssueConversation();
  const { detail, actions, mayComment, setReplyTo } = conversation;
  const api = usePmApi();
  const viewer = useViewer();
  const apiKeys = useApiKeyActors();
  const authorLabel = useAuthorLabel();
  const kindLabel = useKindLabel();
  const [params] = useSearchParams();
  const targetId = params.get('comment');
  const timeline = useIssueTimeline(
    detail,
    renderRun ? runs : NO_RUNS,
    targetId,
  );
  const preview = useFilePreviewState();
  const [mode, setMode] = useState<FeedMode>('conversation');
  const [unfolded, setUnfolded] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const members = useQuery({
    queryKey: pmKeys.members,
    queryFn: () => api.members(),
  });
  const userName = (userId: string): string =>
    members.data?.find((member) => member.userId === userId)?.name ??
    (userId === viewer?.userId ? viewer.name : userId);

  const threads = useMemo(
    () =>
      timeline.entries.flatMap((entry) =>
        entry.kind === 'thread' ? [entry.thread] : [],
      ),
    [timeline.entries],
  );
  // What each comment is on the feed: a hand-over, a review and its verdict.
  const meanings = useMemo(
    () =>
      new Map(
        buildFeed({
          activities: [],
          threads,
          viewerId: viewer?.userId ?? null,
          managerId: PROJECT_MANAGER_ID,
          limit: Number.POSITIVE_INFINITY,
        }).map((event) => [event.id, event]),
      ),
    [threads, viewer?.userId],
  );
  const rows = useMemo(
    () => groupFeedRows(newestFirst(timeline.entries), mode),
    [timeline.entries, mode],
  );

  const comments = new Map<string, IssueComment>();
  const meaningTags = (event: FeedEvent | undefined): CommentTag[] => {
    if (event?.kind === 'handOver')
      return [
        {
          key: 'handOver',
          label: appT('issueLive.feed.handOver'),
          tone: 'blue',
        },
      ];
    if (event?.kind === 'review' && event.verdict)
      return [
        {
          key: 'verdict',
          label: appT(`issueLive.feed.${event.verdict}`),
          tone: event.verdict === 'approved' ? 'green' : 'amber',
        },
      ];
    return [];
  };
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
      ...meaningTags(meanings.get(`comment:${comment.id}`)),
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

  const systemNode = (entry: TimelineEntry): ReactNode => {
    if (entry.kind === 'run') return renderRun?.(entry.run.id) ?? null;
    if (entry.kind === 'activity')
      return (
        <ActivityRow
          activity={entry.activity}
          statuses={detail.statuses}
          t={t}
        />
      );
    return null;
  };
  const toggle = (key: string): void =>
    setUnfolded((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  const toEntry = (row: FeedRow): CommentTimelineEntry => {
    if (row.kind === 'system') {
      const open = unfolded.has(row.key);
      return {
        kind: 'custom',
        key: row.key,
        node: (
          <div className='flex flex-col gap-2' data-feed-system>
            <button
              type='button'
              aria-expanded={open}
              className='inline-flex items-center gap-1.5 self-start rounded-md px-1 text-xs text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none'
              onClick={() => toggle(row.key)}
            >
              <ChevronRightIcon
                aria-hidden
                className={cn(
                  'size-3.5 transition-transform',
                  open && 'rotate-90',
                )}
              />
              {appT('issueLive.feed.systemRecords', {
                count: row.entries.length,
              })}
            </button>
            {open ? (
              <ul className='flex flex-col gap-2 border-l pl-3'>
                {row.entries.map((entry) => (
                  <li key={entry.key}>{systemNode(entry)}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ),
      };
    }
    const { entry } = row;
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
    return { kind: 'custom', key: entry.key, node: systemNode(entry) };
  };
  const entries = rows.map(toEntry);
  const original = (item: CommentItem): IssueComment | undefined =>
    comments.get(item.id);

  return (
    <div className={className} data-testid='issue-feed' data-feed-mode={mode}>
      <CommentTimeline
        entries={entries}
        newestFirst
        headerActions={
          <ToggleGroup
            variant='outline'
            size='sm'
            spacing={0}
            aria-label={appT('issueLive.feed.modes')}
            value={[mode]}
            onValueChange={(values: string[]) => {
              const [next] = values;
              if (next === 'conversation' || next === 'all') setMode(next);
            }}
          >
            <ToggleGroupItem value='conversation'>
              {appT('issueLive.feed.conversation')}
            </ToggleGroupItem>
            <ToggleGroupItem value='all'>
              {appT('issueLive.feed.all')}
            </ToggleGroupItem>
          </ToggleGroup>
        }
        renderMarkdown={(content) => (
          <Clamped>
            <IssueMarkdown content={content} />
          </Clamped>
        )}
        emojis={ISSUE_REACTION_EMOJIS}
        {...(mayComment
          ? {
              onReply: (item: CommentItem) => {
                setReplyTo(original(item) ?? null);
                conversation.editorRef.current?.focus();
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
        onMentionSearch={conversation.searchMentions}
        mentionSearchRevision={conversation.mentionSearchRevision}
        replyingToId={conversation.replyTo?.id ?? null}
        targetId={targetId}
        hasOlder={timeline.hasOlder}
        loadingOlder={timeline.loadingOlder}
        onLoadOlder={timeline.loadOlder}
        locale={i18n.language}
        labels={wording.thread}
      />
      {preview.dialog}
    </div>
  );
}
