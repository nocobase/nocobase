import { act, render, screen, waitFor } from '@testing-library/react';
import Markdown, { type Components } from 'react-markdown';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MermaidDiagram, mermaidSource } from '../src/index.ts';

// Mermaid itself does not run in jsdom (it measures text with SVG APIs jsdom lacks); a stand-in records how it is
// configured and draws the source as text, failing on a source that says so.
const mermaid = vi.hoisted(() => ({
  initialize: vi.fn(),
  render: vi.fn((_id: string, source: string) =>
    source.includes('broken')
      ? Promise.reject(new Error('Parse error on line 1'))
      : Promise.resolve({ svg: `<svg data-source="${source}"></svg>` }),
  ),
}));
vi.mock('mermaid', () => ({ default: mermaid }));

const components: Components = {
  pre: ({ node, ...props }) => {
    const block = <pre data-testid='code-block' {...props} />;
    const source = mermaidSource(node);
    return source === undefined ? (
      block
    ) : (
      <MermaidDiagram source={source} fallback={block} delayMs={0} />
    );
  },
};

function markdown(content: string) {
  return render(<Markdown components={components}>{content}</Markdown>);
}

describe('mermaid code blocks', () => {
  beforeEach(() => {
    document.documentElement.classList.remove('dark');
    mermaid.initialize.mockClear();
    mermaid.render.mockClear();
  });
  afterEach(() => document.documentElement.classList.remove('dark'));

  it('draws a block marked mermaid with strict security and leaves other code alone', async () => {
    const { container } = markdown(
      '```mermaid\ngraph TD\n  A-->B\n```\n\n```ts\nconst a = 1;\n```\n',
    );
    await waitFor(() =>
      expect(container.querySelector('[data-mermaid="diagram"] svg')).not.toBe(
        null,
      ),
    );
    expect(container.querySelector('svg')?.getAttribute('data-source')).toBe(
      'graph TD\n  A-->B',
    );
    expect(mermaid.initialize).toHaveBeenCalledWith({
      startOnLoad: false,
      securityLevel: 'strict',
      theme: 'default',
    });
    expect(screen.getByTestId('code-block').textContent).toBe('const a = 1;\n');
  });

  it('shows the source while it loads and when it does not render', async () => {
    const { container } = markdown('```mermaid\ngraph broken\n```\n');
    expect(screen.getByTestId('code-block').textContent).toContain(
      'graph broken',
    );
    await waitFor(() =>
      expect(container.querySelector('[data-mermaid="failed"]')).not.toBe(null),
    );
    expect(
      container.querySelector('[data-mermaid="failed"]')?.getAttribute('title'),
    ).toBe('Parse error on line 1');
    expect(screen.getByTestId('code-block').textContent).toContain(
      'graph broken',
    );
    expect(container.querySelector('svg')).toBe(null);
  });

  it('follows the dark theme, and draws again when it changes', async () => {
    document.documentElement.classList.add('dark');
    const { container } = markdown('```mermaid\ngraph LR\n  A-->B\n```\n');
    await waitFor(() => expect(container.querySelector('svg')).not.toBe(null));
    expect(mermaid.initialize).toHaveBeenLastCalledWith(
      expect.objectContaining({ theme: 'dark' }),
    );
    act(() => document.documentElement.classList.remove('dark'));
    await waitFor(() =>
      expect(mermaid.initialize).toHaveBeenLastCalledWith(
        expect.objectContaining({ theme: 'default' }),
      ),
    );
    expect(mermaid.render).toHaveBeenCalledTimes(2);
  });

  it('finds the source only in a fenced block marked mermaid', () => {
    const code = (className: unknown) => ({
      type: 'element',
      tagName: 'pre',
      children: [
        {
          type: 'element',
          tagName: 'code',
          properties: { className },
          children: [{ type: 'text', value: 'graph TD\n' }],
        },
      ],
    });
    expect(mermaidSource(code(['language-mermaid']))).toBe('graph TD');
    expect(mermaidSource(code('language-mermaid'))).toBe('graph TD');
    expect(mermaidSource(code(['language-ts']))).toBeUndefined();
    expect(mermaidSource(undefined)).toBeUndefined();
  });
});
