/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { act, renderHook, waitFor } from '@testing-library/react';

import { parseMarkdown, useParseMarkdown } from '../util';

const mermaidMocks = vi.hoisted(() => ({
  initialize: vi.fn(),
  render: vi.fn(),
}));

vi.mock('mermaid', () => ({
  default: mermaidMocks,
}));

describe('client-v2 Markdown rendering', () => {
  beforeEach(() => {
    parseMarkdown.cache.clear();
    mermaidMocks.initialize.mockClear();
    mermaidMocks.render.mockReset();
  });

  it('awaits Mermaid 10 rendering and preserves the rendered image dimensions', async () => {
    mermaidMocks.render.mockResolvedValue({
      svg: '<svg style="max-width: 320px; max-height: 180px"><text>diagram</text></svg>',
    });

    const html = await parseMarkdown('```mermaid\ngraph TD\nA --> B\n```');
    const container = document.createElement('div');
    container.innerHTML = html;
    const image = container.querySelector('img');

    expect(mermaidMocks.initialize).toHaveBeenCalledWith({ securityLevel: 'loose' });
    expect(mermaidMocks.render).toHaveBeenCalledWith(
      expect.stringMatching(/^mermaid-container-\d+$/),
      'graph TD\nA --> B\n',
      expect.any(HTMLDivElement),
    );
    expect(image?.src).toContain('data:image/svg+xml,');
    expect(image?.style.maxWidth).toBe('320px');
    expect(image?.style.maxHeight).toBe('180px');
    expect(container.querySelector('pre.mermaid')).toBeNull();
  });

  it('preserves regular Markdown rendering while removing embedded iframes', async () => {
    const html = await parseMarkdown('# Heading\n\n**Bold text**\n\n<iframe src="https://example.com"></iframe>');
    const container = document.createElement('div');
    container.innerHTML = html;

    expect(container.querySelector('h1')?.textContent).toBe('Heading');
    expect(container.querySelector('strong')?.textContent).toBe('Bold text');
    expect(container.querySelector('iframe')).toBeNull();
    expect(mermaidMocks.render).not.toHaveBeenCalled();
  });

  it('renders a safe error notice when Mermaid rejects the diagram', async () => {
    mermaidMocks.render.mockRejectedValue(new Error('<invalid diagram>'));

    const html = await parseMarkdown('```mermaid\ngraph broken\n```');
    const container = document.createElement('div');
    container.innerHTML = html;
    const alert = container.querySelector('.alert.alert-danger');

    expect(alert?.textContent).toBe('Error: <invalid diagram>');
    expect(alert?.innerHTML).not.toContain('<invalid diagram>');
  });

  it('does not let an older Mermaid render overwrite newer Markdown', async () => {
    let resolveMermaidRender: (result: { svg: string }) => void = () => {
      throw new Error('Mermaid render resolver was not initialized');
    };
    const pendingMermaidRender = new Promise<{ svg: string }>((resolve) => {
      resolveMermaidRender = resolve;
    });
    mermaidMocks.render.mockReturnValueOnce(pendingMermaidRender);
    const slowMarkdown = '```mermaid\ngraph TD\nOld --> Content\n```';
    const { result, rerender } = renderHook(({ text }) => useParseMarkdown(text), {
      initialProps: { text: slowMarkdown },
    });

    await waitFor(() => expect(mermaidMocks.render).toHaveBeenCalledTimes(1));
    const pendingOldParse = parseMarkdown(slowMarkdown);

    rerender({ text: '**Newest content**' });
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.html).toContain('<strong>Newest content</strong>');
    });

    await act(async () => {
      resolveMermaidRender({ svg: '<svg><text>Old content</text></svg>' });
      await pendingOldParse;
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.html).toContain('<strong>Newest content</strong>');
    expect(result.current.html).not.toContain('Old content');
  });
});
