import { render } from '@testing-library/react';
import type { ComponentProps } from 'react';
import type { Components, ExtraProps } from 'react-markdown';
import { describe, expect, it } from 'vitest';

import {
  MarkdownView,
  markdownViewComponents,
} from '../../registry/components/markdown-view';

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

describe('MarkdownView links', () => {
  it('keeps a #anchor on the page and opens every other web link in a new tab', () => {
    const { container } = render(
      <MarkdownView
        content={[
          '[top](#top)',
          '[same origin](/main/issues/1)',
          '[relative](docs/guide.md)',
          '[external](https://example.com)',
          '[mail](mailto:a@example.com)',
        ].join(' ')}
      />,
    );
    const attrs = [...container.querySelectorAll('a')].map((link) => [
      link.textContent,
      link.getAttribute('target'),
      link.getAttribute('rel'),
    ]);
    expect(attrs).toEqual([
      ['top', null, null],
      ['same origin', '_blank', 'noopener noreferrer'],
      ['relative', '_blank', 'noopener noreferrer'],
      ['external', '_blank', 'noopener noreferrer'],
      ['mail', null, null],
    ]);
  });

  it('drops dangerous URLs and never renders raw HTML', () => {
    const { container } = render(
      <MarkdownView
        content={
          '[run](javascript:alert(1)) <b>bold</b> ![x](javascript:alert(2))'
        }
      />,
    );
    const link = container.querySelector('a');
    expect(link).not.toHaveAttribute('href');
    expect(link).not.toHaveAttribute('target');
    expect(container.querySelector('b')).toBeNull();
    expect(container.querySelector('img')).toBeNull();
    expect(container).toHaveTextContent('<b>bold</b>');
  });

  it('lets renderLink and transformUrl replace the defaults', () => {
    const { container } = render(
      <MarkdownView
        content='[a](https://example.com/a) [b](ftp://example.com/b)'
        transformUrl={(url) => (url.startsWith('https:') ? url : '')}
        renderLink={(props, fallback) =>
          props.href?.endsWith('/a') ? (
            <a data-custom href={props.href} target={props.target}>
              {props.children}
            </a>
          ) : (
            fallback
          )
        }
      />,
    );
    const [a, b] = container.querySelectorAll('a');
    expect(a).toHaveAttribute('data-custom');
    expect(a).toHaveAttribute('target', '_blank');
    expect(b).not.toHaveAttribute('href');
  });
});

describe('MarkdownView extensions', () => {
  const Paragraph = (props: ComponentProps<'p'> & ExtraProps) => (
    <markdownViewComponents.p
      {...props}
      data-line={props.node?.position?.start.line}
      className='text-base'
    />
  );
  const overrides: Components = { p: Paragraph };
  const remarkDropH2 =
    () => (tree: { children: { type: string; depth?: number }[] }) => {
      tree.children = tree.children.filter(
        (node) => !(node.type === 'heading' && node.depth === 2),
      );
    };

  it('merges components by tag, passing source positions, and appends remark plugins', () => {
    const { container } = render(
      <MarkdownView
        content={'# A\n\n## B\n\ntext\n\n- item'}
        components={overrides}
        remarkPlugins={[remarkDropH2]}
      />,
    );
    const paragraph = container.querySelector('p');
    expect(paragraph).toHaveAttribute('data-line', '5');
    expect(paragraph?.className).toContain('text-base');
    expect(paragraph?.className).not.toContain('text-sm');
    expect(container.querySelector('h2')).toBeNull();
    expect(container.querySelector('ul')?.className).toContain('list-disc');
  });

  it('keeps elements mounted while content streams in with new override objects', () => {
    const view = (content: string) => (
      <MarkdownView
        content={content}
        components={{ ...overrides }}
        remarkPlugins={[remarkDropH2]}
      />
    );
    const { container, rerender } = render(view('# A\n\nfirst'));
    const heading = container.querySelector('h1');
    const paragraph = container.querySelector('p');
    rerender(view('# A\n\nfirst paragraph\n\nsecond'));
    expect(container.querySelector('h1')).toBe(heading);
    expect(container.querySelector('p')).toBe(paragraph);
    expect(paragraph).toHaveTextContent('first paragraph');
  });

  it('renders h4 to h6 and sanitised images', () => {
    const { container } = render(
      <MarkdownView
        content={
          '#### four\n\n##### five\n\n###### six\n\n![logo](https://example.com/a.png)'
        }
      />,
    );
    expect(
      [...container.querySelectorAll('h4,h5,h6')].map((h) => h.tagName),
    ).toEqual(['H4', 'H5', 'H6']);
    expect(container.querySelector('img')).toHaveAttribute(
      'src',
      'https://example.com/a.png',
    );
  });
});
