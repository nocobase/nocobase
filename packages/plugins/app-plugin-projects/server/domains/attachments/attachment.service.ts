/**
 * Files on issues and comments (`shared/attachments.ts`): uploading, attaching, listing, reading, removing, and
 * purging what nothing holds any longer. The bytes go through `AttachmentStorage` (the file plugin and Drive); the
 * rows are `pmAttachments`.
 *
 * An upload is the uploader's: a person's (`user` and their id) or, for an agent working on an issue, the agent's own
 * principal. Only the uploader may read an upload attached to nothing, attach it, or discard it. Attaching happens in
 * the caller's transaction: the comment service sends a comment's files with it (`attach`), the plan service gives an
 * intake's files to the issues it created. Attaching to an issue records `attachment_added`; a comment's files are
 * counted on its `comment_added` instead. Removing an issue's file records `attachment_removed`.
 *
 * A comment's files are not removed with its row (a deletion may be part of a plan that rolls back): once the comment
 * is deleted they are no longer listed or served, and the purge deletes them with the uploads attached to nothing for
 * `ORPHAN_HOURS`.
 */
import type { DatabaseConnection } from '@nocobase/db';

import {
  ATTACHMENTS_PER_REQUEST_MAX,
  ATTACHMENT_SIZE_MAX,
  ORPHAN_HOURS,
  isInlinePreviewable,
  type Attachment,
} from '../../../shared/attachments.js';
import type { Issue } from '../../../shared/issues.js';
import { requireAction, scopeOf, type Viewer } from '../../access/viewer.js';
import type { ActivityRecorder } from '../../kernel/activity.js';
import type { Actor } from '../../kernel/actor.js';
import { conflict, forbidden, invalid, notFound } from '../../kernel/errors.js';
import type { KindRegistry } from '../../kernel/kinds.js';
import type { Tx, TxRunner } from '../../kernel/tx.js';
import { findComment } from '../comments/comment.store.js';
import {
  canSee,
  findIssue,
  managesIssue,
  requireEditor,
  requireVisible,
} from '../issues/index.js';
import type { AttachmentStorage } from './attachment.storage.js';
import {
  attachRows,
  commentAttachments,
  deleteAttachment,
  deleteIfUnattached,
  findAttachment,
  findAttachments,
  issueAttachments,
  liveCommentAttachments,
  ofDeletedComments,
  unattached,
  type AttachmentRecord,
  type UploaderRef,
} from './attachment.store.js';

/** Rows the purge looks at per pass. */
const PURGE_BATCH = 500;

export interface AttachmentContent {
  readonly attachment: Attachment;
  readonly body: ReadableStream<Uint8Array>;
}

export interface AttachmentService {
  /** An upload of the viewer's, attached to nothing yet. */
  upload(viewer: Viewer, file: File): Promise<Attachment>;
  /** Uploads a file straight onto the issue (its own files). */
  uploadToIssue(
    viewer: Viewer,
    issueIdOrKey: string,
    file: File,
  ): Promise<Attachment>;
  /** The issue's own files, oldest first; with `comments`, then its live comments' files. */
  list(
    viewer: Viewer,
    issueIdOrKey: string,
    options?: { readonly comments?: boolean },
  ): Promise<Attachment[]>;
  /** One file the viewer may read, by id; 404 otherwise. */
  get(viewer: Viewer, id: string): Promise<Attachment>;
  /** A file's bytes; 404 unless the viewer may read it. */
  content(viewer: Viewer, id: string): Promise<AttachmentContent>;
  remove(viewer: Viewer, id: string): Promise<void>;
  /** Deletes the viewer's own uploads attached to nothing (a comment that failed); others are left alone. */
  discard(viewer: Viewer, ids: readonly string[]): Promise<void>;
  /** Deletes uploads attached to nothing for `ORPHAN_HOURS`, and deleted comments' files; answers how many. */
  purge(at?: Date): Promise<number>;
}

