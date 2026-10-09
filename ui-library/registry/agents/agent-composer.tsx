/**
 * The message box for talking to an agent: the page context as removable chips inside it, Enter to send and
 * Shift+Enter for a new line, and a toolbar slot beside the send button for pickers such as the model or the mode.
 * While the agent works (`running`) an empty box turns the send button into "Stop". Presentational: what the next
 * message carries (`context`), a draft to fill in (`draft`) and who may focus it (`registerFocus`) are optional props
 * the page wires; every word comes from `labels`, English by default.
 *
 * With `attachments`, files go with the message too: from the attach button, pasted (a screenshot) or dropped on the
 * box, or on the view around it through `registerAdd`. Each is uploaded as soon as it is added and shows above the
 * text, an image as a thumbnail and anything else as a chip, until it is removed or sent. A file over the size limit
 * or one that failed to upload is marked and keeps the message from being sent; a message sent while files upload
 * goes once they are done.
 */
import {
  filterText,
  selectionPreview,
  type ChatContextChip,
} from '@nocobase/app-plugin-agents/client/chat';
import {
  CHAT_ATTACHMENT_SIZE_MAX,
  CHAT_ATTACHMENTS_PER_MESSAGE_MAX,
  MESSAGE_CONTENT_MAX,
  type MessageAttachment,
  type PageContext,
} from '@nocobase/app-plugin-agents/shared/conversations';
import {
  ArrowUpIcon,
  FileIcon,
  FilterIcon,
  PaperclipIcon,
  PinIcon,
  QuoteIcon,
  SquareDashedMousePointerIcon,
  SquareIcon,
  TriangleAlertIcon,
  XIcon,
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type DragEvent,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
} from 'react';

import { Badge } from '#components/ui/badge';
import { Button } from '#components/ui/button';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupTextarea,
} from '#components/ui/input-group';
import { Spinner } from '#components/ui/spinner';
import { cn } from 'cn';

export interface AgentComposerLabels {
  /** The box's accessible name. */
  readonly label: string;
  readonly placeholder: string;
  /** Beside the send button while idle, where there is room. */
  readonly hint: string;
  /** Beside the send button while the agent works. */
  readonly runningHint: string;
  /** `{max}` is the longest message allowed. */
  readonly tooLong: string;
  readonly send: string;
  readonly stop: string;
  readonly stopping: string;
  /** The chips' accessible name. */
  readonly contextLabel: string;
  /** `{filter}` is the filter's text. */
  readonly contextFilter: string;
  /** `{text}` is the start of the selected text. */
  readonly contextSelection: string;
  /** A chip's remove button; `{label}` is the chip's text. */
  readonly contextRemove: string;
  /** The attach button. */
  readonly attach: string;
  /** The files' accessible name. */
  readonly attachmentsLabel: string;
  /** A file's remove button; `{name}` is its name. */
  readonly attachmentRemove: string;
  readonly attachmentUploading: string;
  /** `{max}` is the size limit, such as `20 MB`. */
  readonly attachmentTooLarge: string;
  readonly attachmentFailed: string;
  /** `{max}` is the number of files a message may carry. */
  readonly attachmentsTooMany: string;
  /** Why the message cannot be sent while a file is marked. */
  readonly attachmentsBlocked: string;
  /** Beside the send button while a message waits for its files. */
  readonly attachmentsWaiting: string;
}

const defaultAgentComposerLabels: AgentComposerLabels = {
  label: 'Message to the agent',
  placeholder: 'Ask, or describe the work to organize…',
  hint: 'Enter to send, Shift+Enter for a new line',
  runningHint: 'Messages you send now join the work in progress',
  tooLong: 'At most {max} characters.',
  send: 'Send',
  stop: 'Stop',
  stopping: 'Stopping…',
  contextLabel: 'Context the next message carries',
  contextFilter: 'Filter: {filter}',
  contextSelection: 'Selected text: “{text}”',
  contextRemove: 'Remove context: {label}',
  attach: 'Attach files',
  attachmentsLabel: 'Files the next message carries',
  attachmentRemove: 'Remove {name}',
  attachmentUploading: 'Uploading…',
  attachmentTooLarge: 'Larger than {max}',
  attachmentFailed: 'Could not upload',
  attachmentsTooMany: 'At most {max} files per message.',
  attachmentsBlocked: 'Remove the files that could not be uploaded to send.',
  attachmentsWaiting: 'Sending once the files are uploaded…',
};

