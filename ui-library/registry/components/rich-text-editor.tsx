/**
 * A rich text editor that reads and writes Markdown, built from official Tiptap pieces: StarterKit, task lists,
 * tables, `Mention` with `Suggestion`, `FileHandler`, `Placeholder` and the Markdown extension. Purely presentational:
 * the consumer gives the Markdown and hears about changes.
 *
 * Typing `@` (or the full-width `＠`, also right after CJK text) asks `onMentionSearch` for candidates matching what
 * follows. Arrow keys move, Enter or Tab inserts a mention chip, stored as `[@Name](mention://<kind>/<id>)`, and
 * Escape dismisses. Focus stays in the editor, so the list is a listbox driven by `aria-activedescendant`. Files
 * pasted or dropped go to `onUpload`, and what it stored is inserted as a link. Every word comes from `labels`,
 * English by default.
 *
 * It is open for extension: `extensions` adds to or overrides `richTextExtensions()`, `toolbar` takes a render
 * function that receives the editor, and the toolbar parts below compose a toolbar of your own inside it.
 */
import type { AnyExtension, Editor } from '@tiptap/core';
import {
  EditorContent,
  Tiptap,
  useEditor,
  useTiptap,
  useTiptapState,
} from '@tiptap/react';
import type {
  SuggestionKeyDownProps,
  SuggestionOptions,
  SuggestionProps,
} from '@tiptap/suggestion';
import {
  BoldIcon,
  CodeIcon,
  ItalicIcon,
  ListIcon,
  ListOrderedIcon,
  QuoteIcon,
  StrikethroughIcon,
  UserIcon,
  type LucideIcon,
} from 'lucide-react';
import {
  type ReactElement,
  type ReactNode,
  type Ref,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';

import { Toggle } from '#components/ui/toggle';
import { cn } from 'cn';

import {
  editorMarkdown,
  mergeExtensions,
  richTextExtensions,
} from './rich-text-markdown.js';

export interface RichTextMention {
  /** The mention URL's kind, such as `user`. */
  readonly kind: string;
  readonly id: string;
  readonly name: string;
  /** A short note beside the name. */
  readonly hint?: string;
  /** Beside the name; a person by default. */
  readonly icon?: ReactNode;
}

/** A file stored by `onUpload`, inserted as a link to it. */
export interface RichTextUpload {
  readonly url: string;
  readonly name: string;
}

export interface RichTextHandle {
  readonly focus: () => void;
  readonly clear: () => void;
  readonly getMarkdown: () => string;
  /** The Tiptap editor, for custom toolbars, tests and callers that insert content programmatically. */
  readonly editor: () => Editor | null;
}

export type RichTextTool =
  | 'bold'
  | 'italic'
  | 'strike'
  | 'code'
  | 'bulletList'
  | 'orderedList'
  | 'quote';

export interface RichTextLabels {
  readonly mentionList: string;
  readonly noMatches: string;
  readonly toolbar: string;
  readonly uploading: string;
  readonly tools: Readonly<Record<RichTextTool, string>>;
}

const defaultRichTextLabels: RichTextLabels = {
  mentionList: 'People and agents to mention',
  noMatches: 'No matches',
  toolbar: 'Formatting',
  uploading: 'Uploading…',
  tools: {
    bold: 'Bold',
    italic: 'Italic',
    strike: 'Strikethrough',
    code: 'Code',
    bulletList: 'Bulleted list',
    orderedList: 'Numbered list',
    quote: 'Quote',
  },
};

export interface RichTextEditorProps {
  /** Markdown. The editor follows changes that did not come from itself (a reset, a reload after a conflict). */
  readonly value: string;
  readonly onChange: (markdown: string) => void;
  /** Candidates for `@query`; without it, `@` opens nothing. */
  readonly onMentionSearch?: (
    query: string,
  ) => Promise<readonly RichTextMention[]>;
  /** Stores a pasted or dropped file; without it, files are left to the browser. */
  readonly onUpload?: (file: File) => Promise<RichTextUpload>;
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
  /**
   * The toolbar: true (the default) shows `RichTextDefaultToolbar`, false hides it, and a function renders your own,
   * typically a `RichTextToolbar` of the exported groups and buttons.
   */
  readonly toolbar?: boolean | ((editor: Editor) => ReactNode);
  /**
   * Added to `richTextExtensions()`; one with the name of a default extension replaces it. Read when the editor is
   * created, so pass a stable array (a module constant or a memo).
   */
  readonly extensions?: readonly AnyExtension[];
  readonly labels?: RichTextLabels;
  readonly className?: string;
  readonly contentClassName?: string;
  readonly ref?: Ref<RichTextHandle>;
}

const MAX_SUGGESTIONS = 8;

type MentionSuggestion = SuggestionProps<RichTextMention, MentionCommand>;

interface MentionCommand {
  readonly id: string;
  readonly label: string;
  readonly kind: string;
}

/** The open mention list: what the suggestion plugin last reported and the highlighted row. */
interface MentionListState {
  readonly suggestion: MentionSuggestion;
  readonly active: number;
}

// Compact prose matching `MarkdownView`, applied to the ProseMirror content through descendant selectors.
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

export function RichTextEditor({
  value,
  onChange,
  onMentionSearch,
  onUpload,
  placeholder,
  'aria-label': ariaLabel,
  disabled = false,
  autoFocus = false,
  onSubmit,
  submitOnEnter = false,
  onEscape,
  mentionPlacement = 'above',
  toolbar = true,
  extensions,
  labels = defaultRichTextLabels,
  className,
  contentClassName,
  ref,
}: RichTextEditorProps): ReactElement {
  const listId = useId();
  const [list, setList] = useState<MentionListState | null>(null);
  const [uploading, setUploading] = useState(0);
  const lastEmittedRef = useRef(value);

  // The extensions are created once; they reach the current props and list through this.
  const [live] = useState(
    () =>
      new Latest({
        onChange,
        onMentionSearch,
        onUpload,
        placeholder,
        keys: { onSubmit, submitOnEnter, onEscape },
        list,
      }),
  );
  useEffect(() => {
    live.set({
      onChange,
      onMentionSearch,
      onUpload,
      placeholder,
      keys: { onSubmit, submitOnEnter, onEscape },
      list,
    });
  });

  // Read once, like every extension: a consumer passes a module constant or a memo.
  const [extra] = useState(extensions);
  const hasUpload = onUpload !== undefined;
  const allExtensions = useMemo(() => {
    /** Hands the files to `onUpload` and inserts what it stored. */
    const upload = (
      editor: Editor,
      files: readonly File[],
      at?: number,
    ): void => {
      const store = live.get().onUpload;
      if (!store) return;
      for (const file of files) {
        setUploading((count) => count + 1);
        void store(file)
          .then((stored) => {
            const content = [
              {
                type: 'text',
                text: stored.name,
                marks: [{ type: 'link', attrs: { href: stored.url } }],
              },
              { type: 'text', text: ' ' },
            ];
            const chain = editor.chain().focus();
            (at === undefined
              ? chain.insertContent(content)
              : chain.insertContentAt(at, content)
            ).run();
          })
          .catch(() => undefined)
          .finally(() => setUploading((count) => count - 1));
      }
    };
    return mergeExtensions(
      richTextExtensions({
        placeholder: () => live.get().placeholder ?? '',
        mention: mentionSuggestion(live.get, setList),
        ...(hasUpload
          ? {
              files: {
                onPaste: (editor, files) => upload(editor, files),
                onDrop: (editor, files, at) => upload(editor, files, at),
              },
            }
          : {}),
        keys: { handlers: () => live.get().keys },
      }),
      extra,
    );
  }, [live, hasUpload, extra]);

  const editor = useEditor(
    {
      extensions: allExtensions,
      content: value,
      contentType: 'markdown',
      editable: !disabled,
      autofocus: autoFocus ? 'end' : false,
      editorProps: {
        attributes: { class: cn(CONTENT_CLASS, contentClassName) },
      },
      onUpdate: ({ editor: current }) => {
        const markdown = editorMarkdown(current);
        lastEmittedRef.current = markdown;
        live.get().onChange(markdown);
      },
    },
    [allExtensions],
  );

  // Follow a value that did not come from this editor (cleared after sending, reloaded after a conflict).
  useEffect(() => {
    if (value === lastEmittedRef.current) return;
    lastEmittedRef.current = value;
    editor.commands.setContent(value, {
      contentType: 'markdown',
      emitUpdate: false,
    });
  }, [editor, value]);

  useEffect(() => {
    editor.setEditable(!disabled, false);
  }, [editor, disabled]);

  const items = list?.suggestion.items ?? [];
  const open = list !== null && !disabled;
  const current = open ? items[list.active] : undefined;

  // Accessible name and the listbox relation live on the contenteditable itself.
  useEffect(() => {
    const dom = editor.view.dom;
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
      current ? optionId(listId, current) : undefined,
    );
    set('aria-disabled', disabled ? 'true' : undefined);
  });

  useImperativeHandle(
    ref,
    () => ({
      focus: () => editor.commands.focus('end'),
      clear: () => {
        lastEmittedRef.current = '';
        editor.commands.clearContent(false);
      },
      getMarkdown: () => editorMarkdown(editor),
      editor: () => editor,
    }),
    [editor],
  );

  return (
    <Tiptap editor={editor}>
      <div
        className={cn(
          'relative rounded-lg border border-input bg-transparent transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30',
          disabled && 'opacity-60',
          className,
        )}
        data-slot='rich-text-editor'
      >
        {open ? (
          <MentionList
            id={listId}
            state={list}
            placement={mentionPlacement}
            labels={labels}
            onActive={(active) => setList({ ...list, active })}
          />
        ) : null}
        {toolbar === true ? (
          <RichTextDefaultToolbar labels={labels} />
        ) : typeof toolbar === 'function' ? (
          toolbar(editor)
        ) : null}
        <EditorContent editor={editor} />
        {uploading > 0 ? (
          <p
            role='status'
            className='border-t px-3 py-1 text-xs text-muted-foreground'
          >
            {labels.uploading}
          </p>
        ) : null}
      </div>
    </Tiptap>
  );
}

