/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { App } from 'antd';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BulkImportForm, VariableForm } from '../pages/EnvironmentPage';

const state = vi.hoisted(() => ({
  close: vi.fn(),
  notificationError: vi.fn(),
  request: vi.fn(),
  toErrMessages: vi.fn(),
}));

vi.mock('@nocobase/flow-engine', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/flow-engine')>();
  const view = {
    close: state.close,
    Footer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  };
  const context = {
    api: {
      request: state.request,
      toErrMessages: state.toErrMessages,
    },
  };

  return {
    ...actual,
    useFlowContext: () => context,
    useFlowEngine: () => ({ context: { t: (key: string) => key } }),
    useFlowView: () => view,
  };
});

describe('plugin-environment-variables client-v2 forms', () => {
  beforeEach(() => {
    state.close.mockReset();
    state.notificationError.mockReset();
    state.request.mockReset();
    state.toErrMessages.mockReset();
    vi.spyOn(App, 'useApp').mockReturnValue({
      notification: { error: state.notificationError },
    } as ReturnType<typeof App.useApp>);
  });

  it('shows the API error and keeps the drawer open when creating a duplicate variable', async () => {
    const duplicateError = new Error('Request failed with status code 400');
    state.request.mockRejectedValue(duplicateError);
    state.toErrMessages.mockReturnValue([{ message: 'Name already exists' }]);
    const onSubmitted = vi.fn();

    render(<VariableForm mode="create" onSubmitted={onSubmitted} title="Add variable" />);

    fireEvent.change(screen.getByLabelText('Name :'), { target: { value: 'DUPLICATE_NAME' } });
    fireEvent.change(screen.getByLabelText('Value :'), { target: { value: 'value' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(state.notificationError).toHaveBeenCalledWith({ message: 'Name already exists' });
    });
    expect(state.toErrMessages).toHaveBeenCalledWith(duplicateError);
    expect(onSubmitted).not.toHaveBeenCalled();
    expect(state.close).not.toHaveBeenCalled();
  });

  it('refreshes the list and closes the drawer after creating a variable successfully', async () => {
    state.request.mockResolvedValue({ data: { data: {} } });
    const onSubmitted = vi.fn();

    render(<VariableForm mode="create" onSubmitted={onSubmitted} title="Add variable" />);

    fireEvent.change(screen.getByLabelText('Name :'), { target: { value: 'NEW_NAME' } });
    fireEvent.change(screen.getByLabelText('Value :'), { target: { value: 'value' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(state.request).toHaveBeenCalledWith({
        url: 'environmentVariables:create',
        method: 'post',
        data: { name: 'NEW_NAME', type: 'default', value: 'value' },
      });
    });
    expect(onSubmitted).toHaveBeenCalledTimes(1);
    expect(state.close).toHaveBeenCalledTimes(1);
    expect(state.notificationError).not.toHaveBeenCalled();
  });

  it('shows the API error and preserves bulk import input when a duplicate variable is included', async () => {
    state.request.mockRejectedValue(new Error('Request failed with status code 400'));
    state.toErrMessages.mockReturnValue([{ message: 'Name already exists' }]);
    const onSubmitted = vi.fn();

    render(<BulkImportForm onSubmitted={onSubmitted} />);

    fireEvent.change(screen.getByLabelText('Plain text :'), { target: { value: 'DUPLICATE_NAME=value' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(state.notificationError).toHaveBeenCalledWith({ message: 'Name already exists' });
    });
    expect(screen.getByLabelText('Plain text :')).toHaveValue('DUPLICATE_NAME=value');
    expect(onSubmitted).not.toHaveBeenCalled();
    expect(state.close).not.toHaveBeenCalled();
  });
});
