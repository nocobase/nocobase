/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { cleanup, render } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FormItem, formItemStyle, verticalFormItemLabelStyle } from '../FormItem';

afterEach(() => {
  cleanup();
});

describe('FormItem', () => {
  it('keeps vertical label-to-value spacing consistent with v1', () => {
    expect(verticalFormItemLabelStyle).toEqual({
      paddingBottom: 0,
    });
  });

  it('keeps spacing between form items consistent with v1', () => {
    expect(formItemStyle).toEqual({
      marginBottom: 12,
    });
  });

  it('does not pass model-only props to the antd Form.Item DOM layout', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const Field = () => <input aria-label="field" />;

    try {
      render(
        <FormItem asterisk label="Name" titleField="name">
          <Field />
        </FormItem>,
      );

      await new Promise((resolve) => setTimeout(resolve, 0));

      const output = error.mock.calls.map((args) => args.map(String).join(' ')).join('\n');
      expect(output).not.toContain('titleField');
      expect(output).not.toContain('asterisk');
    } finally {
      error.mockRestore();
    }
  });

  it('keeps forwarding model props to custom field renderers', () => {
    const receivedProps: Array<Record<string, unknown>> = [];
    const Field = (props: Record<string, unknown>) => {
      receivedProps.push(props);
      return <input aria-label="field" />;
    };

    render(
      <FormItem label="Name" disabled titleField="name">
        <Field />
      </FormItem>,
    );

    expect(receivedProps[receivedProps.length - 1]).toMatchObject({
      disabled: true,
      titleField: 'name',
    });
  });

  it('does not forward model-internal globalSort props to field children', () => {
    const Field = vi.fn(() => <input aria-label="field" />);

    render(
      <FormItem globalSort={['title']} placeholder="Title">
        <Field />
      </FormItem>,
    );

    expect(Field).toHaveBeenCalledWith(expect.not.objectContaining({ globalSort: expect.anything() }), {});
    expect(Field).toHaveBeenCalledWith(expect.objectContaining({ placeholder: 'Title' }), {});
  });
});