/** `20 MB`, `512 KB`, `12 B`. */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  const mb = bytes / (1024 * 1024);
  return `${mb >= 10 ? Math.round(mb) : Math.round(mb * 10) / 10} MB`;
}

/** Sending files with a message: how each is uploaded, and the limits. */
export interface AgentComposerAttachments {
  /** Uploads one file as it is added; `signal` aborts it when the file is removed first. */
  upload(file: File, signal: AbortSignal): Promise<MessageAttachment>;
  /** An uploaded file removed before sending, or left when the box goes away. */
  discard?(attachment: MessageAttachment): void;
  /** Files per message; `CHAT_ATTACHMENTS_PER_MESSAGE_MAX` by default. */
  readonly maxCount?: number;
  /** Bytes per file; `CHAT_ATTACHMENT_SIZE_MAX` by default. */
  readonly maxSize?: number;
  /** Receives the function that adds files (dropped on the view around the box); returns what undoes it. */
  readonly registerAdd?: (add: (files: readonly File[]) => void) => () => void;
}

/** A file in the box: uploading, uploaded, or marked. */
interface ComposerFile {
  readonly key: string;
  readonly file: File;
  /** An object URL of an image, for its thumbnail. */
  readonly preview: string | null;
  readonly status: 'uploading' | 'done' | 'tooLarge' | 'failed';
  readonly attachment: MessageAttachment | null;
  readonly controller: AbortController | null;
}

const IMAGE_TYPES = /^image\/(png|jpeg|gif|webp|avif)$/u;

let fileKeys = 0;

/** The files of a paste or a drop. */
function filesOf(list: FileList | null | undefined): File[] {
  return list ? Array.from(list) : [];
}

function format(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? (values[key] ?? match) : match,
  );
}

/** What the next message carries: chips to show and remove, and the context to send with it. */
export interface AgentComposerContext {
  readonly chips: readonly ChatContextChip[];
  readonly onRemove: (key: string) => void;
  /** The context a message sent now carries; called on send. */
  readonly build: () => PageContext | undefined;
}

/** Text put in the box from elsewhere, such as an "Ask agent" button; each new `nonce` fills it once. */
export interface AgentComposerDraft {
  readonly nonce: number;
  readonly text: string;
}

export interface AgentComposerProps {
  /** A run is open: the agent is working or waiting for a runner. */
  readonly running?: boolean;
  readonly stopping?: boolean;
  /** A message is on its way: the send button shows a spinner. */
  readonly sending?: boolean;
  /** Nothing may be sent now, such as while no agent is chosen; the box stays editable. */
  readonly disabled?: boolean;
  /** Above the box, such as why the agent cannot answer. */
  readonly notice?: ReactNode;
  /** Beside the send button, such as the model or the mode. */
  readonly toolbar?: ReactNode;
  readonly placeholder?: string;
  /**
   * Called with the text, the context and the uploaded files; true (or a promise of true) when the message was taken,
   * which empties the box.
   */
  readonly onSend: (
    content: string,
    context: PageContext | undefined,
    attachments: readonly MessageAttachment[],
  ) => boolean | Promise<boolean>;
  readonly onStop?: () => void;
  /** Both forms are one bordered field holding the chips, the text, the toolbar and a round send button; `page` is roomier. */
  readonly variant?: 'panel' | 'page';
  readonly context?: AgentComposerContext;
  /** Files sent with the message: the attach button, paste and drop. Text only without it. */
  readonly attachments?: AgentComposerAttachments;
  readonly draft?: AgentComposerDraft | null;
  /** Receives a function that focuses the box; returns what undoes the registration. */
  readonly registerFocus?: (focus: () => void) => () => void;
  /** The longest message, in characters. */
  readonly maxLength?: number;
  readonly labels?: Partial<AgentComposerLabels>;
  readonly className?: string;
  /** The text box's own classes, such as a taller `min-h-*` where the box is the page's main content. */
  readonly inputClassName?: string;
}

