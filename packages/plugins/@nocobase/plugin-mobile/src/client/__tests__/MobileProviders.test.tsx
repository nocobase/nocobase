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
import MobileTitleProviderApp from '../demos/MobileTitleProvider-basic';
import MobileRoutesProviderApp from '../demos/MobileRoutesProvider-basic';

describe('MobileProviders', () => {
  test('MobileTitleProvider', async () => {
    render(<MobileTitleProviderApp />);
    await waitFor(() => {
      expect(screen.queryByText('Set Title')).toBeInTheDocument();
    });
    await act(async () => {
      await userEvent.click(screen.queryByText('Set Title'));
    });
    await waitFor(() => {
      expect(screen.queryByText('Hello World')).toBeInTheDocument();
    });
  });

  test('MobileRoutesProvider', async () => {
    render(<MobileRoutesProviderApp />);
    await waitForApp();

    await waitFor(() => {
      expect(screen.queryByText('Test1')).toBeInTheDocument();
      expect(screen.queryByText('2')).toBeInTheDocument();
    });
  });
});
