/**
 * Comment writes: post, edit, delete, react and resolve. Each write records its activity, keeps the issue's
 * `lastActivityAt` (without raising its revision), and emits `issue.changed` plus an event saying what happened, from
 * which follows and notices are planned (`domains/notices`). A person's comment that is not a note is handed to the
 * triggers in the same transaction.
 */
import {
  COMMENT_CONTENT_MAX,
  PLAIN_COMMENT,
  REACTION_EMOJIS,
  type CommentReaction,
  type CreateCommentRequest,
  type IssueComment,
  type MentionRef,
  type ThreadResolution,
  type UpdateCommentRequest,
} from '../../../shared/comments.js';
import type { Issue } from '../../../shared/issues.js';
import { requireAction, type Viewer } from '../../access/viewer.js';
import type { ActivityRecorder } from '../../kernel/activity.js';
import type { Actor } from '../../kernel/actor.js';
import { forbidden, invalid, notFound } from '../../kernel/errors.js';
import type { IdSource } from '../../kernel/ids.js';
import type { KindRegistry } from '../../kernel/kinds.js';
import { isNote, mentions, newMentions } from '../../kernel/mentions.js';
import type { Tx, TxRunner } from '../../kernel/tx.js';
import {
  findIssue,
  issueVisibleTo,
  requireVisibleIssue,
  touchIssueActivity,
  type EventActor,
  type IssueTriggers,
} from '../issues/index.js';
import {
  canDeleteComment,
  canEditComment,
  requireCommenter,
} from './comment.access.js';
import './comment.events.js';
import { mapComments } from './comment.queries.js';
import {
  addReaction,
  findComment,
  insertComment,
  reactionsFor,
  removeReaction,
  updateComment,
  type CommentRecord,
} from './comment.store.js';
import type { CommentAttachments, CommentWriter } from './ports.js';

export interface CommentService extends CommentWriter {
  create(
    viewer: Viewer,
    issueIdOrKey: string,
    input: CreateCommentRequest,
  ): Promise<{
    readonly comment: IssueComment;
    readonly triggered: readonly MentionRef[];
  }>;
  update(
    viewer: Viewer,
    commentId: string,
    input: UpdateCommentRequest,
  ): Promise<IssueComment>;
  remove(viewer: Viewer, commentId: string): Promise<void>;
  react(
    viewer: Viewer,
    commentId: string,
    emoji: string,
  ): Promise<CommentReaction[]>;
  unreact(
    viewer: Viewer,
    commentId: string,
    emoji: string,
  ): Promise<CommentReaction[]>;
  resolve(
    viewer: Viewer,
    commentId: string,
    resolved: boolean,
  ): Promise<ThreadResolution>;
}

export interface CommentDeps {
  readonly tx: TxRunner;
  readonly ids: IdSource;
  readonly activity: ActivityRecorder;
  readonly kinds: KindRegistry;
  readonly triggers: () => IssueTriggers;
  /** Comments' files; a comment takes none when left out. */
  readonly attachments?: () => CommentAttachments;
}

function contentOf(input: unknown): string {
  const content =
    input && typeof input === 'object'
      ? (input as { content?: unknown }).content
      : undefined;
  if (typeof content !== 'string' || !content.trim())
    throw invalid('INVALID_COMMENT', 'content must not be empty.');
  if (content.length > COMMENT_CONTENT_MAX)
    throw invalid(
      'INVALID_COMMENT',
      `content must be at most ${COMMENT_CONTENT_MAX} characters.`,
    );
  return content;
}

const eventActor = (actor: Actor): EventActor => ({
  type: actor.type,
  id: actor.id,
});

const iso = (value: Date | string | null) =>
  value === null ? null : new Date(value).toISOString();

