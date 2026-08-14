/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { render, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Display } from '../Display';

const mocks = vi.hoisted(() => ({
  isDarkTheme: false,
  md2html: vi.fn(),
  preview: vi.fn(),
  removeMarkdownIframes: vi.fn(),
}));

vi.mock('@nocobase/client-v2', () => ({
  removeMarkdownIframes: mocks.removeMarkdownIframes,
  stripMarkdownIframes: (html: string) => html,
}));

vi.mock('@nocobase/flow-engine', () => ({
  useFlowContext: () => ({ isDarkTheme: mocks.isDarkTheme }),
}));

vi.mock('vditor', () => ({
  default: {
    md2html: mocks.md2html,
    preview: mocks.preview,
  },
}));

vi.mock('../const', () => ({
  useCDN: () => 'https://cdn.example.com/vditor',
}));

vi.mock('../style', () => ({
  default: () => ({
    componentCls: 'nb-field-markdown-vditor',
    hashId: 'test-hash',
    wrapSSR: (node: React.ReactNode) => node,
  }),
}));

describe('Markdown Vditor Display', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isDarkTheme = false;
    mocks.md2html.mockResolvedValue('');
    mocks.preview.mockResolvedValue(undefined);
  });

  it('uses the light Vditor content theme in light mode', async () => {
    render(<Display value="# Markdown" />);

    await waitFor(() => {
      expect(mocks.preview).toHaveBeenCalledWith(
        expect.any(HTMLDivElement),
        '# Markdown',
        expect.objectContaining({
          mode: 'light',
          theme: { current: 'light' },
        }),
      );
    });
  });

  it('rerenders the preview with the dark content theme after a theme change', async () => {
    const { rerender } = render(<Display value="# Markdown" />);

    await waitFor(() => {
      expect(mocks.preview).toHaveBeenCalledWith(
        expect.any(HTMLDivElement),
        '# Markdown',
        expect.objectContaining({
          mode: 'light',
          theme: { current: 'light' },
        }),
      );
    });

    mocks.preview.mockClear();
    mocks.isDarkTheme = true;
    rerender(<Display value="# Markdown" />);

    await waitFor(() => {
      expect(mocks.preview).toHaveBeenCalledWith(
        expect.any(HTMLDivElement),
        '# Markdown',
        expect.objectContaining({
          mode: 'dark',
          theme: { current: 'dark' },
        }),
      );
    });
  });
});
