/**
 * Files on a record or a message, presented: safe images as thumbnails and everything else as a chip with its name,
 * size and a download (`AttachmentList`); the files waiting to go with a message (`PendingAttachments`); and a section
 * of a record's files that takes uploads by picking, pasting or dropping (`AttachmentPanel`). Purely presentational:
 * the consumer gives the files and hears about previews, uploads and removals. Without `onPreview`, images open in
 * the item's own dialog and other files download. Every word comes from `labels`, English by default; `{name}`-style
 * placeholders are filled in here.
 */
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DownloadIcon,
  FileIcon,
  Loader2Icon,
  PaperclipIcon,
  UploadIcon,
  XIcon,
} from 'lucide-react';
import {
  useRef,
  useState,
  type ClipboardEvent,
  type DragEvent,
  type ReactElement,
  type ReactNode,
} from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { cn } from 'cn';

export interface AttachmentFile {
  readonly id: string;
  readonly name: string;
  /** In bytes. */
  readonly size: number;
  /** Shown inline for an image. */
  readonly url: string;
  readonly downloadUrl: string;
  /** A safe image the browser may show. */
  readonly image: boolean;
  /** The reader may remove it. */
  readonly canRemove?: boolean;
}

export interface AttachmentLabels {
  readonly title: string;
  readonly images: string;
  readonly files: string;
  readonly pending: string;
  readonly upload: string;
  /** `{name}` is the file. */
  readonly preview: string;
  readonly download: string;
  readonly remove: string;
  readonly uploading: string;
  readonly removeTitle: string;
  readonly removeDescription: string;
  readonly removeConfirm: string;
  readonly cancel: string;
  readonly previous: string;
  readonly next: string;
}

const defaultLabels: AttachmentLabels = {
  title: 'Attachments',
  images: 'Images',
  files: 'Files',
  pending: 'Files to send',
  upload: 'Upload',
  preview: 'Preview {name}',
  download: 'Download {name}',
  remove: 'Remove {name}',
  uploading: 'Uploading {name}…',
  removeTitle: 'Remove this file?',
  removeDescription: '“{name}” is deleted for everyone.',
  removeConfirm: 'Remove',
  cancel: 'Cancel',
  previous: 'Previous file',
  next: 'Next file',
};

function fill(text: string, values: Readonly<Record<string, string>>): string {
  return text.replace(/\{(\w+)\}/gu, (whole, key: string) =>
    key in values ? (values[key] ?? whole) : whole,
  );
}

function bytes(size: number, locale: string | undefined): string {
  const units = ['B', 'KB', 'MB', 'GB'] as const;
  let value = size;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const number = new Intl.NumberFormat(locale, {
    maximumFractionDigits: unit === 0 ? 0 : 1,
  }).format(value);
  return `${number} ${units[unit] ?? 'B'}`;
}

export interface AttachmentListProps {
  readonly files: readonly AttachmentFile[];
  /** Previews a file the consumer's way, stepping through `files` from `index`; every file opens it. */
  readonly onPreview?: (
    files: readonly AttachmentFile[],
    index: number,
  ) => void;
  /** Asks to remove a file the reader may remove; the consumer confirms it. */
  readonly onRemove?: (file: AttachmentFile) => void;
  readonly removingId?: string | null;
  readonly locale?: string;
  readonly labels?: AttachmentLabels;
  readonly className?: string;
}

