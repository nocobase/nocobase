/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import Vditor from 'vditor';
import { Display } from '../components/Display';

vi.mock('vditor', () => ({
  default: {
    preview: vi.fn((element: HTMLElement | null, value: string) => {
      if (element) {
        element.innerHTML = value.includes('image') ? '<img src="https://cdn.example/a.png" />' : `<p>${value}</p>`;
      }
    }),
    md2html: vi.fn(),
  },
}));

vi.mock('antd', () => ({
  Popover: ({
    children,
    content,
    open,
    onOpenChange,
  }: {
    children: React.ReactNode;
    content: React.ReactNode;
    open?: boolean;
    onOpenChange?: (visible: boolean) => void;
  }) => (
    <div data-testid="popover" onMouseEnter={() => onOpenChange?.(true)}>
      {children}
      {open ? content : null}
    </div>
  ),
}));

vi.mock('../components/const', () => ({
  useCDN: () => 'https://cdn.example/vditor',
}));

vi.mock('../components/style', () => ({
  default: () => ({
    wrapSSR: (node: React.ReactNode) => node,
    componentCls: 'markdown-vditor',
    hashId: 'hash',
  }),
}));

describe('Display', () => {
  beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, 'innerText', {
      configurable: true,
      get() {
        return this.textContent;
      },
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    document.getElementById('custom-image-preview')?.remove();
  });

  it('renders markdown preview and opens image preview from rendered images', async () => {
    render(<Display value="image markdown" />);

    await waitFor(() =>
      expect(Vditor.preview).toHaveBeenCalledWith(expect.any(HTMLDivElement), 'image markdown', {
        mode: 'light',
        cdn: 'https://cdn.example/vditor',
      }),
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    fireEvent.click(document.querySelector('img') as HTMLImageElement);
    expect(document.getElementById('custom-image-preview')).toBeInTheDocument();
    fireEvent.click(document.querySelector('img') as HTMLImageElement);
    expect(document.querySelectorAll('#custom-image-preview')).toHaveLength(1);
    fireEvent.click(document.getElementById('custom-image-preview') as HTMLElement);
    expect(document.getElementById('custom-image-preview')).not.toBeInTheDocument();
  });

  it('renders an empty preview without running the outer markdown effect when value is empty', async () => {
    render(<Display />);

    await waitFor(() =>
      expect(Vditor.preview).toHaveBeenCalledWith(expect.any(HTMLDivElement), '', {
        mode: 'light',
        cdn: 'https://cdn.example/vditor',
      }),
    );
    expect(Vditor.md2html).not.toHaveBeenCalled();
  });

  it('converts markdown to plain text in ellipsis mode', async () => {
    vi.mocked(Vditor.md2html).mockResolvedValue('<h1>Hello</h1><p>World</p>');

    render(<Display value="# Hello" ellipsis />);

    await waitFor(() => expect(screen.getByText('HelloWorld')).toBeInTheDocument());
    expect(Vditor.md2html).toHaveBeenCalledWith('# Hello', {
      mode: 'light',
      cdn: 'https://cdn.example/vditor',
    });
  });

  it('keeps ellipsis text empty when markdown conversion fails', async () => {
    vi.mocked(Vditor.md2html).mockRejectedValue(new Error('parse failed'));

    const { container } = render(<Display value="# Hello" ellipsis />);

    await waitFor(() => expect(Vditor.md2html).toHaveBeenCalled());
    expect(container.textContent).toBe('');
  });

  it('opens the ellipsis popover only when the text overflows', async () => {
    vi.mocked(Vditor.md2html).mockResolvedValue('<p>Overflow text</p>');
    const createRangeSpy = vi.spyOn(document, 'createRange').mockReturnValue({
      selectNodeContents: vi.fn(),
      getBoundingClientRect: () => ({ width: 200 }) as DOMRect,
    } as unknown as Range);

    render(<Display value="Overflow text" ellipsis />);

    const text = await screen.findByText('Overflow text');
    Object.defineProperty(text, 'offsetWidth', { configurable: true, value: 100 });
    Object.defineProperty(text, 'scrollWidth', { configurable: true, value: 200 });
    Object.defineProperty(text, 'clientWidth', { configurable: true, value: 100 });

    fireEvent.mouseEnter(text);
    fireEvent.mouseEnter(screen.getByTestId('popover'));

    await waitFor(() =>
      expect(Vditor.preview).toHaveBeenCalledWith(expect.any(HTMLDivElement), 'Overflow text', {
        mode: 'light',
        cdn: 'https://cdn.example/vditor',
      }),
    );
    createRangeSpy.mockRestore();
  });

  it('does not open the ellipsis popover when content fits', async () => {
    vi.mocked(Vditor.md2html).mockResolvedValue('<p>Short text</p>');
    const createRangeSpy = vi.spyOn(document, 'createRange').mockReturnValue({
      selectNodeContents: vi.fn(),
      getBoundingClientRect: () => ({ width: 50 }) as DOMRect,
    } as unknown as Range);

    render(<Display value="Short text" ellipsis />);

    const text = await screen.findByText('Short text');
    Object.defineProperty(text, 'offsetWidth', { configurable: true, value: 100 });
    Object.defineProperty(text, 'scrollWidth', { configurable: true, value: 50 });
    Object.defineProperty(text, 'clientWidth', { configurable: true, value: 100 });

    fireEvent.mouseEnter(text);
    fireEvent.mouseEnter(screen.getByTestId('popover'));

    expect(Vditor.preview).not.toHaveBeenCalled();
    createRangeSpy.mockRestore();
  });
});
