import { render } from '@testing-library/react';
import { expect, it } from 'vitest';
import { KnowledgeMarkdown } from '../client/components/markdown.js';

it('preserves Markdown nodes across refreshes and updates heading options', () => {
  const content =
    '# First\n\nParagraph with [link](https://example.com).\n\n## Second\n\n- Item\n\n```text\ncode\n```';
  const view = (_id: string, icon: string) => (
    <KnowledgeMarkdown
      content={content}
      highlight={icon === 'new' ? [3, 3] : null}
    />
  );
  const { container, rerender } = render(view('first', 'old'));
  const nodes = [...container.querySelectorAll('h1,h2,p,a,ul,li,pre,code')];
  rerender(view('changed', 'new'));
  expect([...container.querySelectorAll('h1,h2,p,a,ul,li,pre,code')]).toEqual(
    nodes,
  );
  for (const node of nodes) expect(node.isConnected).toBe(true);
  expect(container.querySelector('p')).toHaveAttribute(
    'data-highlighted',
    'true',
  );
});
