/**
 * Where a stored file's bytes go: the file plugin's server repository stores them on a Drive disk and inserts the row
 * (`kbFiles`, stamped with the uploader), and the Drive manager reads and deletes them. Both are asked on each use;
 * without the file plugin (or Drive) storing is 400 `FILES_UNAVAILABLE`.
 *
 * Nothing is served at the repository's access path, which is public by design: the knowledge base streams the bytes
 * itself, after checking who may read them (`routes/api.ts`).
 */
import { Readable } from 'node:stream';

import { KnowledgeError } from '../errors.js';
import { TABLES } from './store.js';

/** Required by the file repository; nothing is served there. */
export const FILES_ACCESS_PATH = '/uploads/kb-files';

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

/** Who uploaded a file: `user`, or an actor's kind, and the id. */
export interface Uploader {
  readonly kind: string;
  readonly id: string;
}

export interface KnowledgeFileStore {
  /** Stores the bytes and inserts the `kbFiles` row; answers its id. */
  store(file: File, uploader: Uploader): Promise<string>;
  bytes(object: StoredObject): Promise<Uint8Array>;
  stream(object: StoredObject): Promise<ReadableStream<Uint8Array>>;
  /** Deletes the bytes; a failure leaves an orphan object and is only reported. */
  remove(object: StoredObject): Promise<void>;
}

export interface FileStoreDeps {
  /** Null when the application registers no file plugin. */
  readonly uploader: () => FileUploader | null;
  readonly disks: () => FileDisks | null;
  /** The Drive disk new files go to. */
  readonly disk: () => string;
  readonly onError?: (message: string, error: unknown) => void;
}

export function filesUnavailable(): KnowledgeError {
  return new KnowledgeError(
    400,
    'FILES_UNAVAILABLE',
    'This application stores no files.',
  );
}

export function createFileStore(deps: FileStoreDeps): KnowledgeFileStore {
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
        .repository(TABLES.files, {
          disk: deps.disk(),
          accessPath: FILES_ACCESS_PATH,
          policy: {
            read: true,
            create: {
              scope: true,
              defaults: {
                uploaderKind: uploader.kind,
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
        await disks().use(object.disk).delete(object.key);
      } catch (error) {
        (deps.onError ?? console.error)(
          'The knowledge base could not delete a stored file.',
          error,
        );
      }
    },
  };
}
