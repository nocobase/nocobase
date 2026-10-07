/**
 * Where a file's bytes go: the file plugin's server repository stores them on a Drive disk and inserts the row
 * (`pmAttachments`, stamped with the uploader and attached to nothing), and the Drive manager reads and deletes them.
 * Both are asked on each use; without the file plugin (or Drive) every operation is 400 `FILES_UNAVAILABLE`.
 *
 * Nothing is served at the repository's access path: the plugin's own content route is public by design, so this
 * plugin streams the bytes itself, after checking who may read them (`attachment.routes.ts`).
 */
import { Readable } from 'node:stream';

import { DomainError } from '../../kernel/errors.js';
import { ATTACHMENTS, type UploaderRef } from './attachment.store.js';

/** Required by the file repository; nothing is served there. */
export const ATTACHMENTS_ACCESS_PATH = '/uploads/pm-attachments';

/** The file plugin's server repository, as far as uploading goes (`ServerFileRepositoryManager`). */
export interface FileUploader {
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
export interface FileDisks {
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

export interface AttachmentStorage {
  /** Stores the bytes and inserts the row, attached to nothing; answers its id. */
  store(file: File, uploader: UploaderRef): Promise<string>;
  bytes(object: StoredObject): Promise<Uint8Array>;
  stream(object: StoredObject): Promise<ReadableStream<Uint8Array>>;
  /** Deletes the bytes; a failure leaves an orphan object, never a broken row, and is only logged. */
  remove(object: StoredObject): Promise<void>;
}

export interface AttachmentStorageDeps {
  /** Null when the application registers no file plugin. */
  readonly uploader: () => FileUploader | null;
  readonly disks: () => FileDisks | null;
  /** The Drive disk new files go to. */
  readonly disk: () => string;
  readonly onError?: (error: unknown) => void;
}

export function filesUnavailable(): DomainError {
  return new DomainError(
    'invalid',
    'FILES_UNAVAILABLE',
    'This application stores no files.',
  );
}

export function createAttachmentStorage(
  deps: AttachmentStorageDeps,
): AttachmentStorage {
  const disks = () => {
    const found = deps.disks();
    if (!found) throw filesUnavailable();
    return found;
  };
  return {
    async store(file, uploader) {
      const repository = deps.uploader();
      if (!repository) throw filesUnavailable();
      const { record } = await repository
        .repository(ATTACHMENTS, {
          disk: deps.disk(),
          accessPath: ATTACHMENTS_ACCESS_PATH,
          policy: {
            read: true,
            create: {
              scope: true,
              defaults: {
                uploaderType: uploader.type,
                uploaderId: uploader.id,
              },
            },
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
