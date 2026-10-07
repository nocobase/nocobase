/**
 * Files people send with chat messages (`agChatAttachments`; the contract is "Attachments" in `shared/conversations`).
 * The bytes go through the file plugin's repository onto a Drive disk, as the projects plugin stores issue files; Drive
 * reads and deletes them. Both are asked on each use, so without the file plugin (or Drive) an upload answers 503
 * `NOT_IMPLEMENTED`.
 *
 * An upload is its uploader's alone until it is sent with a message (`attach`, in the message's transaction), which
 * gives it to the conversation: from then on its owner reads it, and a run of the conversation's agent on that
 * conversation. Anyone else gets 404, as if it did not exist. Uploads never sent are purged after
 * `CHAT_ATTACHMENT_ORPHAN_HOURS`.
 */
import { Readable } from 'node:stream';

import type { DatabaseConnection, Repository } from '@nocobase/db';

import {
  CHAT_ATTACHMENT_ORPHAN_HOURS,
  CHAT_ATTACHMENT_SIZE_MAX,
  CHAT_ATTACHMENTS_PER_MESSAGE_MAX,
  CONVERSATION_SUBJECT,
  isInlineImage,
  type MessageAttachment,
} from '../../../shared/conversations.js';
import {
  invalid,
  notFound,
  precondition,
  ProtocolError,
} from '../../kernel/errors.js';
import type { TxRunner } from '../../kernel/tx.js';

export const CHAT_ATTACHMENTS = 'agChatAttachments';

/** Required by the file repository; nothing is served there (the content route checks who may read). */
export const CHAT_ATTACHMENTS_ACCESS_PATH = '/uploads/ag-chat-attachments';

/** Rows the purge looks at per pass. */
const PURGE_BATCH = 500;

export interface ChatAttachmentRecord {
  readonly id: string;
  readonly disk: string;
  readonly key: string;
  readonly filename: string;
  readonly ext: string;
  readonly mimeType: string;
  readonly size: string | number;
  readonly uploaderId: string;
  readonly conversationId: string | null;
  readonly messageId: string | null;
  readonly createdAt: Date | string;
  readonly updatedAt: Date | string;
}

/** What a message keeps of each file it was sent with (`agConversationMessages.attachments`). */
export interface StoredAttachment {
  readonly id: string;
  readonly filename: string;
  readonly ext: string;
  readonly mimeType: string;
  readonly size: number;
}

/** The file plugin's server repository, as far as uploading goes (`ServerFileRepositoryManager`). */
export interface ChatFileUploader {
  repository(
    collection: string,
    options: {
      readonly disk: string;
      readonly accessPath: string;
      readonly policy: {
        readonly read: true;
        readonly create: {
          readonly scope: true;
          readonly defaults: Readonly<Record<string, string>>;
        };
        readonly update: false;
        readonly delete: false;
      };
    },
  ): {
    uploadOne(input: { readonly file: File }): Promise<{
      readonly record: { readonly id: string };
    }>;
  };
}

/** A Drive manager, as far as reading and deleting go. */
export interface ChatFileDisks {
  use(disk: string): {
    getBytes(key: string): Promise<Uint8Array>;
    getStream(key: string): Promise<Readable>;
    delete(key: string): Promise<void>;
  };
}

/** Where a stored file's bytes are. */
export interface StoredObject {
  readonly disk: string;
  readonly key: string;
}

/** Where the bytes go; the file plugin and Drive in an application, memory in tests. */
export interface ChatFileStorage {
  /** Stores the bytes and inserts the row, attached to nothing; answers its id. */
  store(file: File, uploaderId: string): Promise<string>;
  bytes(object: StoredObject): Promise<Uint8Array>;
  stream(object: StoredObject): Promise<ReadableStream<Uint8Array>>;
  /** Deletes the bytes; a failure leaves an orphan object, never a broken row, and is only logged. */
  remove(object: StoredObject): Promise<void>;
}

export interface ChatFileStorageDeps {
  /** Null when the application registers no file plugin. */
  readonly uploader: () => ChatFileUploader | null;
  readonly disks: () => ChatFileDisks | null;
  /** The Drive disk new files go to. */
  readonly disk: () => string;
  readonly onError?: (error: unknown) => void;
}

