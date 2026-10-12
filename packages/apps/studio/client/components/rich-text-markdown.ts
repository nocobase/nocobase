import {
  type AnyExtension,
  Editor,
  Extension,
  type JSONContent,
  type MarkdownToken,
} from '@tiptap/core';
import {
  FileHandler,
  type FileHandlerOptions,
} from '@tiptap/extension-file-handler';
import { TaskItem, TaskList } from '@tiptap/extension-list';
import { Mention } from '@tiptap/extension-mention';
import {
  Placeholder,
  type PlaceholderOptions,
} from '@tiptap/extension-placeholder';
import { TableKit } from '@tiptap/extension-table';
import { Markdown } from '@tiptap/markdown';
import {
  chainCommands,
  createParagraphNear,
  liftEmptyBlock,
  newlineInCode,
  splitBlock,
} from '@tiptap/pm/commands';
import { splitListItem } from '@tiptap/pm/schema-list';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import type { EditorView } from '@tiptap/pm/view';
import { StarterKit } from '@tiptap/starter-kit';
import type { SuggestionMatch, SuggestionOptions } from '@tiptap/suggestion';

/**
 * The Tiptap schema behind `RichTextEditor`, kept apart from the React component so the Markdown round trip can be
 * tested without rendering.
 *
 * Everything here is an official Tiptap extension except what is ours: the mention's Markdown form and CJK-aware
 * trigger, the Markdown tidy step and the composer keys. Storage stays Markdown: the editor loads Markdown and hands
 * Markdown back. A mention is the official `Mention` node with a `kind` attribute, read and written as the mention
 * link `[@Name](mention://<kind>/<id>)`, which `MarkdownView` shows as a chip.
 */

/** A mention's kind, such as `user`. */
export type MentionKind = string;

const KIND = /^[a-z][a-z0-9_]{1,31}$/u;
const kindOr = (value: unknown): string =>
  typeof value === 'string' && KIND.test(value) ? value : 'user';

export interface MentionAttributes {
  readonly kind: MentionKind;
  readonly id: string;
  readonly label: string;
}

/** `[@Label](mention://kind/id)`, anchored at the start of the source (marked tokenizers match from index 0). */
const MENTION_TOKEN =
  /^\[@([^\]\n]*)\]\(mention:\/\/([a-z][a-z0-9_]{1,31})\/([^)\s]+)\)/u;

export function mentionLink(attributes: MentionAttributes): string {
  const label = attributes.label.replace(/[[\]\n]/gu, '');
  return `[@${label}](mention://${attributes.kind}/${encodeURIComponent(attributes.id)})`;
}

interface MentionToken extends MarkdownToken {
  readonly kind: MentionKind;
  readonly id: string;
  readonly label: string;
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/**
 * The `@query` the caret is completing, or null. An `@` (or a full-width `＠`) opens a query unless it follows a Latin
 * letter, digit or `_.+-`, so an email address does not open the list while text without spaces (CJK) does;
 * whitespace ends it.
 */
export function findMentionQuery(
  text: string,
  caret: number,
): { readonly start: number; readonly query: string } | null {
  const before = text.slice(0, caret);
  // The full-width `＠` a CJK input method types counts as `@`.
  const at = Math.max(before.lastIndexOf('@'), before.lastIndexOf('＠'));
  if (at < 0) return null;
  // After a space, a bracket or text without spaces (CJK), but not inside a word or an email address.
  const preceding = at === 0 ? '' : (before[at - 1] ?? '');
  if (/[A-Za-z0-9_.+-]/u.test(preceding)) return null;
  const query = before.slice(at + 1);
  if (/\s/u.test(query) || query.length > 40) return null;
  return { start: at, query };
}

/**
 * The suggestion matcher for mentions. Tiptap's default opens only after a space or at the start of a line, and only
 * for its one trigger character; this one follows `findMentionQuery`, so `@` right after CJK text and the full-width
 * `＠` open the list too.
 */
export const findMentionSuggestion: NonNullable<
  SuggestionOptions['findSuggestionMatch']
> = ({ $position }): SuggestionMatch => {
  const parent = $position.parent;
  if (!parent.isTextblock || parent.type.spec.code) return null;
  const before = parent.textBetween(0, $position.parentOffset, undefined, '￼');
  const found = findMentionQuery(before, before.length);
  if (!found) return null;
  const blockStart = $position.pos - $position.parentOffset;
  return {
    range: { from: blockStart + found.start, to: $position.pos },
    query: found.query,
    text: before.slice(found.start),
  };
};

/**
 * The official `Mention` node with the mention's `kind`, stored in Markdown as the mention link rather than the
 * extension's own `[@ id="…"]` shortcode, so existing content and `MarkdownView` keep working. Configure it as you
 * would `Mention`; its `suggestion` decides how candidates are found and shown.
 */
export const MarkdownMention = Mention.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      kind: {
        default: 'user',
        parseHTML: (element: HTMLElement) =>
          kindOr(element.getAttribute('data-kind')),
        renderHTML: (attributes: Record<string, unknown>) => ({
          'data-kind': kindOr(attributes.kind),
        }),
      },
    };
  },

  parseHTML() {
    return [
      ...(this.parent?.() ?? []),
      {
        // Pasted HTML from a rendered comment: the chip is a link to the mention URL.
        tag: 'a[href^="mention://"]',
        priority: 60,
        getAttrs: (element: HTMLElement) => {
          const match = /^mention:\/\/([a-z][a-z0-9_]{1,31})\/(.+)$/u.exec(
            element.getAttribute('href') ?? '',
          );
          if (!match) return false;
          return {
            kind: match[1],
            id: safeDecode(match[2] ?? ''),
            label: (element.textContent ?? '').replace(/^[@＠]/u, ''),
          };
        },
      },
    ];
  },

  markdownTokenName: 'mention',
  markdownTokenizer: {
    name: 'mention',
    level: 'inline',
    start: (src: string) => src.indexOf('[@'),
    tokenize: (src: string) => {
      const match = MENTION_TOKEN.exec(src);
      if (!match) return undefined;
      const token: MentionToken = {
        type: 'mention',
        raw: match[0],
        label: match[1] ?? '',
        kind: match[2] ?? 'user',
        id: safeDecode(match[3] ?? ''),
      };
      return token;
    },
  },
  parseMarkdown: (token: MarkdownToken) => {
    const mention = token as MentionToken;
    return {
      type: 'mention',
      attrs: { kind: mention.kind, id: mention.id, label: mention.label },
    };
  },
  renderMarkdown: (node: JSONContent) =>
    mentionLink({
      kind: kindOr(node.attrs?.kind),
      id: String(node.attrs?.id ?? ''),
      label: String(node.attrs?.label ?? ''),
    }),
}).configure({
  HTMLAttributes: {
    class:
      'inline-flex items-center rounded-md bg-secondary px-1 font-medium text-secondary-foreground',
  },
  suggestion: { findSuggestionMatch: findMentionSuggestion },
});

