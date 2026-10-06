import {
  ChevronLeft,
  ChevronRight,
  Download,
  LoaderCircle,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState, type ReactElement } from 'react';
import type { FileRecord } from '@nocobase/app-plugin-file/client';

import { formatBytes, previewKind } from '../lib/files.js';
import { isActiveMarkupMimeType } from '../lib/mime.js';
import { resolveOfficeOpenXmlFormat } from '../lib/office-format.js';
import { resolveSafeFileUrl } from '../lib/file-url.js';
import { OfficeOpenXmlPreview } from './office-open-xml-preview.js';

const PDF_MIME_TYPE = 'application/pdf';

// A blob URL is same-origin, so the frame must receive the bytes as a PDF and
// never as a document the browser would render and run. This retyping is the
// safeguard; refusing an active markup response only turns an obvious HTML
// answer into a readable failure instead of a broken PDF viewer.
function asPdfBlob(blob: Blob): Blob {
  return blob.type === PDF_MIME_TYPE
    ? blob
    : blob.slice(0, blob.size, PDF_MIME_TYPE);
}

export interface FilePreviewLabels {
  readonly preview: string;
  readonly download: string;
  readonly close: string;
  readonly previous: string;
  readonly next: string;
  readonly loading: string;
  readonly unsupported: string;
  readonly previewFailed: string;
}

export interface FilePreviewDialogProps {
  readonly files: readonly FileRecord[];
  /** A negative index keeps the dialog closed. */
  readonly index: number;
  readonly labels: FilePreviewLabels;
  readonly onIndexChange: (index: number) => void;
  readonly onClose: () => void;
}

interface LoadedContent {
  /** Id of the file the fetched payload belongs to. */
  readonly key: string;
  readonly text?: string;
  readonly url?: string;
}