/** The latest value of something, for extensions created once that must see every render's props. */
class Latest<T> {
  #value: T;
  constructor(value: T) {
    this.#value = value;
  }
  readonly get = (): T => this.#value;
  set(value: T): void {
    this.#value = value;
  }
}

const optionId = (listId: string, candidate: RichTextMention): string =>
  `${listId}-${candidate.kind}-${candidate.id}`;

const toCommand = (candidate: RichTextMention): MentionCommand => ({
  id: candidate.id,
  label: candidate.name,
  kind: candidate.kind,
});

/**
 * The mention suggestion: `onMentionSearch` answers the items, and the plugin's lifecycle drives React state, which
 * `MentionList` draws inside the editor's frame. Keys are handled here because focus never leaves the editor.
 */
function mentionSuggestion(
  live: () => {
    readonly onMentionSearch?: RichTextEditorProps['onMentionSearch'];
    readonly list: MentionListState | null;
  },
  setList: (
    update: (previous: MentionListState | null) => MentionListState | null,
  ) => void,
): Partial<Omit<SuggestionOptions<RichTextMention, MentionCommand>, 'editor'>> {
  return {
    allow: ({ state, range }) => {
      if (!live().onMentionSearch) return false;
      const mention = state.schema.nodes.mention;
      return (
        mention !== undefined &&
        state.doc
          .resolve(range.from)
          .parent.type.contentMatch.matchType(mention) !== null
      );
    },
    items: async ({ query }) => {
      const search = live().onMentionSearch;
      if (!search) return [];
      return (await search(query)).slice(0, MAX_SUGGESTIONS);
    },
    render: () => {
      const show = (suggestion: MentionSuggestion): void =>
        setList((previous) => ({
          suggestion,
          // Keep the highlighted row while the same query loads; start over when the query changes.
          active:
            previous && previous.suggestion.query === suggestion.query
              ? Math.min(
                  previous.active,
                  Math.max(suggestion.items.length - 1, 0),
                )
              : 0,
        }));
      return {
        onStart: show,
        onUpdate: show,
        onExit: () => setList(() => null),
        onKeyDown: ({ event }: SuggestionKeyDownProps) => {
          if (event.isComposing) return false;
          const state = live().list;
          if (event.key === 'Escape') {
            // The plugin closes the list; keep a surrounding dialog from closing too.
            event.stopPropagation();
            return true;
          }
          if (!state) return false;
          const { items } = state.suggestion;
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            const count = Math.max(items.length, 1);
            const step = event.key === 'ArrowDown' ? 1 : -1;
            setList((previous) =>
              previous
                ? {
                    ...previous,
                    active: (state.active + step + count) % count,
                  }
                : previous,
            );
            return true;
          }
          const chosen = items[state.active];
          if ((event.key === 'Enter' || event.key === 'Tab') && chosen) {
            state.suggestion.command(toCommand(chosen));
            return true;
          }
          return false;
        },
      };
    },
  };
}

