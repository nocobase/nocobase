import { useTranslation } from '@nocobase/i18n/client';
import { useRef, useState, type DragEvent } from 'react';

import {
  INTAKE_FILES_MAX,
  INTAKE_FILE_SIZE_MAX,
  type IntakeFile,
} from '../../../shared/intake.js';
import { useNotify } from '../../hooks/use-notify.js';
import { usePlanApi } from '../../kit/plans/api.js';

export const SIZE_MB: number = INTAKE_FILE_SIZE_MAX / (1024 * 1024);

export interface Upload {
  readonly key: string;
  readonly name: string;
  readonly file: IntakeFile | null;
}

export interface IntakeUploads {
  readonly uploads: readonly Upload[];
  /** The uploaded files, in the order added. */
  readonly files: readonly IntakeFile[];
  readonly uploading: boolean;
  readonly add: (files: readonly File[]) => void;
  readonly remove: (key: string) => void;
  readonly clear: () => void;
  readonly onDragOver: (event: DragEvent) => void;
  readonly onDrop: (event: DragEvent) => void;
}

/**
 * The AI draft tab's files: each one is uploaded as soon as it is added (`POST /api/projects/intake/files`, the file plugin's
 * storage), within the count and size limits; removing one deletes the upload.
 */
export function useIntakeUploads(): IntakeUploads {
  const { t } = useTranslation();
  const api = usePlanApi();
  const notify = useNotify();
  const [uploads, setUploads] = useState<readonly Upload[]>([]);
  const counterRef = useRef(0);

  function add(files: readonly File[]): void {
    const room = INTAKE_FILES_MAX - uploads.length;
    if (files.length > room)
      notify.error(null, t('intake.tooManyFiles', { count: INTAKE_FILES_MAX }));
    for (const file of files.slice(0, Math.max(room, 0))) {
      if (file.size > INTAKE_FILE_SIZE_MAX) {
        notify.error(
          null,
          t('intake.fileTooLarge', { name: file.name, size: SIZE_MB }),
        );
        continue;
      }
      counterRef.current += 1;
      const key = `upload-${counterRef.current}`;
      setUploads((current) => [
        ...current,
        { key, name: file.name, file: null },
      ]);
      api
        .uploadIntakeFile(file)
        .then((stored) =>
          setUploads((current) =>
            current.map((upload) =>
              upload.key === key ? { ...upload, file: stored } : upload,
            ),
          ),
        )
        .catch((error: unknown) => {
          setUploads((current) =>
            current.filter((upload) => upload.key !== key),
          );
          notify.error(error, t('intake.uploadFailed', { name: file.name }));
        });
    }
  }

  return {
    uploads,
    files: uploads.flatMap((upload) => (upload.file ? [upload.file] : [])),
    uploading: uploads.some((upload) => upload.file === null),
    add,
    remove: (key) => {
      const upload = uploads.find((candidate) => candidate.key === key);
      setUploads((current) =>
        current.filter((candidate) => candidate.key !== key),
      );
      if (upload?.file)
        void api.removeIntakeFile(upload.file.id).catch(() => undefined);
    },
    clear: () => setUploads([]),
    onDragOver: (event) => {
      if (event.dataTransfer.types.includes('Files')) event.preventDefault();
    },
    onDrop: (event) => {
      if (event.dataTransfer.files.length === 0) return;
      event.preventDefault();
      add([...event.dataTransfer.files]);
    },
  };
}
