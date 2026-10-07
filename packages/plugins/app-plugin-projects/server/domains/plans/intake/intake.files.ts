/**
 * Intake files: uploads of the person's (`pmAttachments`, attached to nothing), stored through `AttachmentStorage`.
 * Only the uploader may use or remove one. When the intake's plan is executed, its files become the created issues'
 * files (`intake.attach.ts`); until then nothing serves them but the intake itself, and the purge keeps the files an
 * open intake plan names.
 */
import type { DatabaseConnection } from '@nocobase/db';

import {
  INTAKE_FILES_MAX,
  INTAKE_FILE_SIZE_MAX,
  type IntakeFile,
} from '../../../../shared/intake.js';
import { oneOf } from '../../../kernel/db.js';
import { invalid, notFound } from '../../../kernel/errors.js';
import {
  ATTACHMENTS,
  isUuid,
  type AttachmentRecord,
} from '../../attachments/attachment.store.js';
import type { AttachmentStorage } from '../../attachments/attachment.storage.js';
import type { IntakeSource } from './intake.text.js';

/** The stored file, with where its bytes are. */
export interface StoredIntakeFile extends IntakeFile, IntakeSource {
  readonly disk: string;
  readonly key: string;
}

export interface IntakeFileStore {
  upload(userId: string, file: File): Promise<IntakeFile>;
  /** Removes the uploader's own file attached to nothing; 404 for anyone else's. */
  remove(userId: string, id: string): Promise<void>;
  /** The uploader's own files attached to nothing, in the order named; 400 `INVALID_FILE` when one is not. */
  owned(userId: string, ids: readonly string[]): Promise<StoredIntakeFile[]>;
  bytes(file: StoredIntakeFile): Promise<Uint8Array>;
}

export interface IntakeFileStoreDeps {
  readonly conn: () => DatabaseConnection;
  readonly storage: AttachmentStorage;
}

function toFile(row: AttachmentRecord): StoredIntakeFile {
  return {
    id: String(row.id),
    disk: row.disk,
    key: row.key,
    filename: row.filename,
    ext: row.ext,
    mimeType: row.mimeType,
    size: Number(row.size),
    createdAt: new Date(row.createdAt).toISOString(),
  };
}

const publicFile = (file: StoredIntakeFile): IntakeFile => ({
  id: file.id,
  filename: file.filename,
  ext: file.ext,
  mimeType: file.mimeType,
  size: file.size,
  createdAt: file.createdAt,
});

export function createIntakeFileStore(
  deps: IntakeFileStoreDeps,
): IntakeFileStore {
  const files = () => deps.conn().repository<AttachmentRecord>(ATTACHMENTS);
  const ownFilter = (userId: string) => ({
    uploaderType: 'user',
    uploaderId: userId,
    issueId: null,
  });

  return {
    async upload(userId, file) {
      if (file.size > INTAKE_FILE_SIZE_MAX)
        throw invalid(
          'FILE_TOO_LARGE',
          `A file may have at most ${INTAKE_FILE_SIZE_MAX} bytes.`,
        );
      const id = await deps.storage.store(file, { type: 'user', id: userId });
      const row = await files().findOne({ filter: { id } });
      if (!row) throw notFound('File');
      return publicFile(toFile(row));
    },

    async remove(userId, id) {
      const row = isUuid(id)
        ? await files().findOne({ filter: { id, ...ownFilter(userId) } })
        : null;
      if (!row) throw notFound('File');
      await files().deleteMany({ filter: { id, issueId: null } });
      await deps.storage.remove(row);
    },

    async owned(userId, ids) {
      const wanted = [...new Set(ids)];
      if (wanted.length > INTAKE_FILES_MAX)
        throw invalid(
          'INVALID_INTAKE',
          `At most ${INTAKE_FILES_MAX} files at a time.`,
        );
      if (wanted.length === 0) return [];
      const valid = wanted.filter(isUuid);
      const rows =
        valid.length === 0
          ? []
          : await files().findMany({
              filter: (f) =>
                f.and([
                  oneOf(f, 'id', valid),
                  f.string('uploaderType').eq('user'),
                  f.string('uploaderId').eq(userId),
                  f.string('issueId').eq(null),
                ]),
            });
      return wanted.map((id) => {
        const row = rows.find((candidate) => String(candidate.id) === id);
        if (!row)
          throw invalid(
            'INVALID_FILE',
            `File ${id} is not an upload of yours.`,
          );
        return toFile(row);
      });
    },

    bytes: (file) => deps.storage.bytes(file),
  };
}
