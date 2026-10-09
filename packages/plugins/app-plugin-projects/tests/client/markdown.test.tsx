// Issue descriptions, comments and plans hand `mermaid` code blocks to @nocobase/markdown-mermaid, whose own tests
// cover the drawing; until a diagram is drawn, and when it cannot be, the block shows its source.
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PmMarkdown } from '../../client/components/pm-markdown.js';

describe('PmMarkdown', () => {
  it('hands a mermaid code block to the diagram, with the source as its fallback', () => {
    const { container } = render(
      <PmMarkdown
        content={
          '```mermaid\ngraph TD\n  A-->B\n```\n\n```ts\nconst a = 1;\n```\n'
        }
      />,
    );
    const diagram = container.querySelector('[data-mermaid]');
    expect(diagram).toHaveAttribute('data-mermaid', 'pending');
    expect(diagram?.querySelector('pre')).toHaveTextContent('graph TD A-->B');
    const blocks = container.querySelectorAll('pre');
    expect(blocks).toHaveLength(2);
    expect(blocks[1]?.closest('[data-mermaid]')).toBeNull();
  });

  it('ends a bare URL at the first CJK character or full-width punctuation mark', () => {
    const { container } = render(
      <PmMarkdown
        content={
          'PR：https://github.com/nocobase/studio/pull/8（分支 `agent/PM-1`），见 www.example.com。另见https://example.com/x.（说明）'
        }
      />,
    );
    const links = [...container.querySelectorAll('a')].map((link) => [
      link.getAttribute('href'),
      link.textContent,
    ]);
    expect(links).toEqual([
      [
        'https://github.com/nocobase/studio/pull/8',
        'https://github.com/nocobase/studio/pull/8',
      ],
      ['http://www.example.com', 'www.example.com'],
      ['https://example.com/x', 'https://example.com/x'],
    ]);
    expect(container).toHaveTextContent(
      'PR：https://github.com/nocobase/studio/pull/8（分支 agent/PM-1），见 www.example.com。另见https://example.com/x.（说明）',
    );
  });

  it('keeps CJK in URLs written in angle brackets or as a link, and unlinks a bare URL with no host left', () => {
    const { container } = render(
      <PmMarkdown
        content={
          '<https://example.com/中文> [维基](https://example.com/wiki/中文) https://中文.com，https://example.org'
        }
      />,
    );
    const hrefs = [...container.querySelectorAll('a')].map((link) =>
      decodeURI(link.getAttribute('href') ?? ''),
    );
    expect(hrefs).toEqual([
      'https://example.com/中文',
      'https://example.com/wiki/中文',
      'https://example.org',
    ]);
    expect(container).toHaveTextContent(
      'https://中文.com，https://example.org',
    );
  });
});
