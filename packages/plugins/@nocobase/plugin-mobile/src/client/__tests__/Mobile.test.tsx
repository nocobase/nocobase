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
      expect(screen.queryByTestId('ui-editor-button')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.queryByText('Home')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.queryByText('Message')).toBeInTheDocument();
      expect(screen.queryByText('Github')).toBeInTheDocument();
    });

    await act(async () => {
      await userEvent.click(screen.queryByText('Message'));
    });
    await waitFor(() => {
      expect(screen.queryByText('Unread Message')).toBeInTheDocument();
      expect(screen.queryByText('Read Message')).toBeInTheDocument();
    });
  });
});