export function AttachmentList({
  files,
  onPreview,
  onRemove,
  removingId = null,
  locale,
  labels = defaultLabels,
  className,
}: AttachmentListProps): ReactElement | null {
  const [shown, setShown] = useState<number | null>(null);
  const images = files.filter((file) => file.image);
  const others = files.filter((file) => !file.image);
  // The consumer's preview steps through every file; the item's own only through the images.
  const previewed = onPreview ? [...images, ...others] : images;
  if (files.length === 0) return null;
  const open = (file: AttachmentFile): void => {
    const index = previewed.indexOf(file);
    if (onPreview) onPreview(previewed, index);
    else setShown(index);
  };

  const removeButton = (file: AttachmentFile, overlay: boolean): ReactNode =>
    onRemove && file.canRemove ? (
      <Button
        variant={overlay ? 'secondary' : 'ghost'}
        size='icon-xs'
        className={cn(
          overlay &&
            'absolute top-1 right-1 opacity-90 shadow-sm sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100',
        )}
        aria-label={fill(labels.remove, { name: file.name })}
        disabled={removingId === file.id}
        onClick={() => onRemove(file)}
      >
        {removingId === file.id ? (
          <Loader2Icon className='animate-spin' />
        ) : (
          <XIcon />
        )}
      </Button>
    ) : null;

  return (
    <div
      className={cn('flex min-w-0 flex-col gap-2', className)}
      data-slot='attachment-list'
    >
      {images.length > 0 ? (
        <ul className='flex flex-wrap gap-2' aria-label={labels.images}>
          {images.map((file) => (
            <li key={file.id} className='group relative'>
              <button
                type='button'
                className='block size-20 overflow-hidden rounded-md border bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:size-24'
                aria-label={fill(labels.preview, { name: file.name })}
                title={`${file.name} · ${bytes(file.size, locale)}`}
                onClick={() => open(file)}
              >
                <img
                  src={file.url}
                  alt={file.name}
                  loading='lazy'
                  className='size-full object-cover'
                />
              </button>
              {removeButton(file, true)}
            </li>
          ))}
        </ul>
      ) : null}
      {others.length > 0 ? (
        <ul className='flex min-w-0 flex-wrap gap-2' aria-label={labels.files}>
          {others.map((file) => (
            <li
              key={file.id}
              className='flex max-w-full min-w-0 items-center gap-1 rounded-md border bg-background py-1 pr-1 pl-2 text-sm'
            >
              <FileIcon
                className='size-3.5 shrink-0 text-muted-foreground'
                aria-hidden='true'
              />
              {onPreview ? (
                <button
                  type='button'
                  className='min-w-0 truncate text-left hover:underline focus-visible:underline focus-visible:outline-none'
                  aria-label={fill(labels.preview, { name: file.name })}
                  onClick={() => open(file)}
                >
                  {file.name}
                </button>
              ) : (
                <a
                  href={file.downloadUrl}
                  download={file.name}
                  className='min-w-0 truncate hover:underline'
                >
                  {file.name}
                </a>
              )}
              <span className='shrink-0 text-xs text-muted-foreground tabular-nums'>
                {bytes(file.size, locale)}
              </span>
              <Button
                variant='ghost'
                size='icon-xs'
                className='shrink-0 text-muted-foreground'
                aria-label={fill(labels.download, { name: file.name })}
                render={<a href={file.downloadUrl} download={file.name} />}
                nativeButton={false}
              >
                <DownloadIcon />
              </Button>
              {removeButton(file, false)}
            </li>
          ))}
        </ul>
      ) : null}
      {shown !== null && shown >= 0 ? (
        <ImagePreview
          files={previewed}
          index={shown}
          labels={labels}
          onClose={() => setShown(null)}
        />
      ) : null}
    </div>
  );
}