function ChipIcon({ chip }: { readonly chip: ChatContextChip }): ReactElement {
  if (chip.kind === 'filter') return <FilterIcon aria-hidden='true' />;
  if (chip.kind === 'selection') return <QuoteIcon aria-hidden='true' />;
  return chip.pinned ? (
    <PinIcon aria-hidden='true' />
  ) : (
    <SquareDashedMousePointerIcon aria-hidden='true' />
  );
}

export interface ComposerContextChipsProps {
  readonly chips: readonly ChatContextChip[];
  readonly onRemove: (key: string) => void;
  readonly labels?: Partial<AgentComposerLabels>;
}

/** What the next message carries; each chip holds its own remove button. */
export function ComposerContextChips({
  chips,
  onRemove,
  labels,
}: ComposerContextChipsProps): ReactElement | null {
  const words = labels
    ? { ...defaultAgentComposerLabels, ...labels }
    : defaultAgentComposerLabels;
  if (chips.length === 0) return null;
  const text = (chip: ChatContextChip): string =>
    chip.kind === 'item'
      ? chip.item.label
      : chip.kind === 'filter'
        ? format(words.contextFilter, {
            filter: chip.filter.label ?? filterText(chip.filter),
          })
        : format(words.contextSelection, {
            text: selectionPreview(chip.selection.text),
          });
  return (
    <ul
      className='flex w-full min-w-0 flex-wrap items-center gap-1'
      aria-label={words.contextLabel}
      data-testid='chat-context-chips'
    >
      {chips.map((chip) => {
        const label = text(chip);
        const pinned = chip.kind === 'item' && chip.pinned;
        return (
          <li
            key={chip.key}
            // At most half a row each, so a narrow panel still sets two side by side; the last takes what it needs.
            className='flex max-w-[min(15rem,calc(50%-0.125rem))] min-w-0 last:max-w-60'
            data-chip={chip.key}
          >
            <Badge
              variant='secondary'
              data-tone={pinned ? 'blue' : 'grey'}
              className={cn(
                'h-6 max-w-full min-w-0 shrink gap-1 pr-0.5 pl-1.5 font-normal [&>svg]:size-3 [&>svg]:shrink-0',
                pinned
                  ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300'
                  : 'bg-muted text-muted-foreground',
              )}
              title={chip.kind === 'selection' ? chip.selection.text : label}
            >
              <ChipIcon chip={chip} />
              <span className='min-w-0 truncate'>{label}</span>
              <Button
                variant='ghost'
                size='icon-xs'
                className='size-4.5 shrink-0 rounded-full text-current opacity-70 hover:bg-foreground/10 hover:text-current hover:opacity-100'
                aria-label={format(words.contextRemove, { label })}
                onClick={() => onRemove(chip.key)}
              >
                <XIcon className='size-3' />
              </Button>
            </Badge>
          </li>
        );
      })}
    </ul>
  );
}

export interface ComposerFilesProps {
  readonly files: readonly ComposerFileView[];
  readonly onRemove: (key: string) => void;
  readonly labels?: Partial<AgentComposerLabels>;
}

/** A file in the box as `ComposerFiles` shows it. */
export interface ComposerFileView {
  readonly key: string;
  readonly name: string;
  readonly size: number;
  /** An image's thumbnail URL; null shows a file chip. */
  readonly preview: string | null;
  readonly status: 'uploading' | 'done' | 'tooLarge' | 'failed';
  /** The size limit, for a file over it. */
  readonly maxSize: number;
}

