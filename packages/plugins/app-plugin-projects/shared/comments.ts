/**
 * Comments on issues: threads (a root and its replies, flat), Markdown with mentions (`mention://<kind>/<id>`),
 * reactions and resolved threads. The browser writes plain comments; other plugins write their own kinds through the
 * server's `CommentWriter`.
 */
import type { Attachment } from './attachments.js';
import type { Page } from './common.js';
import type { NameText } from './kinds.js';
import type { ActivityVia } from './plans.js';

export const REACTION_EMOJIS = [
  '👍',
  '👀',
  '🎉',
  '❤️',
  '🚀',
  '😄',
  '🤔',
  '👎',
] as const;
export type ReactionEmoji = (typeof REACTION_EMOJIS)[number];

export const COMMENT_CONTENT_MAX = 200_000;
/** Threads per page: a page is a number of roots, each with all its replies. */
export const THREAD_PAGE_LIMIT = { default: 30, max: 100 } as const;
/** `GET /api/projects/mentionCandidates`: candidates per request (`pageSize`). */
export const MENTION_CANDIDATE_LIMIT = { default: 8, max: 20 } as const;
/** How much of a comment a notice quotes. */
export const EXCERPT_LENGTH = 200;
/** The kind the browser writes. */
export const PLAIN_COMMENT = 'comment';

export interface CommentReaction {
  readonly emoji: ReactionEmoji;
  readonly count: number;
  readonly userIds: readonly string[];
}

/** Someone or something named in a comment: a kind's key and an id. */
export interface MentionRef {
  readonly kind: string;
  readonly id: string;
}

/** One entry of the `@` list. */
export interface MentionCandidate extends MentionRef {
  readonly name: string;
  /** Its name in the viewer's language, when its kind ships one (a built-in agent). */
  readonly nameText?: NameText;
  /** A second line, such as an email address. */
  readonly hint?: string;
}

export interface IssueComment {
  readonly id: string;
  readonly issueId: string;
  /** A kind's key (`shared/kinds.ts`). */
  readonly authorType: string;
  readonly authorId: string | null;
  readonly authorName: string | null;
  /** `comment`, or a kind another plugin writes. */
  readonly kind: string;
  /** Markdown; empty once deleted. */
  readonly content: string;
  /** The content starts with `/note`: it starts no work. */
  readonly note: boolean;
  readonly parentId: string | null;
  readonly rootId: string;
  /** How a person wrote it when not by hand in the browser (`agent`: an agent wrote it for them, or their plan did). */
  readonly via: 'cli' | 'api_key' | 'agent' | null;
  /** The originating run and attempt, when recorded by the application. Kept separate from the transport `via`. */
  readonly source?: ActivityVia | null;
  readonly createdAt: string;
  readonly editedAt: string | null;
  readonly deleted: boolean;
  readonly reactions: readonly CommentReaction[];
  /** Roots only. */
  readonly resolvedAt: string | null;
  readonly resolvedById: string | null;
  readonly resolvedByName: string | null;
  /** The files sent with it, oldest first; none once it is deleted. */
  readonly attachments: readonly Attachment[];
}

/** A root comment and its replies, oldest first. */
export interface CommentThread {
  readonly root: IssueComment;
  readonly replies: readonly IssueComment[];
}

/**
 * `GET /api/projects/issues/{issueId}/comments`: the newer threads first page by page, each page oldest first. The
 * service's page; the API answers `{ data, meta: { nextPageToken? } }`.
 */
export type ThreadPage = Page<CommentThread>;

export interface CreateCommentRequest {
  readonly content: string;
  readonly parentId?: string | null;
  /**
   * Uploads of the caller's attached to nothing (`POST /api/projects/attachments`), at most
   * `ATTACHMENTS_PER_REQUEST_MAX`: they are sent with the comment (`shared/attachments.ts`).
   */
  readonly attachmentIds?: readonly string[];
}

export interface UpdateCommentRequest {
  readonly content: string;
}

/**
 * `POST /api/projects/issues/{issueId}/comments` answers `{ data: CreateCommentResult }`: the comment and whom it
 * started work for (empty without a plugin that does).
 */
export interface CreateCommentResult {
  readonly comment: IssueComment;
  readonly triggered: readonly MentionRef[];
}

/** `POST /api/projects/comments/{commentId}/react` and `/unreact`: the comment's reactions after the change. */
export interface CommentReactions {
  readonly reactions: readonly CommentReaction[];
}

export interface ThreadResolution {
  readonly commentId: string;
  readonly resolvedAt: string | null;
  readonly resolvedById: string | null;
}
