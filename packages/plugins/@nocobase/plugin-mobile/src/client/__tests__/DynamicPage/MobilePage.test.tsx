/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { act, render, screen, userEvent, waitFor, waitForApp } from '@nocobase/test/client';
import React from 'react';
import NotFound from '../../demos/pages-dynamic-page-404';
import Basic from '../../demos/pages-dynamic-page-basic';
import Schema from '../../demos/pages-dynamic-page-schema';
// import Settings from '../../demos/pages-dynamic-page-settings'

describe('MobilePage', () => {
  it('basic', async () => {
    render(<Basic />);
    await waitForApp();

    await waitFor(() => {
      expect(screen.queryByText('Schema Test Page')).toBeInTheDocument();
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

  it.skip('schema', async () => {
    render(<Schema />);
    await waitForApp();

    await waitFor(() => {
      expect(screen.queryByText('Tab1 Content')).toBeInTheDocument();
      expect(screen.queryAllByRole('button')).toHaveLength(4);
    });
  });

  // it('settings', async () => {
  //   render(<Settings />);
  //   await waitForApp();

  //   await waitFor(() => {
  //     expect(screen.queryByText('Settings')).toBeInTheDocument();
  //   });

  //   await act(async () => {
  //     await userEvent.hover(screen.getByText('Settings'));
  //   });

  //   await waitFor(() => {
  //     expect(document.querySelector('span[aria-label="designer-schema-settings-div-mobile:page"]')).toBeInTheDocument();
  //   })

  //   await act(async () => {
  //     await userEvent.hover(document.querySelector('span[aria-label="designer-schema-settings-div-mobile:page"]'));
  //   });

  //   await waitFor(() => {
  //     expect(screen.queryByText('Display page header')).toBeInTheDocument();
  //     expect(screen.queryByText('Display page title')).not.toBeInTheDocument();
  //     expect(screen.queryByText('Display tabs')).not.toBeInTheDocument();
  //   });

  //   await act(async () => {
  //     await userEvent.click(screen.getByText('Display page header'));
  //   });

  //   await waitFor(() => {
  //     expect(screen.queryByText('Display page title')).toBeInTheDocument();
  //     expect(screen.queryByText('Display tabs')).toBeInTheDocument();
  //     expect(screen.queryByTestId('schema-json')).toHaveTextContent(JSON.stringify({
  //       "displayNavigationBar": true
  //     }));
  //   });

  //   await act(async () => {
  //     await userEvent.click(screen.getByText('Display page title'));
  //   });

  //   await waitFor(() => {
  //     expect(screen.queryByTestId('schema-json')).toHaveTextContent(JSON.stringify({
  //       "displayNavigationBar": true,
  //       "displayPageTitle": false
  //     }));
  //   });

  //   await act(async () => {
  //     await userEvent.click(screen.getByText('Display tabs'));
  //   });

  //   await waitFor(() => {
  //     expect(screen.queryByTestId('schema-json')).toHaveTextContent(JSON.stringify({
  //       "displayNavigationBar": true,
  //       "displayPageTitle": false,
  //       "displayTabs": true
  //     }));
  //   });
  // });
});
