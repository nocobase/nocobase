/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { App } from 'antd';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import EnvironmentPage, { BulkImportForm } from '../EnvironmentPage';

const mocks = vi.hoisted(() => ({
  api: {
    request: vi.fn(),
    resource: vi.fn(() => ({ destroy: vi.fn() })),
    toErrMessages: vi.fn(),
  },
  viewer: {
    drawer: vi.fn(),
  },
  flowView: {
    close: vi.fn(),
    Footer: undefined as React.ComponentType<React.PropsWithChildren>,
  },
  modal: {
    confirm: vi.fn(),
  },
  notification: {
    error: vi.fn(),
  },
  requestServices: [] as Array<() => Promise<unknown>>,
  requestOptions: [] as Array<{ onError?: (error: Error) => void }>,
  requestResult: {
    data: { data: [], meta: {} },
    loading: false,
    refresh: vi.fn(),
  },
}));

vi.mock('@nocobase/flow-engine', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/flow-engine')>();
  return {
    ...actual,
    useFlowContext: () => ({ api: mocks.api, viewer: mocks.viewer }),
    useFlowView: () => mocks.flowView,
    useFlowEngine: () => ({
      context: {
        t: (key: string, options?: Record<string, unknown>) =>
          key.replace('{{line}}', typeof options?.line === 'number' ? String(options.line) : ''),
      },
    }),
  };
});

vi.mock('ahooks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('ahooks')>();
  return {
    ...actual,
    useRequest: (service: () => Promise<unknown>, options?: { onError?: (error: Error) => void }) => {
      mocks.requestServices.push(service);
      mocks.requestOptions.push(options || {});
      return mocks.requestResult;
    },
  };
});

describe('BulkImportForm', () => {
  let appUseAppSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requestServices.length = 0;
    mocks.requestOptions.length = 0;
    mocks.flowView.Footer = ({ children }) => <>{children}</>;
    appUseAppSpy = vi.spyOn(App, 'useApp').mockReturnValue({
      modal: mocks.modal,
      notification: mocks.notification,
    } as ReturnType<typeof App.useApp>);
  });

  afterEach(() => {
    appUseAppSpy.mockRestore();
  });

  it('shows line validation errors and does not submit invalid names', async () => {
    render(<BulkImportForm onSubmitted={vi.fn()} />);

    fireEvent.change(screen.getAllByRole('textbox')[0], {
      target: { value: '=invalid-empty-name\n123=456' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(await screen.findByText('Line 1: variable name cannot be empty.')).toBeInTheDocument();
    expect(
      screen.getByText('Line 2: only letters, numbers and underscores are allowed, and it must start with a letter.'),
    ).toBeInTheDocument();
    expect(mocks.api.request).not.toHaveBeenCalled();
    expect(mocks.flowView.close).not.toHaveBeenCalled();
  });

  it('submits valid variables and closes the drawer', async () => {
    const onSubmitted = vi.fn();
    mocks.api.request.mockResolvedValue({ data: {} });
    mocks.flowView.close.mockResolvedValue(undefined);
    render(<BulkImportForm onSubmitted={onSubmitted} />);

    const textareas = screen.getAllByRole('textbox');
    fireEvent.change(textareas[0], { target: { value: 'FOO=a=b' } });
    fireEvent.change(textareas[1], { target: { value: 'SECRET=123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() =>
      expect(mocks.api.request).toHaveBeenCalledWith({
        url: 'environmentVariables:create',
        method: 'post',
        data: [
          { name: 'FOO', value: 'a=b', type: 'default' },
          { name: 'SECRET', value: '123', type: 'secret' },
        ],
      }),
    );
    expect(onSubmitted).toHaveBeenCalledTimes(1);
    expect(mocks.flowView.close).toHaveBeenCalledTimes(1);
  });

  it('shows server errors and keeps the drawer open', async () => {
    const onSubmitted = vi.fn();
    const requestError = new Error('Request failed');
    mocks.api.request.mockRejectedValue(requestError);
    mocks.api.toErrMessages.mockReturnValue([{ message: 'Name validation failed' }]);
    render(<BulkImportForm onSubmitted={onSubmitted} />);

    fireEvent.change(screen.getAllByRole('textbox')[0], { target: { value: 'FOO=123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() =>
      expect(mocks.notification.error).toHaveBeenCalledWith({
        message: 'Bulk import failed',
        description: 'Name validation failed',
        role: 'alert',
      }),
    );
    expect(onSubmitted).not.toHaveBeenCalled();
    expect(mocks.flowView.close).not.toHaveBeenCalled();
  });
});

describe('EnvironmentPage filters', () => {
  let appUseAppSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requestServices.length = 0;
    mocks.requestOptions.length = 0;
    appUseAppSpy = vi.spyOn(App, 'useApp').mockReturnValue({
      modal: mocks.modal,
      notification: mocks.notification,
    } as ReturnType<typeof App.useApp>);
  });

  afterEach(() => {
    appUseAppSpy.mockRestore();
  });

  it('shows an error notification when a submitted filter request fails', async () => {
    mocks.api.request.mockResolvedValue({ data: { data: [], meta: {} } });
    mocks.api.toErrMessages.mockReturnValue([{ message: 'Invalid filter query' }]);
    render(<EnvironmentPage />);

    fireEvent.click(screen.getByRole('button', { name: /Filter/i }));
    fireEvent.click(await screen.findByText('Add condition'));

    const fieldPlaceholder = await screen.findByText('Select field');
    const fieldSelector = fieldPlaceholder.closest('.ant-select-selector');
    if (!fieldSelector) {
      throw new Error('Expected the filter field selector');
    }
    fireEvent.mouseDown(fieldSelector);
    const typeOptions = await screen.findAllByText('Type');
    fireEvent.click(typeOptions[typeOptions.length - 1]);

    const popover = document.querySelector('.ant-popover');
    const selectors = popover?.querySelectorAll('.ant-select-selector');
    if (!selectors || selectors.length < 4) {
      throw new Error('Expected the type value selector');
    }
    fireEvent.mouseDown(selectors[3]);
    fireEvent.click(await screen.findByText('Plain text'));
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(mocks.requestOptions.length).toBeGreaterThan(1);
    });
    await act(async () => {
      await mocks.requestServices.at(-1)?.();
    });
    expect(mocks.api.request).toHaveBeenCalledWith({
      url: 'environmentVariables',
      method: 'get',
      params: {
        paginate: false,
        filter: { $and: [{ type: { $eq: ['default'] } }] },
      },
      skipNotify: true,
    });

    const requestError = new Error('Request failed');
    act(() => {
      mocks.requestOptions.at(-1)?.onError?.(requestError);
    });

    expect(mocks.notification.error).toHaveBeenCalledWith({
      message: 'Filter failed',
      description: 'Invalid filter query',
      role: 'alert',
    });
  });
});
