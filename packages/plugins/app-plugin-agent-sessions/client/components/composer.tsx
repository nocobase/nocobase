/**
 * Where a person writes to the agent. Enter sends, Shift+Enter breaks the line, and while the agent is answering a
 * message waits for the turn to end unless sent with ⌘↩ (Ctrl+Enter), which stops the turn first. Pasted, dropped or
 * picked images go with the message. A message that starts with `/` offers the agent's own commands, and `#` offers
 * what the message can mention, such as an issue, which then goes with it.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { cn } from 'cn';
import {
  ArrowUpIcon,
  HashIcon,
  ImageIcon,
  Maximize2Icon,
  Minimize2Icon,
  SlashSquareIcon,
  XIcon,
} from 'lucide-react';
import {
  Fragment,
  useLayoutEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type DragEvent,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
} from 'react';

import type { PromptContent, Reference } from '../../shared/api.js';
import { useMentions, type Mention } from '../api.js';
import { StatusPill } from './status-pill.js';

type Image = Extract<PromptContent, { type: 'image' }>;
/** An image waiting to be sent, with a key of its own for the list. */
type Pending = Image & { readonly id: string };

export interface ComposerProps {
  readonly placeholder: string;
  readonly disabled?: boolean;
  /** The agent is answering: Enter queues the message, ⌘↩ interrupts. */
  readonly busy?: boolean;
  readonly sending?: boolean;
  readonly commands?: readonly {
    readonly name: string;
    readonly description: string;
  }[];
  /** Offers `#` mentions, those of this project first; left out, `#` is plain text. */
  readonly mentions?: { readonly projectId: string | null };
  /** Above the message, such as where a new session runs. */
  readonly header?: ReactNode;
  /** The agent's choices, beside the attachments. */
  readonly toolbar?: ReactNode;
  /** Before the send button, such as how full the context is. */
  readonly trailing?: ReactNode;
  /** A taller box, for a session's first message. */
  readonly large?: boolean;
  /** A session's reply box starts at one line on a phone, with optional expansion. */
  readonly compact?: boolean;
  /** The keys it takes, under the box. */
  readonly hints?: boolean;
  readonly autoFocus?: boolean;
  readonly onSend: (
    content: PromptContent[],
    interrupt: boolean,
    mentions: Mention[],
  ) => Promise<void> | void;
}

/** One entry of the list under `/` or `#`. */
interface Suggestion {
  readonly id: string;
  readonly label: ReactNode;
  readonly detail: ReactNode;
  /** The text that replaces what was typed after `/` or `#`. */
  readonly insert: string;
  readonly mention?: Reference;
}

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MOD_KEY =
  typeof navigator !== 'undefined' &&
  /Mac|iPhone|iPad/u.test(navigator.userAgent)
    ? '⌘'
    : 'Ctrl';

/** How a mention reads in the message. */
const mentionText = (reference: Reference): string =>
  `#${reference.key ?? reference.title}`;

