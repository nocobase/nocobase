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
import InnerPageApp from '../demos/MobileTabBar-inner-page';

describe('MobileLayout', () => {
  test('enableTabBar: false', async () => {
    render(<BasicApp />);
    await waitForApp();
    await waitFor(() => {
      expect(screen.queryByText('Home')).toBeInTheDocument(); // title
      expect(screen.queryByText('Message')).not.toBeInTheDocument(); // tabBar 内容 item
    });
  });

  test('inner page', async () => {
    render(<InnerPageApp />);
    await waitForApp();
    await waitFor(() => {
      expect(screen.queryByText('custom-page')).toBeInTheDocument(); // custom page content
      expect(screen.queryByText('Message')).not.toBeInTheDocument(); // tabBar 内容 item
    });
  });
});