/** The files the next message carries: image thumbnails and file chips, each with its own remove button. */
export function ComposerFiles({
  files,
  onRemove,
  labels,
}: ComposerFilesProps): ReactElement | null {
  const words = labels
    ? { ...defaultAgentComposerLabels, ...labels }
    : defaultAgentComposerLabels;
  if (files.length === 0) return null;
  return (
    <ul
      className='flex w-full min-w-0 flex-wrap items-start gap-1.5'
      aria-label={words.attachmentsLabel}
      data-testid='chat-composer-files'
    >
      {files.map((file) => {
        const marked = file.status === 'tooLarge' || file.status === 'failed';
        const problem =
          file.status === 'tooLarge'
            ? format(words.attachmentTooLarge, {
                max: formatFileSize(file.maxSize),
              })
            : file.status === 'failed'
              ? words.attachmentFailed
              : file.status === 'uploading'
                ? words.attachmentUploading
                : formatFileSize(file.size);
        const remove = (
          <Button
            variant='secondary'
            size='icon-xs'
            className='absolute -top-1.5 -right-1.5 size-5 rounded-full border shadow-xs'
            aria-label={format(words.attachmentRemove, { name: file.name })}
            onClick={() => onRemove(file.key)}
          >
            <XIcon className='size-3' />
          </Button>
        );
        return (
          <li
            key={file.key}
            className='relative'
            data-file-status={file.status}
            title={`${file.name} · ${problem}`}
          >
            {file.preview && !marked ? (
              <div className='relative size-14 overflow-hidden rounded-md border bg-muted'>
                <img
                  src={file.preview}
                  alt={file.name}
                  className='size-full object-cover'
                />
                {file.status === 'uploading' ? (
                  <span className='absolute inset-0 flex items-center justify-center bg-background/60'>
                    <Spinner aria-label={words.attachmentUploading} />
                  </span>
                ) : null}
              </div>
            ) : (
              <div
                className={cn(
                  'flex h-14 w-44 min-w-0 items-center gap-2 rounded-md border bg-muted/50 px-2',
                  marked && 'border-destructive/40 bg-destructive/5',
                )}
              >
                <span className='flex size-8 shrink-0 items-center justify-center rounded bg-background text-muted-foreground'>
                  {file.status === 'uploading' ? (
                    <Spinner aria-label={words.attachmentUploading} />
                  ) : marked ? (
                    <TriangleAlertIcon className='size-4 text-destructive' />
                  ) : (
                    <FileIcon className='size-4' />
                  )}
                </span>
                <span className='flex min-w-0 flex-col'>
                  <span className='truncate text-xs font-medium'>
                    {file.name}
                  </span>
                  <span
                    className={cn(
                      'truncate text-xs',
                      marked ? 'text-destructive' : 'text-muted-foreground',
                    )}
                  >
                    {problem}
                  </span>
                </span>
              </div>
            )}
            {remove}
          </li>
        );
      })}
    </ul>
  );
}

