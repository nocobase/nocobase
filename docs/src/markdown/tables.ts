import type { Element, Root } from 'hast';
import { visit } from 'unist-util-visit';

/**
 * Wrap every Markdown table in `<div class="table-scroll">`. A wide table scrolls inside the wrapper, which also
 * draws the border, so the table itself stays a real table at full width instead of `display: block`.
 */
export function rehypeTableWrapper() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element, index, parent) => {
      if (node.tagName !== 'table' || !parent || index === undefined) return;
      parent.children[index] = {
        type: 'element',
        tagName: 'div',
        properties: { className: ['table-scroll'] },
        children: [node],
      };
    });
  };
}
