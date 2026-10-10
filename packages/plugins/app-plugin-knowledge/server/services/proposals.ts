/**
 * Proposals: a change an actor (an agent, say) or a person who may only propose suggests, which someone who may edit
 * what it changes decides: the document, or for a new one its parent (the space at the top). Proposing takes `propose`
 * there, and a proposal is seen by whoever reads what it changes, and by the person it was made for.
 *
 * | step     | rule                                                                                                      |
 * | -------- | --------------------------------------------------------------------------------------------------------- |
 * | propose  | the proposer may propose in the space; an update or a verify names a live document; a new document's     |
 * |          | parent is live, in the same space, within the depth limit, and its slug is free                           |
 * |          | one pending proposal per source and document (409 `KNOWLEDGE_PROPOSAL_PENDING`); at most                 |
 * |          | `KNOWLEDGE_PROPOSALS_PER_RUN` per run (409 `KNOWLEDGE_PROPOSAL_LIMIT`); content a decider rejected from   |
 * |          | the same source is not proposed again (409 `KNOWLEDGE_PROPOSAL_REJECTED`)                                 |
 * | accept   | an update whose document moved past its base version is stale: 409 `KNOWLEDGE_PROPOSAL_STALE` unless     |
 * |          | `confirmStale`, then its content becomes the next version whole (no merge); a new document's slug is made |
 * |          | unique and a parent gone or archived files it at the root; a verify marks the document verified          |
 * | reject   | the comment is kept; the same content from the same source is refused from then on (one sent back too)    |
 * | send     | `requestChanges`: a decider sends a pending proposal back with a comment; it waits as `revising`, and     |
 * | back     | `proposal.changesRequested` asks the application to wake its proposer. A document's version an actor     |
 * |          | wrote is sent back the same way (`requestDocChanges`): a `revising` record of `origin` `document` with  |
 * |          | the version's content, author, source and run stands for it (409 `KNOWLEDGE_PROPOSAL_PENDING` while    |
 * |          | that source has one pending or sent back for the document)                                               |
 * | revise   | the next proposal from the same source for the same document (or naming it, `replacesId`, from the same |
 * |          | proposer) replaces the one sent back, which becomes `superseded`; its review shows the diff from it      |
 * | withdraw | the person it was made for, or the actor that made it; pending or sent back                               |
 *
 * The "source" is what the proposal came from, as the application names it (the issue a run works on), or else the
 * proposer itself. A new version from a proposal is authored by its proposer and records the run, the proposal and who
 * approved it; the version's history shows what a revision was sent back with.
 *
 * A proposal may carry a file: a new file entry (`create`) or a file entry's replacement (`update`), uploaded by the
 * proposer with the proposal (`proposeFile`), or later through a one-time ticket (`ticket`, then `redeem` with the
 * bytes) by a client that sends a file apart from its request (an agent's command). The file waits unparsed; accepting
 * makes it the entry's version and extracts its text; rejecting or withdrawing deletes it. An article is never replaced
 * by a file, nor a file by text; a folder is neither proposed nor changed by a proposal.
 */
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

import type {
  KnowledgeAccess,
  KnowledgeProposal,
  KnowledgeProposalKind,
  KnowledgeProposalStatus,
  KnowledgeSource,
  SpaceRef,
} from '../../shared/knowledge.js';
import {
  KNOWLEDGE_PROPOSALS_PER_RUN,
  KNOWLEDGE_REASON_MAX,
} from '../../shared/knowledge.js';
import {
  conflict,
  forbidden,
  docArgumentNotFound,
  docNotFound,
  invalid,
  KnowledgeError,
  notFound,
} from '../errors.js';
import {
  createAccessCheck,
  type AccessCheck,
  type KnowledgeReader,
} from './access.js';
import type { KnowledgeContext, KnowledgeTx, ProposalDoc } from './context.js';
import { spaceOfDoc } from './documents.js';
import { fileInfo } from './file-info.js';
import {
  discardFile,
  proposedVersionFile,
  storeFile,
  type FileContent,
} from './files.js';
import { filesUnavailable, type KnowledgeFileStore } from './storage.js';
import {
  docsRepo,
  findDoc,
  findDocBySlug,
  findFile,
  findSpace,
  findSpaceById,
  findVersion,
  isoOrNull,
  iso,
  json,
  num,
  proposalsRepo,
  spacesRepo,
  ticketsRepo,
  versionsRepo,
  type ProposalRecord,
} from './store.js';
import * as check from './validate.js';
import { authorOf, namesFor, revisionRequestOf, sourceOf } from './views.js';
import {
  appendVersion,
  checkParent,
  ensureSpace,
  freeSlug,
  hashOf,
  insertDoc,
  nextSortOrder,
} from './writes.js';

/** What a proposal asks for, as a command or the API hands it over. */
export interface ProposalInput {
  readonly kind: KnowledgeProposalKind;
  /** An update or a verify: the document. */
  readonly docId?: string;
  /** A new document: its space, when not its parent's (or else `primary`'s; one of them is required). */
  readonly space?: SpaceRef;
  readonly parentId?: string | null;
  readonly title?: string;
  readonly slug?: string;
  readonly summary?: string;
  readonly content?: string;
  /** The version written against; the current one when left out. */
  readonly baseVersion?: number;
  readonly reason: string;
  readonly source?: KnowledgeSource | null;
  /** The space a new document goes to when it names none and has no parent: the run's project, say. */
  readonly primary?: SpaceRef;
  /** A new file, or a file's replacement: an upload of the proposer's no version or proposal names yet. */
  readonly fileId?: string;
  /** The proposal sent back that this one revises; else the one sent back from the same source, if any. */
  readonly replacesId?: string;
}