function MentionList({
  id,
  state,
  placement,
  labels,
  onActive,
}: {
  readonly id: string;
  readonly state: MentionListState;
  readonly placement: 'above' | 'below';
  readonly labels: RichTextLabels;
  readonly onActive: (index: number) => void;
}): ReactElement | null {
  const { suggestion, active } = state;
  if (suggestion.loading && suggestion.items.length === 0) return null;
  return (
    <div
      id={id}
      role='listbox'
      aria-label={labels.mentionList}
      className={cn(
        'absolute left-0 z-20 w-72 max-w-full overflow-hidden rounded-lg bg-popover p-1 text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10',
        placement === 'above' ? 'bottom-full mb-1' : 'top-full mt-1',
      )}
    >
      {suggestion.items.length === 0 ? (
        <p className='px-2 py-1.5 text-muted-foreground'>{labels.noMatches}</p>
      ) : (
        suggestion.items.map((candidate, index) => (
          <div
            key={`${candidate.kind}:${candidate.id}`}
            id={optionId(id, candidate)}
            role='option'
            aria-selected={index === active}
            className={cn(
              'flex cursor-default items-center gap-2 rounded-md px-2 py-1.5',
              index === active && 'bg-accent text-accent-foreground',
            )}
            onMouseDown={(event) => {
              // Keep focus in the editor; the click would otherwise blur it first.
              event.preventDefault();
              suggestion.command(toCommand(candidate));
            }}
            onMouseEnter={() => onActive(index)}
          >
            <span className='flex size-3.5 shrink-0 items-center text-muted-foreground [&_svg]:size-3.5'>
              {candidate.icon ?? <UserIcon aria-hidden='true' />}
            </span>
            <span className='truncate'>{candidate.name}</span>
            {candidate.hint ? (
              <span className='ml-auto text-xs text-muted-foreground'>
                {candidate.hint}
              </span>
            ) : null}
          </div>
        ))
      )}
    </div>
  );
}

