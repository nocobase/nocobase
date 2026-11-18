import { usePendingFeedback } from '@nocobase/app-client';
import { LoaderCircle, RotateCcw, UploadCloud, X } from 'lucide-react';
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type ReactElement,
} from 'react';
import type {
  ClientFileRepository,
  FileRecord,
} from '@nocobase/app-plugin-file/client';

import { acceptsFile, formatBytes } from '../lib/files.js';

export interface FileUploadLabels {
  readonly choose: string;
  readonly dropHint: string;
  readonly uploading: string;
  readonly tooLarge: string;
  readonly rejected: string;
  readonly uploadFailed: string;
  readonly cancel: string;
  readonly retry: string;
  readonly longWait: string;
}

export interface FileUploadFieldProps {
  readonly repository: ClientFileRepository;
  /** Called with the uploaded records once the server has committed them. */
  readonly onChange: (records: readonly FileRecord[]) => void | Promise<void>;
  readonly labels: FileUploadLabels;
  readonly multiple?: boolean;
  readonly accept?: readonly string[];
  readonly maxSize?: number;
  readonly disabled?: boolean;
  /** Renders only the trigger button, for use inside a list row. */
  readonly compact?: boolean;
}

/**
 * Upload control for File Repository resources: one file uses `uploadOne`,
 * a batch uses `uploadMany`. The caller owns what happens to the records.
 */
export function FileUploadField({
  repository,
  onChange,
  labels,
  multiple = false,
  accept = [],
  maxSize,
  disabled = false,
  compact = false,
}: FileUploadFieldProps): ReactElement {
  const inputRef = useRef<HTMLInputElement>(null);
  const controllerRef = useRef<AbortController | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  // Files of the last failed upload, kept so Retry sends exactly them again.
  const [failed, setFailed] = useState<readonly File[]>([]);
  // The upload request reports no byte progress: show an honest wait.
  const feedback = usePendingFeedback(busy);
  // Leaving the page cancels the request instead of letting it land later.
  useEffect(() => () => controllerRef.current?.abort(), []);

  const submit = async (selected: readonly File[]): Promise<void> => {
    const files = (multiple ? selected : selected.slice(0, 1)).filter(
      (file) => {
        if (maxSize !== undefined && file.size > maxSize) {
          setError(`${labels.tooLarge} (${formatBytes(maxSize)})`);
          return false;
        }
        if (!acceptsFile(file, accept)) {
          setError(labels.rejected);
          return false;
        }
        return true;
      },
    );
    if (!files.length) return;
    const controller = new AbortController();
    controllerRef.current = controller;
    setBusy(true);
    setError('');
    setFailed([]);
    try {
      const { signal } = controller;
      const records =
        files.length === 1
          ? [
              (await repository.uploadOne({ file: files[0] }, { signal }))
                .record,
            ]
          : (await repository.uploadMany({ files }, { signal })).records;
      if (signal.aborted) return;
      await onChange(records);
    } catch (cause) {
      if (controller.signal.aborted) return;
      setError(cause instanceof Error ? cause.message : labels.uploadFailed);
      setFailed(files);
    } finally {
      if (controllerRef.current === controller) {
        controllerRef.current = undefined;
        setBusy(false);
      }
    }
  };
  const cancel = (): void => {
    controllerRef.current?.abort();
    controllerRef.current = undefined;
    setBusy(false);
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    void submit(Array.from(event.currentTarget.files ?? []));
    event.currentTarget.value = '';
  };
  const handleDrop = (event: DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    setDragging(false);
    if (!disabled && !busy) void submit(Array.from(event.dataTransfer.files));
  };

  const control = (
    <>
      <button
        type='button'
        className='inline-flex items-center gap-2 rounded-lg border bg-background px-4 py-2 text-sm font-medium shadow-2xs hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50 cursor-pointer'
        disabled={disabled || busy}
        onClick={() => inputRef.current?.click()}
      >
        {feedback.visible ? (
          <LoaderCircle
            aria-hidden='true'
            className='size-4 motion-safe:animate-spin'
          />
        ) : (
          <UploadCloud aria-hidden='true' className='size-4 text-primary' />
        )}
        {/* Both labels share one cell so the button keeps its width; only the
            visible one is exposed, so the button is always named. */}
        <span className='grid'>
          <span
            aria-hidden={feedback.visible || undefined}
            className={`col-start-1 row-start-1 ${feedback.visible ? 'invisible' : ''}`}
          >
            {labels.choose}
          </span>
          <span
            aria-hidden={!feedback.visible || undefined}
            className={`col-start-1 row-start-1 ${feedback.visible ? '' : 'invisible'}`}
          >
            {labels.uploading}
          </span>
        </span>
      </button>
      {busy ? (
        <button
          type='button'
          className='inline-flex items-center gap-1 rounded-lg px-2 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer'
          onClick={cancel}
        >
          <X aria-hidden='true' className='size-4' />
          {labels.cancel}
        </button>
      ) : null}
      <span className={compact ? 'sr-only' : 'text-xs text-muted-foreground'}>
        {labels.dropHint}
      </span>
      <input
        ref={inputRef}
        className='sr-only'
        type='file'
        multiple={multiple}
        accept={accept.join(',')}
        aria-label={labels.choose}
        disabled={disabled || busy}
        onChange={handleChange}
      />
    </>
  );

  return (
    <div data-slot='file-upload-field' className='space-y-2'>
      {compact ? (
        <div className='inline-flex items-center'>{control}</div>
      ) : (
        <div
          className={`flex flex-wrap items-center gap-4 rounded-xl border-2 border-dashed p-4 transition-colors ${
            dragging
              ? 'border-primary bg-primary/5'
              : 'border-border/80 bg-card hover:bg-muted/20'
          }`}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          {control}
        </div>
      )}
      {/* Stays mounted so the change is announced rather than dropped. */}
      <p role='status' className='text-xs text-muted-foreground empty:hidden'>
        {feedback.visible
          ? feedback.longWaiting
            ? labels.longWait
            : labels.uploading
          : ''}
      </p>
      {error ? (
        <div className='flex flex-wrap items-center gap-2'>
          <p role='alert' className='text-sm text-destructive'>
            {error}
          </p>
          {failed.length ? (
            <button
              type='button'
              className='inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer disabled:opacity-50'
              disabled={disabled}
              onClick={() => void submit(failed)}
            >
              <RotateCcw aria-hidden='true' className='size-4' />
              {labels.retry}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