/** What a ticket proposes once its file arrives: a proposal without the file, and the file's name. */
export type TicketInput = Omit<ProposalInput, 'fileId'> & {
  readonly filename?: string;
};

/** A one-time upload: send the file to `id` with `token` as the bearer credential, before `expiresAt`. */
export interface ProposalTicket {
  readonly id: string;
  readonly token: string;
  readonly expiresAt: string;
}

export interface ProposalFilter {
  readonly status?: KnowledgeProposalStatus;
  readonly space?: SpaceRef;
  readonly docId?: string;
  /** Only those the viewer may decide. */
  readonly decidable?: boolean;
}

export interface ProposalService {
  propose(
    viewer: KnowledgeReader,
    input: ProposalInput,
  ): Promise<KnowledgeProposal>;
  list(
    viewer: KnowledgeReader,
    filter?: ProposalFilter,
  ): Promise<KnowledgeProposal[]>;
  /** One proposal, with the contents its diffs need. */
  get(viewer: KnowledgeReader, id: string): Promise<KnowledgeProposal>;
  accept(
    viewer: KnowledgeReader,
    id: string,
    input?: unknown,
  ): Promise<KnowledgeProposal>;
  reject(
    viewer: KnowledgeReader,
    id: string,
    input?: unknown,
  ): Promise<KnowledgeProposal>;
  /** Sends a pending proposal back to its proposer with what should change (`{ comment }`). */
  requestChanges(
    viewer: KnowledgeReader,
    id: string,
    input?: unknown,
  ): Promise<KnowledgeProposal>;
  /** Sends a document's current version, which an actor wrote, back to it with what should change (`{ comment }`). */
  requestDocChanges(
    viewer: KnowledgeReader,
    docId: string,
    input?: unknown,
  ): Promise<KnowledgeProposal>;
  withdraw(viewer: KnowledgeReader, id: string): Promise<KnowledgeProposal>;
  /** Stores `file` as the proposer's upload and proposes it (`input` without `fileId`). */
  proposeFile(
    viewer: KnowledgeReader,
    input: ProposalInput,
    file: File,
  ): Promise<KnowledgeProposal>;
  /** A one-time ticket to send the file of a proposal later; the proposal is checked again when it arrives. */
  ticket(viewer: KnowledgeReader, input: TicketInput): Promise<ProposalTicket>;
  /** The file of a ticket: proposes it as the ticket's reader. 401 for a ticket unknown, used or expired. */
  redeem(
    ticketId: string,
    token: string | null,
    file: File,
  ): Promise<KnowledgeProposal>;
  /** A proposal's file, for whoever reads the proposal. */
  file(viewer: KnowledgeReader, id: string): Promise<FileContent>;
}

/** What the proposals of files need: where files are stored, and how large they may be. */
export interface ProposalFileDeps {
  readonly store: () => KnowledgeFileStore | null;
  readonly maxBytes: number;
}

/** How long a ticket lasts. */
const TICKET_MS = 60 * 60 * 1000;

const sha256 = (text: string) =>
  createHash('sha256').update(text).digest('hex');

/** What a proposal's events say of its document. */
async function proposalDoc(
  conn: KnowledgeTx['conn'],
  docId: string | null,
): Promise<ProposalDoc | null> {
  const doc = docId ? await findDoc(conn, docId) : null;
  return doc ? { id: doc.id, slug: doc.slug, title: doc.title } : null;
}

/** What a proposal or a version is sent back with: a comment, required. */
function changesWanted(raw: unknown): string {
  const input = raw === undefined ? {} : check.body(raw);
  const comment = check.comment(input.comment);
  if (!comment)
    throw invalid('INVALID_COMMENT', 'Say what should change.', 'comment');
  return comment;
}

const sourceKey = (record: {
  readonly sourceKind: string | null;
  readonly sourceId: string | null;
  readonly proposerKind: string;
  readonly proposerId: string;
}) =>
  record.sourceKind && record.sourceId
    ? { sourceKind: record.sourceKind, sourceId: record.sourceId }
    : { proposerKind: record.proposerKind, proposerId: record.proposerId };

