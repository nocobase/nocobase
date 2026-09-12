/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  CustomHeight,
  CustomIndentUnit,
  getHeightOptions,
  normalizeHeight,
  normalizeIndentUnit,
  renderHeightDropdown,
  renderIndentDropdown,
} from '../codeFieldSettings';

describe('codeFieldSettings', () => {
  afterEach(cleanup);

  it('normalizes height and indent unit values', () => {
    expect(normalizeHeight(' 320px ')).toBe('320px');
    expect(normalizeHeight('   ')).toBe('auto');
    expect(normalizeHeight(undefined)).toBe('auto');

    expect(normalizeIndentUnit(4.8)).toBe(4);
    expect(normalizeIndentUnit(0)).toBe(2);
    expect(normalizeIndentUnit(Number.NaN)).toBe(2);
  });

  it('creates translated height options', () => {
    const ctx = {
      t: vi.fn((key: string, options: Record<string, unknown>) => `${key}:${options.ns}`),
    };

    expect(getHeightOptions(ctx)[0]).toEqual({
      label: 'Auto:@nocobase/plugin-field-code,client',
      value: 'auto',
    });
    expect(ctx.t).toHaveBeenCalledWith('Auto', {
      ns: ['@nocobase/plugin-field-code', 'client'],
    });
  });

  it('submits custom height values without closing the dropdown', () => {
    const handleChange = vi.fn();
    const setOpen = vi.fn();

    render(<CustomHeight defaultValue="300px" handleChange={handleChange} setOpen={setOpen} t={(key) => key} />);
    fireEvent.change(screen.getByPlaceholderText('e.g. 300px or 50%'), {
      target: {
        value: ' 50% ',
      },
    });
    fireEvent.click(screen.getByText('OK'));

    expect(handleChange).toHaveBeenCalledWith('50%');
  });

  it('submits custom indent unit values as positive integers', () => {
    const handleChange = vi.fn();
    const setOpen = vi.fn();

    render(<CustomIndentUnit defaultValue={3} handleChange={handleChange} setOpen={setOpen} t={(key) => key} />);
    fireEvent.change(screen.getByRole('spinbutton'), {
      target: {
        value: '5',
      },
    });
    fireEvent.click(screen.getByText('OK'));

    expect(handleChange).toHaveBeenCalledWith(5);
  });

  it('renders dropdown additions with custom defaults', () => {
    const ctx = {
      t: (key: string) => key,
    };
    const setOpen = vi.fn();
    const handleChange = vi.fn();

    const { rerender } = render(<>{renderHeightDropdown(ctx, <div>menu</div>, setOpen, handleChange, '360px')}</>);

    expect(screen.getByText('menu')).toBeTruthy();
    expect(screen.getByDisplayValue('360px')).toBeTruthy();

    rerender(<>{renderIndentDropdown(ctx, <div>menu</div>, setOpen, handleChange, 3)}</>);
    expect(screen.getByDisplayValue('3')).toBeTruthy();
  });
});