/** The toolbar frame: a labelled `role="toolbar"` row above the content. Put groups and buttons in it. */
export function RichTextToolbar({
  label = defaultRichTextLabels.toolbar,
  className,
  children,
}: {
  readonly label?: string;
  readonly className?: string;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <div
      role='toolbar'
      aria-label={label}
      className={cn(
        'flex flex-wrap items-center gap-0.5 border-b px-1 py-1',
        className,
      )}
    >
      {children}
    </div>
  );
}

export interface RichTextToolbarButtonProps {
  /** The accessible name, also the tooltip. */
  readonly label: string;
  readonly icon: LucideIcon;
  /** Runs the command, such as `editor => editor.chain().focus().toggleBold().run()`. */
  readonly run: (editor: Editor) => void;
  /** Whether the button shows as pressed; it re-renders only when this answer changes. */
  readonly isActive?: (editor: Editor) => boolean;
  /** Whether the command applies here; a disabled editor disables every button. */
  readonly isEnabled?: (editor: Editor) => boolean;
}

/**
 * One toolbar button: a shadcn `Toggle` bound to the editor of the surrounding `RichTextEditor` (Tiptap's
 * `useTiptap`), pressed while `isActive` holds. Focus stays in the editor when it is clicked.
 */
export function RichTextToolbarButton({
  label,
  icon: Icon,
  run,
  isActive,
  isEnabled,
}: RichTextToolbarButtonProps): ReactElement {
  const { editor } = useTiptap();
  const { pressed, enabled } = useTiptapState(
    ({ editor: current }) => ({
      pressed: isActive?.(current) ?? false,
      enabled: current.isEditable && (isEnabled?.(current) ?? true),
    }),
    (a, b) => a.pressed === b?.pressed && a.enabled === b?.enabled,
  );
  return (
    <Toggle
      aria-label={label}
      title={label}
      pressed={pressed}
      disabled={!enabled}
      onMouseDown={(event) => event.preventDefault()}
      onPressedChange={() => run(editor)}
      className='size-6 min-w-6 rounded-md px-0 text-muted-foreground aria-pressed:text-foreground [&_svg:not([class*=size-])]:size-3.5'
    >
      <Icon aria-hidden='true' />
    </Toggle>
  );
}