/** What the comment and plan services use, inside their transactions. */
export interface AttachmentLinks {
  /**
   * Attaches `ids` (checked: 1 to `ATTACHMENTS_PER_REQUEST_MAX` distinct ids of `uploader`'s uploads attached to
   * nothing) to the issue, or to one of its comments. Answers the rows, in the order named. 400 `INVALID_FIELD` or
   * `INVALID_ATTACHMENT` otherwise, and nothing is attached.
   */
  attach(
    tx: Tx,
    uploader: UploaderRef,
    target: { readonly issueId: string; readonly commentId: string | null },
    ids: unknown,
  ): Promise<AttachmentRecord[]>;
  /** The files of these comments, by comment id; a deleted comment's are left out by the caller. */
  ofComments(
    conn: DatabaseConnection,
    commentIds: readonly string[],
  ): Promise<ReadonlyMap<string, readonly Attachment[]>>;
  /** The issue's own files as `viewer` sees them (who may remove which). */
  ofIssue(
    conn: DatabaseConnection,
    viewer: Viewer | null,
    issue: Issue,
  ): Promise<Attachment[]>;
}

export interface AttachmentDeps {
  readonly tx: TxRunner;
  readonly activity: ActivityRecorder;
  readonly kinds: KindRegistry;
  readonly storage: AttachmentStorage;
  /** The application's public base path (`/app`, or empty), for the content URLs. */
  readonly basePath: () => string;
  /** File ids an open plan still needs (an intake's files), kept by the purge. */
  readonly keep?: (conn: DatabaseConnection) => Promise<ReadonlySet<string>>;
  readonly now?: () => Date;
}

/** Who uploads as the viewer: the actor they act as (an agent working on an issue uploads as itself). */
export function uploaderOf(actor: Actor, userId: string): UploaderRef {
  return { type: actor.type, id: actor.id ?? userId };
}

const sameUploader = (row: AttachmentRecord, uploader: UploaderRef) =>
  row.uploaderType === uploader.type && row.uploaderId === uploader.id;

export function requireUploader(viewer: Viewer): void {
  requireAction(
    viewer,
    'pm.attachments',
    'upload',
    'You may not attach files.',
  );
}

/** The `attachmentIds` of a request: absent or empty is none; otherwise 1 to the maximum distinct strings. */
export function readAttachmentIds(value: unknown): string[] {
  if (value === undefined || value === null) return [];
  if (
    !Array.isArray(value) ||
    !value.every((item): item is string => typeof item === 'string' && !!item)
  )
    throw invalid('INVALID_FIELD', 'attachmentIds must be a list of file ids.');
  const ids = [...new Set(value)];
  if (ids.length > ATTACHMENTS_PER_REQUEST_MAX)
    throw invalid(
      'INVALID_FIELD',
      `At most ${ATTACHMENTS_PER_REQUEST_MAX} files at a time.`,
    );
  return ids;
}

function checkSize(file: File): void {
  if (file.size > ATTACHMENT_SIZE_MAX)
    throw invalid(
      'FILE_TOO_LARGE',
      `A file may have at most ${ATTACHMENT_SIZE_MAX} bytes.`,
      { maxBytes: ATTACHMENT_SIZE_MAX },
    );
}

const iso = (value: Date | string) => new Date(value).toISOString();

