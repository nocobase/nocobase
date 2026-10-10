import { messageKey } from '../lib/message-key.js';
import { useTranslation } from '@nocobase/i18n/client';
import { LoaderCircle, RotateCcw, Trash2, UploadCloud, X } from 'lucide-react';
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type ReactElement,
} from 'react';

import type { FileRecord, FileUploadFieldProps } from '../types';
import { Button } from '@/components/ui/button';
import { FileThumbnail } from './file-thumbnail';

type UploadItem = {
  readonly key: string;
  readonly file: File;
  readonly status: 'pending' | 'uploading' | 'error';
  readonly controller?: AbortController;
  readonly error?: Error;
};

function accepts(file: File, rules: readonly string[]): boolean {
  if (!rules.length) return true;
  const name = file.name.toLowerCase();
  return rules.some((rule) => {
    const value = rule.trim().toLowerCase();
    if (value === '*' || value === '*/*') return true;
    return value.endsWith('/*')
      ? file.type.toLowerCase().startsWith(value.slice(0, -1))
      : value.startsWith('.')
        ? name.endsWith(value)
        : file.type.toLowerCase() === value;
  });
}

export function FileUploadField(
  inputProps: FileUploadFieldProps,
): ReactElement {
  const { t } = useTranslation('@nocobase/app-plugin-file');
  const {
    repository,
    value,
    onChange,
    onError,
    onStatusChange,
    multiple = false,
    accept = [],
    maxSize,
    maxFiles,
    disabled = false,
    removeOnDelete = false,
    labels,
  } = inputProps;

  const [items, setItems] = useState<UploadItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const valueRef = useRef(value);
  const completedRecordsRef = useRef<FileRecord[]>([]);
  const commitScheduledRef = useRef(false);
  const statusChangeRef = useRef(onStatusChange);
  const controllersRef = useRef(new Map<string, AbortController>());
  const mountedRef = useRef(true);
  const maximum = multiple ? (maxFiles ?? Infinity) : 1;
  const chooseLabel =
    labels?.choose ??
    (multiple
      ? t('files.chooseMany', { defaultValue: 'Choose files' })
      : t('files.chooseOne', { defaultValue: 'Choose file' }));
  const removeLabel =
    labels?.remove ?? t('files.remove', { defaultValue: 'Remove' });
  const retryLabel =
    labels?.retry ?? t('files.retry', { defaultValue: 'Retry' });

  useEffect(() => {
    valueRef.current = value;
  }, [value]);
  useEffect(() => {
    statusChangeRef.current = onStatusChange;
  }, [onStatusChange]);
  useEffect(() => {
    onStatusChange?.(
      items.some((item) => item.status === 'error')
        ? 'error'
        : items.length
          ? 'uploading'
          : 'idle',
    );
  }, [items, onStatusChange]);
  useEffect(() => {
    mountedRef.current = true;
    const controllers = controllersRef.current;
    return () => {
      mountedRef.current = false;
      for (const controller of controllers.values()) controller.abort();
      statusChangeRef.current?.('idle');
    };
  }, []);

  const commitCompletedRecord = (record: FileRecord): void => {
    completedRecordsRef.current.push(record);
    if (commitScheduledRef.current) return;
    commitScheduledRef.current = true;
    queueMicrotask(() => {
      commitScheduledRef.current = false;
      const completed = completedRecordsRef.current.splice(0);
      if (!mountedRef.current || !completed.length) return;
      onChange(
        multiple
          ? [...valueRef.current, ...completed]
          : [completed.at(-1) as FileRecord],
      );
    });
  };

  const upload = async (item: UploadItem): Promise<void> => {
    const controller = new AbortController();
    controllersRef.current.set(item.key, controller);
    setItems((current) =>
      current.map((candidate) =>
        candidate.key === item.key
          ? { ...candidate, status: 'uploading', controller, error: undefined }
          : candidate,
      ),
    );
    try {
      const { record } = await repository.uploadOne(
        { file: item.file },
        { signal: controller.signal },
      );
      controllersRef.current.delete(item.key);
      if (!mountedRef.current || controller.signal.aborted) return;
      setItems((current) =>
        current.filter((candidate) => candidate.key !== item.key),
      );
      commitCompletedRecord(record);
    } catch (error) {
      controllersRef.current.delete(item.key);
      if (
        controller.signal.aborted ||
        (error instanceof Error && error.name === 'AbortError')
      ) {
        if (mountedRef.current) {
          setItems((current) =>
            current.filter((candidate) => candidate.key !== item.key),
          );
        }
        return;
      }
      if (!mountedRef.current) return;
      const uploadError =
        error instanceof Error ? error : new Error('File upload failed.');
      setItems((current) =>
        current.map((candidate) =>
          candidate.key === item.key
            ? { ...candidate, error: uploadError, status: 'error' }
            : candidate,
        ),
      );
      onError?.(uploadError);
    }
  };

  const addFiles = (files: readonly File[]): void => {
    if (disabled) return;
    if (files.length + (multiple ? value.length : 0) + items.length > maximum) {
      onError?.(
        new Error(
          t('fileLimitReached', {
            defaultValue: 'The maximum number of files has been reached.',
          }),
        ),
      );
      return;
    }
    const selected = (multiple ? files : files.slice(0, 1)).filter((file) => {
      if (maxSize !== undefined && file.size > maxSize) {
        onError?.(
          new Error(
            t('fileTooLarge', {
              defaultValue: 'File exceeds the maximum size.',
            }),
          ),
        );
        return false;
      }
      if (!accepts(file, accept)) {
        onError?.(
          new Error(
            t('fileTypeNotAllowed', {
              defaultValue: 'File type is not allowed.',
            }),
          ),
        );
        return false;
      }
      return true;
    });
    const nextItems = selected.map((file): UploadItem => ({
      key: `${file.name}:${file.size}:${file.lastModified}:${Math.random()}`,
      file,
      status: 'pending',
    }));
    setItems((current) => [...current, ...nextItems]);
    nextItems.forEach((item) => void upload(item));
  };

  const removeRecord = async (record: FileRecord): Promise<void> => {
    if (removeOnDelete) {
      try {
        await repository.deleteOne({ filter: { id: record.id } });
      } catch (error) {
        onError?.(
          error instanceof Error
            ? error
            : new Error(
                t('removalFailed', {
                  defaultValue: 'File removal failed.',
                }),
              ),
        );
        return;
      }
    }
    const next = valueRef.current.filter(
      (candidate) => candidate.id !== record.id,
    );
    onChange(next);
  };
  const cancel = (item: UploadItem): void => {
    controllersRef.current.get(item.key)?.abort();
    controllersRef.current.delete(item.key);
    setItems((current) =>
      current.filter((candidate) => candidate.key !== item.key),
    );
  };
  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    addFiles(Array.from(event.currentTarget.files ?? []));
    event.currentTarget.value = '';
  };
  const handleDrop = (event: DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    setDragging(false);
    addFiles(Array.from(event.dataTransfer.files));
  };

  return (
    <div
      data-slot='file-upload-field'
      className='space-y-3'
      aria-busy={items.some((item) => item.status === 'uploading')}
    >
      <div
        className={`flex min-h-24 flex-wrap gap-3 rounded-md border border-dashed p-3 ${dragging ? 'border-primary bg-primary/5' : ''}`}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        {value.map((record) => (
          <div key={record.id} className='w-36 rounded-md border p-2'>
            <div className='flex h-20 items-center justify-center overflow-hidden rounded-sm bg-muted/30'>
              <FileThumbnail file={record} />
            </div>
            <div className='mt-2 truncate text-sm' title={record.filename}>
              {record.filename}
            </div>
            <div className='text-xs text-muted-foreground'>
              {t('files.done', { defaultValue: 'Done' })}
            </div>
            <Button
              type='button'
              size='icon'
              variant='ghost'
              aria-label={`${removeLabel}: ${record.filename}`}
              onClick={() => void removeRecord(record)}
              disabled={disabled}
            >
              <Trash2 aria-hidden='true' />
            </Button>
          </div>
        ))}
        {items.map((item) => (
          <div key={item.key} className='w-36 rounded-md border p-2'>
            <div className='flex h-20 items-center justify-center overflow-hidden rounded-sm bg-muted/30'>
              {item.status === 'uploading' ? (
                <LoaderCircle
                  className='animate-spin'
                  aria-label={t('files.uploading', {
                    defaultValue: 'Uploading',
                  })}
                />
              ) : (
                <UploadCloud aria-hidden='true' />
              )}
            </div>
            <div className='mt-2 truncate text-sm' title={item.file.name}>
              {item.file.name}
            </div>
            <div className='text-xs text-muted-foreground'>
              {item.status === 'error'
                ? ((item.error
                    ? t(messageKey(item.error.message), {
                        defaultValue: item.error.message,
                      })
                    : undefined) ??
                  t('files.failed', { defaultValue: 'Failed' }))
                : item.status === 'uploading'
                  ? t('files.uploading', { defaultValue: 'Uploading' })
                  : t('files.pending', { defaultValue: 'Pending' })}
            </div>
            <div className='mt-2 flex gap-1'>
              {item.status === 'error' ? (
                <Button
                  type='button'
                  size='icon'
                  variant='ghost'
                  aria-label={`${retryLabel}: ${item.file.name}`}
                  onClick={() => void upload(item)}
                  disabled={disabled}
                >
                  <RotateCcw aria-hidden='true' />
                </Button>
              ) : null}
              <Button
                type='button'
                size='icon'
                variant='ghost'
                aria-label={t('files.cancelFile', {
                  filename: item.file.name,
                  defaultValue: `Cancel ${item.file.name}`,
                })}
                onClick={() => cancel(item)}
                disabled={disabled}
              >
                <X aria-hidden='true' />
              </Button>
            </div>
          </div>
        ))}
        <Button
          type='button'
          variant='outline'
          className='min-h-20 min-w-32'
          onClick={() => inputRef.current?.click()}
          disabled={
            disabled ||
            (multiple
              ? value.length + items.length >= maximum
              : items.length >= 1)
          }
        >
          <UploadCloud aria-hidden='true' />
          {chooseLabel}
        </Button>
        <input
          ref={inputRef}
          className='sr-only'
          type='file'
          multiple={multiple}
          accept={accept.join(',')}
          onChange={handleChange}
          aria-label={chooseLabel}
          disabled={disabled}
        />
      </div>
      <div className='sr-only' aria-live='polite'>
        {[
          ...value.map(
            (record) =>
              `${record.filename}: ${t('files.done', { defaultValue: 'done' })}`,
          ),
          ...items.map(
            (item) =>
              `${item.file.name}: ${t(`files.status.${item.status}`, { defaultValue: item.status })}`,
          ),
        ].join('. ')}
      </div>
    </div>
  );
}