interface ToolDefinition {
  readonly key: RichTextTool;
  readonly icon: LucideIcon;
  readonly run: (editor: Editor) => void;
  readonly isActive: (editor: Editor) => boolean;
}

const INLINE_TOOLS: readonly ToolDefinition[] = [
  {
    key: 'bold',
    icon: BoldIcon,
    run: (editor) => editor.chain().focus().toggleBold().run(),
    isActive: (editor) => editor.isActive('bold'),
  },
  {
    key: 'italic',
    icon: ItalicIcon,
    run: (editor) => editor.chain().focus().toggleItalic().run(),
    isActive: (editor) => editor.isActive('italic'),
  },
  {
    key: 'strike',
    icon: StrikethroughIcon,
    run: (editor) => editor.chain().focus().toggleStrike().run(),
    isActive: (editor) => editor.isActive('strike'),
  },
  {
    key: 'code',
    icon: CodeIcon,
    run: (editor) => editor.chain().focus().toggleCode().run(),
    isActive: (editor) => editor.isActive('code'),
  },
];

const BLOCK_TOOLS: readonly ToolDefinition[] = [
  {
    key: 'bulletList',
    icon: ListIcon,
    run: (editor) => editor.chain().focus().toggleBulletList().run(),
    isActive: (editor) => editor.isActive('bulletList'),
  },
  {
    key: 'orderedList',
    icon: ListOrderedIcon,
    run: (editor) => editor.chain().focus().toggleOrderedList().run(),
    isActive: (editor) => editor.isActive('orderedList'),
  },
  {
    key: 'quote',
    icon: QuoteIcon,
    run: (editor) => editor.chain().focus().toggleBlockquote().run(),
    isActive: (editor) => editor.isActive('blockquote'),
  },
];

function ToolGroup({
  tools,
  labels,
}: {
  readonly tools: readonly ToolDefinition[];
  readonly labels: RichTextLabels;
}): ReactElement {
  return (
    <>
      {tools.map((tool) => (
        <RichTextToolbarButton
          key={tool.key}
          label={labels.tools[tool.key]}
          icon={tool.icon}
          run={tool.run}
          isActive={tool.isActive}
        />
      ))}
    </>
  );
}

/** Bold, italic, strikethrough and inline code. */
export function RichTextInlineTools({
  labels = defaultRichTextLabels,
}: {
  readonly labels?: RichTextLabels;
}): ReactElement {
  return <ToolGroup tools={INLINE_TOOLS} labels={labels} />;
}

/** Bulleted and numbered lists and the quote. */
export function RichTextBlockTools({
  labels = defaultRichTextLabels,
}: {
  readonly labels?: RichTextLabels;
}): ReactElement {
  return <ToolGroup tools={BLOCK_TOOLS} labels={labels} />;
}

/** A thin divider between groups. */
export function RichTextToolbarSeparator(): ReactElement {
  return <span aria-hidden='true' className='mx-0.5 h-4 w-px bg-border' />;
}

/** The toolbar `RichTextEditor` shows by default: the inline tools, then the block tools. */
export function RichTextDefaultToolbar({
  labels = defaultRichTextLabels,
}: {
  readonly labels?: RichTextLabels;
}): ReactElement {
  return (
    <RichTextToolbar label={labels.toolbar}>
      <RichTextInlineTools labels={labels} />
      <RichTextBlockTools labels={labels} />
    </RichTextToolbar>
  );
}
