import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { MarkdownView } from '../../registry/components/markdown-view';

function links(container: HTMLElement): (string | null)[][] {
  return [...container.querySelectorAll('a')].map((link) => [
    link.getAttribute('href'),
    link.textContent,
  ]);
}

describe('MarkdownView', () => {
  it('ends a bare URL at the first CJK character or full-width punctuation mark', () => {
    const { container } = render(
      <MarkdownView content='PR：https://github.com/nocobase/studio/pull/8（分支 `agent/PM-1`），见 www.example.com。' />,
    );
    expect(links(container)).toEqual([
      [
        'https://github.com/nocobase/studio/pull/8',
        'https://github.com/nocobase/studio/pull/8',
      ],
      ['http://www.example.com', 'www.example.com'],
    ]);
    expect(container).toHaveTextContent(
      'PR：https://github.com/nocobase/studio/pull/8（分支 agent/PM-1），见 www.example.com。',
    );
  });

  it('keeps a URL written in angle brackets whole', () => {
    const { container } = render(
      <MarkdownView content='<https://example.com/中文>' />,
    );
    expect(
      decodeURI(container.querySelector('a')?.getAttribute('href') ?? ''),
    ).toBe('https://example.com/中文');
  });

  it('keeps a valid port in a bare URL before CJK text', () => {
    const { container } = render(
      <MarkdownView content='https://example.com:8443/docs中文说明' />,
    );
    expect(links(container)).toEqual([
      ['https://example.com:8443/docs', 'https://example.com:8443/docs'],
    ]);
    expect(container).toHaveTextContent(
      'https://example.com:8443/docs中文说明',
    );
  });

  it.each([
    [
      'https://localhost:8443/docs中文说明',
      [['https://localhost:8443/docs', 'https://localhost:8443/docs']],
      'https://localhost:8443/docs中文说明',
    ],
    [
      'http://localhost:13000/main（开发环境）',
      [['http://localhost:13000/main', 'http://localhost:13000/main']],
      'http://localhost:13000/main（开发环境）',
    ],
    [
      'https://localhost/docs中文说明',
      [['https://localhost/docs', 'https://localhost/docs']],
      'https://localhost/docs中文说明',
    ],
    [
      'https://中文.example，http://localhost:13000/main中文',
      [['http://localhost:13000/main', 'http://localhost:13000/main']],
      'https://中文.example，http://localhost:13000/main中文',
    ],
  ])(
    'links a localhost URL before CJK text in %s',
    (content, expectedLinks, text) => {
      const { container } = render(<MarkdownView content={content} />);

      expect(links(container)).toEqual(expectedLinks);
      expect(container).toHaveTextContent(text);
    },
  );
});

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
