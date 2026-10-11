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
  readonly removed?: boolean;
  readonly removalFailed?: boolean;
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
  // Keep removal decisions available to upload callbacks, including before React's next render.
  const currentRef = useRef<readonly Upload[]>([]);

  function update(
    change: (current: readonly Upload[]) => readonly Upload[],
  ): void {
    currentRef.current = change(currentRef.current);
    setUploads(currentRef.current);
  }

  async function cleanup(key: string, file: IntakeFile): Promise<void> {
    try {
      await api.removeIntakeFile(file.id);
      update((current) => current.filter((upload) => upload.key !== key));
    } catch (error) {
      update((current) =>
        current.map((upload) =>
          upload.key === key
            ? { ...upload, file, removalFailed: true }
            : upload,
        ),
      );
      notify.error(error, t('intake.removeFailed', { name: file.filename }));
    }
  }

  function add(files: readonly File[]): void {
    const room =
      INTAKE_FILES_MAX -
      currentRef.current.filter((upload) => !upload.removed).length;
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
      update((current) => [...current, { key, name: file.name, file: null }]);
      api
        .uploadIntakeFile(file)
        .then((stored) => {
          const upload = currentRef.current.find(
            (candidate) => candidate.key === key,
          );
          if (upload?.removed) return cleanup(key, stored);
          update((current) =>
            current.map((upload) =>
              upload.key === key ? { ...upload, file: stored } : upload,
            ),
          );
        })
        .catch((error: unknown) => {
          update((current) => current.filter((upload) => upload.key !== key));
          notify.error(error, t('intake.uploadFailed', { name: file.name }));
        });
    }
  }

  return {
    uploads,
    files: uploads.flatMap((upload) =>
      !upload.removed && upload.file ? [upload.file] : [],
    ),
    uploading: uploads.some(
      (upload) => !upload.removed && upload.file === null,
    ),
    add,
    remove: (key) => {
      const upload = currentRef.current.find(
        (candidate) => candidate.key === key,
      );
      if (!upload || (upload.removed && !upload.removalFailed)) return;
      update((current) =>
        current.map((candidate) =>
          candidate.key === key
            ? { ...candidate, removed: true, removalFailed: false }
            : candidate,
        ),
      );
      if (upload.file) void cleanup(key, upload.file);
    },
    clear: () => update(() => []),
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
