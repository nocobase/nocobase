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
