/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { createStaticInputRenderer } from '../utils';

// Mock DateFilterDynamicComponent to a lightweight component
vi.mock('../../../../schema-component', () => {
  return {
    DateFilterDynamicComponent: (props: any) => (
      <button data-testid="date-filter" onClick={() => props.onChange?.('DATE_PICKED')}>
        date-filter
      </button>
    ),
  };
});

describe('createStaticInputRenderer', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('renders default Input when x-component is unknown and merges props', async () => {
    const schema = {
      'x-component': 'Unknown',
      'x-component-props': { placeholder: 'fromSchema', style: { color: 'red' } },
    };
    const meta: any = {
      uiSchema: { 'x-component-props': { placeholder: 'fromMeta', style: { fontSize: 12 } } },
    };
    const t = (s: string) => s;
    const Comp = createStaticInputRenderer(schema, meta, t);
    const onChange = vi.fn();
    render(<Comp value={''} onChange={onChange} />);

    const input = screen.getByPlaceholderText('fromSchema') as HTMLInputElement; // schema props override meta props
    expect(input).toBeInTheDocument();
    // change value
    fireEvent.change(input, { target: { value: 'abc' } });
    expect(onChange).toHaveBeenCalledWith('abc');
  });

  it('renders Switch and calls onChange with boolean', async () => {
    const schema = { 'x-component': 'Switch' };
    const t = (s: string) => s;
    const Comp = createStaticInputRenderer(schema, null as any, t);
    const onChange = vi.fn();
    render(<Comp value={false} onChange={onChange} />);

    const sw = screen.queryByRole('switch') || screen.getByRole('checkbox');
    fireEvent.click(sw as Element);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('renders DateFilterDynamicComponent and proxies onChange', async () => {
    const schema = { 'x-component': 'DateFilterDynamicComponent' };
    const t = (s: string) => s;
    const Comp = createStaticInputRenderer(schema, null as any, t);
    const onChange = vi.fn();
    render(<Comp value={''} onChange={onChange} />);

    fireEvent.click(screen.getByTestId('date-filter'));
    expect(onChange).toHaveBeenCalledWith('DATE_PICKED');
  });
});
