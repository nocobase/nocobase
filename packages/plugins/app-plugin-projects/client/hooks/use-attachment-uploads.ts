import { useTranslation } from '@nocobase/i18n/client';

import { ACCESS_NAMESPACE } from '../../shared/access.js';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type DragEvent,
} from 'react';

import {
  ATTACHMENTS_PER_REQUEST_MAX,
  ATTACHMENT_SIZE_MAX,
  type Attachment,
} from '../../shared/attachments.js';
import { useNotify } from './use-notify.js';
import { usePmApi } from './use-pm-api.js';

/** A file being added: its name while it uploads, then the stored file. */
export interface PendingUpload {
  readonly key: string;
  readonly name: string;
  readonly size: number;
  readonly attachment: Attachment | null;
}

export const ATTACHMENT_SIZE_MB: number = ATTACHMENT_SIZE_MAX / (1024 * 1024);

export interface AttachmentUploads {
  readonly uploads: readonly PendingUpload[];
  /** The uploaded files' ids, in the order added. */
  readonly ids: readonly string[];
  readonly uploading: boolean;
  readonly add: (files: readonly File[]) => void;
  /** Takes a file back: an upload in flight is cancelled, a finished one deleted. */
  readonly remove: (key: string) => void;
  /** Forgets the files once they were sent, without deleting them. */
  readonly clear: () => void;
  /** Pasted files (a screenshot, say) are added instead of pasted as text. */
  readonly onPaste: (event: ClipboardEvent) => void;
  readonly onDragOver: (event: DragEvent) => void;
  readonly onDrop: (event: DragEvent) => void;
}

/** A pasted screenshot arrives as `image.png`; name it after the moment so several stay apart. */
function named(file: File, index: number): File {
  if (file.name && file.name !== 'image.png') return file;
  const stamp = new Date().toISOString().replace(/[-:]/gu, '').slice(0, 15);
  const ext = file.type.split('/')[1]?.replace(/[^a-z0-9]/giu, '') || 'png';
  return new File(
    [file],
    `screenshot-${stamp}${index > 0 ? `-${index + 1}` : ''}.${ext}`,
    { type: file.type },
  );
}

/**
 * Files added to a comment before it is sent (`shared/attachments.ts`): each is uploaded as soon as it is added
 * (picked, pasted or dropped), attached to nothing until the comment takes it; at most
 * `ATTACHMENTS_PER_REQUEST_MAX`, each within the size limit. Taking one back deletes the upload; leaving the page
 * leaves it to the server's purge.
 */
export function useAttachmentUploads(): AttachmentUploads {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const api = usePmApi();
  const notify = useNotify();
  const [uploads, setUploads] = useState<readonly PendingUpload[]>([]);
  const counterRef = useRef(0);
  const controllersRef = useRef(new Map<string, AbortController>());

  useEffect(() => {
    const running = controllersRef.current;
    return () => {
      for (const controller of running.values()) controller.abort();
    };
  }, []);

  const add = useCallback(
    (files: readonly File[]) => {
      // The server refuses more than the maximum anyway; this keeps the reader from uploading what it would refuse.
      const room = ATTACHMENTS_PER_REQUEST_MAX - uploads.length;
      if (files.length > room)
        notify.error(
          null,
          t('attachments.tooMany', { count: ATTACHMENTS_PER_REQUEST_MAX }),
        );
      files.slice(0, Math.max(room, 0)).forEach((original, index) => {
        const file = named(original, index);
        if (file.size > ATTACHMENT_SIZE_MAX) {
          notify.error(
            null,
            t('attachments.tooLarge', {
              name: file.name,
              size: ATTACHMENT_SIZE_MB,
            }),
          );
          return;
        }
        counterRef.current += 1;
        const key = `upload-${counterRef.current}`;
        const controller = new AbortController();
        controllersRef.current.set(key, controller);
        setUploads((current) => [
          ...current,
          { key, name: file.name, size: file.size, attachment: null },
        ]);
        api
          .uploadAttachment(file, controller.signal)
          .then((attachment) =>
            setUploads((current) =>
              current.map((upload) =>
                upload.key === key ? { ...upload, attachment } : upload,
              ),
            ),
          )
          .catch((error: unknown) => {
            setUploads((current) =>
              current.filter((upload) => upload.key !== key),
            );
            if (!controller.signal.aborted)
              notify.error(
                error,
                t('attachments.uploadFailed', { name: file.name }),
              );
          })
          .finally(() => controllersRef.current.delete(key));
      });
    },
    [api, notify, t, uploads.length],
  );

  return {
    uploads,
    ids: uploads.flatMap((upload) =>
      upload.attachment ? [upload.attachment.id] : [],
    ),
    uploading: uploads.some((upload) => upload.attachment === null),
    add,
    remove: (key) => {
      const upload = uploads.find((candidate) => candidate.key === key);
      controllersRef.current.get(key)?.abort();
      setUploads((current) =>
        current.filter((candidate) => candidate.key !== key),
      );
      if (upload?.attachment)
        void api.removeAttachment(upload.attachment.id).catch(() => undefined);
    },
    clear: () => setUploads([]),
    onPaste: (event) => {
      const files = [...event.clipboardData.files];
      if (files.length === 0) return;
      event.preventDefault();
      event.stopPropagation();
      add(files);
    },
    onDragOver: (event) => {
      if (event.dataTransfer.types.includes('Files')) event.preventDefault();
    },
    onDrop: (event) => {
      if (event.dataTransfer.files.length === 0) return;
      event.preventDefault();
      event.stopPropagation();
      add([...event.dataTransfer.files]);
    },
  };
}
