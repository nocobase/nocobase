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
import { JsonTextArea } from '../JsonTextArea';

describe('JsonTextArea', () => {
  it('formats object values and emits parsed JSON on blur', async () => {
    const handleChange = vi.fn();

    render(<JsonTextArea value={{ foo: 'bar' }} onChange={handleChange} />);

    const textArea = await screen.findByRole('textbox');
    expect(textArea).toHaveValue('{\n  "foo": "bar"\n}');

    fireEvent.change(textArea, { target: { value: '{"foo":"baz"}' } });
    fireEvent.blur(textArea);

    expect(handleChange).toHaveBeenCalledWith({ foo: 'baz' });
    expect(textArea).toHaveValue('{\n  "foo": "baz"\n}');
  });

  it('shows JSON parse errors and does not emit invalid values', async () => {
    const handleChange = vi.fn();

    render(<JsonTextArea value={{}} onChange={handleChange} />);

    const textArea = await screen.findByRole('textbox');
    fireEvent.change(textArea, { target: { value: '{' } });
    fireEvent.blur(textArea);

    expect(handleChange).not.toHaveBeenCalled();
    expect(await screen.findByText(/JSON/)).toBeInTheDocument();
  });
});