type EnterEvent = Pick<
  KeyboardEvent,
  | 'key'
  | 'shiftKey'
  | 'metaKey'
  | 'ctrlKey'
  | 'altKey'
  | 'isComposing'
  | 'keyCode'
>;

/** An Enter that only confirms an IME candidate; Safari reports it with keyCode 229 and `isComposing` false. */
function isImeEnter(event: EnterEvent): boolean {
  return event.isComposing || event.keyCode === 229;
}

/** ⌘/Ctrl + Enter: the submit key of long-form editors, where Enter is a new paragraph. */
export function isModifierEnter(event: EnterEvent): boolean {
  return (
    event.key === 'Enter' &&
    (event.metaKey || event.ctrlKey) &&
    !isImeEnter(event)
  );
}

/** Enter submits a message box; ⌘/Ctrl + Enter still does. */
export function isSubmitEnter(event: EnterEvent): boolean {
  return (
    event.key === 'Enter' &&
    !event.shiftKey &&
    !event.altKey &&
    !isImeEnter(event)
  );
}

/** Shift + Enter starts a new line in a message box that submits on Enter. */
export function isNewLineEnter(event: EnterEvent): boolean {
  return event.key === 'Enter' && event.shiftKey && !isImeEnter(event);
}

/** What plain Enter does in Tiptap (list item, code block, then paragraph), for Shift + Enter when Enter submits. */
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

/** What the composer keys call. */
export interface ComposerKeyHandlers {
  readonly onSubmit?: () => void;
  /** Enter submits and Shift + Enter starts a new paragraph or list item; otherwise ⌘/Ctrl + Enter submits. */
  readonly submitOnEnter?: boolean;
  readonly onEscape?: () => void;
}

export interface ComposerKeysOptions {
  /** Read on every key press, so the answer may change between renders without recreating the editor. */
  readonly handlers: () => ComposerKeyHandlers;
}

/**
 * The message-box keys: Enter or ⌘/Ctrl + Enter submits, Shift + Enter splits, Escape leaves. Its priority is below
 * the mention suggestion's, so Enter, Tab and Escape reach it only while the mention list is closed, and its plugin
 * runs before StarterKit's keymaps. An Enter that confirms an IME candidate is left alone.
 */
export const ComposerKeys = Extension.create<ComposerKeysOptions>({
  name: 'composerKeys',
  priority: 100,

  addOptions() {
    return { handlers: () => ({}) };
  },

  addProseMirrorPlugins() {
    const { handlers } = this.options;
    return [
      new Plugin({
        key: new PluginKey('composerKeys'),
        props: {
          handleKeyDown: (view, event) => {
            const current = handlers();
            if (
              current.submitOnEnter
                ? isSubmitEnter(event)
                : isModifierEnter(event)
            ) {
              current.onSubmit?.();
              return true;
            }
            if (current.submitOnEnter && isNewLineEnter(event))
              return splitAtCaret(view);
            if (event.key === 'Escape' && current.onEscape) {
              current.onEscape();
              return true;
            }
            return false;
          },
        },
      }),
    ];
  },
});

