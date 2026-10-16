import type { Blockquote, Paragraph, Root, RootContent, Text } from 'mdast';
import type { Processor } from 'unified';
import { visit, SKIP } from 'unist-util-visit';

/**
 * Callout containers, written the way the Rspress site wrote them:
 *
 * ```md
 * :::tip Important notes
 * Content
 * :::
 * ```
 *
 * `remark-directive` only understands a label in brackets (`:::tip[Important notes]`) and drops the rest of the
 * opening line, so the source is rewritten to that form before it is parsed. Fenced code is left untouched, so a
 * code sample can still show the syntax.
 */
export const CALLOUT_TYPES = [
  'tip',
  'info',
  'note',
  'warning',
  'danger',
  'caution',
  'details',
] as const;

const DEFAULT_TITLES: Record<string, string> = {
  tip: 'TIP',
  info: 'INFO',
  note: 'NOTE',
  warning: 'WARNING',
  danger: 'DANGER',
  caution: 'CAUTION',
  details: 'DETAILS',
};

const OPENING = new RegExp(
  `^(\\s{0,3}:{3,})(${CALLOUT_TYPES.join('|')})[ \\t]+([^\\[{\\s].*?)\\s*$`,
);
const FENCE = /^\s{0,3}(`{3,}|~{3,})/;

/** Rewrite `:::tip Title` to `:::tip[Title]` outside fenced code blocks. */
export function normalizeCalloutSyntax(source: string): string {
  let fence: string | undefined;
  return source
    .split('\n')
    .map((line) => {
      const fenceMatch = FENCE.exec(line);
      if (fenceMatch) {
        const marker = fenceMatch[1];
        if (!fence) fence = marker;
        else if (marker[0] === fence[0] && marker.length >= fence.length)
          fence = undefined;
        return line;
      }
      if (fence) return line;
      const match = OPENING.exec(line);
      if (!match) return line;
      const title = match[3].replace(/[[\]]/g, (bracket) => `\\${bracket}`);
      return `${match[1]}${match[2]}[${title}]`;
    })
    .join('\n');
}

interface DirectiveLike {
  type: 'containerDirective' | 'leafDirective' | 'textDirective';
  name: string;
  attributes?: Record<string, string | null | undefined> | null;
  children: RootContent[];
  data?: Record<string, unknown>;
}

function isLabel(node: RootContent | undefined): node is Paragraph {
  return (
    node?.type === 'paragraph' &&
    Boolean(
      (node.data as { directiveLabel?: boolean } | undefined)?.directiveLabel,
    )
  );
}

/**
 * Turn `containerDirective` callouts into
 * `<div class="callout callout--tip"><p class="callout__title">…</p><div class="callout__content">…</div></div>`, and
 * put every other directive back as the text it was written as, so prose such as `10:30` or `ratio:1` is never
 * swallowed by the directive syntax.
 */
export function remarkCallouts(this: Processor) {
  // Wrap the parser that remark-parse (or the MDX compiler) installed, so the rewrite runs on the raw source.
  const self = this as unknown as {
    parser?: (document: string, file: unknown) => Root;
  };
  const original = self.parser;
  if (original) {
    self.parser = (document: string, file: unknown) =>
      original(normalizeCalloutSyntax(document), file);
  }

  return (tree: Root) => {
    visit(tree, (node, index, parent) => {
      if (
        node.type !== 'containerDirective' &&
        node.type !== 'leafDirective' &&
        node.type !== 'textDirective'
      ) {
        return;
      }
      const directive = node as unknown as DirectiveLike;
      if (
        directive.type === 'containerDirective' &&
        (CALLOUT_TYPES as readonly string[]).includes(directive.name)
      ) {
        const [first, ...rest] = directive.children;
        const label = isLabel(first) ? first : undefined;
        const body = label ? rest : directive.children;
        const titleChildren = label
          ? label.children
          : [text(DEFAULT_TITLES[directive.name])];
        directive.data = {
          hName: 'div',
          hProperties: { className: ['callout', `callout--${directive.name}`] },
        };
        const title: Paragraph = { type: 'paragraph', children: titleChildren };
        const content: Blockquote = {
          type: 'blockquote',
          children: body as Blockquote['children'],
        };
        directive.children = [
          renderAs(title, 'p', ['callout__title']),
          renderAs(content, 'div', ['callout__content']),
        ];
        return;
      }
      if (!parent || index === undefined) return;
      // Not a callout: put back what the author wrote. A container keeps its content, a leaf directive becomes a
      // paragraph and a text directive becomes text again.
      let replacement: RootContent[];
      if (directive.type === 'containerDirective') {
        replacement = directive.children;
      } else {
        const label =
          directive.children.length > 0
            ? [text('['), ...directive.children, text(']')]
            : [];
        const inline = [
          text(
            `${directive.type === 'leafDirective' ? '::' : ':'}${directive.name}`,
          ),
          ...label,
        ];
        replacement =
          directive.type === 'leafDirective'
            ? [{ type: 'paragraph', children: inline } as Paragraph]
            : inline;
      }
      parent.children.splice(index, 1, ...(replacement as never[]));
      // A container's content is visited again, so a callout nested in it is still converted.
      return directive.type === 'containerDirective'
        ? index
        : [SKIP, index + replacement.length];
    });
  };
}

function text(value: string): Text {
  return { type: 'text', value };
}

/** Tell `remark-rehype` which element and classes to render a node as. */
function renderAs<T extends RootContent>(
  node: T,
  tagName: string,
  className: string[],
): T {
  return Object.assign(node, {
    data: { hName: tagName, hProperties: { className } },
  });
}
