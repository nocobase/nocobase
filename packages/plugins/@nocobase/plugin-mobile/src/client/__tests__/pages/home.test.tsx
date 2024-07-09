/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { render, waitForApp, screen, waitFor } from '@nocobase/test/client';
import BasicApp from '../../demos/pages-home-basic';
import CustomApp from '../../demos/pages-home-custom';
import NullApp from '../../demos/pages-home-null';

describe('Home page', () => {
  it('rewrite to first page', async () => {
    render(<BasicApp />);
    await waitForApp();

    await waitFor(() => {
      expect(screen.queryByText('Test Page')).toBeInTheDocument();
    });
  });

  it('if custom home page, not rewrite', async () => {
    render(<CustomApp />);
    await waitFor(() => {
      expect(screen.queryByTestId('mobile-loading')).not.toBeInTheDocument();
      expect(screen.queryByText('Custom Home Page')).toBeInTheDocument();
    });
  });

  it('no routes render null', async () => {
    render(<NullApp />);
    await waitForApp();

    await waitFor(() => {
      expect(document.querySelector('.ant-app').innerHTML).toHaveLength(0);
    });
  });
});