export function AgentComposer({
  running = false,
  stopping = false,
  sending = false,
  disabled = false,
  notice,
  toolbar,
  placeholder,
  onSend,
  onStop,
  variant = 'panel',
  context,
  attachments,
  draft = null,
  registerFocus,
  maxLength = MESSAGE_CONTENT_MAX,
  labels,
  className,
  inputClassName,
}: AgentComposerProps): ReactElement {
  const words = labels
    ? { ...defaultAgentComposerLabels, ...labels }
    : defaultAgentComposerLabels;
  const inputId = useId();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [content, setContent] = useState('');
  // The box registers how to focus it as it mounts, and undoes that as it unmounts.
  const attach = useCallback(
    (node: HTMLTextAreaElement | null) => {
      textareaRef.current = node;
      if (!node || !registerFocus) return undefined;
      const undo = registerFocus(() => node.focus());
      return () => {
        undo();
        textareaRef.current = null;
      };
    },
    [registerFocus],
  );

  // A draft fills the box once (while rendering), then takes the focus: an empty box, or one that still holds the
  // previous draft as it was put there; never what the person wrote.
  const [seenDraft, setSeenDraft] = useState<AgentComposerDraft | null>(null);
  if (draft && draft.nonce !== seenDraft?.nonce) {
    setSeenDraft(draft);
    if (!content.trim() || content === seenDraft?.text) setContent(draft.text);
  }
  const draftNonce = draft?.nonce;
  useEffect(() => {
    if (draftNonce !== undefined) textareaRef.current?.focus();
  }, [draftNonce]);

  // The files the next message carries; `filesRef` is what unmounting and the uploads see.
  const [files, setFiles] = useState<readonly ComposerFile[]>([]);
  const filesRef = useRef<readonly ComposerFile[]>(files);
  const [tooMany, setTooMany] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const maxCount = attachments?.maxCount ?? CHAT_ATTACHMENTS_PER_MESSAGE_MAX;
  const maxSize = attachments?.maxSize ?? CHAT_ATTACHMENT_SIZE_MAX;
  const attachmentsRef = useRef(attachments);
  // Handlers and the uploads read the box as last rendered.
  useLayoutEffect(() => {
    filesRef.current = files;
    attachmentsRef.current = attachments;
  });
  // Each upload's outcome by file key: the file, or null when it failed or was removed.
  const uploadsRef = useRef(
    new Map<string, Promise<MessageAttachment | null>>(),
  );

  const update = useCallback(
    (key: string, change: Partial<ComposerFile>): void =>
      setFiles((current) =>
        current.map((file) =>
          file.key === key ? { ...file, ...change } : file,
        ),
      ),
    [],
  );

  const addFiles = useCallback(
    (added: readonly File[]): void => {
      const source = attachmentsRef.current;
      if (!source || added.length === 0) return;
      const room = Math.max(0, maxCount - filesRef.current.length);
      setTooMany(added.length > room);
      const taken = added.slice(0, room).map((file): ComposerFile => {
        fileKeys += 1;
        const tooLarge = file.size > maxSize;
        return {
          key: `file-${fileKeys}`,
          file,
          preview:
            IMAGE_TYPES.test(file.type) &&
            typeof URL.createObjectURL === 'function'
              ? URL.createObjectURL(file)
              : null,
          status: tooLarge ? 'tooLarge' : 'uploading',
          attachment: null,
          controller: tooLarge ? null : new AbortController(),
        };
      });
      if (taken.length === 0) return;
      setFiles((current) => [...current, ...taken]);
      for (const entry of taken) {
        const { controller } = entry;
        if (!controller) continue;
        const outcome = source.upload(entry.file, controller.signal).then(
          (attachment) => {
            // Removed while it uploaded: it was never the message's.
            if (controller.signal.aborted) {
              source.discard?.(attachment);
              return null;
            }
            update(entry.key, {
              status: 'done',
              attachment,
              controller: null,
            });
            return attachment;
          },
          () => {
            if (!controller.signal.aborted)
              update(entry.key, { status: 'failed', controller: null });
            return null;
          },
        );
        uploadsRef.current.set(entry.key, outcome);
      }
    },
    [maxCount, maxSize, update],
  );

  const removeFile = useCallback((key: string): void => {
    const file = filesRef.current.find((entry) => entry.key === key);
    if (!file) return;
    file.controller?.abort();
    if (file.attachment) attachmentsRef.current?.discard?.(file.attachment);
    if (file.preview) URL.revokeObjectURL(file.preview);
    uploadsRef.current.delete(key);
    setTooMany(false);
    setFiles((current) => current.filter((entry) => entry.key !== key));
  }, []);

  // The view around the box adds what is dropped on it.
  const registerAdd = attachments?.registerAdd;
  useEffect(() => registerAdd?.(addFiles), [registerAdd, addFiles]);

  // Leaving: uploads stop, files never sent are discarded, thumbnails freed.
  useEffect(
    () => () => {
      for (const file of filesRef.current) {
        file.controller?.abort();
        if (file.attachment) attachmentsRef.current?.discard?.(file.attachment);
        if (file.preview) URL.revokeObjectURL(file.preview);
      }
    },
    [],
  );

  const length = [...content].length;
  const tooLong = length > maxLength;
  const empty = content.trim() === '';
  const uploading = files.some((file) => file.status === 'uploading');
  const blocked = files.some(
    (file) => file.status === 'tooLarge' || file.status === 'failed',
  );
  const canSend =
    (!empty || files.length > 0) &&
    !tooLong &&
    !blocked &&
    !disabled &&
    !sending &&
    !waiting;
  const showStop =
    running && empty && files.length === 0 && onStop !== undefined;

  function submit(): void {
    if (!canSend) return;
    const carried = filesRef.current;
    if (!uploading) {
      send(
        carried.flatMap((file) => (file.attachment ? [file.attachment] : [])),
        carried,
      );
      return;
    }
    // The files are not all uploaded yet: the message goes once they are, and stays in the box when one failed.
    setWaiting(true);
    void Promise.all(
      carried.map((file) =>
        file.attachment
          ? Promise.resolve(file.attachment)
          : (uploadsRef.current.get(file.key) ?? Promise.resolve(null)),
      ),
    ).then((uploaded) => {
      setWaiting(false);
      if (uploaded.every((file) => file !== null)) send(uploaded, carried);
    });
  }

  function send(
    uploaded: readonly MessageAttachment[],
    carried: readonly ComposerFile[],
  ): void {
    const sent = content;
    const taken = onSend(sent, context?.build(), uploaded);
    const clear = (): void => {
      for (const file of carried) {
        if (file.preview) URL.revokeObjectURL(file.preview);
        uploadsRef.current.delete(file.key);
      }
      const sentKeys = new Set(carried.map((file) => file.key));
      setFiles((current) => current.filter((file) => !sentKeys.has(file.key)));
      setTooMany(false);
    };
    if (taken === true) {
      setContent('');
      clear();
    } else if (taken !== false)
      void taken.then(
        (ok) => {
          if (!ok) return;
          setContent((current) => (current === sent ? '' : current));
          clear();
        },
        () => undefined,
      );
  }

  function onPaste(event: ClipboardEvent<HTMLTextAreaElement>): void {
    if (!attachments) return;
    const pasted = filesOf(event.clipboardData.files);
    if (pasted.length === 0) return;
    // A screenshot comes alone; text copied with a picture still pastes as text.
    if (!event.clipboardData.getData('text/plain')) event.preventDefault();
    addFiles(pasted);
  }

  function onDragOver(event: DragEvent<HTMLDivElement>): void {
    if (!attachments || !event.dataTransfer.types.includes('Files')) return;
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = 'copy';
  }

  function onDrop(event: DragEvent<HTMLDivElement>): void {
    if (!attachments || !event.dataTransfer.types.includes('Files')) return;
    event.preventDefault();
    event.stopPropagation();
    addFiles(filesOf(event.dataTransfer.files));
  }

  const fileInputRef = useRef<HTMLInputElement>(null);

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>): void {
    if (
      event.key === 'Enter' &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing &&
      !event.altKey
    ) {
      event.preventDefault();
      submit();
    }
  }

  const chips = context?.chips.length ? (
    <ComposerContextChips
      chips={context.chips}
      onRemove={context.onRemove}
      labels={words}
    />
  ) : null;
  const fileChips = files.length ? (
    <ComposerFiles
      files={files.map((file) => ({
        key: file.key,
        name: file.file.name,
        size: file.file.size,
        preview: file.preview,
        status: file.status,
        maxSize,
      }))}
      onRemove={removeFile}
      labels={words}
    />
  ) : null;
  const fileNote =
    tooMany || blocked ? (
      <p className='text-xs text-destructive' role='alert'>
        {tooMany
          ? format(words.attachmentsTooMany, { max: String(maxCount) })
          : words.attachmentsBlocked}
      </p>
    ) : null;
  const attachButton = attachments ? (
    <>
      <input
        ref={fileInputRef}
        type='file'
        multiple
        className='sr-only'
        tabIndex={-1}
        aria-hidden='true'
        data-testid='chat-attach-input'
        onChange={(event) => {
          addFiles(filesOf(event.target.files));
          event.target.value = '';
        }}
      />
      <Button
        variant='ghost'
        size='icon-sm'
        className='shrink-0 rounded-full text-muted-foreground'
        aria-label={words.attach}
        title={words.attach}
        disabled={files.length >= maxCount}
        onClick={() => fileInputRef.current?.click()}
        data-testid='chat-attach'
      >
        <PaperclipIcon />
      </Button>
    </>
  ) : null;
  const tooLongNote = tooLong ? (
    <p className='text-xs text-destructive'>
      {format(words.tooLong, { max: String(maxLength) })}
    </p>
  ) : null;
  const label = (
    <label htmlFor={inputId} className='sr-only'>
      {words.label}
    </label>
  );
  const stopLabel = stopping ? words.stopping : words.stop;
  // Icon-only and round in both forms, so the toolbar keeps its room; the name is the accessible label.
  const action = showStop ? (
    <Button
      size='icon'
      variant='outline'
      className='shrink-0 rounded-full'
      disabled={stopping}
      onClick={onStop}
      aria-label={stopLabel}
      title={stopLabel}
      data-testid='chat-stop'
    >
      {stopping ? <Spinner /> : <SquareIcon className='size-3 fill-current' />}
    </Button>
  ) : (
    <Button
      size='icon'
      className='shrink-0 rounded-full disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100'
      disabled={!canSend}
      onClick={submit}
      aria-label={words.send}
      title={words.send}
      data-testid='chat-send'
    >
      {sending || waiting ? <Spinner /> : <ArrowUpIcon />}
    </Button>
  );

  const page = variant === 'page';
  // The panel's hint shows only where it fits on one line; the page form names only the work in progress.
  const hint = waiting
    ? words.attachmentsWaiting
    : running
      ? words.runningHint
      : page
        ? null
        : words.hint;

  return (
    <div
      className={cn('@container space-y-2', className)}
      data-testid='chat-composer'
      // A floating launcher never covers the box (the agent chat's `floating-clearance.ts`).
      data-floating-avoid=''
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {notice ?? null}
      {label}
      {/* One bordered field holds the chips, the text, and the toolbar row with the send button. */}
      <InputGroup
        className={cn(
          // The send button is disabled while the box is empty; the field itself stays enabled.
          'bg-card has-disabled:bg-card has-disabled:opacity-100 dark:bg-card dark:has-disabled:bg-card',
          page ? 'rounded-2xl shadow-sm' : 'rounded-xl shadow-xs',
        )}
      >
        {chips || fileChips ? (
          <InputGroupAddon
            align='block-start'
            className={cn(
              'min-w-0 flex-col items-start gap-2 font-normal',
              page ? 'px-3 pt-3' : 'px-2 pt-2',
            )}
          >
            {fileChips}
            {chips}
          </InputGroupAddon>
        ) : null}
        <InputGroupTextarea
          id={inputId}
          ref={attach}
          value={content}
          rows={2}
          className={cn(
            'min-h-14',
            page ? 'max-h-60 px-4 pt-3' : 'max-h-48 px-3 pt-2.5',
            inputClassName,
          )}
          placeholder={placeholder ?? words.placeholder}
          aria-invalid={tooLong ? true : undefined}
          onChange={(event) => setContent(event.target.value)}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
        />
        <InputGroupAddon
          align='block-end'
          className={cn(
            'min-w-0 gap-1.5 font-normal',
            page ? 'px-3 pb-3' : 'px-2 pb-2',
          )}
        >
          {attachButton}
          {toolbar ?? null}
          <p
            className={cn(
              'min-w-0 flex-1 truncate text-xs text-muted-foreground',
              !page && 'hidden @md:block',
            )}
          >
            {hint}
          </p>
          <span className='ml-auto shrink-0'>{action}</span>
        </InputGroupAddon>
      </InputGroup>
      {tooLongNote}
      {fileNote}
    </div>
  );
}
