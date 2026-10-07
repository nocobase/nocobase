// Finding a Mermaid diagram in the tree react-markdown renders: a fenced code block marked `mermaid` becomes
// `<pre><code class="language-mermaid">`.

/** A node of the HTML tree react-markdown passes to its components, as far as this module reads it. */
export interface MarkdownNode {
  readonly type: string;
  readonly tagName?: string;
  readonly value?: string;
  readonly properties?: { readonly className?: unknown };
  readonly children?: readonly MarkdownNode[];
}

function textOf(node: MarkdownNode): string {
  if (node.type === 'text') return node.value ?? '';
  return (node.children ?? []).map(textOf).join('');
}

/**
 * The diagram source when `node` is the `pre` of a fenced code block marked `mermaid`, else undefined. Use it in a
 * react-markdown `pre` component: `const source = mermaidSource(node)`.
 */
export function mermaidSource(
  node: MarkdownNode | undefined,
): string | undefined {
  if (node?.tagName !== 'pre') return undefined;
  const code = node.children?.find((child) => child.type === 'element');
  if (code?.tagName !== 'code') return undefined;
  const names = code.properties?.className;
  const list: unknown[] = Array.isArray(names)
    ? names
    : typeof names === 'string'
      ? names.split(/\s+/u)
      : [];
  if (!list.includes('language-mermaid')) return undefined;
  return textOf(code).replace(/\n$/u, '');
}
