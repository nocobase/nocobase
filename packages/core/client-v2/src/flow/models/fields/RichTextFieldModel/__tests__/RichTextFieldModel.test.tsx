/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { act, render } from '@nocobase/test/client';
import { sanitizeRichTextHtml } from '@nocobase/utils/client';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RichTextField } from '..';

const mockState = vi.hoisted(() => ({
  onChange: undefined as ((value: string) => void) | undefined,
  value: undefined as unknown,
}));

vi.mock('../../../../../flow-compat', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../../../flow-compat')>();
  return {
    ...actual,
    lazy: () => (props: { onChange?: (value: string) => void; value?: unknown }) => {
      mockState.onChange = props.onChange;
      mockState.value = props.value;
      return null;
    },
  };
});

describe('RichTextField edit mode sanitization', () => {
  beforeEach(() => {
    mockState.onChange = undefined;
    mockState.value = undefined;
  });

  it('sanitizes stored HTML before passing it to ReactQuill', () => {
    const payload = '<p>safe</p><img src="https://example.com/image.png" onerror="alert(1)"><script>alert(1)</script>';

    render(<RichTextField value={payload} onChange={vi.fn()} />);

    expect(mockState.value).toBe(sanitizeRichTextHtml(payload));
  });

  it('preserves Delta values', () => {
    const delta = { ops: [{ insert: 'safe\n' }] };

    render(<RichTextField value={delta} onChange={vi.fn()} />);

    expect(mockState.value).toBe(delta);
  });

  it('does not normalize active editor feedback', () => {
    const editorValue = '<p>Hello<br>World</p>';
    expect(sanitizeRichTextHtml(editorValue)).not.toBe(editorValue);

    const { rerender } = render(<RichTextField value="" onChange={vi.fn()} />);
    act(() => mockState.onChange?.(editorValue));
    rerender(<RichTextField value={editorValue} onChange={vi.fn()} />);

    expect(mockState.value).toBe(editorValue);
  });

  it('sanitizes subsequent external values', () => {
    const payload = '<img src=x onerror="alert(1)">';
    const { rerender } = render(<RichTextField value="" onChange={vi.fn()} />);

    rerender(<RichTextField value={payload} onChange={vi.fn()} />);

    expect(mockState.value).toBe(sanitizeRichTextHtml(payload));
  });
});