export function Composer({
  placeholder,
  disabled,
  busy,
  sending,
  commands = [],
  mentions,
  header,
  toolbar,
  trailing,
  large,
  compact,
  hints,
  autoFocus,
  onSend,
}: ComposerProps): ReactElement {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [caret, setCaret] = useState(0);
  const [images, setImages] = useState<Pending[]>([]);
  const [mentioned, setMentioned] = useState<Reference[]>([]);
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const filesRef = useRef<HTMLInputElement>(null);
  useLayoutEffect(() => {
    const input = inputRef.current;
    if (!compact || !input) return;
    // Keep multiline editing usable in browsers without field-sizing support.
    input.style.height = 'auto';
    input.style.height = `${input.scrollHeight}px`;
  }, [compact, text, expanded]);

  const slash = /^\/(\S*)$/u.exec(text)?.[1];
  // The `#word` right before the caret, while it is being typed.
  const hash = mentions
    ? /(?:^|\s)#([^\s#]*)$/u.exec(text.slice(0, caret))
    : null;
  const found = useMentions(hash?.[1], mentions?.projectId ?? null);
  const suggestions: Suggestion[] =
    slash !== undefined
      ? commands
          .filter((command) => command.name.startsWith(slash))
          .slice(0, 8)
          .map((command) => ({
            id: command.name,
            label: <code className='text-xs'>/{command.name}</code>,
            detail: command.description,
            insert: `/${command.name} `,
          }))
      : hash
        ? (found.data ?? []).map((reference) => ({
            id: `${reference.kind}:${reference.refId}`,
            label: (
              <span className='flex min-w-0 items-center gap-2'>
                {reference.key && (
                  <code className='text-muted-foreground shrink-0 text-[11px]'>
                    {reference.key}
                  </code>
                )}
                <span className='truncate text-[13px]'>{reference.title}</span>
              </span>
            ),
            detail: (
              <span className='flex items-center gap-2'>
                {reference.group}
                {reference.status && <StatusPill status={reference.status} />}
              </span>
            ),
            insert: `${mentionText(reference)} `,
            mention: reference,
          }))
        : [];
  const empty = !text.trim() && images.length === 0;

  const type = (next: string, at: number): void => {
    setText(next);
    setCaret(at);
    setHighlight(0);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(at, at);
    });
  };

  const choose = (suggestion: Suggestion): void => {
    if (suggestion.mention) {
      const start = caret - (hash?.[1].length ?? 0) - 1;
      const reference = suggestion.mention;
      setMentioned((current) => [
        ...current.filter((other) => other.refId !== reference.refId),
        reference,
      ]);
      type(
        `${text.slice(0, start)}${suggestion.insert}${text.slice(caret)}`,
        start + suggestion.insert.length,
      );
    } else {
      type(suggestion.insert, suggestion.insert.length);
    }
  };

  /** Types `mark` at the caret, such as `#` to start a mention. */
  const insert = (mark: string): void => {
    const at = inputRef.current?.selectionStart ?? text.length;
    const before = text.slice(0, at);
    const lead = before && !/\s$/u.test(before) ? ' ' : '';
    type(
      `${before}${lead}${mark}${text.slice(at)}`,
      at + lead.length + mark.length,
    );
  };

  const send = async (interrupt: boolean): Promise<void> => {
    if (empty || disabled || sending) return;
    const content: PromptContent[] = [
      ...(text.trim() ? [{ type: 'text' as const, text: text.trim() }] : []),
      ...images.map(({ mimeType, data }) => ({
        type: 'image' as const,
        mimeType,
        data,
      })),
    ];
    // What was mentioned and is still in the message.
    const kept = mentioned
      .filter((reference) => text.includes(mentionText(reference)))
      .map(({ kind, refId }) => ({ kind, refId }));
    try {
      await onSend(content, interrupt, kept);
    } catch {
      // The caller said what went wrong; the draft stays for another try.
      return;
    }
    setText('');
    setCaret(0);
    setImages([]);
    setMentioned([]);
  };

  const addFiles = async (list: Iterable<File>): Promise<void> => {
    const read = await Promise.all(
      [...list]
        .filter(
          (file) =>
            file.type.startsWith('image/') && file.size <= MAX_IMAGE_BYTES,
        )
        .map(async (file): Promise<Pending> => ({
          id: crypto.randomUUID(),
          type: 'image',
          mimeType: file.type,
          data: await base64(file),
        })),
    );
    if (read.length > 0)
      setImages((current) => [...current, ...read].slice(0, 10));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>): void => {
    if (event.nativeEvent.isComposing) return;
    if (suggestions.length > 0) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        setHighlight(
          (index) =>
            (index +
              (event.key === 'ArrowDown' ? 1 : -1) +
              suggestions.length) %
            suggestions.length,
        );
        return;
      }
      if (event.key === 'Tab' || (event.key === 'Enter' && !event.shiftKey)) {
        event.preventDefault();
        choose(suggestions[Math.min(highlight, suggestions.length - 1)]);
        return;
      }
    }
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void send(event.metaKey || event.ctrlKey);
    }
  };

  const onPaste = (event: ClipboardEvent): void => {
    if (event.clipboardData.files.length === 0) return;
    event.preventDefault();
    void addFiles(event.clipboardData.files);
  };

  const onDrop = (event: DragEvent): void => {
    if (event.dataTransfer.files.length === 0) return;
    event.preventDefault();
    void addFiles(event.dataTransfer.files);
  };

  const keys: readonly [readonly string[], string][] = [
    [['Enter'], busy ? t('composer.keys.queue') : t('composer.keys.send')],
    [['Shift', 'Enter'], t('composer.keys.newline')],
    [[MOD_KEY, 'Enter'], t('composer.keys.interrupt')],
  ];

  return (
    <div className='relative'>
      {suggestions.length > 0 && (
        <ul
          role='listbox'
          aria-label={hash ? t('composer.mentions') : t('composer.commands')}
          className={cn(
            'bg-popover absolute right-0 left-0 z-10 max-h-72 overflow-y-auto rounded-lg border p-1 shadow-md',
            // A first message sits high on its page, so its list opens downwards.
            large ? 'top-full mt-2' : 'bottom-full mb-2',
          )}
        >
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion.id}
              role='option'
              aria-selected={index === highlight}
            >
              <button
                type='button'
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(suggestion)}
                className={cn(
                  'flex w-full min-w-0 flex-col items-start gap-0.5 rounded-md px-2.5 py-1.5 text-left',
                  index === highlight ? 'bg-muted' : 'hover:bg-muted',
                )}
              >
                {suggestion.label}
                <span className='text-muted-foreground line-clamp-1 text-xs'>
                  {suggestion.detail}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <div
        className={cn(
          'bg-card focus-within:border-primary flex flex-col rounded-[10px] border shadow-xs transition-colors',
          compact &&
            'max-md:max-h-[calc(var(--agent-session-height,100dvh)*0.55)] max-md:overflow-y-auto max-md:overscroll-y-contain',
          disabled && 'opacity-60',
        )}
        onDragOver={(event) => event.preventDefault()}
        onDrop={onDrop}
      >
        {header && (
          <div className='flex min-w-0 flex-wrap items-center gap-2 px-3 pt-3'>
            {header}
          </div>
        )}
        {images.length > 0 && (
          <div
            className={cn(
              'flex gap-2 px-3.5 pt-3',
              compact
                ? 'max-md:max-h-20 max-md:flex-nowrap max-md:overflow-x-auto md:flex-wrap'
                : 'flex-wrap',
            )}
          >
            {images.map((image) => (
              <div key={image.id} className='relative'>
                <img
                  src={`data:${image.mimeType};base64,${image.data}`}
                  alt=''
                  className='size-16 rounded-md border object-cover'
                />
                <button
                  type='button'
                  aria-label={t('composer.removeImage')}
                  onClick={() =>
                    setImages((current) =>
                      current.filter((other) => other.id !== image.id),
                    )
                  }
                  className='bg-card text-muted-foreground hover:text-foreground absolute -top-1.5 -right-1.5 rounded-full border p-0.5'
                >
                  <XIcon className='size-3.5' />
                </button>
              </div>
            ))}
          </div>
        )}
        <textarea
          ref={inputRef}
          value={text}
          rows={large ? 4 : compact ? 1 : 2}
          autoFocus={autoFocus}
          disabled={disabled}
          placeholder={placeholder}
          aria-label={placeholder}
          onChange={(event) => {
            setText(event.target.value);
            setCaret(event.target.selectionStart);
            setHighlight(0);
          }}
          onSelect={(event) => setCaret(event.currentTarget.selectionStart)}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          className={cn(
            // 16px on a phone, so that focusing it does not zoom the page.
            'field-sizing-content resize-none bg-transparent px-3.5 pb-1 text-base leading-relaxed outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed sm:text-sm',
            compact
              ? 'max-h-[min(calc(var(--agent-session-height,100dvh)*0.3),12rem)] md:max-h-80'
              : 'max-h-80',
            large
              ? 'min-h-30 pt-3.5'
              : compact
                ? expanded
                  ? 'min-h-[min(calc(var(--agent-session-height,100dvh)*0.2),10rem)] pt-2 md:min-h-14'
                  : 'min-h-10 pt-2 md:min-h-14 md:pt-3'
                : 'min-h-14 pt-3',
          )}
        />
        {/* On a phone the agent's choices take a row of their own above the buttons, swiped when they do not fit. */}
        <div
          className={cn(
            'flex flex-wrap items-center gap-0.5 px-2 pb-2 sm:flex-nowrap',
            compact && 'max-md:sticky max-md:bottom-0 max-md:bg-card',
          )}
        >
          <ToolButton
            label={t('composer.addImage')}
            disabled={disabled}
            onClick={() => filesRef.current?.click()}
          >
            <ImageIcon className='size-4' />
          </ToolButton>
          {compact && (
            <span className='md:hidden'>
              <ToolButton
                label={expanded ? t('composer.collapse') : t('composer.expand')}
                disabled={disabled}
                onClick={() => {
                  setExpanded(!expanded);
                  inputRef.current?.focus();
                }}
              >
                {expanded ? (
                  <Minimize2Icon className='size-4' />
                ) : (
                  <Maximize2Icon className='size-4' />
                )}
              </ToolButton>
            </span>
          )}
          <input
            ref={filesRef}
            type='file'
            accept='image/*'
            multiple
            hidden
            onChange={(event) => {
              if (event.target.files) void addFiles(event.target.files);
              event.target.value = '';
            }}
          />
          {mentions && (
            <ToolButton
              label={t('composer.mentions')}
              disabled={disabled}
              onClick={() => insert('#')}
            >
              <HashIcon className='size-4' />
            </ToolButton>
          )}
          {commands.length > 0 && (
            <ToolButton
              label={t('composer.commands')}
              disabled={disabled}
              onClick={() => type('/', 1)}
            >
              <SlashSquareIcon className='size-4' />
            </ToolButton>
          )}
          <div className='order-first flex w-full min-w-0 items-center gap-0.5 overflow-x-auto pb-1 [scrollbar-width:none] empty:hidden sm:order-none sm:ml-0.5 sm:w-auto sm:flex-1 sm:flex-wrap sm:overflow-visible sm:border-l sm:pb-0 sm:pl-1'>
            {toolbar}
          </div>
          <div className='ml-auto flex shrink-0 items-center gap-0.5'>
            {trailing}
            <button
              type='button'
              aria-label={busy ? t('composer.queue') : t('composer.send')}
              title={busy ? t('composer.queue') : t('composer.send')}
              disabled={empty || disabled || sending}
              onClick={() => void send(false)}
              className={cn(
                'inline-flex size-9 shrink-0 items-center justify-center rounded-full transition-colors',
                'disabled:bg-muted disabled:text-muted-foreground',
                busy
                  ? 'bg-foreground text-background'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90',
              )}
            >
              <ArrowUpIcon className='size-4' />
            </button>
          </div>
        </div>
      </div>
      {hints && (
        <p className='text-muted-foreground mt-2 hidden flex-wrap gap-x-4 gap-y-1 px-1 text-[11px] sm:flex'>
          {keys.map(([combo, label]) => (
            <span key={label} className='inline-flex items-center gap-1'>
              {combo.map((key, index) => (
                <Fragment key={key}>
                  {index > 0 && '+'}
                  <kbd className='bg-card rounded-[3px] border px-1 font-sans text-[10.5px]'>
                    {key}
                  </kbd>
                </Fragment>
              ))}
              {label}
            </span>
          ))}
        </p>
      )}
    </div>
  );
}

function ToolButton({
  label,
  disabled,
  onClick,
  children,
}: {
  readonly label: string;
  readonly disabled: boolean | undefined;
  readonly onClick: () => void;
  readonly children: ReactElement;
}): ReactElement {
  return (
    <button
      type='button'
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className='text-muted-foreground hover:bg-muted hover:text-foreground inline-flex size-7 shrink-0 items-center justify-center rounded-md transition-colors disabled:pointer-events-none disabled:opacity-50'
    >
      {children}
    </button>
  );
}

function base64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      typeof reader.result === 'string'
        ? resolve(reader.result.replace(/^data:[^,]*,/u, ''))
        : reject(new Error('The file could not be read.'));
    reader.onerror = () =>
      reject(reader.error ?? new Error('The file could not be read.'));
    reader.readAsDataURL(file);
  });
}