/** The item's own preview: images one at a time, with stepping and a download. */
function ImagePreview({
  files,
  index: initial,
  labels,
  onClose,
}: {
  readonly files: readonly AttachmentFile[];
  readonly index: number;
  readonly labels: AttachmentLabels;
  readonly onClose: () => void;
}): ReactElement | null {
  const [index, setIndex] = useState(initial);
  const file = files[index];
  if (!file) return null;
  const step = (by: number): void =>
    setIndex((value) => (value + by + files.length) % files.length);
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className='flex max-h-[calc(100dvh-2rem)] max-w-[calc(100%-2rem)] flex-col gap-3 sm:max-w-4xl'>
        <div className='flex min-w-0 items-center gap-2 pr-8'>
          <DialogTitle className='min-w-0 flex-1 truncate'>
            {file.name}
          </DialogTitle>
          {files.length > 1 ? (
            <>
              <Button
                variant='ghost'
                size='icon-sm'
                aria-label={labels.previous}
                onClick={() => step(-1)}
              >
                <ChevronLeftIcon />
              </Button>
              <Button
                variant='ghost'
                size='icon-sm'
                aria-label={labels.next}
                onClick={() => step(1)}
              >
                <ChevronRightIcon />
              </Button>
            </>
          ) : null}
          <Button
            variant='ghost'
            size='icon-sm'
            aria-label={fill(labels.download, { name: file.name })}
            render={<a href={file.downloadUrl} download={file.name} />}
            nativeButton={false}
          >
            <DownloadIcon />
          </Button>
        </div>
        <div className='flex min-h-0 flex-1 items-center justify-center overflow-auto'>
          <img
            src={file.url}
            alt={file.name}
            className='max-h-[75dvh] max-w-full object-contain'
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** A file being added: its name while it uploads, then a chip that can be taken back. */
export interface PendingAttachment {
  readonly key: string;
  readonly name: string;
  readonly size: number;
  /** Uploaded: its thumbnail when it is an image. */
  readonly done: boolean;
  readonly thumbnailUrl?: string | null;
}

/** The files added to a message before it is sent. */
export function PendingAttachments({
  files,
  onRemove,
  locale,
  labels = defaultLabels,
}: {
  readonly files: readonly PendingAttachment[];
  readonly onRemove: (key: string) => void;
  readonly locale?: string;
  readonly labels?: AttachmentLabels;
}): ReactElement | null {
  if (files.length === 0) return null;
  return (
    <ul
      className='flex min-w-0 flex-wrap gap-2'
      aria-label={labels.pending}
      data-testid='pending-attachments'
    >
      {files.map((file) => (
        <li
          key={file.key}
          className='flex max-w-full min-w-0 items-center gap-1.5 rounded-md border bg-background py-1 pr-1 pl-2 text-sm'
        >
          {file.done && file.thumbnailUrl ? (
            <img
              src={file.thumbnailUrl}
              alt=''
              className='size-5 shrink-0 rounded-sm object-cover'
            />
          ) : file.done ? (
            <FileIcon
              className='size-3.5 shrink-0 text-muted-foreground'
              aria-hidden='true'
            />
          ) : (
            <Loader2Icon
              className='size-3.5 shrink-0 animate-spin'
              aria-label={fill(labels.uploading, { name: file.name })}
            />
          )}
          <span className='min-w-0 truncate'>{file.name}</span>
          <span className='shrink-0 text-xs text-muted-foreground tabular-nums'>
            {bytes(file.size, locale)}
          </span>
          <Button
            variant='ghost'
            size='icon-xs'
            aria-label={fill(labels.remove, { name: file.name })}
            onClick={() => onRemove(file.key)}
          >
            <XIcon />
          </Button>
        </li>
      ))}
    </ul>
  );
}

export interface AttachmentPanelProps extends Omit<
  AttachmentListProps,
  'onRemove' | 'className'
> {
  /** Takes picked, pasted or dropped files; without it, the panel only lists. Nothing renders without files then. */
  readonly onUpload?: (files: readonly File[]) => void;
  /** The names of the files uploading now. */
  readonly uploading?: readonly string[];
  /** Under the title, such as the size limit. */
  readonly hint?: string;
  /** Removes a file after the item confirmed it. */
  readonly onRemove?: (file: AttachmentFile) => Promise<void>;
  readonly className?: string;
}

/**
 * A record's own files as a section: "Upload", or paste and drop while it has focus; removing asks first. Without
 * files it is one compact row.
 */
export function AttachmentPanel({
  files,
  onUpload,
  uploading = [],
  hint,
  onRemove,
  labels = defaultLabels,
  className,
  ...list
}: AttachmentPanelProps): ReactElement | null {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [removing, setRemoving] = useState<AttachmentFile | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  if (files.length === 0 && !onUpload) return null;
  const empty = files.length === 0;
  const status =
    uploading.length > 0
      ? fill(labels.uploading, { name: uploading[0] ?? '' })
      : hint;

  const dropHandlers = onUpload
    ? {
        onDragOver: (event: DragEvent) => {
          if (!event.dataTransfer.types.includes('Files')) return;
          event.preventDefault();
          setDragging(true);
        },
        onDragLeave: () => setDragging(false),
        onDrop: (event: DragEvent) => {
          setDragging(false);
          if (event.dataTransfer.files.length === 0) return;
          event.preventDefault();
          onUpload([...event.dataTransfer.files]);
        },
        onPaste: (event: ClipboardEvent) => {
          const pasted = [...event.clipboardData.files];
          if (pasted.length === 0) return;
          event.preventDefault();
          onUpload(pasted);
        },
      }
    : {};

  const uploadButton = onUpload ? (
    <>
      <Button
        variant='ghost'
        size='sm'
        disabled={uploading.length > 0}
        onClick={() => inputRef.current?.click()}
      >
        {uploading.length > 0 ? (
          <Loader2Icon data-icon='inline-start' className='animate-spin' />
        ) : (
          <UploadIcon data-icon='inline-start' />
        )}
        {labels.upload}
      </Button>
      <input
        ref={inputRef}
        type='file'
        multiple
        hidden
        data-testid='attachment-file-input'
        onChange={(event) => {
          onUpload([...(event.target.files ?? [])]);
          event.target.value = '';
        }}
      />
    </>
  ) : null;

  return (
    <section
      aria-label={labels.title}
      tabIndex={onUpload ? 0 : undefined}
      className={cn(
        'rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring',
        empty
          ? 'flex flex-wrap items-center justify-between gap-2 border border-dashed px-4 py-2'
          : 'space-y-3 border bg-card p-4 text-card-foreground',
        dragging && 'border-primary bg-primary/5',
        className,
      )}
      data-slot='attachment-panel'
      {...dropHandlers}
    >
      {empty ? (
        <>
          <div className='flex min-w-0 items-center gap-2 text-sm text-muted-foreground'>
            <PaperclipIcon className='size-4 shrink-0' aria-hidden='true' />
            <h2 className='font-medium'>{labels.title}</h2>
            {status ? (
              <span className='hidden truncate sm:inline'>{status}</span>
            ) : null}
          </div>
          {uploadButton}
        </>
      ) : (
        <>
          <div className='flex items-start justify-between gap-2'>
            <div className='min-w-0'>
              <h2 className='flex items-center gap-2 text-sm font-semibold'>
                {labels.title}
                <span className='text-xs font-normal text-muted-foreground tabular-nums'>
                  {files.length}
                </span>
              </h2>
              {status ? (
                <p className='text-xs text-muted-foreground'>{status}</p>
              ) : null}
            </div>
            {uploadButton}
          </div>
          <AttachmentList
            files={files}
            labels={labels}
            removingId={busyId}
            {...list}
            {...(onRemove ? { onRemove: setRemoving } : {})}
          />
        </>
      )}
      <AlertDialog
        open={removing !== null}
        onOpenChange={(open) => {
          if (!open) setRemoving(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{labels.removeTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {fill(labels.removeDescription, { name: removing?.name ?? '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busyId !== null}>
              {labels.cancel}
            </AlertDialogCancel>
            <AlertDialogAction
              variant='destructive'
              disabled={busyId !== null}
              onClick={() => {
                if (!removing || !onRemove) return;
                setBusyId(removing.id);
                void onRemove(removing)
                  .then(() => setRemoving(null))
                  .catch(() => undefined)
                  .finally(() => setBusyId(null));
              }}
            >
              {labels.removeConfirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
