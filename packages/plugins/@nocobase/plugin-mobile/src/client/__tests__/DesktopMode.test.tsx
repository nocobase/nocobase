/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import App from '../demos/DesktopMode-basic';
import { act, render, screen, userEvent, waitFor, waitForApp } from '@nocobase/test/client';

describe('DesktopMode', () => {
  it('basic', async () => {
    render(<App />);
    await waitForApp();

    // back
    expect(screen.queryByRole('link')).toHaveAttribute('href', '/admin');

    // ui-editor
    expect(screen.queryByTestId('ui-editor-button')).toBeInTheDocument();

    // size
    await act(async () => {
      await userEvent.click(screen.queryByTestId('desktop-mode-size-pad'));
    });
    await waitFor(() => {
      expect(screen.queryByTestId('desktop-mode-resizable').style.width).toBe('768px');
      expect(screen.queryByTestId('desktop-mode-resizable').style.height).toBe('667px');
    });
    await act(async () => {
      await userEvent.click(screen.queryByTestId('desktop-mode-size-mobile'));
    });
    await waitFor(() => {
      expect(screen.queryByTestId('desktop-mode-resizable').style.width).toBe('375px');
      expect(screen.queryByTestId('desktop-mode-resizable').style.height).toBe('667px');
    });

    // qrcode
    expect(screen.queryByTestId('desktop-mode-qrcode')).toBeInTheDocument();
    await act(async () => {
      await userEvent.hover(screen.queryByTestId('desktop-mode-qrcode'));
    });
    await waitFor(() => {
      expect(document.querySelector('canvas')).toBeInTheDocument();
    });

    // content
    expect(screen.queryByText('demo content')).toBeInTheDocument();
  });
});
