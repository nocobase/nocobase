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
import Basic from '../../demos/pages-page-content-basic';
import FirstRoute from '../../demos/pages-page-content-first-route';
import NotFound from '../../demos/pages-page-content-404';

describe('MobilePageContent', () => {
  it('basic', async () => {
    render(<Basic />);
    await waitForApp();

    await waitFor(() => {
      expect(screen.queryByText('Schema Test Page')).toBeInTheDocument();
    });
  });

  it('render first route', async () => {
    render(<FirstRoute />);
    await waitForApp();

    await waitFor(() => {
      expect(screen.queryByText('First Route Content')).toBeInTheDocument();
    });
  });

  it('not found', async () => {
    render(<NotFound />);
    await waitForApp();

    await waitFor(() => {
      expect(screen.queryByText('404')).toBeInTheDocument();
    });

    await act(async () => {
      await userEvent.click(screen.getByText('Back Home'));
    });

    await waitFor(() => {
      expect(screen.queryByText('404')).not.toBeInTheDocument();
    });
  });
});
