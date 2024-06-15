/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { fireEvent, render, screen, userEvent, waitFor } from '@nocobase/test/client';
import React from 'react';
import App from '../demos/icon-picker';

describe('IconPicker', () => {
  it('should display all icons when click the button', async () => {
    const { container } = render(<App />);

    const button = container.querySelector('button') as HTMLButtonElement;
    await userEvent.click(button);

    expect(screen.getByText('Icon')).toHaveTextContent(`Icon`);
    expect(screen.queryAllByRole('img').length).toBe(422);
  });

  it.skip('should display the selected icon', async () => {
    const { container } = render(<App />);

    const button = container.querySelector('button') as HTMLButtonElement;
    await userEvent.click(button);

    const icon = screen.queryAllByRole('img')[0];
    await userEvent.click(icon);

    const icons = screen.queryAllByRole('img');
    // 被选中的图标
    expect(icons[0]).toEqual(icon);
    // 在 Read pretty 中显示的被选中的图标
    expect(icons[2]).toEqual(icon);

    // 清除按钮图标
    await userEvent.click(icons[1]);
    expect(screen.queryAllByRole('img').length).toBe(0);
  }, 300000);

  it.only('should filter the displayed icons when changing the value of search input', async () => {
    const { container } = render(<App />);

    await waitFor(() => {
      const button = container.querySelector('button') as HTMLButtonElement;
      userEvent.click(button);
    });

    const searchInput = screen.queryByRole('search') as HTMLInputElement;
    await userEvent.type(searchInput, 'left');
    expect(screen.queryAllByRole('img').length).toBeLessThan(422);
  });
});
