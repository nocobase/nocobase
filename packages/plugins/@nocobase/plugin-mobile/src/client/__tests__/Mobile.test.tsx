/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { act, render, screen, userEvent, waitFor, waitForApp } from '@nocobase/test/client';
import React from 'react';
import App from '../demos/Mobile-basic';

describe.skip('Mobile', () => {
  test('desktop mode', async () => {
    render(<App />);
    await waitForApp();

    await waitFor(() => {
      expect(screen.queryByTestId('ui-editor-button')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.queryAllByText('Test1')).toHaveLength(2);
      expect(screen.queryByText('Test2')).toBeInTheDocument();
      expect(screen.queryByText('Tab1')).toBeInTheDocument();
      expect(screen.queryByText('Tab2')).toBeInTheDocument();
      expect(screen.queryByText('Tab1 Content')).toBeInTheDocument();
    });

    await act(async () => {
      await userEvent.click(screen.queryByText('Tab2'));
    });
    await waitFor(() => {
      expect(screen.queryByText('Tab2 Content')).toBeInTheDocument();
    });
  });
});
