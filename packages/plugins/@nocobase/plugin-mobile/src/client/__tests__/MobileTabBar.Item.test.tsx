/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { act, render, screen, userEvent } from '@nocobase/test/client';
import BasicApp from '../demos/MobileTabBar.Item-basic';
import OnClickApp from '../demos/MobileTabBar.Item-on-click';
import SelectedApp from '../demos/MobileTabBar.Item-selected';
import SelectedIconApp from '../demos/MobileTabBar.Item-selected-icon';
import WithIconApp from '../demos/MobileTabBar.Item-with-icon';
import WithIconReactNodeApp from '../demos/MobileTabBar.Item-with-icon-node';

describe('MobileTabBar.Item', () => {
  test('Basic', () => {
    render(<BasicApp />);
    await expect(screen.getByText('Test')).toBeInTheDocument();
  });

  test('With Icon: string', () => {
    render(<WithIconApp />);
    await expect(screen.getByText('Test')).toBeInTheDocument();
    await expect(screen.queryByRole('img')).toBeInTheDocument();
  });

  test('With Icon: React.Node', () => {
    render(<WithIconReactNodeApp />);
    await expect(screen.getByText('Test')).toBeInTheDocument();
    await expect(screen.queryByRole('img')).toBeInTheDocument();
  });

  test('Selected', () => {
    render(<SelectedApp />);
    await expect(screen.getByText('Test')).toBeInTheDocument();
    await expect(document.querySelector('.adm-tab-bar-item-active')).toBeInTheDocument();
  });

  test('Selected Icon', () => {
    render(<SelectedIconApp />);
    await expect(screen.getByText('Test')).toBeInTheDocument();
    await expect(document.querySelector('.adm-tab-bar-item-active')).toBeInTheDocument();
    await expect(screen.queryByRole('img')).toHaveAttribute('aria-label', 'appstore-add');
  });

  test('onClick', async () => {
    render(<OnClickApp />);
    await expect(screen.getByText('Test')).toBeInTheDocument();
    await act(async () => {
      await userEvent.click(screen.getByText('Test'));
    });
    await expect(screen.getByText('Clicked')).toBeInTheDocument();
  });
});
