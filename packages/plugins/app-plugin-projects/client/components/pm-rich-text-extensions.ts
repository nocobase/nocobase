import {
  type AnyExtension,
  Editor,
  type JSONContent,
  type MarkdownToken,
  mergeAttributes,
  Node,
} from '@tiptap/core';
import { TaskItem, TaskList } from '@tiptap/extension-list';
import { Placeholder } from '@tiptap/extension-placeholder';
import { TableKit } from '@tiptap/extension-table';
import { Markdown } from '@tiptap/markdown';
import { StarterKit } from '@tiptap/starter-kit';

/**
 * The TipTap schema behind `PmRichTextEditor`, kept apart from the React component so the Markdown round trip can be
 * tested without rendering.
 *
 * Storage stays Markdown: the editor loads Markdown and hands Markdown back. A mention
 * is an atomic inline node that reads and writes the mention link `[@Name](mention://<kind>/<id>)` (`lib/kinds.ts`)
 * — the same text the server's trigger rules and `PmMarkdown` read — so switching the
 * composer from a textarea to rich text changes nothing on the wire.
 */

/** A kind's key, such as `user`. */
export type PmMentionKind = string;

const KIND = /^[a-z][a-z0-9_]{1,31}$/u;
const kindOr = (value: unknown): string =>
  typeof value === 'string' && KIND.test(value) ? value : 'user';

export interface PmMentionAttributes {
  readonly kind: PmMentionKind;
  readonly id: string;
  readonly label: string;
}

/** `[@Label](mention://kind/id)`, anchored at the start of the source (marked tokenizers match from index 0). */
const MENTION_TOKEN =
  /^\[@([^\]\n]*)\]\(mention:\/\/([a-z][a-z0-9_]{1,31})\/([^)\s]+)\)/u;

export function mentionLink(attributes: PmMentionAttributes): string {
  const label = attributes.label.replace(/[[\]\n]/gu, '');
  return `[@${label}](mention://${attributes.kind}/${encodeURIComponent(attributes.id)})`;
}

interface MentionToken extends MarkdownToken {
  readonly kind: PmMentionKind;
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

export const PmMention: Node = Node.create({
  name: 'pmMention',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      kind: { default: 'user' },
      id: { default: '' },
      label: { default: '' },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-pm-mention]',
        getAttrs: (element) => ({
          kind: kindOr(element.getAttribute('data-kind')),
          id: element.getAttribute('data-id') ?? '',
          label: element.getAttribute('data-label') ?? '',
        }),
      },
      {
        // Pasted HTML from a rendered comment: the chip is a link to the mention URL.
        tag: 'a[href^="mention://"]',
        priority: 60,
        getAttrs: (element) => {
          const match = /^mention:\/\/([a-z][a-z0-9_]{1,31})\/(.+)$/u.exec(
            element.getAttribute('href') ?? '',
          );
          if (!match) return false;
          return {
            kind: match[1],
            id: safeDecode(match[2]),
            label: (element.textContent ?? '').replace(/^@/u, ''),
          };
        },
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-pm-mention': '',
        'data-kind': node.attrs.kind as string,
        'data-id': node.attrs.id as string,
        'data-label': node.attrs.label as string,
        class:
          'inline-flex items-center rounded-md bg-secondary px-1 font-medium text-secondary-foreground',
      }),
      `@${node.attrs.label as string}`,
    ];
  },

  renderText({ node }) {
    return `@${node.attrs.label as string}`;
  },

  markdownTokenName: 'pmMention',
  markdownTokenizer: {
    name: 'pmMention',
    level: 'inline',
    start: (src: string) => src.indexOf('[@'),
    tokenize: (src: string) => {
      const match = MENTION_TOKEN.exec(src);
      if (!match) return undefined;
      const token: MentionToken = {
        type: 'pmMention',
        raw: match[0],
        label: match[1],
        kind: match[2],
        id: safeDecode(match[3]),
      };
      return token;
    },
  },
  parseMarkdown: (token: MarkdownToken) => {
    const mention = token as MentionToken;
    return {
      type: 'pmMention',
      attrs: { kind: mention.kind, id: mention.id, label: mention.label },
    };
  },
  renderMarkdown: (node: JSONContent) =>
    mentionLink({
      kind: kindOr(node.attrs?.kind),
      id: String(node.attrs?.id ?? ''),
      label: String(node.attrs?.label ?? ''),
    }),
});

export interface PmRichTextSchemaOptions {
  readonly placeholder?: string;
}

/** Every extension the editor uses; the Markdown extension last so it sees the others' markdown specs. */
export function npRichTextExtensions(
  options: PmRichTextSchemaOptions = {},
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
    PmMention,
    Placeholder.configure({ placeholder: options.placeholder ?? '' }),
    Markdown,
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
 * the same extensions, so what this returns is what saving an untouched draft would send.
 */
export function roundTripMarkdown(markdown: string): string {
  const editor = new Editor({
    extensions: npRichTextExtensions(),
    content: markdown,
    contentType: 'markdown',
  });
  try {
    return editorMarkdown(editor);
  } finally {
    editor.destroy();
  }
}