export function FilePreviewDialog({
  files,
  index,
  labels,
  onIndexChange,
  onClose,
}: FilePreviewDialogProps): ReactElement {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const objectUrlRef = useRef<string | undefined>(undefined);
  const [loaded, setLoaded] = useState<LoadedContent>();
  const [failureKey, setFailureKey] = useState<string>();
  const file = index >= 0 && index < files.length ? files[index] : undefined;
  const open = Boolean(file);
  const kind = file ? previewKind(file) : undefined;
  const current = file && loaded?.key === file.id ? loaded : undefined;
  const failed = Boolean(file && failureKey === file.id);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleCancel = (event: Event): void => {
      event.preventDefault();
      onClose();
    };
    const handleBackdropClick = (event: MouseEvent): void => {
      if (event.target === dialog) onClose();
    };
    dialog.addEventListener('cancel', handleCancel);
    dialog.addEventListener('click', handleBackdropClick);
    return () => {
      dialog.removeEventListener('cancel', handleCancel);
      dialog.removeEventListener('click', handleBackdropClick);
    };
  }, [onClose]);

  useEffect(
    () => () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    },
    [],
  );

  useEffect(() => {
    if (!file) return;
    const preview = previewKind(file);
    const url = file.contentUrl;
    if (!url || (preview !== 'pdf' && preview !== 'text')) return;
    // The content route always sends Content-Disposition: attachment, so the
    // bytes are fetched into a local payload instead of being embedded.
    const key = file.id;
    const controller = new AbortController();
    void (async () => {
      const response = await fetch(url, {
        credentials: 'include',
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(String(response.status));
      if (preview === 'text') {
        const text = await response.text();
        if (!controller.signal.aborted) setLoaded({ key, text });
        return;
      }
      const blob = await response.blob();
      if (controller.signal.aborted) return;
      if (isActiveMarkupMimeType(blob.type)) throw new Error(blob.type);
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      const objectUrl = URL.createObjectURL(asPdfBlob(blob));
      objectUrlRef.current = objectUrl;
      setLoaded({ key, url: objectUrl });
    })().catch(() => {
      if (!controller.signal.aborted) setFailureKey(key);
    });
    return () => controller.abort();
  }, [file]);

  const move = (step: number): void => {
    const next = index + step;
    if (next >= 0 && next < files.length) onIndexChange(next);
  };

  const body = (): ReactElement => {
    if (!file) return <span />;
    if (failed)
      return (
        <p role='alert' className='text-sm text-destructive'>
          {labels.previewFailed}
        </p>
      );
    if (kind === 'unsupported' || !file.contentUrl)
      return (
        <p className='text-sm text-muted-foreground'>{labels.unsupported}</p>
      );
    if (kind === 'ooxml') {
      const format = resolveOfficeOpenXmlFormat(file);
      const url = resolveSafeFileUrl(file.contentUrl);
      if (format)
        return (
          <OfficeOpenXmlPreview
            key={`${file.id}:${String(file.updatedAt)}:${file.contentUrl}`}
            format={format}
            url={url}
            error={url ? undefined : labels.previewFailed}
            labels={labels}
          />
        );
    }
    if (kind === 'audio') return <audio controls src={file.contentUrl} />;
    if (kind === 'video')
      return <video controls src={file.contentUrl} className='max-h-[60vh]' />;
    if (kind === 'image')
      return (
        <img
          src={file.contentUrl}
          alt={file.filename}
          className='max-h-[60vh] object-contain'
        />
      );
    if (kind === 'text' && current?.text !== undefined)
      return (
        <pre className='max-h-[60vh] w-full overflow-auto rounded-md bg-background p-4 text-left text-sm whitespace-pre-wrap'>
          {current.text}
        </pre>
      );
    if (kind === 'pdf' && current?.url)
      return (
        <iframe
          title={file.filename}
          src={current.url}
          className='h-[60vh] w-full rounded-md border bg-background'
        />
      );
    return (
      <LoaderCircle
        aria-label={labels.loading}
        className='size-6 animate-spin text-muted-foreground'
      />
    );
  };

  return (
    <dialog
      ref={dialogRef}
      data-slot='file-preview-dialog'
      aria-label={labels.preview}
      className='m-auto w-[min(56rem,calc(100%-2rem))] rounded-xl border bg-card p-0 text-card-foreground backdrop:bg-black/40'
      onKeyDown={(event) => {
        if (
          event.target !== dialogRef.current &&
          (event.target as HTMLElement).closest('[data-office-open-xml-format]')
        )
          return;
        if (event.key === 'ArrowLeft') move(-1);
        if (event.key === 'ArrowRight') move(1);
      }}
    >
      {file ? (
        <div className='flex max-h-[85vh] flex-col'>
          <header className='flex items-center gap-3 border-b px-4 py-3'>
            <div className='min-w-0 flex-1'>
              <p className='truncate font-medium' title={file.filename}>
                {file.filename}
              </p>
              <p className='text-xs text-muted-foreground'>
                {file.mimeType} · {formatBytes(file.size)}
              </p>
            </div>
            <a
              className='inline-flex items-center gap-1 rounded-md border px-2 py-1 text-sm hover:bg-accent'
              href={file.contentUrl}
              download={file.filename}
            >
              <Download aria-hidden='true' className='size-4' />
              {labels.download}
            </a>
            <button
              type='button'
              aria-label={labels.close}
              className='rounded-md p-1 hover:bg-accent'
              onClick={onClose}
            >
              <X aria-hidden='true' className='size-4' />
            </button>
          </header>
          <div className='flex min-h-64 flex-1 items-center justify-center overflow-auto bg-muted/30 p-4'>
            {body()}
          </div>
          {files.length > 1 ? (
            <footer className='flex items-center justify-between border-t px-4 py-2 text-sm'>
              <button
                type='button'
                className='inline-flex items-center gap-1 rounded-md px-2 py-1 hover:bg-accent disabled:opacity-40'
                disabled={index <= 0}
                onClick={() => move(-1)}
              >
                <ChevronLeft aria-hidden='true' className='size-4' />
                {labels.previous}
              </button>
              <span className='text-muted-foreground'>
                {index + 1} / {files.length}
              </span>
              <button
                type='button'
                className='inline-flex items-center gap-1 rounded-md px-2 py-1 hover:bg-accent disabled:opacity-40'
                disabled={index >= files.length - 1}
                onClick={() => move(1)}
              >
                {labels.next}
                <ChevronRight aria-hidden='true' className='size-4' />
              </button>
            </footer>
          ) : null}
        </div>
      ) : null}
    </dialog>
  );
}
