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
import Basic from '../../demos/pages-navigation-bar-basic';
import NavFalse from '../../demos/pages-navigation-bar-false';
import NavTitleFalse from '../../demos/pages-navigation-bar-title-false';
import NavTabs from '../../demos/pages-page-tabs';

describe('MobilePageNavigationBar', () => {
  it('basic', async () => {
    render(<Basic />);
    await waitForApp();

    await waitFor(() => {
      expect(screen.queryByText('Title')).toBeInTheDocument();
    });
  });

  it('displayNavigationBar: false', async () => {
    render(<NavFalse />);
    await waitForApp();

    await waitFor(() => {
      expect(screen.queryByText('Title')).not.toBeInTheDocument();
    });
  });

  it('displayPageTitle: false', async () => {
    render(<NavTitleFalse />);
    await waitForApp();

    await waitFor(() => {
      expect(screen.queryByText('Title')).not.toBeInTheDocument();
    });
  });

  it('displayTabs: true', async () => {
    render(<NavTabs />);
    await waitForApp();

    await waitFor(() => {
      expect(screen.queryByText('Tab1')).toBeInTheDocument();
      expect(screen.queryByText('Tab2')).toBeInTheDocument();
      expect(screen.queryByText('/page/page1/tabs/tab1')).toBeInTheDocument();
    });

    await act(async () => {
      await userEvent.click(screen.getByText('Tab2'));
    });
    await waitFor(() => {
      expect(screen.queryByText('Tab1')).toBeInTheDocument();
      expect(screen.queryByText('Tab2')).toBeInTheDocument();
      expect(screen.queryByText('/page/page1/tabs/tab2')).toBeInTheDocument();
    });
  });
});