function filesUnavailable(): ProtocolError {
  return precondition(
    'NOT_IMPLEMENTED',
    'This application stores no files: register the file plugin to send files in chat.',
  );
}

/** Storage over the file plugin's repository and Drive, both asked on each use. */
export function createChatFileStorage(
  deps: ChatFileStorageDeps,
): ChatFileStorage {
  const disks = (): ChatFileDisks => {
    const found = deps.disks();
    if (!found) throw filesUnavailable();
    return found;
  };
  return {
    async store(file, uploaderId) {
      const repository = deps.uploader();
      if (!repository) throw filesUnavailable();
      const { record } = await repository
        .repository(CHAT_ATTACHMENTS, {
          disk: deps.disk(),
          accessPath: CHAT_ATTACHMENTS_ACCESS_PATH,
          policy: {
            read: true,
            create: { scope: true, defaults: { uploaderId } },
            update: false,
            delete: false,
          },
        })
        .uploadOne({ file });
      return String(record.id);
    },
    bytes: (object) => disks().use(object.disk).getBytes(object.key),
    async stream(object) {
      const stream = await disks().use(object.disk).getStream(object.key);
      return Readable.toWeb(stream) as ReadableStream<Uint8Array>;
    },
    async remove(object) {
      try {
        await deps.disks()?.use(object.disk).delete(object.key);
      } catch (error) {
        deps.onError?.(error);
      }
    },
  };
}

/** Who reads a file: a person, or a run of an agent acting for them (its subject). */
export interface AttachmentReader {
  readonly userId: string;
  /** Set for a request authenticated by a run token: only files of the conversation the run works on. */
  readonly run?: {
    readonly subjectKind: string;
    readonly subjectId: string;
  } | null;
}

export interface ChatAttachmentContent {
  readonly attachment: MessageAttachment;
  readonly body: ReadableStream<Uint8Array>;
}

export interface ChatAttachmentService {
  /** An upload of the person's, attached to nothing yet. */
  upload(userId: string, file: File): Promise<MessageAttachment>;
  /** Deletes the person's own upload not sent yet; 404 for anything else. */
  remove(userId: string, id: string): Promise<void>;
  /** A file's bytes; 404 unless the reader may read it. */
  content(reader: AttachmentReader, id: string): Promise<ChatAttachmentContent>;
  /** The images of `ids` sent in `conversationId`, at most `maxBytes` each, for an online agent's model. */
  images(
    conversationId: string,
    ids: readonly string[],
    maxBytes: number,
  ): Promise<{ readonly mediaType: string; readonly data: Uint8Array }[]>;
  /** Deletes uploads attached to nothing for `CHAT_ATTACHMENT_ORPHAN_HOURS`; answers how many. */
  purge(at?: Date): Promise<number>;
}

/** What the conversation service uses inside a message's transaction. */
export interface ChatAttachmentLinks {
  /**
   * Gives `ids` (checked: at most `CHAT_ATTACHMENTS_PER_MESSAGE_MAX` distinct ids of `userId`'s uploads attached to
   * nothing) to the conversation and message. Answers what the message keeps, in the order named; 400
   * `INVALID_REQUEST` otherwise, and nothing is attached.
   */
  attach(
    conn: DatabaseConnection,
    userId: string,
    target: { readonly conversationId: string; readonly messageId: string },
    ids: readonly string[],
  ): Promise<StoredAttachment[]>;
}

export interface ChatAttachmentDeps {
  readonly tx: TxRunner;
  readonly storage: ChatFileStorage;
  /** The application's public base path (`/app`, or empty), for the content URLs. */
  readonly basePath: () => string;
  readonly now?: () => Date;
}

