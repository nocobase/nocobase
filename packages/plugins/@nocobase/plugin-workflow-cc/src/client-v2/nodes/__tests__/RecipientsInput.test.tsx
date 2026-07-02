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
import { afterEach, describe, expect, it, vi } from 'vitest';

const holder = vi.hoisted(() => ({
  userSelect: vi.fn(),
}));

vi.mock('@nocobase/plugin-notification-manager/client-v2', () => ({
  UserSelect: (props: Record<string, unknown>) => {
    holder.userSelect(props);
    return <input aria-label="recipient-user-select" readOnly value={String(props.value ?? '')} />;
  },
}));

vi.mock('../../locale', () => ({
  useT: () => (key: string) => key,
}));

import { RecipientsInput } from '../components/RecipientsInput';

afterEach(() => {
  vi.clearAllMocks();
});

describe('RecipientsInput', () => {
  it('normalizes numeric user ids for the v2 user selector and preserves them when echoed back', () => {
    const onChange = vi.fn();
    const value = [1, { filter: { $and: [] } }];

    render(<RecipientsInput value={value} onChange={onChange} />);

    expect(holder.userSelect).toHaveBeenNthCalledWith(1, expect.objectContaining({ value: '1' }));
    expect(holder.userSelect).toHaveBeenNthCalledWith(2, expect.objectContaining({ value: value[1] }));

    holder.userSelect.mock.calls[0][0].onChange('1');
    expect(onChange).toHaveBeenLastCalledWith([1, value[1]]);
  });

  it('supports adding selected users and user queries with the original value shape', async () => {
    const onChange = vi.fn();

    render(<RecipientsInput value={[1]} onChange={onChange} />);

    fireEvent.mouseEnter(screen.getByRole('button', { name: /Add/ }));
    fireEvent.click(await screen.findByRole('button', { name: 'Select users' }));
    expect(onChange).toHaveBeenLastCalledWith([1, '']);

    fireEvent.mouseEnter(screen.getByRole('button', { name: /Add/ }));
    fireEvent.click(await screen.findByRole('button', { name: 'Query users' }));
    expect(onChange).toHaveBeenLastCalledWith([1, { filter: {} }]);
  });

  it('can remove and reorder recipients without changing the stored item shape', () => {
    const onChange = vi.fn();
    const value = [1, '2', { filter: { name: { $includes: 'a' } } }];

    render(<RecipientsInput value={value} onChange={onChange} />);

    fireEvent.click(screen.getAllByLabelText('Move recipient down')[0]);
    expect(onChange).toHaveBeenLastCalledWith(['2', 1, value[2]]);

    fireEvent.click(screen.getAllByLabelText('Move recipient up')[2]);
    expect(onChange).toHaveBeenLastCalledWith([1, value[2], '2']);

    fireEvent.click(screen.getAllByLabelText('Remove recipient')[1]);
    expect(onChange).toHaveBeenLastCalledWith([1, value[2]]);
  });

  it('hides mutation controls when disabled but still renders selected recipients', () => {
    render(<RecipientsInput disabled value={[1]} />);

    expect(screen.getByLabelText('recipient-user-select')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Add/ })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Remove recipient')).not.toBeInTheDocument();
  });
});
