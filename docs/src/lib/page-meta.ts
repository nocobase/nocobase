import type { RootContent } from 'mdast';
import { toString } from 'mdast-util-to-string';
import remarkDirective from 'remark-directive';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import { normalizeCalloutSyntax } from '../markdown/callouts.ts';

export interface PageMeta {
  /** Text of the first `# Heading`, if the page has one. */
  h1?: string;
  /**
   * Plain text of everything between the title and the first `##` section, joined by spaces. Rspress used this as the
   * page description when the frontmatter had none, and the published `<meta name="description">` and `llms.txt`
   * entries rely on it.
   */
  lead?: string;
}

const parser = unified().use(remarkParse).use(remarkGfm).use(remarkDirective);

export function extractPageMeta(body: string): PageMeta {
  const tree = parser.parse(normalizeCalloutSyntax(body));
  const titleIndex = tree.children.findIndex(
    (node) => node.type === 'heading' && node.depth === 1,
  );
  const h1 =
    titleIndex >= 0 ? toString(tree.children[titleIndex]).trim() : undefined;

  const lead: string[] = [];
  for (const node of tree.children.slice(titleIndex + 1)) {
    if (node.type === 'heading' && node.depth <= 2) break;
    const text = leadText(node);
    if (text) lead.push(text);
  }
  const description = lead.join(' ').replace(/\s+/g, ' ').trim();
  return { h1: h1 || undefined, lead: description || undefined };
}

function leadText(node: RootContent): string {
  // Code, tables, HTML and images describe nothing a search result could show; Rspress left them out too.
  if (['code', 'table', 'html', 'thematicBreak', 'yaml'].includes(node.type))
    return '';
  return toString(node, { includeImageAlt: false });
}