function files(conn: DatabaseConnection): Repository<ChatAttachmentRecord> {
  return conn.repository<ChatAttachmentRecord>(CHAT_ATTACHMENTS);
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;

/** File ids are the file plugin's uuids; anything else names no file (and must not reach a uuid column). */
function isUuid(value: string): boolean {
  return UUID.test(value);
}

async function findFile(
  conn: DatabaseConnection,
  id: string,
): Promise<ChatAttachmentRecord | undefined> {
  if (!isUuid(id)) return undefined;
  return (await files(conn).findOne({ filter: { id } })) ?? undefined;
}

async function findFiles(
  conn: DatabaseConnection,
  ids: readonly string[],
): Promise<ChatAttachmentRecord[]> {
  const wanted = ids.filter(isUuid);
  if (wanted.length === 0) return [];
  return files(conn).findMany({
    filter: (f) => f.or(wanted.map((id) => f.string('id').eq(id))),
  });
}

/** The content route of a file, with the application's base path. */
export function chatAttachmentUrl(basePath: string, id: string): string {
  return `${basePath.replace(/\/+$/u, '')}/api/agents/chatAttachments/${encodeURIComponent(id)}/content`;
}

/** A file as the API answers it. */
export function attachmentView(
  basePath: string,
  file: StoredAttachment,
): MessageAttachment {
  const contentUrl = chatAttachmentUrl(basePath, file.id);
  return {
    id: file.id,
    filename: file.filename,
    ext: file.ext,
    mimeType: file.mimeType,
    size: Number(file.size),
    contentUrl,
    downloadUrl: `${contentUrl}?download=true`,
    previewable: isInlineImage(file.mimeType, file.ext),
  };
}

function stored(row: ChatAttachmentRecord): StoredAttachment {
  return {
    id: row.id,
    filename: row.filename,
    ext: row.ext,
    mimeType: row.mimeType,
    size: Number(row.size),
  };
}

/** What a message stored as its files; anything malformed is left out. */
export function storedAttachments(value: unknown): StoredAttachment[] {
  if (typeof value === 'string') {
    try {
      return storedAttachments(JSON.parse(value) as unknown);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(value)) return [];
  return value.flatMap((item: unknown): StoredAttachment[] => {
    if (typeof item !== 'object' || item === null) return [];
    const record = item as Record<string, unknown>;
    return typeof record.id === 'string' && typeof record.filename === 'string'
      ? [
          {
            id: record.id,
            filename: record.filename,
            ext: typeof record.ext === 'string' ? record.ext : '',
            mimeType:
              typeof record.mimeType === 'string'
                ? record.mimeType
                : 'application/octet-stream',
            size: Number(record.size ?? 0),
          },
        ]
      : [];
  });
}

/** The `attachmentIds` of a request: absent is none; otherwise at most the maximum distinct non-empty strings. */
export function readAttachmentIds(value: unknown): string[] {
  if (value === undefined || value === null) return [];
  if (
    !Array.isArray(value) ||
    !value.every((item): item is string => typeof item === 'string' && !!item)
  )
    throw invalid('attachmentIds must be a list of file ids.', {
      field: 'attachmentIds',
    });
  const ids = [...new Set(value)];
  if (ids.length > CHAT_ATTACHMENTS_PER_MESSAGE_MAX)
    throw invalid(
      `At most ${CHAT_ATTACHMENTS_PER_MESSAGE_MAX} files per message.`,
      { field: 'attachmentIds' },
    );
  return ids;
}

/** 413 `UPLOAD_TOO_LARGE`: a file over `CHAT_ATTACHMENT_SIZE_MAX`. */
export function fileTooLarge(): ProtocolError {
  return new ProtocolError(
    'UPLOAD_TOO_LARGE',
    `A file may have at most ${CHAT_ATTACHMENT_SIZE_MAX} bytes.`,
    { maxBytes: CHAT_ATTACHMENT_SIZE_MAX },
  );
}

export function createChatAttachments(deps: ChatAttachmentDeps): {
  readonly service: ChatAttachmentService;
  readonly links: ChatAttachmentLinks;
} {
  const now = deps.now ?? (() => new Date());
  const view = (row: ChatAttachmentRecord): MessageAttachment =>
    attachmentView(deps.basePath(), stored(row));

  /** The row, when the reader may read it; 404 otherwise. */
  async function readable(
    conn: DatabaseConnection,
    reader: AttachmentReader,
    id: string,
  ): Promise<ChatAttachmentRecord> {
    const row = await findFile(conn, id);
    if (!row) throw notFound('Attachment');
    if (row.conversationId === null) {
      // An upload not sent yet: its uploader's alone, never a run's.
      if (reader.run || row.uploaderId !== reader.userId)
        throw notFound('Attachment');
      return row;
    }
    if (
      reader.run &&
      (reader.run.subjectKind !== CONVERSATION_SUBJECT ||
        reader.run.subjectId !== row.conversationId)
    )
      throw notFound('Attachment');
    const conversation = await conn
      .repository<{ id: string; userId: string }>('agConversations')
      .findOne({ filter: { id: row.conversationId } });
    if (!conversation || conversation.userId !== reader.userId)
      throw notFound('Attachment');
    return row;
  }

  /** Deletes the row only while it is still attached to nothing; answers whether it did. */
  async function deleteIfUnattached(
    conn: DatabaseConnection,
    id: string,
  ): Promise<boolean> {
    await files(conn).deleteMany({
      filter: (f) =>
        f.and([f.string('id').eq(id), f.string('conversationId').eq(null)]),
    });
    return !(await files(conn).findOne({ filter: { id } }));
  }

  const links: ChatAttachmentLinks = {
    async attach(conn, userId, target, ids) {
      if (ids.length === 0) return [];
      const rows = await findFiles(conn, ids);
      const ordered = ids.map((id) => {
        const row = rows.find((candidate) => candidate.id === id);
        if (!row || row.conversationId !== null || row.uploaderId !== userId)
          throw invalid(`File ${id} is not an upload of yours to send.`, {
            field: 'attachmentIds',
            fileId: id,
          });
        return row;
      });
      await files(conn).updateMany({
        filter: (f) =>
          f.and([
            f.or(ids.map((id) => f.string('id').eq(id))),
            f.string('conversationId').eq(null),
          ]),
        values: { ...target, updatedAt: now() },
      });
      return ordered.map(stored);
    },
  };

  const service: ChatAttachmentService = {
    async upload(userId, file) {
      if (file.size > CHAT_ATTACHMENT_SIZE_MAX) throw fileTooLarge();
      const id = await deps.storage.store(file, userId);
      const row = await findFile(deps.tx.read(), id);
      if (!row) throw notFound('Attachment');
      return view(row);
    },

    async remove(userId, id) {
      const conn = deps.tx.read();
      const row = await findFile(conn, id);
      if (!row || row.uploaderId !== userId || row.conversationId !== null)
        throw notFound('Attachment');
      if (await deleteIfUnattached(conn, row.id))
        await deps.storage.remove(row);
    },

    async content(reader, id) {
      const row = await readable(deps.tx.read(), reader, id);
      return { attachment: view(row), body: await deps.storage.stream(row) };
    },

    async images(conversationId, ids, maxBytes) {
      const rows = await findFiles(deps.tx.read(), ids);
      const images: { mediaType: string; data: Uint8Array }[] = [];
      for (const id of ids) {
        const row = rows.find((candidate) => candidate.id === id);
        if (
          !row ||
          row.conversationId !== conversationId ||
          !isInlineImage(row.mimeType, row.ext) ||
          Number(row.size) > maxBytes
        )
          continue;
        images.push({
          mediaType: row.mimeType.split(';')[0].trim().toLowerCase(),
          data: await deps.storage.bytes(row),
        });
      }
      return images;
    },

    async purge(at = now()) {
      const conn = deps.tx.read();
      const cutoff = at.getTime() - CHAT_ATTACHMENT_ORPHAN_HOURS * 3_600_000;
      const rows = await files(conn).findMany({
        filter: (f) => f.string('conversationId').eq(null),
        sort: (sort) => [sort.field('createdAt').asc(), sort.field('id').asc()],
        limit: PURGE_BATCH,
      });
      let purged = 0;
      // The age is compared here rather than in the query: dialects store the timestamp differently.
      for (const row of rows) {
        if (new Date(row.createdAt).getTime() >= cutoff) break;
        // Sent meanwhile: the row survived, so its bytes stay.
        if (!(await deleteIfUnattached(conn, row.id))) continue;
        await deps.storage.remove(row);
        purged += 1;
      }
      return purged;
    },
  };

  return { service, links };
}
