import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { MarkdownView } from '../../client/components/markdown-view';

describe('MarkdownView CJK autolinks', () => {
  it.each([
    [
      'PR：https://example.com/pull/35（分支 x）',
      ['https://example.com/pull/35'],
      ['https://example.com/pull/35'],
      'PR：https://example.com/pull/35（分支 x）',
    ],
    [
      'See https://example.com/docs中文说明',
      ['https://example.com/docs'],
      ['https://example.com/docs'],
      'See https://example.com/docs中文说明',
    ],
    [
      'Visit www.example.com，感谢！',
      ['http://www.example.com'],
      ['www.example.com'],
      'Visit www.example.com，感谢！',
    ],
    [
      'https://one.example/a中文https://two.example/b。',
      ['https://one.example/a', 'https://two.example/b'],
      ['https://one.example/a', 'https://two.example/b'],
      'https://one.example/a中文https://two.example/b。',
    ],
    [
      '(https://example.com/path_(nested)). Next: https://example.com/end.,',
      ['https://example.com/path_(nested)', 'https://example.com/end'],
      ['https://example.com/path_(nested)', 'https://example.com/end'],
      '(https://example.com/path_(nested)). Next: https://example.com/end.,',
    ],
  ])('links only the URL in %s', (content, hrefs, labels, fullText) => {
    const { container } = render(<MarkdownView content={content} />);
    const root = container.querySelector('[data-slot="markdown-view"]');
    const links = Array.from(root?.querySelectorAll('a') ?? []);

    expect(links.map((link) => link.getAttribute('href'))).toEqual(hrefs);
    expect(links.map((link) => link.textContent)).toEqual(labels);
    expect(root?.textContent).toBe(fullText);
  });

  it('preserves explicit links containing CJK text', () => {
    const { container } = render(
      <MarkdownView content='<https://example.com/中文> and [文档](https://example.com/路径)' />,
    );
    const links = Array.from(container.querySelectorAll('a'));

    expect(links.map((link) => link.textContent)).toEqual([
      'https://example.com/中文',
      '文档',
    ]);
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      'https://example.com/%E4%B8%AD%E6%96%87',
      'https://example.com/%E8%B7%AF%E5%BE%84',
    ]);
    expect(
      container.querySelector('[data-slot="markdown-view"]')?.textContent,
    ).toBe('https://example.com/中文 and 文档');
  });

  it('keeps mention rendering, fenced code and unsafe URL filtering', () => {
    const { container } = render(
      <MarkdownView
        content={
          '[@Ada](mention://user/ada)\n\n```text\nhttps://example.com/中文\n```\n\n[Unsafe](javascript:alert%281%29)'
        }
      />,
    );

    expect(container.querySelector('[data-mention="user"]')).toHaveTextContent(
      'Ada',
    );
    expect(container.querySelector('pre')).toHaveTextContent(
      'https://example.com/中文',
    );
    expect(container.querySelector('pre a')).toBeNull();
    expect(container.querySelector('a[href=""]')).toHaveTextContent('Unsafe');
    expect(container.querySelectorAll('a')).toHaveLength(1);
  });
});
