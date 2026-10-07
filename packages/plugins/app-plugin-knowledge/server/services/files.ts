/**
 * Files in a space's tree: uploading one (a new file entry), replacing it (its next version), reading its bytes, and
 * its text extracted as Markdown in the background (`parsing/`), which becomes the version's content and its sections
 * once ready.
 *
 * | step     | rule                                                                                                    |
 * | -------- | ------------------------------------------------------------------------------------------------------- |
 * | upload   | the uploader may edit where it goes; at most `maxBytes`; the bytes go through `KnowledgeFileStore`      |
 * |          | before the transaction, and are deleted again if it fails                                               |
 * | parse    | a parsed type (`KNOWLEDGE_PARSED_EXTENSIONS`) starts `parsing`, anything else is `unsupported`; one     |
 * |          | file at a time, each in a worker thread; `ready` writes the text, and the sections while the version is |
 * |          | current; `failed` keeps the reason; a version left `parsing` (a restart) is parsed again at start       |
 * | reparse  | someone who may edit the entry asks again for a version that `failed`                                   |
 * | content  | whoever reads the entry (an actor: not archived) reads any version's bytes                              |
 */
import { createHash } from 'node:crypto';

import {
  KNOWLEDGE_EXTRACT_MAX,
  KNOWLEDGE_FILE_SIZE_MAX,
  type KnowledgeDoc,
  type KnowledgeFileInfo,
  type KnowledgeParseStatus,
} from '../../shared/knowledge.js';
import {
  conflict,
  docNotFound,
  invalid,
  KnowledgeError,
  notFound,
} from '../errors.js';
import { isParsed, type TextExtractor } from '../parsing/index.js';
import { createAccessCheck, type KnowledgeReader } from './access.js';
import type { KnowledgeContext } from './context.js';
import {
  readableDoc,
  requireAddUnder,
  type DocumentService,
} from './documents.js';
import { fileInfo } from './file-info.js';
import type { KnowledgeFileStore, Uploader } from './storage.js';
import { filesUnavailable } from './storage.js';
import {
  filesRepo,
  findDoc,
  findDocBySlug,
  findFile,
  findSpaceById,
  findVersion,
  num,
  versionsRepo,
  type FileRecord,
} from './store.js';
import * as check from './validate.js';
import {
  appendVersion,
  checkParent,
  ensureSpace,
  freeSlug,
  insertDoc,
  nextSortOrder,
  writeChunks,
  type VersionFile,
} from './writes.js';

/** A stored file's bytes, with what the API shows of it. */
export interface FileContent {
  readonly file: KnowledgeFileInfo;
  readonly body: ReadableStream<Uint8Array>;
}

export interface FileService {
  /** The largest file stored, in bytes. */
  readonly maxBytes: number;
  /**
   * A new file entry from an upload (`{ scope, scopeId, parentId?, title?, summary?, slug? }`): its title is the
   * file's name unless given, and its text is extracted in the background.
   */
  upload(
    viewer: KnowledgeReader,
    input: unknown,
    file: File,
  ): Promise<KnowledgeDoc>;
  /** A file entry's next version with another file (`{ expectedVersion?, note? }`; the current one when absent). */
  replace(
    viewer: KnowledgeReader,
    docId: string,
    input: unknown,
    file: File,
  ): Promise<KnowledgeDoc>;
  /** A file entry's bytes: the current version's, or `version`'s. */
  content(
    viewer: KnowledgeReader,
    docId: string,
    options?: { readonly version?: number },
  ): Promise<FileContent>;
  /** Extracts the text of a version whose extraction failed (the current one unless named) again. */
  reparse(
    viewer: KnowledgeReader,
    docId: string,
    options?: { readonly version?: number },
  ): Promise<KnowledgeDoc>;
  /** Resolves once no extraction waits or runs. */
  idle(): Promise<void>;
  /** Picks up the versions left `parsing` (a restart); answers how many. */
  resume(): Promise<number>;
}

export interface FileServiceDeps {
  /** Null when the application stores no files. */
  readonly store: () => KnowledgeFileStore | null;
  readonly extract: TextExtractor;
  readonly maxBytes?: number;
}

/** What uploading stores, before the transaction that names it. */
export interface StoredFile {
  readonly record: FileRecord;
  readonly sha256: string;
}

