import { useTranslation } from '@nocobase/i18n/client';
import {
  chainCommands,
  createParagraphNear,
  liftEmptyBlock,
  newlineInCode,
  splitBlock,
} from '@tiptap/pm/commands';
import { splitListItem } from '@tiptap/pm/schema-list';
import type { EditorView } from '@tiptap/pm/view';
import { type Editor, EditorContent, useEditor } from '@tiptap/react';
import {
  BoldIcon,
  CodeIcon,
  ItalicIcon,
  ListIcon,
  ListOrderedIcon,
  QuoteIcon,
  StrikethroughIcon,
} from 'lucide-react';
import {
  type ReactElement,
  type Ref,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';

import {
  isModifierEnter,
  isNewLineEnter,
  isSubmitEnter,
} from './pm-shortcut-keys.js';
import { findMentionQuery } from '../lib/mentions.js';
import { cn } from 'cn';

import {
  editorMarkdown,
  type PmMentionKind,
  npRichTextExtensions,
} from './pm-rich-text-extensions.js';
import { PmKindIcon } from './pm-kind-icon.js';

export interface PmMentionCandidate {
  readonly kind: PmMentionKind;
  readonly id: string;
  readonly name: string;
  /** A short note beside the name (its state, say). */
  readonly hint?: string;
}

export interface PmRichTextHandle {
  readonly focus: () => void;
  readonly clear: () => void;
  readonly getMarkdown: () => string;
  /** The TipTap editor, for tests and callers that insert content programmatically. */
  readonly editor: () => Editor | null;
}

export interface PmRichTextEditorProps {
  /** Markdown. The editor follows changes that did not come from itself (a reset, a reload after a conflict). */
  readonly value: string;
  readonly onChange: (markdown: string) => void;
  readonly mentionCandidates?: readonly PmMentionCandidate[];
  readonly placeholder?: string;
  readonly 'aria-label'?: string;
  readonly disabled?: boolean;
  readonly autoFocus?: boolean;
  /** ⌘/Ctrl + Enter while the mention list is closed; also plain Enter with `submitOnEnter`. */
  readonly onSubmit?: () => void;
  /** Message boxes: Enter submits and Shift + Enter starts a new paragraph or list item. */
  readonly submitOnEnter?: boolean;
  /** Escape while the mention list is closed. */
  readonly onEscape?: () => void;
  /** Where the mention list opens: above suits a composer pinned to the bottom, below suits a description. */
  readonly mentionPlacement?: 'above' | 'below';
  readonly toolbar?: boolean;
  readonly className?: string;
  readonly contentClassName?: string;
  readonly ref?: Ref<PmRichTextHandle>;
}

const MAX_SUGGESTIONS = 8;

/** What plain Enter does in TipTap (list item, code block, then paragraph), for Shift + Enter when Enter submits. */
function splitAtCaret(view: EditorView): boolean {
  const { listItem, taskItem } = view.state.schema.nodes;
  const items = [listItem, taskItem]
    .filter((type) => type !== undefined)
    .map((type) => splitListItem(type));
  return chainCommands(
    ...items,
    newlineInCode,
    createParagraphNear,
    liftEmptyBlock,
    splitBlock,
  )(view.state, view.dispatch, view);
}

interface MentionState {
  /** Document position of the `@`. */
  readonly from: number;
  /** Document position of the caret. */
  readonly to: number;
  readonly query: string;
}

/** The `@query` the caret is completing in the current text block, as document positions. */
function readMention(editor: Editor): MentionState | null {
  const { selection } = editor.state;
  if (!selection.empty) return null;
  const { $from } = selection;
  if (!$from.parent.isTextblock || $from.parent.type.spec.code) return null;
  const before = $from.parent.textBetween(
    0,
    $from.parentOffset,
    undefined,
    '￼',
  );
  const found = findMentionQuery(before, before.length);
  if (!found) return null;
  const blockStart = $from.pos - $from.parentOffset;
  return {
    from: blockStart + found.start,
    to: $from.pos,
    query: found.query,
  };
}

// Compact prose matching `PmMarkdown`, applied to the ProseMirror content through descendant selectors.
const CONTENT_CLASS = cn(
  'min-h-16 px-3 py-2 text-sm leading-6 wrap-anywhere outline-none',
  '[&_p:not(:first-child)]:mt-2 [&_h1]:text-lg [&_h1]:font-semibold [&_h2]:text-base [&_h2]:font-semibold [&_h3]:text-sm [&_h3]:font-semibold',
  '[&_ul]:ml-5 [&_ul]:list-disc [&_ol]:ml-5 [&_ol]:list-decimal [&_ul[data-type=taskList]]:ml-0 [&_ul[data-type=taskList]]:list-none',
  '[&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground',
  '[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:font-mono [&_code]:text-xs',
  '[&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-3 [&_pre_code]:bg-transparent [&_pre_code]:p-0',
  '[&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4',
  '[&_table]:w-full [&_td]:border [&_td]:px-2 [&_th]:border [&_th]:px-2 [&_th]:text-left',
  '[&_.is-editor-empty:first-child]:before:pointer-events-none [&_.is-editor-empty:first-child]:before:float-left [&_.is-editor-empty:first-child]:before:h-0 [&_.is-editor-empty:first-child]:before:text-muted-foreground [&_.is-editor-empty:first-child]:before:content-[attr(data-placeholder)]',
);

/**
 * The one rich text editor of this plugin: TipTap with StarterKit, task lists and tables,
 * reading and writing Markdown, so descriptions and comments stay Markdown on the wire.
 *
 * Typing `@` (at the start or after whitespace) opens a list of candidates (members, and principals of other
 * mentionable kinds) filtered by what follows. Arrow keys move, Enter or Tab inserts a mention chip — stored as
 * `[@Name](mention://<kind>/<id>)` — and Escape dismisses. Focus stays in the editor, so the list is a listbox driven by
 * `aria-activedescendant`, like the textarea composer it replaces.
 */
export function PmRichTextEditor({
  value,
  onChange,
  mentionCandidates = [],
  placeholder,
  'aria-label': ariaLabel,
  disabled = false,
  autoFocus = false,
  onSubmit,
  submitOnEnter = false,
  onEscape,
  mentionPlacement = 'above',
  toolbar = true,
  className,
  contentClassName,
  ref,
}: PmRichTextEditorProps): ReactElement {
  const { t } = useTranslation();
  const listId = useId();
  const [mention, setMention] = useState<MentionState | null>(null);
  const [dismissedAt, setDismissedAt] = useState<number | null>(null);
  const [active, setActive] = useState({ key: '', index: 0 });
  const lastEmittedRef = useRef(value);
  const callbacksRef = useRef({ onChange, onSubmit, submitOnEnter, onEscape });
  useEffect(() => {
    callbacksRef.current = { onChange, onSubmit, submitOnEnter, onEscape };
  });

  const open = mention !== null && mention.from !== dismissedAt && !disabled;
  const needle = mention?.query.toLowerCase() ?? '';
  const matches = open
    ? mentionCandidates
        .filter((candidate) => candidate.name.toLowerCase().includes(needle))
        .slice(0, MAX_SUGGESTIONS)
    : [];
  const queryKey = mention ? `${mention.from}:${mention.query}` : '';
  const activeIndex =
    active.key === queryKey
      ? Math.min(active.index, Math.max(matches.length - 1, 0))
      : 0;

  // The key handler is registered once with the editor; it reads the list through this ref.
  const listStateRef = useRef({
    open,
    matches,
    activeIndex,
    queryKey,
    mention,
  });
  const chooseRef = useRef<(candidate: PmMentionCandidate) => void>(() => {});
  useEffect(() => {
    listStateRef.current = { open, matches, activeIndex, queryKey, mention };
    chooseRef.current = choose;
  });

  const editor = useEditor({
    extensions: npRichTextExtensions({ placeholder }),
    content: value,
    contentType: 'markdown',
    editable: !disabled,
    autofocus: autoFocus ? 'end' : false,
    shouldRerenderOnTransaction: true,
    editorProps: {
      attributes: { class: cn(CONTENT_CLASS, contentClassName) },
      handleKeyDown: (view, event) => {
        const state = listStateRef.current;
        if (state.open && !event.isComposing) {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            const count = Math.max(state.matches.length, 1);
            const step = event.key === 'ArrowDown' ? 1 : -1;
            setActive({
              key: state.queryKey,
              index: (state.activeIndex + step + count) % count,
            });
            return true;
          }
          if (
            (event.key === 'Enter' || event.key === 'Tab') &&
            state.matches[state.activeIndex]
          ) {
            chooseRef.current(state.matches[state.activeIndex]);
            return true;
          }
          if (event.key === 'Escape' && state.mention) {
            event.stopPropagation();
            setDismissedAt(state.mention.from);
            return true;
          }
        }
        const callbacks = callbacksRef.current;
        if (
          callbacks.submitOnEnter
            ? isSubmitEnter(event)
            : isModifierEnter(event)
        ) {
          callbacks.onSubmit?.();
          return true;
        }
        if (callbacks.submitOnEnter && isNewLineEnter(event)) {
          return splitAtCaret(view);
        }
        if (event.key === 'Escape' && callbacksRef.current.onEscape) {
          callbacksRef.current.onEscape();
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor: current }) => {
      const markdown = editorMarkdown(current);
      lastEmittedRef.current = markdown;
      callbacksRef.current.onChange(markdown);
    },
    onTransaction: ({ editor: current }) => {
      setMention(current.isFocused ? readMention(current) : null);
    },
    onBlur: () => setMention(null),
  });

  function choose(candidate: PmMentionCandidate): void {
    const target = listStateRef.current.mention;
    if (!editor || !target) return;
    editor
      .chain()
      .focus()
      .insertContentAt({ from: target.from, to: target.to }, [
        {
          type: 'pmMention',
          attrs: {
            kind: candidate.kind,
            id: candidate.id,
            label: candidate.name,
          },
        },
        { type: 'text', text: ' ' },
      ])
      .run();
  }

  // Follow a value that did not come from this editor (cleared after sending, reloaded after a conflict).
  useEffect(() => {
    if (!editor || value === lastEmittedRef.current) return;
    lastEmittedRef.current = value;
    editor.commands.setContent(value, {
      contentType: 'markdown',
      emitUpdate: false,
    });
  }, [editor, value]);

  useEffect(() => {
    editor?.setEditable(!disabled, false);
  }, [editor, disabled]);

  // Accessible name and the listbox relation live on the contenteditable itself.
  useEffect(() => {
    const dom = editor?.view.dom;
    if (!dom) return;
    const set = (name: string, attribute: string | undefined): void => {
      if (attribute === undefined) dom.removeAttribute(name);
      else dom.setAttribute(name, attribute);
    };
    set('role', 'textbox');
    set('aria-multiline', 'true');
    set('aria-label', ariaLabel);
    set('aria-haspopup', 'listbox');
    set('aria-expanded', String(open));
    set('aria-controls', open ? listId : undefined);
    set(
      'aria-activedescendant',
      open && matches[activeIndex]
        ? `${listId}-${matches[activeIndex].kind}-${matches[activeIndex].id}`
        : undefined,
    );
    set('aria-disabled', disabled ? 'true' : undefined);
  });

  useImperativeHandle(
    ref,
    () => ({
      focus: () => editor?.commands.focus('end'),
      clear: () => {
        lastEmittedRef.current = '';
        editor?.commands.clearContent(false);
      },
      getMarkdown: () => (editor ? editorMarkdown(editor) : ''),
      editor: () => editor,
    }),
    [editor],
  );

  return (
    <div
      className={cn(
        'relative rounded-lg border border-input bg-transparent transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30',
        disabled && 'opacity-60',
        className,
      )}
    >
      {open ? (
        <div
          id={listId}
          role='listbox'
          aria-label={t('richText.mentionList')}
          className={cn(
            'absolute left-0 z-20 w-72 max-w-full overflow-hidden rounded-lg bg-popover p-1 text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10',
            mentionPlacement === 'above' ? 'bottom-full mb-1' : 'top-full mt-1',
          )}
        >
          {matches.length === 0 ? (
            <p className='px-2 py-1.5 text-muted-foreground'>
              {t('richText.noMatches')}
            </p>
          ) : (
            matches.map((candidate, index) => {
              return (
                <div
                  key={`${candidate.kind}:${candidate.id}`}
                  id={`${listId}-${candidate.kind}-${candidate.id}`}
                  role='option'
                  aria-selected={index === activeIndex}
                  className={cn(
                    'flex cursor-default items-center gap-2 rounded-md px-2 py-1.5',
                    index === activeIndex && 'bg-accent text-accent-foreground',
                  )}
                  onMouseDown={(event) => {
                    // Keep focus in the editor; the click would otherwise blur it first.
                    event.preventDefault();
                    choose(candidate);
                  }}
                  onMouseEnter={() => setActive({ key: queryKey, index })}
                >
                  <PmKindIcon
                    kind={candidate.kind}
                    className='size-3.5 text-muted-foreground'
                    aria-hidden='true'
                  />
                  <span className='truncate'>{candidate.name}</span>
                  {candidate.hint ? (
                    <span className='ml-auto text-xs text-muted-foreground'>
                      {candidate.hint}
                    </span>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      ) : null}
      {toolbar && editor ? (
        <Toolbar editor={editor} disabled={disabled} />
      ) : null}
      <EditorContent editor={editor} />
    </div>
  );
}

function Toolbar({
  editor,
  disabled,
}: {
  readonly editor: Editor;
  readonly disabled: boolean;
}): ReactElement {
  const { t } = useTranslation();
  const tools = [
    {
      key: 'bold',
      icon: BoldIcon,
      run: () => editor.chain().focus().toggleBold().run(),
      active: editor.isActive('bold'),
    },
    {
      key: 'italic',
      icon: ItalicIcon,
      run: () => editor.chain().focus().toggleItalic().run(),
      active: editor.isActive('italic'),
    },
    {
      key: 'strike',
      icon: StrikethroughIcon,
      run: () => editor.chain().focus().toggleStrike().run(),
      active: editor.isActive('strike'),
    },
    {
      key: 'code',
      icon: CodeIcon,
      run: () => editor.chain().focus().toggleCode().run(),
      active: editor.isActive('code'),
    },
    {
      key: 'bulletList',
      icon: ListIcon,
      run: () => editor.chain().focus().toggleBulletList().run(),
      active: editor.isActive('bulletList'),
    },
    {
      key: 'orderedList',
      icon: ListOrderedIcon,
      run: () => editor.chain().focus().toggleOrderedList().run(),
      active: editor.isActive('orderedList'),
    },
    {
      key: 'quote',
      icon: QuoteIcon,
      run: () => editor.chain().focus().toggleBlockquote().run(),
      active: editor.isActive('blockquote'),
    },
  ] as const;
  return (
    <div
      role='toolbar'
      aria-label={t('richText.toolbar')}
      className='flex flex-wrap items-center gap-0.5 border-b px-1 py-1'
    >
      {tools.map((tool) => {
        const Icon = tool.icon;
        return (
          <button
            key={tool.key}
            type='button'
            aria-label={t(`richText.tools.${tool.key}`)}
            aria-pressed={tool.active}
            disabled={disabled}
            onMouseDown={(event) => event.preventDefault()}
            onClick={tool.run}
            className='inline-flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-50 aria-pressed:bg-muted aria-pressed:text-foreground [&_svg]:size-3.5'
          >
            <Icon aria-hidden='true' />
          </button>
        );
      })}
    </div>
  );
}
