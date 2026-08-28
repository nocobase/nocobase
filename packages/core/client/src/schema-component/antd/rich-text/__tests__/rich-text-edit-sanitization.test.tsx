/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FormItem } from '@formily/antd-v5';
import { createForm } from '@formily/core';
import { Field, FormProvider } from '@formily/react';
import { act, render, waitFor } from '@nocobase/test/client';
import { sanitizeRichTextHtml } from '@nocobase/utils';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RichText } from '../RichText';

const mockState = vi.hoisted(() => ({
  onChange: undefined as ((value: string) => void) | undefined,
  value: undefined as unknown,
}));

vi.mock('react-quill', () => ({
  default: (props: { onChange?: (value: string) => void; value?: unknown }) => {
    mockState.onChange = props.onChange;
    mockState.value = props.value;
    return null;
  },
}));

describe('RichText edit mode sanitization', () => {
  beforeEach(() => {
    mockState.onChange = undefined;
    mockState.value = undefined;
  });

  it('sanitizes a stored HTML string before passing it to ReactQuill', async () => {
    const payload = '<p>safe</p><img src="https://example.com/image.png" onerror="alert(1)"><script>alert(1)</script>';

    render(
      <FormProvider form={createForm()}>
        <Field name="content" value={payload} decorator={[FormItem]} component={[RichText]} />
      </FormProvider>,
    );

    await waitFor(() => expect(mockState.value).toBe(sanitizeRichTextHtml(payload)));
  });

  it('preserves non-string editor values', async () => {
    const delta = { ops: [{ insert: 'safe\n' }] };

    render(
      <FormProvider form={createForm()}>
        <Field name="content" value={delta} decorator={[FormItem]} component={[RichText]} />
      </FormProvider>,
    );

    await waitFor(() => expect(mockState.value).toStrictEqual(delta));
  });

  it('does not rewrite HTML returned by the active editor', async () => {
    const editorValue = '<p>Hello<br>World</p>';
    expect(sanitizeRichTextHtml(editorValue)).not.toBe(editorValue);

    render(
      <FormProvider form={createForm()}>
        <Field name="content" value="" decorator={[FormItem]} component={[RichText]} />
      </FormProvider>,
    );

    await waitFor(() => expect(mockState.onChange).toBeTypeOf('function'));
    act(() => mockState.onChange?.(editorValue));

    await waitFor(() => expect(mockState.value).toBe(editorValue));
  });
});
