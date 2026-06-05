/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import * as nocobaseClient from '@nocobase/client';
import { act, fireEvent, render, screen, userEvent, waitFor } from '@nocobase/test/client';
import React from 'react';
import { RestoreFromLocal } from '../components/RestoreFromLocal';
import { NAMESPACE } from '../constants';
import { createMockAppWrapper } from './testUtils';

describe('RestoreFromLocal', () => {
  const { Wrapper, mockRequest } = createMockAppWrapper();
  const mockedRestore = vi.fn().mockReturnValue({ data: { status: 'ok' } });

  beforeEach(() => {
    mockRequest.reset();
    mockRequest.onGet(`${NAMESPACE}:appInfo`).reply(200, {
      data: {
        database: {
          dialect: 'sqlite',
        },
      },
    });
  });

  const MockedRestoreFromLocal = () => {
    mockRequest.onPost(`${NAMESPACE}:upload`).reply(() => {
      return [200, mockedRestore()];
    });
    return <RestoreFromLocal />;
  };

  test('should render restore from backup button', async () => {
    render(<MockedRestoreFromLocal />, { wrapper: Wrapper });
    expect(screen.getByText('Restore backup from local')).toBeInTheDocument();
  });

  test('should trigger restore api', async () => {
    const file = new File([''], 'backup_20240818_182302_2122.nbdata', { type: 'application/octet-stream' });
    const user = userEvent.setup();
    render(<MockedRestoreFromLocal />, { wrapper: Wrapper });
    await act(async () => {
      await user.click(screen.getByText('Restore backup from local'));
    });
    await waitFor(() => {
      const fileBtn = document.querySelector('input[type="file"]') as HTMLInputElement;
      fireEvent.change(fileBtn, { target: { files: [file] } });
    });
    await act(async () => {
      await user.click(screen.getByText('Submit'));
    });
    await waitFor(() => {
      expect(mockedRestore).toHaveBeenCalled();
    });
  });
});
