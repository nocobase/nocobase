/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { render, screen, userEvent, waitFor } from '@nocobase/test/client';
import React from 'react';
import App1 from './components/basic';
import InlineApp from './components/modal';

describe('ErrorFallback', () => {
  it('should render correctly', () => {
    render(<App1 />);

    expect(screen.getByText(/render failed/i)).toBeInTheDocument();
    expect(screen.getByText(/this is likely a nocobase internals bug\. please open an issue at/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /feedback/i })).toBeInTheDocument();
    expect(screen.getByText(/try again/i)).toBeInTheDocument();
    expect(screen.getByText(/error: error message/i)).toBeInTheDocument();

    // 底部复制按钮
    expect(document.querySelector('.ant-typography-copy')).toBeInTheDocument();
  });

  it('should render inline correctly', async () => {
    render(<InlineApp />);

    expect(screen.getByText(/Error: error message/i)).toBeInTheDocument();
    expect(document.querySelector('.ant-typography-copy')).toBeInTheDocument();

    await userEvent.hover(screen.getByText(/Error: error message/i));
    await waitFor(() => {
      expect(screen.getByText(/render failed/i)).toBeInTheDocument();
      expect(
        screen.getByText(/this is likely a nocobase internals bug\. please open an issue at/i),
      ).toBeInTheDocument();
    });
  });
});