export interface RichTextExtensionOptions {
  /** Text, or a function asked on each render so the placeholder can change without recreating the editor. */
  readonly placeholder?: PlaceholderOptions['placeholder'];
  /** Overrides for the mention's suggestion (`items`, `render`, `allow` …); the CJK-aware matcher stays unless replaced. */
  readonly mention?: Partial<Omit<SuggestionOptions, 'editor'>>;
  /** Pasted and dropped files; without it, files are left to the browser. */
  readonly files?: Pick<
    FileHandlerOptions,
    'onPaste' | 'onDrop' | 'allowedMimeTypes'
  >;
  /** The composer keys; without them, Enter and Escape keep Tiptap's defaults. */
  readonly keys?: ComposerKeysOptions;
}

/**
 * The default extension set: StarterKit (with links), task lists, tables, mentions and the placeholder, the file
 * handler and composer keys when asked for, and the Markdown extension last so it sees the others' Markdown specs.
 */
export function richTextExtensions(
  options: RichTextExtensionOptions = {},
): AnyExtension[] {
  return [
    StarterKit.configure({
      link: {
        openOnClick: false,
        autolink: true,
        protocols: ['mention'],
        HTMLAttributes: { rel: 'noreferrer', target: '_blank' },
      },
    }),
    TaskList,
    TaskItem.configure({ nested: true }),
    TableKit.configure({ table: { resizable: false } }),
    options.mention
      ? MarkdownMention.configure({
          suggestion: {
            findSuggestionMatch: findMentionSuggestion,
            ...options.mention,
          },
        })
      : MarkdownMention,
    Placeholder.configure({ placeholder: options.placeholder ?? '' }),
    ...(options.files ? [FileHandler.configure(options.files)] : []),
    ...(options.keys ? [ComposerKeys.configure(options.keys)] : []),
    Markdown,
  ];
}

/**
 * The base set with `extra` added. An extra extension whose name matches one in the base replaces it in place, so
 * `StarterKit.configure(…)` or a reconfigured `MarkdownMention` overrides ours; the rest go before the Markdown
 * extension, which stays last.
 */
export function mergeExtensions(
  base: readonly AnyExtension[],
  extra: readonly AnyExtension[] = [],
): AnyExtension[] {
  const byName = new Map(extra.map((extension) => [extension.name, extension]));
  const merged = base.map((extension) => {
    const replacement = byName.get(extension.name);
    if (!replacement) return extension;
    byName.delete(extension.name);
    return replacement;
  });
  const added = [...byName.values()];
  const markdownAt = merged.findIndex(
    (extension) => extension.name === 'markdown',
  );
  if (markdownAt < 0) return [...merged, ...added];
  return [
    ...merged.slice(0, markdownAt),
    ...added,
    ...merged.slice(markdownAt),
  ];
}

/**
 * Undoes the serializer's defensive HTML escaping where it cannot change meaning, so the stored Markdown stays as
 * readable for any reader as what a person would type: `&gt;` after the first character of a line (only a leading `>`
 * starts a quote), `&amp;` that does not begin an entity, and an autolinked URL written back as the bare URL. Fenced
 * code is left alone. Leading and trailing blank lines are dropped.
 */
export function tidyMarkdown(markdown: string): string {
  let fenced = false;
  const lines = markdown.split('\n').map((line) => {
    if (/^\s*(```|~~~)/u.test(line)) {
      fenced = !fenced;
      return line;
    }
    if (fenced) return line;
    const decoded = line
      .replace(/&amp;(?![a-zA-Z]+;|#\d+;|#x[0-9a-fA-F]+;)/gu, '&')
      .replace(/\[(https?:\/\/[^\]\s]+)\]\(\1\)/gu, '$1');
    const indent = /^\s*/u.exec(decoded)?.[0].length ?? 0;
    const head = decoded.slice(0, indent + 1);
    const rest = decoded.slice(indent + 1).replace(/&gt;/gu, '>');
    return head + rest;
  });
  return lines.join('\n').replace(/^\n+|\n+$/gu, '');
}

/** The editor's content as stored Markdown. */
export function editorMarkdown(editor: Editor): string {
  return editor.isEmpty ? '' : tidyMarkdown(editor.getMarkdown());
}

/**
 * Markdown → document → Markdown without a view, for tests and for normalising a draft. The editor component uses
 * the same extensions, so what this returns is what saving an untouched draft would send; pass the same `extensions`
 * as the editor when it has extra ones.
 */
export function roundTripMarkdown(
  markdown: string,
  extensions: readonly AnyExtension[] = [],
): string {
  const editor = new Editor({
    extensions: mergeExtensions(richTextExtensions(), extensions),
    content: markdown,
    contentType: 'markdown',
  });
  try {
    return editorMarkdown(editor);
  } finally {
    editor.destroy();
  }
}
