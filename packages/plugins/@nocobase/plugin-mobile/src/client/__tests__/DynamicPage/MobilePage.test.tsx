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
import Basic from '../../demos/pages-dynamic-page-basic';
import NotFound from '../../demos/pages-dynamic-page-404';
import Schema from '../../demos/pages-dynamic-page-schema';
// import Settings from '../../demos/pages-dynamic-page-settings'

describe('MobilePage', () => {
  it('basic', async () => {
    render(<Basic />);
    await waitForApp();

    await waitFor(() => {
      await expect(screen.queryByText('Schema Test Page')).toBeInTheDocument();
    });
  });
  it('not found', async () => {
    render(<NotFound />);
    await waitForApp();

    await waitFor(() => {
      await expect(screen.queryByText('404')).toBeInTheDocument();
    });

    await act(async () => {
      await userEvent.click(screen.getByText('Back Home'));
    });

    await waitFor(() => {
      await expect(screen.queryByText('404')).not.toBeInTheDocument();
    });
  });

  it('schema', async () => {
    render(<Schema />);
    await waitForApp();

    await waitFor(() => {
      await expect(screen.queryByText('Tab1 Content')).toBeInTheDocument();
      await expect(screen.queryAllByRole('button')).toHaveLength(4);
    });
  });

  // it('settings', async () => {
  //   render(<Settings />);
  //   await waitForApp();

  //   await waitFor(() => {
  //     await expect(screen.queryByText('Settings')).toBeInTheDocument();
  //   });

  //   await act(async () => {
  //     await userEvent.hover(screen.getByText('Settings'));
  //   });

  //   await waitFor(() => {
  //     await expect(document.querySelector('span[aria-label="designer-schema-settings-div-mobile:page"]')).toBeInTheDocument();
  //   })

  //   await act(async () => {
  //     await userEvent.hover(document.querySelector('span[aria-label="designer-schema-settings-div-mobile:page"]'));
  //   });

  //   await waitFor(() => {
  //     await expect(screen.queryByText('Enable Navigation Bar')).toBeInTheDocument();
  //     await expect(screen.queryByText('Enable Navigation Bar Title')).not.toBeInTheDocument();
  //     await expect(screen.queryByText('Enable Navigation Bar Tabs')).not.toBeInTheDocument();
  //   });

  //   await act(async () => {
  //     await userEvent.click(screen.getByText('Enable Navigation Bar'));
  //   });

  //   await waitFor(() => {
  //     await expect(screen.queryByText('Enable Navigation Bar Title')).toBeInTheDocument();
  //     await expect(screen.queryByText('Enable Navigation Bar Tabs')).toBeInTheDocument();
  //     await expect(screen.queryByTestId('schema-json')).toHaveTextContent(JSON.stringify({
  //       "enableNavigationBar": true
  //     }));
  //   });

  //   await act(async () => {
  //     await userEvent.click(screen.getByText('Enable Navigation Bar Title'));
  //   });

  //   await waitFor(() => {
  //     await expect(screen.queryByTestId('schema-json')).toHaveTextContent(JSON.stringify({
  //       "enableNavigationBar": true,
  //       "enableNavigationBarTitle": false
  //     }));
  //   });

  //   await act(async () => {
  //     await userEvent.click(screen.getByText('Enable Navigation Bar Tabs'));
  //   });

  //   await waitFor(() => {
  //     await expect(screen.queryByTestId('schema-json')).toHaveTextContent(JSON.stringify({
  //       "enableNavigationBar": true,
  //       "enableNavigationBarTitle": false,
  //       "enableNavigationBarTabs": true
  //     }));
  //   });
  // });
});
