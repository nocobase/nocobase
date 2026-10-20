import { render } from '@testing-library/react';
import { expect, it } from 'vitest';
import { MarkdownView } from '../../client/components/markdown-view.js';

it('preserves Markdown nodes across refreshes and updates heading options', () => {
  const content =
    '# First\n\nParagraph with [link](https://example.com).\n\n## Second\n\n- Item\n\n```text\ncode\n```';
  const view = (id: string, icon: string) => (
    <MarkdownView
      content={content + '\n\n[@User](mention://user/1)'}
      headingIds={[id, 'second']}
      mentionIcon={() => icon}
      renderCodeBlock={(_code, block) => block}
    />
  );
  const { container, rerender } = render(view('first', 'old'));
  const nodes = [...container.querySelectorAll('h1,h2,p,a,ul,li,pre,code')];
  rerender(view('changed', 'new'));
  expect([...container.querySelectorAll('h1,h2,p,a,ul,li,pre,code')]).toEqual(
    nodes,
  );
  for (const node of nodes) expect(node.isConnected).toBe(true);
  expect(container.querySelector('h1')).toHaveAttribute('id', 'changed');
  expect(container.querySelector('[data-mention]')).toHaveTextContent('new');
});
