/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { render, screen, waitFor, waitForApp } from '@nocobase/test/client';
import BasicApp from '../demos/MobileTabBar-basic';
import FalseApp from '../demos/MobileTabBar-false';
import InnerPageApp from '../demos/MobileTabBar-inner-page';

describe('MobileTabBar', () => {
  test('basic', async () => {
    render(<BasicApp />);
    await waitForApp();
    await waitFor(() => {
      expect(screen.queryByText('Test1')).toBeInTheDocument(); // title
      expect(screen.queryByText('Test2')).toBeInTheDocument(); // title
    });
  });

  test('enableTabBar: false', async () => {
    render(<FalseApp />);
    await waitForApp();
    await waitFor(() => {
      expect(screen.queryByText('Test1')).not.toBeInTheDocument(); // title
      expect(screen.queryByText('Test2')).not.toBeInTheDocument(); // title
    });
  });

  test('inner page', async () => {
    render(<InnerPageApp />);
    await waitForApp();
    await waitFor(() => {
      expect(screen.queryByText('inner page')).toBeInTheDocument(); // custom page content
      expect(screen.queryByText('Test1')).not.toBeInTheDocument();
      expect(screen.queryByText('Test2')).not.toBeInTheDocument();
    });
  });
});