export function createFileService(
  context: KnowledgeContext,
  docs: DocumentService,
  deps: FileServiceDeps,
): FileService {
  const maxBytes = deps.maxBytes ?? KNOWLEDGE_FILE_SIZE_MAX;
  const nowText = () => context.now().toISOString();
  const store = () => {
    const found = deps.store();
    if (!found) throw filesUnavailable();
    return found;
  };

  // One extraction at a time, in order; a version asked for twice is extracted once.
  const queued = new Set<string>();
  let chain: Promise<void> = Promise.resolve();
  const enqueue = (versionId: string) => {
    if (queued.has(versionId)) return;
    queued.add(versionId);
    chain = chain.then(async () => {
      queued.delete(versionId);
      try {
        await parse(versionId);
      } catch (error) {
        context.onError('A knowledge file could not be parsed.', error);
      }
    });
  };
  context.onParse(enqueue);

  async function finish(
    versionId: string,
    result:
      | { status: 'ready'; markdown: string }
      | { status: 'unsupported' }
      | { status: 'failed'; error: string },
  ): Promise<void> {
    await context.transaction(async (tx) => {
      const version = await versionsRepo(tx.conn).findOne({
        filter: { id: versionId },
      });
      if (!version || version.parseStatus !== 'parsing') return;
      const content =
        result.status === 'ready'
          ? result.markdown.slice(0, KNOWLEDGE_EXTRACT_MAX)
          : '';
      await versionsRepo(tx.conn).updateMany({
        filter: { id: versionId },
        values: {
          content,
          parseStatus: result.status,
          parseError:
            result.status === 'failed' ? result.error.slice(0, 500) : null,
        },
      });
      const doc = await findDoc(tx.conn, version.docId);
      if (!doc) return;
      if (num(doc.currentVersion) === num(version.version)) {
        const space = await findSpaceById(tx.conn, doc.spaceId);
        if (space && result.status === 'ready')
          await writeChunks(
            context,
            tx,
            doc,
            { scope: space.scope, scopeId: space.scopeId ?? '' },
            num(version.version),
            content,
          );
      }
      tx.emit({ type: 'doc.changed', docId: doc.id });
    });
  }

  async function parse(versionId: string): Promise<void> {
    const conn = context.read();
    const version = await versionsRepo(conn).findOne({
      filter: { id: versionId },
    });
    if (!version || version.parseStatus !== 'parsing') return;
    const file = version.fileId ? await findFile(conn, version.fileId) : null;
    if (!file) {
      await finish(versionId, { status: 'failed', error: 'The file is gone.' });
      return;
    }
    if (!isParsed(file.ext)) {
      await finish(versionId, { status: 'unsupported' });
      return;
    }
    let result: Awaited<ReturnType<TextExtractor>>;
    try {
      const bytes = await store().bytes(file);
      result = await deps.extract({ bytes, ext: file.ext.toLowerCase() });
    } catch (error) {
      result = {
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
      };
    }
    await finish(versionId, result);
  }

  /** The file's version facts: parsed or stored only. */
  const versionFile = (stored: StoredFile): VersionFile => ({
    fileId: stored.record.id,
    sha256: stored.sha256,
    parseStatus: isParsed(stored.record.ext) ? 'parsing' : 'unsupported',
  });

  const service: FileService = {
    maxBytes,

    async upload(viewer, raw, file) {
      const input = check.body(raw);
      const ref = check.space(input, (space) => context.access.space(space));
      const access = createAccessCheck(context, viewer);
      await requireAddUnder(
        context,
        access,
        ref,
        typeof input.parentId === 'string' ? input.parentId : null,
        'edit',
      );
      const title =
        input.title === undefined || input.title === ''
          ? check.title(file.name.slice(0, 200))
          : check.title(input.title);
      const summary = check.summary(input.summary);
      const wantedSlug =
        input.slug === undefined || input.slug === ''
          ? null
          : check.slug(input.slug);
      const parentId =
        typeof input.parentId === 'string' && input.parentId
          ? input.parentId
          : null;
      const stored = await storeFile(context, store(), maxBytes, file, {
        kind: 'user',
        id: viewer.userId,
      });
      let id: string;
      try {
        id = await context.transaction(async (tx) => {
          const now = nowText();
          const space = await ensureSpace(context, tx.conn, ref, now);
          const parent = await checkParent(tx.conn, space.id, parentId);
          if (
            wantedSlug &&
            (await findDocBySlug(tx.conn, space.id, wantedSlug))
          )
            throw conflict(
              'KNOWLEDGE_SLUG_TAKEN',
              `A document with slug ${wantedSlug} exists in this space.`,
            );
          const doc = await insertDoc(context, tx, {
            kind: 'file',
            space,
            parentId: parent?.id ?? null,
            slug:
              wantedSlug ??
              (await freeSlug(tx.conn, space.id, check.slugify(title))),
            sortOrder: await nextSortOrder(
              tx.conn,
              space.id,
              parent?.id ?? null,
            ),
            next: { title, summary, content: '', file: versionFile(stored) },
            author: { kind: 'user', id: viewer.userId },
            createdById: viewer.userId,
            now,
          });
          return doc.id;
        });
      } catch (error) {
        await discardFile(context, store(), stored.record.id);
        throw error;
      }
      return docs.get(viewer, id);
    },

    async replace(viewer, docId, raw, file) {
      const input = raw === undefined ? {} : check.body(raw);
      const access = createAccessCheck(context, viewer);
      const found = await findDoc(context.read(), docId);
      if (!found) throw docNotFound();
      const ref = (await access.doc(found)).space;
      await access.requireDoc(found, 'edit');
      if (found.kind !== 'file')
        throw invalid('INVALID_KIND', 'Only a file is replaced by a file.');
      const expected =
        input.expectedVersion === undefined
          ? num(found.currentVersion)
          : check.version(
              input.expectedVersion,
              'VERSION_REQUIRED',
              'expectedVersion',
            );
      const note = check.note(input.note);
      const stored = await storeFile(context, store(), maxBytes, file, {
        kind: 'user',
        id: viewer.userId,
      });
      try {
        await context.transaction(async (tx) => {
          const doc = (await findDoc(tx.conn, docId))!;
          if (doc.archivedAt)
            throw conflict(
              'KNOWLEDGE_ARCHIVED',
              'Archived documents are read-only; restore it first.',
            );
          await appendVersion(
            context,
            tx,
            doc,
            ref,
            expected,
            {
              title: doc.title,
              summary: doc.summary,
              content: '',
              file: versionFile(stored),
            },
            { kind: 'user', id: viewer.userId, note },
            nowText(),
          );
        });
      } catch (error) {
        await discardFile(context, store(), stored.record.id);
        throw error;
      }
      return docs.get(viewer, docId);
    },

    async content(viewer, docId, options = {}) {
      const access = createAccessCheck(context, viewer);
      const { doc } = await readableDoc(context, access, docId);
      if (doc.kind !== 'file')
        throw notFound('Knowledge file', 'FILE_NOT_FOUND');
      const number =
        options.version === undefined
          ? num(doc.currentVersion)
          : check.version(options.version);
      const conn = context.read();
      const version = await findVersion(conn, doc.id, number);
      const file = version?.fileId
        ? await findFile(conn, version.fileId)
        : null;
      if (!version || !file) throw notFound('Knowledge file', 'FILE_NOT_FOUND');
      return {
        file: fileInfo(
          file,
          version,
          context.urls.doc(
            doc.id,
            number === num(doc.currentVersion) ? undefined : number,
          ),
        ),
        body: await store().stream(file),
      };
    },

    async reparse(viewer, docId, options = {}) {
      const access = createAccessCheck(context, viewer);
      const found = await findDoc(context.read(), docId);
      if (!found) throw docNotFound();
      await access.requireDoc(found, 'edit');
      const number =
        options.version === undefined
          ? num(found.currentVersion)
          : check.version(options.version);
      await context.transaction(async (tx) => {
        const version = await findVersion(tx.conn, docId, number);
        if (!version?.fileId)
          throw notFound('Knowledge file', 'FILE_NOT_FOUND');
        if (version.parseStatus !== 'failed')
          throw conflict(
            'KNOWLEDGE_NOT_FAILED',
            'Only a file whose text could not be extracted is parsed again.',
          );
        await versionsRepo(tx.conn).updateMany({
          filter: { id: version.id },
          values: { parseStatus: 'parsing', parseError: null },
        });
        tx.emit({ type: 'doc.changed', docId });
        tx.afterCommit(() => context.parse(version.id));
      });
      return docs.get(viewer, docId);
    },

    async idle() {
      // A parse can queue another (a version asked for while one ran): wait until the chain stays the same.
      for (;;) {
        const waiting = chain;
        await waiting;
        if (waiting === chain) return;
      }
    },

    async resume() {
      const rows = await versionsRepo(context.read()).findMany({
        filter: { parseStatus: 'parsing' satisfies KnowledgeParseStatus },
      });
      for (const row of rows) enqueue(row.id);
      return rows.length;
    },
  };
  return service;
}