export function createCommentService(deps: CommentDeps): CommentService {
  const record = (
    tx: Tx,
    issueId: string,
    actor: Actor,
    action: string,
    details: Record<string, unknown>,
  ) => deps.activity.record(tx.conn, { issueId, actor, action, details });

  /** The comment and its issue; 404 unless the viewer may see the issue and the comment exists. */
  async function visibleComment(
    tx: Tx,
    viewer: Viewer,
    commentId: string,
  ): Promise<{ readonly comment: CommentRecord; readonly issue: Issue }> {
    const comment = await findComment(tx.conn, commentId);
    const issue = comment
      ? await findIssue(tx.conn, comment.issueId)
      : undefined;
    if (!comment || !issue || !(await issueVisibleTo(tx.conn, viewer, issue)))
      throw notFound('Comment');
    return { comment, issue };
  }

  async function mapOne(
    tx: Tx,
    id: string,
    viewer?: Viewer,
  ): Promise<IssueComment> {
    const row = (await findComment(tx.conn, id)) as CommentRecord;
    const [comment] = await mapComments(
      tx.conn,
      deps.kinds,
      [row],
      deps.attachments?.(),
      viewer,
    );
    if (!comment) throw notFound('Comment');
    return comment;
  }

  async function write(
    tx: Tx,
    actor: Actor,
    issue: Issue,
    input: {
      readonly content: string;
      readonly parentId?: string | null;
      readonly attachmentIds?: unknown;
    },
    options: {
      readonly kind?: string;
      readonly origin?: Readonly<Record<string, unknown>>;
      readonly trigger?: boolean;
      /** The person writing, whose right to mention each principal is checked. */
      readonly userId: string | null;
      readonly viewer?: Viewer;
    },
  ) {
    const content = contentOf(input);
    let parent: CommentRecord | undefined;
    if (input.parentId) {
      parent = await findComment(tx.conn, input.parentId);
      if (!parent || parent.issueId !== issue.id || parent.deletedAt)
        throw invalid(
          'INVALID_PARENT',
          'parentId must be a comment of the same issue.',
        );
    }
    const note = isNote(content);
    const refs = mentions(content);
    if (options.userId)
      await deps.kinds.requireMentions(tx.conn, refs, {
        userId: options.userId,
        note,
      });
    const id = deps.ids.next();
    const now = new Date();
    await insertComment(tx.conn, {
      id,
      issueId: issue.id,
      authorType: actor.type,
      authorId: actor.id,
      kind: options.kind ?? PLAIN_COMMENT,
      content,
      parentId: parent?.id ?? null,
      rootId: parent?.rootId ?? id,
      origin: options.origin ?? (actor.trace ? { trace: actor.trace } : null),
      via: actor.via ?? null,
      createdAt: now,
      updatedAt: now,
    });
    const files =
      input.attachmentIds === undefined || input.attachmentIds === null
        ? []
        : await attachmentsOf().attach(
            tx,
            { type: actor.type, id: actor.id ?? options.userId ?? '' },
            { issueId: issue.id, commentId: id },
            input.attachmentIds,
          );
    await touchIssueActivity(tx.conn, issue.id, now);
    await record(tx, issue.id, actor, 'comment_added', {
      commentId: id,
      parentId: parent?.id ?? null,
      ...(files.length > 0 ? { attachmentCount: files.length } : {}),
    });
    const comment = await mapOne(tx, id, options.viewer);
    const parentComment = parent
      ? await mapOne(tx, parent.id, options.viewer)
      : null;
    let triggered: readonly MentionRef[] = [];
    const triggers = deps.triggers();
    if (
      actor.type === 'user' &&
      !note &&
      options.trigger !== false &&
      triggers.onCommentCreated
    )
      triggered = await triggers.onCommentCreated(tx, {
        comment,
        issue,
        parent: parentComment,
        actor,
        mentions: refs,
      });
    tx.emit({ type: 'issue.changed', issueId: issue.id });
    tx.emit({
      type: 'comment.created',
      issueId: issue.id,
      commentId: id,
      rootId: comment.rootId,
      parentId: comment.parentId,
      actor: eventActor(actor),
      note,
      mentions: refs,
      parentAuthor: parent
        ? { type: parent.authorType, id: parent.authorId }
        : null,
    });
    return { comment, triggered };
  }

  function attachmentsOf(): CommentAttachments {
    const attachments = deps.attachments?.();
    if (!attachments)
      throw invalid('FILES_UNAVAILABLE', 'This application stores no files.');
    return attachments;
  }

  async function reactions(tx: Tx, commentId: string) {
    const [comment] = await mapComments(tx.conn, deps.kinds, [
      (await findComment(tx.conn, commentId)) as CommentRecord,
    ]);
    return [...(comment?.reactions ?? [])];
  }

  function emojiOf(value: string): string {
    if (!(REACTION_EMOJIS as readonly string[]).includes(value))
      throw invalid('INVALID_EMOJI', 'emoji is not one of the reactions.');
    return value;
  }

  return {
    create(viewer, issueIdOrKey, input) {
      return deps.tx.run(async (tx) => {
        const issue = await requireVisibleIssue(tx.conn, viewer, issueIdOrKey);
        requireCommenter(viewer);
        const attachmentIds = (input as { attachmentIds?: unknown })
          .attachmentIds;
        if (Array.isArray(attachmentIds) && attachmentIds.length > 0)
          requireAction(
            viewer,
            'pm.attachments',
            'upload',
            'You may not attach files.',
          );
        return write(tx, viewer.actor, issue, input, {
          userId: viewer.userId,
          viewer,
        });
      });
    },

    post(actor, issueIdOrKey, input, options = {}) {
      if (!deps.kinds.has(actor.type))
        throw new TypeError(`Kind ${actor.type} is not registered.`);
      return deps.tx.run(async (tx) => {
        const issue = await findIssue(tx.conn, issueIdOrKey);
        if (!issue || issue.deletedAt) throw notFound('Issue');
        return write(tx, actor, issue, input, {
          ...(options.kind ? { kind: options.kind } : {}),
          ...(options.origin ? { origin: options.origin } : {}),
          ...(options.trigger === undefined
            ? {}
            : { trigger: options.trigger }),
          userId: null,
        });
      }, options.outer);
    },

    async update(viewer, commentId, input) {
      const content = contentOf(input);
      return deps.tx.run(async (tx) => {
        const { comment, issue } = await visibleComment(tx, viewer, commentId);
        if (comment.deletedAt) throw notFound('Comment');
        if (!canEditComment(viewer, comment))
          throw forbidden('Only its author may edit a comment.');
        if (content === comment.content) return mapOne(tx, comment.id, viewer);
        const added = newMentions(comment.content, content);
        await deps.kinds.requireMentions(tx.conn, added, {
          userId: viewer.userId,
          note: isNote(content),
        });
        const editedAt = new Date();
        await updateComment(tx.conn, comment.id, { content, editedAt });
        await record(tx, issue.id, viewer.actor, 'comment_edited', {
          commentId: comment.id,
        });
        tx.emit({ type: 'issue.changed', issueId: issue.id });
        tx.emit({
          type: 'comment.updated',
          issueId: issue.id,
          commentId: comment.id,
          actor: eventActor(viewer.actor),
          mentions: added,
          editedAt: editedAt.toISOString(),
        });
        return mapOne(tx, comment.id, viewer);
      });
    },

    async remove(viewer, commentId) {
      await deps.tx.run(async (tx) => {
        const { comment, issue } = await visibleComment(tx, viewer, commentId);
        if (comment.deletedAt) return;
        if (!(await canDeleteComment(tx.conn, viewer, comment, issue)))
          throw forbidden(
            "Only its author, the issue's owner, the project lead or an administrator may delete a comment.",
          );
        await updateComment(tx.conn, comment.id, {
          deletedAt: new Date(),
          deletedByType: viewer.actor.type,
          deletedById: viewer.actor.id,
        });
        await record(tx, issue.id, viewer.actor, 'comment_deleted', {
          commentId: comment.id,
          authorType: comment.authorType,
          authorId: comment.authorId,
        });
        tx.emit({ type: 'issue.changed', issueId: issue.id });
        tx.emit({
          type: 'comment.deleted',
          issueId: issue.id,
          commentId: comment.id,
          actor: eventActor(viewer.actor),
          author: { type: comment.authorType, id: comment.authorId },
        });
      });
    },

    async react(viewer, commentId, emoji) {
      const value = emojiOf(emoji);
      return deps.tx.run(async (tx) => {
        const { comment, issue } = await visibleComment(tx, viewer, commentId);
        if (comment.deletedAt) throw notFound('Comment');
        if (
          await addReaction(tx.conn, {
            id: deps.ids.next(),
            commentId: comment.id,
            userId: viewer.userId,
            emoji: value,
          })
        )
          tx.emit({ type: 'issue.changed', issueId: issue.id });
        return reactions(tx, comment.id);
      });
    },

    async unreact(viewer, commentId, emoji) {
      const value = emojiOf(emoji);
      return deps.tx.run(async (tx) => {
        const { comment, issue } = await visibleComment(tx, viewer, commentId);
        if (comment.deletedAt) throw notFound('Comment');
        const before = (await reactionsFor(tx.conn, [comment.id])).length;
        await removeReaction(tx.conn, comment.id, viewer.userId, value);
        if ((await reactionsFor(tx.conn, [comment.id])).length !== before)
          tx.emit({ type: 'issue.changed', issueId: issue.id });
        return reactions(tx, comment.id);
      });
    },

    resolve(viewer, commentId, resolved) {
      return deps.tx.run(async (tx) => {
        const { comment, issue } = await visibleComment(tx, viewer, commentId);
        requireCommenter(viewer);
        if (comment.deletedAt) throw notFound('Comment');
        if (comment.parentId !== null)
          throw invalid('NOT_THREAD_ROOT', 'Only a thread is resolved.');
        if ((comment.resolvedAt !== null) !== resolved) {
          await updateComment(tx.conn, comment.id, {
            resolvedAt: resolved ? new Date() : null,
            resolvedById: resolved ? viewer.userId : null,
          });
          await record(
            tx,
            issue.id,
            viewer.actor,
            resolved ? 'thread_resolved' : 'thread_unresolved',
            { commentId: comment.id },
          );
          tx.emit({ type: 'issue.changed', issueId: issue.id });
          tx.emit({
            type: 'comment.threadResolved',
            issueId: issue.id,
            commentId: comment.id,
            actor: eventActor(viewer.actor),
            resolved,
          });
        }
        const after = (await findComment(tx.conn, comment.id)) as CommentRecord;
        return {
          commentId: after.id,
          resolvedAt: iso(after.resolvedAt),
          resolvedById: after.resolvedById,
        };
      });
    },
  };
}
