/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ImeSafeTextInput } from '../../../components/ImeSafeTextInput';

const PlainInput = (props: any) => <input aria-label="ime-safe-input" {...props} />;
const PlainTextArea = (props: any) => <textarea aria-label="ime-safe-textarea" {...props} />;

describe('ImeSafeTextInput', () => {
  it('keeps local draft when parent rerenders stale input value', () => {
    const onChange = vi.fn();
    const { rerender } = render(<ImeSafeTextInput component={PlainInput} value="" onChange={onChange} />);

    const input = screen.getByLabelText('ime-safe-input');
    fireEvent.change(input, { target: { value: 'te' } });

    expect((input as HTMLInputElement).value).toBe('te');
    expect(onChange).toHaveBeenCalledTimes(1);

    rerender(<ImeSafeTextInput component={PlainInput} value="" onChange={onChange} />);

    expect((screen.getByLabelText('ime-safe-input') as HTMLInputElement).value).toBe('te');
  });

  it('defers input commit until composition ends', () => {
    const onChange = vi.fn();
    render(<ImeSafeTextInput component={PlainInput} value="" onChange={onChange} />);

    const input = screen.getByLabelText('ime-safe-input');
    fireEvent.compositionStart(input);
    fireEvent.change(input, { target: { value: 'te' }, nativeEvent: { isComposing: true } });

    expect((input as HTMLInputElement).value).toBe('te');
    expect(onChange).not.toHaveBeenCalled();

    fireEvent.compositionEnd(input, { target: { value: 'tét' } });
    fireEvent.change(input, { target: { value: 'tét' }, nativeEvent: { isComposing: false } });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect((input as HTMLInputElement).value).toBe('tét');
  });

  it('keeps local draft for textarea when parent rerenders stale value', () => {
    const onChange = vi.fn();
    const { rerender } = render(<ImeSafeTextInput component={PlainTextArea} value="" onChange={onChange} />);

    const textarea = screen.getByLabelText('ime-safe-textarea');
    fireEvent.change(textarea, { target: { value: 'te' } });

    expect((textarea as HTMLTextAreaElement).value).toBe('te');
    expect(onChange).toHaveBeenCalledTimes(1);

    rerender(<ImeSafeTextInput component={PlainTextArea} value="" onChange={onChange} />);

    expect((screen.getByLabelText('ime-safe-textarea') as HTMLTextAreaElement).value).toBe('te');
  });
});
