// Knowledge documents hand `mermaid` code blocks to @nocobase/markdown-mermaid, whose own tests
// cover the drawing; until a diagram is drawn, and when it cannot be, the block shows its source.
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { KnowledgeMarkdown } from '../client/components/markdown.js';

describe('KnowledgeMarkdown', () => {
  it('hands a mermaid code block to the diagram, with the source as its fallback', () => {
    const { container } = render(
      <KnowledgeMarkdown
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
});

describe('KnowledgeMarkdown on MarkdownView', () => {
  const content = [
    '# Guide',
    '',
    '## Setup',
    '',
    'Read [the intro](#setup), [another doc](/main/knowledge/x) or [site](https://example.com); call [us](tel:+8610123) or [text](sms:+8610123).',
    '',
    '### Setup',
    '',
    '#### Four',
    '',
    '##### Five',
    '',
    '###### Six',
    '',
    '```md',
    '# not a heading',
    '```',
  ].join('\n');

  it('gives h1 to h6 the anchors markdownHeadings computes and hides the leading title', () => {
    const { container } = render(
      <KnowledgeMarkdown content={content} hiddenHeadingLine={1} />,
    );
    expect(
      [...container.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((heading) => [
        heading.tagName,
        heading.id,
        heading.getAttribute('data-line'),
      ]),
    ).toEqual([
      ['H2', 'setup', '3'],
      ['H3', 'setup-2', '7'],
      ['H4', 'four', '9'],
      ['H5', 'five', '11'],
      ['H6', 'six', '13'],
    ]);
  });

  it('keeps #anchor links on the page and opens other links in a new tab', () => {
    const { container } = render(<KnowledgeMarkdown content={content} />);
    expect(
      [...container.querySelectorAll('a')].map((link) => [
        link.getAttribute('href'),
        link.getAttribute('target'),
      ]),
    ).toEqual([
      ['#setup', null],
      ['/main/knowledge/x', '_blank'],
      ['https://example.com', '_blank'],
      ['tel:+8610123', null],
      ['sms:+8610123', null],
    ]);
  });

  it('highlights every block in the line range', () => {
    const { container } = render(
      <KnowledgeMarkdown content={content} highlight={[3, 5]} />,
    );
    expect(
      [...container.querySelectorAll('[data-highlighted]')].map(
        (node) => node.tagName,
      ),
    ).toEqual(['H2', 'P']);
  });
});
