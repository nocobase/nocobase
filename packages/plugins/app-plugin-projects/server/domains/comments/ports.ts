/**
 * What other plugins use to write and read comments (an agent runtime posting a reply, a summary, a proposal). They
 * check their own rights; the project plugin keeps the rules of the thread: same issue, roots and replies, mentions
 * of registered kinds only, and only a person's comment starts work.
 */
import type { DatabaseConnection } from '@nocobase/db';

import type { Attachment } from '../../../shared/attachments.js';
import type { IssueComment, MentionRef } from '../../../shared/comments.js';
import type { Actor } from '../../kernel/actor.js';
import type { Tx } from '../../kernel/tx.js';

export interface CommentWriteOptions {
  /** Joins this transaction instead of opening one. */
  readonly outer?: Tx;
  /** False: the triggers are not told (they are told only of a person's comments anyway). */
  readonly trigger?: boolean;
  /** The comment's kind; `comment` by default. */
  readonly kind?: string;
  /** What the writer wants to trace with the comment, such as `{ runId }`; never returned. */
  readonly origin?: Readonly<Record<string, unknown>>;
}

export interface CommentWriter {
  /**
   * Writes a comment as `actor`, whose kind must be registered. No browser permission is checked: the caller decides
   * who may write through it.
   */
  post(
    actor: Actor,
    issueIdOrKey: string,
    input: {
      readonly content: string;
      readonly parentId?: string | null;
      /** Uploads of `actor`'s attached to nothing, sent with the comment. */
      readonly attachmentIds?: readonly string[];
    },
    options?: CommentWriteOptions,
  ): Promise<{
    readonly comment: IssueComment;
    readonly triggered: readonly MentionRef[];
  }>;
}

export interface CommentReader {
  /** An issue's comments, oldest first: since a time, within one thread, or roots only. */
  list(
    conn: DatabaseConnection,
    issueId: string,
    options?: {
      readonly since?: string;
      readonly rootId?: string;
      readonly rootsOnly?: boolean;
      readonly limit?: number;
    },
  ): Promise<IssueComment[]>;
}

/** The attachments domain, as comments read and send their files (`domains/attachments`). */
export interface CommentAttachments {
  ofComments(
    conn: DatabaseConnection,
    commentIds: readonly string[],
  ): Promise<ReadonlyMap<string, readonly Attachment[]>>;
  /** Attaches the uploader's uploads to the comment; 400 when one is not theirs or already attached. */
  attach(
    tx: Tx,
    uploader: { readonly type: string; readonly id: string },
    target: { readonly issueId: string; readonly commentId: string | null },
    ids: unknown,
  ): Promise<readonly unknown[]>;
}
