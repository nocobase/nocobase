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
import { InputNumberField } from '../NumberFieldModel';

describe('InputNumberField', () => {
  it('keeps the existing number value type for regular input', () => {
    const onChange = vi.fn();

    render(<InputNumberField stringMode onChange={onChange} />);
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '123' } });

    expect(onChange).toHaveBeenLastCalledWith(123);
    expect(onChange).not.toHaveBeenCalledWith('123');
  });

  it('preserves a high-precision decimal string in string mode', () => {
    const onChange = vi.fn();
    const value = '123456789012345678901234567890';

    render(<InputNumberField stringMode onChange={onChange} />);
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value } });

    expect(onChange).toHaveBeenLastCalledWith(value);
    expect(screen.getByRole('spinbutton')).toHaveValue(value);
  });

  it('does not switch to scientific notation at the 22-digit boundary', () => {
    const onChange = vi.fn();
    const value = '1234567890123458152112';

    render(<InputNumberField stringMode onChange={onChange} />);
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value } });

    expect(onChange).toHaveBeenLastCalledWith(value);
    expect(onChange).not.toHaveBeenCalledWith('1.234567890123458152112e+21');
  });
});
