import type { Root as MdastRoot } from 'mdast';
import type { Element, Root as HastRoot } from 'hast';
import { visit } from 'unist-util-visit';

/**
 * Remove the page's `# Title`. The document layout renders the title itself so that it can put the page actions
 * (Copy Markdown) directly under it; leaving the heading in the body would print it twice.
 */
export function remarkStripTitle() {
  return (tree: MdastRoot) => {
    const index = tree.children.findIndex(
      (node) => node.type === 'heading' && node.depth === 1,
    );
    if (index >= 0) tree.children.splice(index, 1);
  };
}

const HEADING = /^h[2-6]$/;

/**
 * Give every section heading a `#` link to itself. The link carries no text, the `#` is drawn by CSS, so the heading
 * text Astro collects for the table of contents stays clean. Runs after `rehypeHeadingIds`, which assigns the ids.
 */
export function rehypeHeadingAnchors() {
  return (tree: HastRoot) => {
    visit(tree, 'element', (node: Element) => {
      if (!HEADING.test(node.tagName)) return;
      const id = node.properties?.id;
      if (typeof id !== 'string' || !id) return;
      node.children.unshift({
        type: 'element',
        tagName: 'a',
        properties: {
          className: ['heading-anchor'],
          href: `#${id}`,
          ariaHidden: 'true',
          tabIndex: -1,
        },
        children: [],
      });
    });
  };
}