/** Stores an upload of `uploader`'s (at most `maxBytes`), with the hash of its bytes. */
export async function storeFile(
  context: Pick<KnowledgeContext, 'read'>,
  store: KnowledgeFileStore,
  maxBytes: number,
  file: File,
  uploader: Uploader,
): Promise<StoredFile> {
  if (file.size > maxBytes)
    throw new KnowledgeError(
      400,
      'FILE_TOO_LARGE',
      `A file may have at most ${maxBytes} bytes.`,
      { maxBytes },
    );
  const sha256 = createHash('sha256')
    .update(new Uint8Array(await file.arrayBuffer()))
    .digest('hex');
  const id = await store.store(file, uploader);
  await filesRepo(context.read()).updateMany({
    filter: { id },
    values: { sha256 },
  });
  const record = await findFile(context.read(), id);
  if (!record) throw notFound('Knowledge file', 'FILE_NOT_FOUND');
  return { record, sha256 };
}

/** Deletes a stored file's row and bytes. */
export async function discardFile(
  context: Pick<KnowledgeContext, 'read'>,
  store: KnowledgeFileStore,
  fileId: string,
): Promise<void> {
  const record = await findFile(context.read(), fileId);
  if (!record) return;
  await filesRepo(context.read()).deleteMany({ filter: { id: fileId } });
  await store.remove(record);
}

/** The version a proposal's accepted file becomes: parsed when its type is. */
export function proposedVersionFile(
  record: FileRecord,
): VersionFile & { readonly parseStatus: KnowledgeParseStatus } {
  return {
    fileId: record.id,
    sha256: record.sha256 ?? '',
    parseStatus: isParsed(record.ext) ? 'parsing' : 'unsupported',
  };
}
