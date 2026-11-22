/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css } from '@emotion/css';
import { render } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { FormItem, formItemStyle, verticalFormItemLabelStyle } from '../FormItem';

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

  it.each([undefined, 'detail-margin'])('preserves caller classes with margin class %s', (itemMarginClassName) => {
    const colorClass = css({ color: 'red' });
    const sizeClass = css({ fontSize: 13 });
    const { container } = render(
      <FormItem className={`${colorClass} ${sizeClass}`} itemMarginClassName={itemMarginClassName}>
        <input />
      </FormItem>,
    );

    const wrapper = container.querySelector('.ant-form-item');
    expect(wrapper).toHaveClass(colorClass, sizeClass);
    expect(wrapper.classList.contains('detail-margin')).toBe(Boolean(itemMarginClassName));
    expect(container.querySelector('input')).not.toHaveClass('detail-margin');
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
