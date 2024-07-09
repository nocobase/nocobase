/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { act, render, screen, userEvent, waitFor, waitForApp } from '@nocobase/test/client';
import App from '../demos/Mobile-basic';

describe('Mobile', () => {
  test('desktop mode', async () => {
    render(<App />);
    await waitForApp();

    await waitFor(() => {
      await expect(screen.queryByTestId('ui-editor-button')).toBeInTheDocument();
    });

    await waitFor(() => {
      await expect(screen.queryAllByText('Test1')).toHaveLength(2);
      await expect(screen.queryByText('Test2')).toBeInTheDocument();
      await expect(screen.queryByText('Tab1')).toBeInTheDocument();
      await expect(screen.queryByText('Tab2')).toBeInTheDocument();
      await expect(screen.queryByText('Tab1 Content')).toBeInTheDocument();
    });

    await act(async () => {
      await userEvent.click(screen.queryByText('Tab2'));
    });
    await waitFor(() => {
      await expect(screen.queryByText('Tab2 Content')).toBeInTheDocument();
    });
  });
});