export function createProposalService(
  context: KnowledgeContext,
  files: ProposalFileDeps,
): ProposalService {
  const resolverFor = (viewer: KnowledgeReader) =>
    createAccessCheck(context, viewer);
  const nowText = () => context.now().toISOString();
  const store = () => {
    const found = files.store();
    if (!found) throw filesUnavailable();
    return found;
  };
  /** Who uploads for a reader: the actor itself, or the person. */
  const uploaderOf = (viewer: KnowledgeReader) =>
    viewer.actor
      ? { kind: viewer.actor.kind, id: viewer.actor.id }
      : { kind: 'user', id: viewer.userId };

  /**
   * What the viewer may do with what a proposal changes: its document, or for a new document its parent, or the space
   * itself at the top (or when they are gone).
   */
  async function rightsOver(
    access: AccessCheck,
    record: ProposalRecord,
    space: SpaceRef,
  ): Promise<KnowledgeAccess> {
    const conn = context.read();
    const target = record.docId
      ? await findDoc(conn, record.docId)
      : record.parentId
        ? await findDoc(conn, record.parentId)
        : null;
    if (target && target.spaceId === record.spaceId)
      return (await access.doc(target)).access;
    return access.access(space);
  }

  async function spaceOf(record: ProposalRecord): Promise<SpaceRef> {
    const space = await findSpaceById(context.read(), record.spaceId);
    if (!space) throw notFound('Knowledge proposal', 'PROPOSAL_NOT_FOUND');
    return { scope: space.scope, scopeId: space.scopeId ?? '' };
  }

  async function viewOf(
    access: AccessCheck | null,
    record: ProposalRecord,
    options: { readonly contents?: boolean } = {},
  ): Promise<KnowledgeProposal> {
    const conn = context.read();
    const space = await spaceOf(record);
    const doc = record.docId ? await findDoc(conn, record.docId) : null;
    const currentVersion = doc ? num(doc.currentVersion) : null;
    const baseVersion =
      record.baseVersion === null ? null : num(record.baseVersion);
    const stale =
      record.status === 'pending' &&
      record.kind === 'update' &&
      currentVersion !== null &&
      baseVersion !== null &&
      currentVersion > baseVersion;
    const replaced = record.replacesId
      ? ((await proposalsRepo(conn).findOne({
          filter: { id: record.replacesId },
        })) ?? null)
      : null;
    const supersededBy =
      record.status === 'superseded'
        ? ((await proposalsRepo(conn).findOne({
            filter: { replacesId: record.id },
          })) ?? null)
        : null;
    const names = await namesFor(context.access, [
      { kind: record.proposerKind, id: record.proposerId },
      { kind: 'user', id: record.authorizedById },
      { kind: 'user', id: record.decidedById },
      { kind: 'user', id: replaced?.decidedById ?? null },
    ]);
    const spaceTitle = await context.access.title(space);
    const canDecide =
      (record.status === 'pending' || record.status === 'revising') && access
        ? (await rightsOver(access, record, space)).edit
        : false;
    let baseContent: string | null | undefined;
    let currentContent: string | null | undefined;
    if (options.contents && doc) {
      baseContent =
        baseVersion === null
          ? null
          : ((await findVersion(conn, doc.id, baseVersion))?.content ?? null);
      currentContent =
        (await findVersion(conn, doc.id, num(doc.currentVersion)))?.content ??
        null;
    }
    const stored = record.fileId ? await findFile(conn, record.fileId) : null;
    return {
      id: record.id,
      kind: record.kind,
      status: record.status,
      scope: space.scope,
      scopeId: space.scopeId,
      spaceTitle,
      docId: record.docId,
      docTitle: doc?.title ?? record.title ?? '',
      docSlug: doc?.slug ?? record.slug,
      parentId: record.parentId,
      title: record.title,
      slug: record.slug,
      summary: record.summary,
      content: record.content,
      file: stored
        ? fileInfo(stored, null, context.urls.proposal(record.id))
        : null,
      baseVersion,
      currentVersion,
      stale,
      ...(options.contents ? { baseContent, currentContent } : {}),
      reason: record.reason,
      proposer: authorOf(names, record.proposerKind, record.proposerId),
      authorizedBy: authorOf(names, 'user', record.authorizedById),
      source: sourceOf(record),
      runId: record.runId,
      decidedBy: record.decidedById
        ? authorOf(names, 'user', record.decidedById)
        : null,
      decidedAt: isoOrNull(record.decidedAt),
      comment: record.comment,
      appliedVersion:
        record.appliedVersion === null ? null : num(record.appliedVersion),
      origin: record.origin === 'document' ? 'document' : 'proposal',
      replaces: replaced ? revisionRequestOf(replaced, names) : null,
      ...(options.contents
        ? { replacedContent: replaced ? replaced.content : null }
        : {}),
      supersededById: supersededBy?.id ?? null,
      createdAt: iso(record.createdAt),
      canDecide,
    };
  }

  async function find(id: string): Promise<ProposalRecord> {
    const record = await proposalsRepo(context.read()).findOne({
      filter: { id },
    });
    if (!record) throw notFound('Knowledge proposal', 'PROPOSAL_NOT_FOUND');
    return record;
  }

  /** The proposal, once the viewer is known to read its space. */
  async function readable(access: AccessCheck, id: string) {
    const record = await find(id);
    const space = await spaceOf(record);
    const rights = await rightsOver(access, record, space);
    const own =
      record.authorizedById === access.reader.userId ||
      (access.reader.actor && record.proposerId === access.reader.actor.id);
    if (!rights.read && !own)
      throw notFound('Knowledge proposal', 'PROPOSAL_NOT_FOUND');
    return { record, space, rights };
  }

  async function decide(
    viewer: KnowledgeReader,
    id: string,
    decision: 'accepted' | 'rejected',
    raw: unknown,
  ): Promise<KnowledgeProposal> {
    const access = resolverFor(viewer);
    const input = raw === undefined ? {} : check.body(raw);
    const comment = check.comment(input.comment);
    const confirmStale = input.confirmStale === true;
    const { record, space, rights } = await readable(access, id);
    if (!rights.edit)
      throw forbidden(
        access.reader.actor
          ? 'Agents do not decide knowledge proposals.'
          : 'You may not decide this proposal.',
      );
    // One sent back is rejected (given up on) but not accepted: what it holds is what was sent back.
    const open: readonly KnowledgeProposalStatus[] =
      decision === 'rejected' ? ['pending', 'revising'] : ['pending'];
    await context.transaction(async (tx) => {
      const current = await proposalsRepo(tx.conn).findOne({
        filter: { id },
      });
      if (!current || !open.includes(current.status))
        throw conflict(
          'KNOWLEDGE_PROPOSAL_DECIDED',
          current?.status === 'revising'
            ? 'This proposal was sent back for changes; wait for its revision.'
            : 'This proposal has already been decided.',
        );
      const applied =
        decision === 'accepted'
          ? await apply(
              tx,
              current,
              space,
              viewer.userId,
              comment,
              confirmStale,
            )
          : null;
      const taken = await proposalsRepo(tx.conn).updateMany({
        filter: (f) =>
          f.and([f.string('id').eq(id), f.string('status').eq(current.status)]),
        values: {
          status: decision,
          decidedById: viewer.userId,
          decidedAt: nowText(),
          // Rejecting one sent back without a word keeps what it was sent back with.
          comment:
            applied?.comment ??
            comment ??
            (current.status === 'revising' ? current.comment : null),
          ...(applied
            ? { docId: applied.docId, appliedVersion: applied.version }
            : {}),
          updatedAt: nowText(),
        },
      });
      if (taken.updatedCount !== 1)
        throw conflict(
          'KNOWLEDGE_PROPOSAL_DECIDED',
          'This proposal has already been decided.',
        );
      const decided = (await proposalsRepo(tx.conn).findOne({
        filter: { id },
      }))!;
      if (decision === 'rejected' && decided.fileId) {
        const fileId = decided.fileId;
        tx.afterCommit(() => discardFile(context, store(), fileId));
      }
      tx.emit({
        type: 'proposal.decided',
        proposal: decided,
        space,
        doc: await proposalDoc(tx.conn, decided.docId),
        decision,
        byUserId: viewer.userId,
      });
    });
    void record;
    return viewOf(access, await find(id), { contents: true });
  }

  /** What accepting does to the knowledge: the new version, the new document, or the verification. */
  async function apply(
    tx: KnowledgeTx,
    record: ProposalRecord,
    space: SpaceRef,
    deciderId: string,
    comment: string | null,
    confirmStale: boolean,
  ): Promise<{ docId: string; version: number; comment: string | null }> {
    const now = nowText();
    const author = {
      kind: record.proposerKind,
      id: record.proposerId,
      source: sourceOf(record),
      runId: record.runId,
      proposalId: record.id,
      approvedById: deciderId,
      note: comment?.slice(0, 500) ?? null,
    };
    if (record.kind === 'create') {
      const spaceRecord = await ensureSpace(context, tx.conn, space, now);
      let parentId: string | null = null;
      let fellBack = false;
      if (record.parentId) {
        const parent = await findDoc(tx.conn, record.parentId);
        if (parent && !parent.archivedAt && parent.spaceId === spaceRecord.id)
          parentId = parent.id;
        else fellBack = true;
      }
      const file = record.fileId
        ? await findFile(tx.conn, record.fileId)
        : null;
      if (record.fileId && !file)
        throw conflict(
          'KNOWLEDGE_PROPOSAL_STALE',
          'The proposed file is gone.',
        );
      const doc = await insertDoc(context, tx, {
        space: spaceRecord,
        parentId,
        slug: await freeSlug(
          tx.conn,
          spaceRecord.id,
          record.slug ?? check.slugify(record.title ?? ''),
        ),
        sortOrder: await nextSortOrder(tx.conn, spaceRecord.id, parentId),
        next: {
          title: record.title ?? '',
          summary: record.summary ?? '',
          content: file ? '' : (record.content ?? ''),
          ...(file ? { file: proposedVersionFile(file) } : {}),
        },
        author,
        createdById: deciderId,
        now,
      });
      return {
        docId: doc.id,
        version: 1,
        comment: fellBack
          ? [
              comment,
              'The proposed parent document is no longer available; the document was filed at the root.',
            ]
              .filter(Boolean)
              .join(' ')
          : comment,
      };
    }
    const doc = record.docId ? await findDoc(tx.conn, record.docId) : null;
    if (!doc)
      throw conflict('KNOWLEDGE_PROPOSAL_STALE', 'The document is gone.');
    if (doc.archivedAt)
      throw conflict(
        'KNOWLEDGE_ARCHIVED',
        'The document is archived; restore it before accepting.',
      );
    if (record.kind === 'verify') {
      await docsRepo(tx.conn).updateMany({
        filter: { id: doc.id },
        values: { verifiedAt: now, verifiedById: deciderId },
      });
      tx.emit({ type: 'doc.changed', docId: doc.id });
      return { docId: doc.id, version: num(doc.currentVersion), comment };
    }
    const currentVersion = num(doc.currentVersion);
    const baseVersion =
      record.baseVersion === null ? currentVersion : num(record.baseVersion);
    if (currentVersion > baseVersion && !confirmStale)
      throw conflict(
        'KNOWLEDGE_PROPOSAL_STALE',
        `The document is now at version ${currentVersion}; this proposal was written against version ${baseVersion}. Confirm to accept it anyway.`,
        { currentVersion, baseVersion },
      );
    const file = record.fileId ? await findFile(tx.conn, record.fileId) : null;
    if (record.fileId && !file)
      throw conflict('KNOWLEDGE_PROPOSAL_STALE', 'The proposed file is gone.');
    const version = await appendVersion(
      context,
      tx,
      doc,
      space,
      currentVersion,
      {
        title: record.title ?? doc.title,
        summary: record.summary ?? doc.summary,
        content: file ? '' : (record.content ?? ''),
        ...(file ? { file: proposedVersionFile(file) } : {}),
      },
      author,
      now,
    );
    return { docId: doc.id, version, comment };
  }

  /** An upload of the proposer's that no version or proposal names yet. */
  async function proposable(viewer: KnowledgeReader, fileId: string) {
    const conn = context.read();
    const file = await findFile(conn, fileId);
    const uploader = uploaderOf(viewer);
    if (
      !file ||
      file.uploaderKind !== uploader.kind ||
      file.uploaderId !== uploader.id
    )
      throw invalid(
        'INVALID_FILE',
        `File ${fileId} is not an upload of yours.`,
      );
    const named =
      (await versionsRepo(conn).findMany({ filter: { fileId }, limit: 1 }))
        .length > 0 ||
      (await proposalsRepo(conn).findMany({ filter: { fileId }, limit: 1 }))
        .length > 0;
    if (named)
      throw invalid('INVALID_FILE', `File ${fileId} is proposed already.`);
    return file;
  }

  const service: ProposalService = {
    async propose(viewer, input) {
      const access = resolverFor(viewer);
      const reason = check.reason(input.reason);
      const kind = input.kind;
      if (kind !== 'update' && kind !== 'create' && kind !== 'verify')
        throw invalid('INVALID_KIND', 'kind must be update, create or verify.');
      const conn = context.read();

      // Where it goes, and what it changes.
      let space: SpaceRef;
      let docId: string | null = null;
      let baseVersion: number | null = null;
      let parentId: string | null = null;
      let slug: string | null = null;
      let title: string | null = null;
      const file =
        input.fileId === undefined || input.fileId === null
          ? null
          : await proposable(viewer, String(input.fileId));
      if (kind === 'verify' && file)
        throw invalid('INVALID_FILE', 'A verification proposes no file.');
      if (kind === 'create') {
        title =
          file && (input.title === undefined || input.title === '')
            ? check.title(file.filename.slice(0, 200))
            : check.title(input.title);
        const parent = input.parentId
          ? await findDoc(conn, input.parentId)
          : null;
        if (input.parentId && !parent)
          throw invalid(
            'INVALID_PARENT',
            'The parent document was not found.',
            'parentId',
          );
        space =
          (input.space
            ? check.space(input.space, (named) => context.access.space(named))
            : undefined) ??
          (parent ? (await spaceOfDoc(context, parent)).ref : undefined) ??
          input.primary ??
          (() => {
            throw invalid(
              'SPACE_REQUIRED',
              'Name the space a new document goes to.',
            );
          })();
        slug =
          input.slug === undefined || input.slug === ''
            ? check.slugify(title)
            : check.slug(input.slug);
        parentId = parent?.id ?? null;
      } else {
        const doc = input.docId ? await findDoc(conn, input.docId) : null;
        if (!doc) throw docArgumentNotFound();
        space = (await spaceOfDoc(context, doc)).ref;
        if (doc.archivedAt && !viewer.actor)
          throw conflict(
            'KNOWLEDGE_ARCHIVED',
            'Archived documents are read-only.',
          );
        if (doc.archivedAt) throw docArgumentNotFound();
        if (doc.kind === 'folder')
          throw invalid(
            'INVALID_KIND',
            'A folder is not changed by a proposal.',
          );
        if (kind === 'update' && doc.kind === 'file' && !file)
          throw invalid(
            'INVALID_FILE',
            'A file is replaced by a file: propose the new file.',
          );
        if (kind === 'update' && doc.kind !== 'file' && file)
          throw invalid(
            'INVALID_FILE',
            'An article is changed by its text, not by a file.',
          );
        docId = doc.id;
        baseVersion =
          input.baseVersion === undefined
            ? num(doc.currentVersion)
            : check.version(
                input.baseVersion,
                'INVALID_BASE_VERSION',
                'baseVersion',
              );
        if (baseVersion > num(doc.currentVersion))
          throw invalid(
            'INVALID_BASE_VERSION',
            `The document has no version ${baseVersion} yet.`,
          );
        title = input.title === undefined ? null : check.title(input.title);
      }
      if (kind === 'create') {
        const parent = parentId ? await findDoc(conn, parentId) : null;
        if (parent)
          await access.requireDoc(parent, 'propose', () =>
            invalid(
              'INVALID_PARENT',
              'The parent document was not found.',
              'parentId',
            ),
          );
        else await access.requireUnder(space, null, 'propose');
      } else {
        const doc = (await findDoc(conn, docId!))!;
        await access.requireDoc(doc, 'propose', () => docArgumentNotFound());
      }

      if (file && input.content !== undefined && input.content !== '')
        throw invalid(
          'INVALID_CONTENT',
          "A proposed file's text comes from the file.",
        );
      const content =
        kind === 'verify' || file ? null : check.content(input.content ?? '');
      if (content !== null && content.trim() === '')
        throw invalid('EMPTY_CONTENT', 'The proposed content is empty.');
      const summary =
        input.summary === undefined ? null : check.summary(input.summary);
      const contentHash = hashOf(
        file
          ? `${kind}\nfile:${file.sha256 ?? file.id}`
          : `${kind}\n${content ?? ''}`,
      );
      const proposer = viewer.actor
        ? { proposerKind: viewer.actor.kind, proposerId: viewer.actor.id }
        : { proposerKind: 'user', proposerId: viewer.userId };
      const source = input.source ?? null;
      const key = sourceKey({
        sourceKind: source?.kind ?? null,
        sourceId: source?.id ?? null,
        ...proposer,
      });

      const id = await context.transaction(async (tx) => {
        const now = nowText();
        const spaceRecord = await findSpace(tx.conn, space);
        if (kind === 'create') {
          if (spaceRecord) {
            await checkParent(tx.conn, spaceRecord.id, parentId);
            if (await findDocBySlug(tx.conn, spaceRecord.id, slug!))
              throw conflict(
                'KNOWLEDGE_SLUG_TAKEN',
                `A document with slug ${slug!} exists; propose a change to it instead.`,
              );
          }
        }
        const sameTarget = (f: Parameters<Filter>[0]) =>
          docId
            ? f.string('docId').eq(docId)
            : f.and([
                f.string('docId').empty(),
                f.string('slug').eq(slug),
                ...(spaceRecord
                  ? [f.string('spaceId').eq(spaceRecord.id)]
                  : []),
              ]);
        const fromSource = (f: Parameters<Filter>[0]) =>
          f.and(
            (Object.entries(key) as [string, string][]).map(([field, value]) =>
              f.string(field).eq(value),
            ),
          );
        const pending = await proposalsRepo(tx.conn).findMany({
          filter: (f) =>
            f.and([
              f.string('status').eq('pending'),
              sameTarget(f),
              fromSource(f),
            ]),
          limit: 1,
        });
        if (pending.length > 0)
          throw conflict(
            'KNOWLEDGE_PROPOSAL_PENDING',
            'A proposal for this document from the same source is still waiting; put everything into that one, or wait for it to be decided.',
            { proposalId: pending[0].id },
          );
        const rejected = await proposalsRepo(tx.conn).findMany({
          filter: (f) =>
            f.and([
              f.string('status').eq('rejected'),
              f.string('contentHash').eq(contentHash),
              sameTarget(f),
              fromSource(f),
            ]),
          limit: 1,
        });
        if (rejected.length > 0)
          throw conflict(
            'KNOWLEDGE_PROPOSAL_REJECTED',
            'The same change was rejected before; propose something different, or ask the decider why.',
            { proposalId: rejected[0].id },
          );
        if (viewer.actor?.runId) {
          const ofRun = await proposalsRepo(tx.conn).findMany({
            filter: { runId: viewer.actor.runId },
          });
          if (ofRun.length >= KNOWLEDGE_PROPOSALS_PER_RUN)
            throw conflict(
              'KNOWLEDGE_PROPOSAL_LIMIT',
              `A run proposes at most ${KNOWLEDGE_PROPOSALS_PER_RUN} knowledge changes.`,
            );
        }
        // What it revises: the proposal named, or the one sent back from the same source for the same document.
        const replacing =
          input.replacesId !== undefined && input.replacesId !== null
            ? await proposalsRepo(tx.conn).findOne({
                filter: { id: String(input.replacesId) },
              })
            : (
                await proposalsRepo(tx.conn).findMany({
                  filter: (f) =>
                    f.and([
                      f.string('status').eq('revising'),
                      sameTarget(f),
                      fromSource(f),
                    ]),
                  limit: 1,
                })
              )[0];
        if (
          input.replacesId !== undefined &&
          input.replacesId !== null &&
          !(
            replacing &&
            replacing.status === 'revising' &&
            (kind === 'create'
              ? !replacing.docId && replacing.spaceId === spaceRecord?.id
              : replacing.docId === docId) &&
            ((replacing.proposerKind === proposer.proposerKind &&
              replacing.proposerId === proposer.proposerId) ||
              JSON.stringify(sourceKey(replacing)) === JSON.stringify(key))
          )
        )
          throw conflict(
            'KNOWLEDGE_PROPOSAL_NOT_REVISING',
            'replacesId names no proposal of yours sent back for changes to this document.',
            { proposalId: String(input.replacesId) },
          );
        const space2 =
          spaceRecord ?? (await ensureSpace(context, tx.conn, space, now));
        const proposalId = context.newId();
        await proposalsRepo(tx.conn).createOne({
          values: {
            id: proposalId,
            spaceId: space2.id,
            docId,
            kind,
            parentId,
            slug,
            title,
            summary,
            content,
            contentHash,
            fileId: file?.id ?? null,
            baseVersion,
            reason,
            ...proposer,
            authorizedById: viewer.userId,
            sourceKind: source?.kind ?? null,
            sourceId: source?.id ?? null,
            sourceTitle: source?.title?.slice(0, 255) ?? null,
            sourceUrl: source?.url?.slice(0, 500) ?? null,
            runId: viewer.actor?.runId ?? null,
            status: 'pending',
            decidedById: null,
            decidedAt: null,
            comment: null,
            appliedVersion: null,
            replacesId: replacing?.id ?? null,
            origin: null,
            createdAt: now,
            updatedAt: now,
          },
        });
        if (replacing) {
          const replaced = await proposalsRepo(tx.conn).updateMany({
            filter: (f) =>
              f.and([
                f.string('id').eq(replacing.id),
                f.string('status').eq('revising'),
              ]),
            values: { status: 'superseded', updatedAt: now },
          });
          if (replaced.updatedCount !== 1)
            throw conflict(
              'KNOWLEDGE_PROPOSAL_NOT_REVISING',
              'The proposal sent back was decided meanwhile.',
              { proposalId: replacing.id },
            );
          if (replacing.fileId) {
            const fileId = replacing.fileId;
            tx.afterCommit(() => discardFile(context, store(), fileId));
          }
        }
        tx.emit({
          type: 'proposal.created',
          proposal: (await proposalsRepo(tx.conn).findOne({
            filter: { id: proposalId },
          }))!,
          space,
          doc: await proposalDoc(tx.conn, docId),
        });
        return proposalId;
      });
      return viewOf(access, await find(id));
    },

    async list(viewer, filter = {}) {
      const access = resolverFor(viewer);
      const conn = context.read();
      const spaceIds: string[] = [];
      if (filter.space) {
        await access.requireRead(filter.space);
        const record = await findSpace(conn, filter.space);
        if (!record) return [];
        spaceIds.push(record.id);
      }
      const rows = await proposalsRepo(conn).findMany({
        filter: (f) =>
          f.and([
            f.string('status').eq(filter.status ?? 'pending'),
            ...(spaceIds.length > 0
              ? [f.or(spaceIds.map((id) => f.string('spaceId').eq(id)))]
              : []),
            ...(filter.docId ? [f.string('docId').eq(filter.docId)] : []),
          ]),
        sort: (sort) => [
          sort.field('createdAt').desc(),
          sort.field('id').desc(),
        ],
        limit: 200,
      });
      const spaces = new Map(
        (
          await spacesRepo(conn).findMany({
            filter: (f) =>
              f.or(
                [...new Set(rows.map((row) => row.spaceId))].map((id) =>
                  f.string('id').eq(id),
                ),
              ),
          })
        ).map((space) => [space.id, space]),
      );
      const result: KnowledgeProposal[] = [];
      for (const row of rows) {
        const space = spaces.get(row.spaceId);
        if (!space) continue;
        const rights = await rightsOver(access, row, {
          scope: space.scope,
          scopeId: space.scopeId ?? '',
        });
        const own =
          row.authorizedById === viewer.userId ||
          (viewer.actor && row.proposerId === viewer.actor.id);
        if (!rights.read && !own) continue;
        if (filter.decidable && !rights.edit) continue;
        result.push(await viewOf(access, row));
      }
      return result;
    },

    async get(viewer, id) {
      const access = resolverFor(viewer);
      const { record } = await readable(access, id);
      return viewOf(access, record, { contents: true });
    },

    accept: (viewer, id, input) => decide(viewer, id, 'accepted', input),
    reject: (viewer, id, input) => decide(viewer, id, 'rejected', input),

    async requestChanges(viewer, id, raw) {
      const access = resolverFor(viewer);
      const comment = changesWanted(raw);
      const { space, rights } = await readable(access, id);
      if (!rights.edit)
        throw forbidden(
          access.reader.actor
            ? 'Agents do not decide knowledge proposals.'
            : 'You may not decide this proposal.',
        );
      await context.transaction(async (tx) => {
        const now = nowText();
        const taken = await proposalsRepo(tx.conn).updateMany({
          filter: (f) =>
            f.and([f.string('id').eq(id), f.string('status').eq('pending')]),
          values: {
            status: 'revising',
            decidedById: viewer.userId,
            decidedAt: now,
            comment,
            updatedAt: now,
          },
        });
        if (taken.updatedCount !== 1)
          throw conflict(
            'KNOWLEDGE_PROPOSAL_DECIDED',
            'This proposal has already been decided.',
          );
        const sent = (await proposalsRepo(tx.conn).findOne({
          filter: { id },
        }))!;
        tx.emit({
          type: 'proposal.changesRequested',
          proposal: sent,
          space,
          doc: await proposalDoc(tx.conn, sent.docId),
          comment,
          byUserId: viewer.userId,
        });
      });
      return viewOf(access, await find(id), { contents: true });
    },

    async requestDocChanges(viewer, docId, raw) {
      const access = resolverFor(viewer);
      const comment = changesWanted(raw);
      const conn = context.read();
      const doc = await findDoc(conn, docId);
      if (!doc) throw docNotFound();
      await access.requireDoc(doc, 'edit');
      if (doc.archivedAt)
        throw conflict(
          'KNOWLEDGE_ARCHIVED',
          'Archived documents are read-only.',
        );
      const version =
        doc.kind === 'folder'
          ? null
          : await findVersion(conn, doc.id, num(doc.currentVersion));
      if (
        !version ||
        !version.authorId ||
        version.authorKind === 'user' ||
        version.authorKind === 'system'
      )
        throw invalid(
          'NOT_REVISABLE',
          'Only a version an agent wrote is sent back to it; edit the document, or propose the change.',
        );
      const space = (await spaceOfDoc(context, doc)).ref;
      const author = {
        sourceKind: version.sourceKind,
        sourceId: version.sourceId,
        proposerKind: version.authorKind,
        proposerId: version.authorId,
      };
      const key = sourceKey(author);
      const id = await context.transaction(async (tx) => {
        const open = await proposalsRepo(tx.conn).findMany({
          filter: (f) =>
            f.and([
              f.or([
                f.string('status').eq('pending'),
                f.string('status').eq('revising'),
              ]),
              f.string('docId').eq(doc.id),
              ...(Object.entries(key) as [string, string][]).map(
                ([field, value]) => f.string(field).eq(value),
              ),
            ]),
          limit: 1,
        });
        if (open.length > 0)
          throw conflict(
            'KNOWLEDGE_PROPOSAL_PENDING',
            open[0].status === 'pending'
              ? 'A proposal for this document from the same source is waiting; send that one back instead.'
              : 'This document was sent back to the same source already; wait for its revision.',
            { proposalId: open[0].id },
          );
        const now = nowText();
        const proposalId = context.newId();
        await proposalsRepo(tx.conn).createOne({
          values: {
            id: proposalId,
            spaceId: doc.spaceId,
            docId: doc.id,
            kind: 'update',
            parentId: null,
            slug: null,
            title: null,
            summary: null,
            content: version.content,
            // Never matched by the check for rejected content: nobody proposed it.
            contentHash: null,
            fileId: null,
            baseVersion: num(version.version),
            reason: comment.slice(0, KNOWLEDGE_REASON_MAX),
            proposerKind: version.authorKind,
            proposerId: version.authorId!,
            authorizedById: viewer.userId,
            sourceKind: version.sourceKind,
            sourceId: version.sourceId,
            sourceTitle: version.sourceTitle,
            sourceUrl: null,
            runId: version.runId,
            status: 'revising',
            decidedById: viewer.userId,
            decidedAt: now,
            comment,
            appliedVersion: null,
            replacesId: null,
            origin: 'document',
            createdAt: now,
            updatedAt: now,
          },
        });
        tx.emit({
          type: 'proposal.changesRequested',
          proposal: (await proposalsRepo(tx.conn).findOne({
            filter: { id: proposalId },
          }))!,
          space,
          doc: { id: doc.id, slug: doc.slug, title: doc.title },
          comment,
          byUserId: viewer.userId,
        });
        return proposalId;
      });
      return viewOf(access, await find(id), { contents: true });
    },

    async withdraw(viewer, id) {
      const access = resolverFor(viewer);
      const record = await find(id);
      const mine = viewer.actor
        ? record.proposerKind === viewer.actor.kind &&
          record.proposerId === viewer.actor.id
        : record.authorizedById === viewer.userId;
      if (!mine)
        throw forbidden(
          'Only who made a proposal, or it was made for, withdraws it.',
        );
      const space = await spaceOf(record);
      await context.transaction(async (tx) => {
        const taken = await proposalsRepo(tx.conn).updateMany({
          filter: (f) =>
            f.and([
              f.string('id').eq(id),
              f.or([
                f.string('status').eq('pending'),
                f.string('status').eq('revising'),
              ]),
            ]),
          values: { status: 'withdrawn', updatedAt: nowText() },
        });
        if (taken.updatedCount !== 1)
          throw conflict(
            'KNOWLEDGE_PROPOSAL_DECIDED',
            'This proposal has already been decided.',
          );
        if (record.fileId) {
          const fileId = record.fileId;
          tx.afterCommit(() => discardFile(context, store(), fileId));
        }
        tx.emit({
          type: 'proposal.decided',
          proposal: (await proposalsRepo(tx.conn).findOne({ filter: { id } }))!,
          space,
          doc: await proposalDoc(tx.conn, record.docId),
          decision: 'withdrawn',
          byUserId: viewer.actor ? null : viewer.userId,
        });
      });
      return viewOf(access, await find(id));
    },

    async proposeFile(viewer, input, file) {
      const stored = await storeFile(
        context,
        store(),
        files.maxBytes,
        file,
        uploaderOf(viewer),
      );
      try {
        return await service.propose(viewer, {
          ...input,
          fileId: stored.record.id,
        });
      } catch (error) {
        await discardFile(context, store(), stored.record.id);
        throw error;
      }
    },

    async ticket(viewer, input) {
      store();
      const access = resolverFor(viewer);
      if (input.kind !== 'update' && input.kind !== 'create')
        throw invalid(
          'INVALID_KIND',
          'A file is proposed as create or update.',
        );
      check.reason(input.reason);
      if (input.kind === 'update') {
        const doc = input.docId
          ? await findDoc(context.read(), input.docId)
          : null;
        if (!doc) throw docArgumentNotFound();
        if (doc.kind !== 'file')
          throw invalid(
            'INVALID_FILE',
            'An article is changed by its text, not by a file.',
          );
        await access.requireDoc(doc, 'propose', () => docArgumentNotFound());
      }
      const filename =
        typeof input.filename === 'string' && input.filename.trim()
          ? input.filename.trim().slice(0, 255)
          : undefined;
      const token = randomBytes(32).toString('base64url');
      const id = context.newId();
      const now = context.now();
      const expiresAt = new Date(now.getTime() + TICKET_MS).toISOString();
      const request: TicketInput = {
        ...input,
        ...(filename ? { filename } : {}),
      };
      await ticketsRepo(context.read()).createOne({
        values: {
          id,
          tokenHash: sha256(token),
          userId: viewer.userId,
          actorKind: viewer.actor?.kind ?? null,
          actorId: viewer.actor?.id ?? null,
          runId: viewer.actor?.runId ?? null,
          request: JSON.parse(JSON.stringify(request)) as Record<
            string,
            string
          >,
          expiresAt,
          usedAt: null,
          createdAt: now.toISOString(),
        },
      });
      return { id, token, expiresAt };
    },

    async redeem(ticketId, token, file) {
      const conn = context.read();
      const ticket = await ticketsRepo(conn).findOne({
        filter: { id: ticketId },
      });
      const expected = Buffer.from(ticket?.tokenHash ?? '');
      const given = Buffer.from(token ? sha256(token) : '');
      const valid =
        ticket !== undefined &&
        ticket !== null &&
        expected.length === given.length &&
        timingSafeEqual(expected, given) &&
        !ticket.usedAt &&
        new Date(ticket.expiresAt).getTime() > context.now().getTime();
      if (!valid)
        throw new KnowledgeError(
          401,
          'INVALID_TICKET',
          'The upload ticket is invalid, used or expired.',
        );
      const taken = await ticketsRepo(conn).updateMany({
        filter: (f) =>
          f.and([f.string('id').eq(ticketId), f.date('usedAt').empty()]),
        values: { usedAt: context.now().toISOString() },
      });
      if (taken.updatedCount !== 1)
        throw new KnowledgeError(
          401,
          'INVALID_TICKET',
          'The upload ticket is invalid, used or expired.',
        );
      const reader: KnowledgeReader = {
        userId: ticket.userId,
        ...(ticket.actorKind && ticket.actorId
          ? {
              actor: {
                kind: ticket.actorKind,
                id: ticket.actorId,
                ...(ticket.runId ? { runId: ticket.runId } : {}),
              },
            }
          : {}),
      };
      const { filename, ...input } = json<TicketInput>(ticket.request, {
        kind: 'create',
        reason: '',
      });
      const named = filename
        ? new File([file], filename, { type: file.type })
        : file;
      return service.proposeFile(reader, input, named);
    },

    async file(viewer, id) {
      const access = resolverFor(viewer);
      const { record } = await readable(access, id);
      const stored = record.fileId
        ? await findFile(context.read(), record.fileId)
        : null;
      if (!stored) throw notFound('Knowledge file', 'FILE_NOT_FOUND');
      return {
        file: fileInfo(stored, null, context.urls.proposal(record.id)),
        body: await store().stream(stored),
      };
    },
  };
  return service;
}

type Filter = Extract<
  NonNullable<
    Parameters<ReturnType<typeof proposalsRepo>['findMany']>[0]
  >['filter'],
  (...args: never[]) => unknown
>;