export function createAttachmentService(deps: AttachmentDeps): {
  readonly service: AttachmentService;
  readonly links: AttachmentLinks;
} {
  const now = deps.now ?? (() => new Date());

  function contentPath(id: string): string {
    const base = deps.basePath().replace(/\/+$/u, '');
    return `${base}/api/projects/attachments/${encodeURIComponent(id)}/content`;
  }

  async function views(
    conn: DatabaseConnection,
    rows: readonly AttachmentRecord[],
    canDelete: (row: AttachmentRecord) => boolean,
  ): Promise<Attachment[]> {
    const name = await deps.kinds.nameAll(
      conn,
      rows.map((row) => ({ type: row.uploaderType, id: row.uploaderId })),
    );
    return rows.map((row) => ({
      id: row.id,
      filename: row.filename,
      ext: row.ext,
      mimeType: row.mimeType,
      size: Number(row.size),
      issueId: row.issueId,
      commentId: row.commentId,
      uploader: {
        type: row.uploaderType,
        id: row.uploaderId,
        name: name(row.uploaderType, row.uploaderId),
      },
      createdAt: iso(row.createdAt),
      contentUrl: contentPath(row.id),
      downloadUrl: `${contentPath(row.id)}?download=true`,
      previewable: isInlinePreviewable(row.mimeType, row.ext),
      canDelete: canDelete(row),
    }));
  }

  async function view(
    conn: DatabaseConnection,
    row: AttachmentRecord,
    canDelete = false,
  ): Promise<Attachment> {
    const [one] = await views(conn, [row], () => canDelete);
    if (!one) throw notFound('Attachment');
    return one;
  }

  /** Whether the viewer may remove an issue's own file. */
  async function mayRemove(
    conn: DatabaseConnection,
    viewer: Viewer,
    issue: Issue,
    row: AttachmentRecord,
  ): Promise<boolean> {
    if (row.commentId !== null) return false;
    if (
      sameUploader(row, uploaderOf(viewer.actor, viewer.userId)) &&
      scopeOf(viewer, 'pm.issues', 'edit') !== 'none'
    )
      return true;
    return managesIssue(conn, viewer, issue, 'moderate-comments');
  }

  /** The row and its issue (null while attached to nothing), when the viewer may read it; 404 otherwise. */
  async function readable(
    conn: DatabaseConnection,
    viewer: Viewer,
    id: string,
  ): Promise<{
    readonly row: AttachmentRecord;
    readonly issue: Issue | null;
  }> {
    const row = await findAttachment(conn, id);
    if (!row) throw notFound('Attachment');
    if (row.issueId === null) {
      if (!sameUploader(row, uploaderOf(viewer.actor, viewer.userId)))
        throw notFound('Attachment');
      return { row, issue: null };
    }
    const issue = await findIssue(conn, row.issueId);
    if (!issue || !(await canSee(conn, viewer, issue)))
      throw notFound('Attachment');
    if (row.commentId !== null) {
      const comment = await findComment(conn, row.commentId);
      if (!comment || comment.deletedAt) throw notFound('Attachment');
    }
    return { row, issue };
  }

  async function store(viewer: Viewer, file: File): Promise<string> {
    requireUploader(viewer);
    checkSize(file);
    return deps.storage.store(file, uploaderOf(viewer.actor, viewer.userId));
  }

  const links: AttachmentLinks = {
    async attach(tx, uploader, target, value) {
      const ids = readAttachmentIds(value);
      if (ids.length === 0) return [];
      const rows = await findAttachments(tx.conn, ids);
      const ordered = ids.map((id) => {
        const row = rows.find((candidate) => candidate.id === id);
        if (!row || row.issueId !== null || !sameUploader(row, uploader))
          throw invalid(
            'INVALID_ATTACHMENT',
            `File ${id} is not an upload of yours attached to nothing.`,
            { fileId: id },
          );
        return row;
      });
      await attachRows(tx.conn, ids, target);
      return ordered;
    },

    async ofComments(conn, commentIds) {
      const rows = await commentAttachments(conn, commentIds);
      const mapped = await views(conn, rows, () => false);
      const byComment = new Map<string, Attachment[]>();
      for (const attachment of mapped) {
        const key = attachment.commentId ?? '';
        byComment.set(key, [...(byComment.get(key) ?? []), attachment]);
      }
      return byComment;
    },

    async ofIssue(conn, viewer, issue) {
      const rows = await issueAttachments(conn, issue.id);
      const removable = new Set<string>();
      if (viewer)
        for (const row of rows)
          if (await mayRemove(conn, viewer, issue, row)) removable.add(row.id);
      return views(conn, rows, (row) => removable.has(row.id));
    },
  };

  const service: AttachmentService = {
    async upload(viewer, file) {
      const id = await store(viewer, file);
      const conn = deps.tx.read();
      const row = await findAttachment(conn, id);
      if (!row) throw notFound('Attachment');
      return view(conn, row, true);
    },

    async uploadToIssue(viewer, issueIdOrKey, file) {
      const issue = await requireVisible(deps.tx.read(), viewer, issueIdOrKey);
      requireEditor(viewer);
      const id = await store(viewer, file);
      return deps.tx.run(async (tx) => {
        const [row] = await links.attach(
          tx,
          uploaderOf(viewer.actor, viewer.userId),
          { issueId: issue.id, commentId: null },
          [id],
        );
        await deps.activity.record(tx.conn, {
          issueId: issue.id,
          actor: viewer.actor,
          action: 'attachment_added',
          details: {
            attachmentIds: [id],
            filenames: [row?.filename ?? ''],
          },
        });
        tx.emit({ type: 'issue.changed', issueId: issue.id });
        const attached = await findAttachment(tx.conn, id);
        if (!attached) throw notFound('Attachment');
        return view(
          tx.conn,
          attached,
          await mayRemove(tx.conn, viewer, issue, attached),
        );
      });
    },

    async list(viewer, issueIdOrKey, options = {}) {
      const conn = deps.tx.read();
      const issue = await requireVisible(conn, viewer, issueIdOrKey);
      const own = await links.ofIssue(conn, viewer, issue);
      if (!options.comments) return own;
      // A comment's files go with the comment: none of them is removed on its own.
      return [
        ...own,
        ...(await views(
          conn,
          await liveCommentAttachments(conn, issue.id),
          () => false,
        )),
      ];
    },

    async get(viewer, id) {
      const conn = deps.tx.read();
      const { row, issue } = await readable(conn, viewer, id);
      return view(
        conn,
        row,
        issue ? await mayRemove(conn, viewer, issue, row) : true,
      );
    },

    async content(viewer, id) {
      const conn = deps.tx.read();
      const { row } = await readable(conn, viewer, id);
      return {
        attachment: await view(conn, row),
        body: await deps.storage.stream(row),
      };
    },

    async remove(viewer, id) {
      const removed = await deps.tx.run(async (tx) => {
        const { row, issue } = await readable(tx.conn, viewer, id);
        if (!issue) {
          await deleteAttachment(tx.conn, row.id);
          return row;
        }
        if (row.commentId !== null)
          throw conflict(
            'COMMENT_ATTACHMENT',
            "A comment's files go with the comment: delete the comment instead.",
          );
        if (!(await mayRemove(tx.conn, viewer, issue, row)))
          throw forbidden(
            "Only its uploader, the issue's owner, the project lead or an administrator may remove this file.",
          );
        await deleteAttachment(tx.conn, row.id);
        await deps.activity.record(tx.conn, {
          issueId: issue.id,
          actor: viewer.actor,
          action: 'attachment_removed',
          details: { attachmentId: row.id, filename: row.filename },
        });
        tx.emit({ type: 'issue.changed', issueId: issue.id });
        return row;
      });
      await deps.storage.remove(removed);
    },

    async discard(viewer, ids) {
      const uploader = uploaderOf(viewer.actor, viewer.userId);
      const conn = deps.tx.read();
      for (const row of await findAttachments(conn, ids)) {
        if (row.issueId !== null || !sameUploader(row, uploader)) continue;
        if (await deleteIfUnattached(conn, row.id))
          await deps.storage.remove(row);
      }
    },

    async purge(at = now()) {
      const conn = deps.tx.read();
      const cutoff = at.getTime() - ORPHAN_HOURS * 60 * 60 * 1000;
      const keep = (await deps.keep?.(conn)) ?? new Set<string>();
      let purged = 0;
      // The age is compared here rather than in the query: dialects store the timestamp differently.
      for (const row of await unattached(conn, PURGE_BATCH)) {
        if (new Date(row.createdAt).getTime() >= cutoff) break;
        if (keep.has(row.id)) continue;
        // Attached meanwhile: the row survived, so its bytes stay.
        if (!(await deleteIfUnattached(conn, row.id))) continue;
        await deps.storage.remove(row);
        purged += 1;
      }
      for (const row of await ofDeletedComments(conn, PURGE_BATCH)) {
        await deleteAttachment(conn, row.id);
        await deps.storage.remove(row);
        purged += 1;
      }
      return purged;
    },
  };

  return { service, links };
}
