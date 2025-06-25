/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { fireEvent, render, screen, sleep, userEvent, waitFor } from '@nocobase/test/client';
import React from 'react';
import App1 from '../demos/demo1';
import App2 from '../demos/demo2';
import App4 from '../demos/demo4';

describe('Action', () => {
  it.skip('show the drawer when click the button', async () => {
    const { getByText } = render(<App1 />);
    await waitFor(async () => {
      await userEvent.click(getByText('Open'));
      // drawer
      expect(document.querySelector('.ant-drawer')).toBeInTheDocument();
    });
    // mask
    expect(document.querySelector('.ant-drawer-mask')).toBeInTheDocument();
    // title
    expect(getByText('Drawer Title')).toBeInTheDocument();
    // content
    expect(getByText('Hello')).toBeInTheDocument();

    // close button
    await waitFor(async () => {
      await userEvent.click(getByText('Close'));
      expect(document.querySelector('.ant-drawer')).not.toBeInTheDocument();
    });

    // should also close when click the mask
    await waitFor(async () => {
      await userEvent.click(getByText('Open'));
      expect(document.querySelector('.ant-drawer')).toBeInTheDocument();
    });
    await userEvent.click(document.querySelector('.ant-drawer-mask') as HTMLElement);
    await waitFor(() => {
      expect(document.querySelector('.ant-drawer')).not.toBeInTheDocument();
    });

    // should also close when click the close icon
    await waitFor(async () => {
      await userEvent.click(getByText('Open'));
      expect(document.querySelector('.ant-drawer')).toBeInTheDocument();
    });
    await userEvent.click(document.querySelector('.ant-drawer-close') as HTMLElement);
    await waitFor(() => {
      expect(document.querySelector('.ant-drawer')).not.toBeInTheDocument();
    });
  });
});

describe('Action.Drawer without Action', () => {
  it.skip('show the drawer when click the button', async () => {
    const { getByText } = render(<App2 />);
    await waitFor(async () => {
      await userEvent.click(getByText('Open'));
      // wait for the drawer to open
      await sleep(300);
      // drawer
      expect(document.querySelector('.ant-drawer')).toBeInTheDocument();
      // mask
      expect(document.querySelector('.ant-drawer-mask')).toBeInTheDocument();
      // title
      expect(getByText('Drawer Title')).toBeInTheDocument();
      // content
      expect(getByText('Hello')).toBeInTheDocument();
    });

    // close button
    await waitFor(async () => {
      await userEvent.click(getByText('Close'));
      expect(document.querySelector('.ant-drawer')).not.toBeInTheDocument();
    });

    // should also close when click the mask
    await waitFor(async () => {
      await userEvent.click(getByText('Open'));
      expect(document.querySelector('.ant-drawer')).toBeInTheDocument();
    });
    await userEvent.click(document.querySelector('.ant-drawer-mask') as HTMLElement);
    await waitFor(() => {
      expect(document.querySelector('.ant-drawer')).not.toBeInTheDocument();
    });

    // should also close when click the close icon
    await waitFor(async () => {
      await userEvent.click(getByText('Open'));
      expect(document.querySelector('.ant-drawer')).toBeInTheDocument();
    });

    await userEvent.click(document.querySelector('.ant-drawer-close') as HTMLElement);

    await waitFor(() => {
      expect(document.querySelector('.ant-drawer')).not.toBeInTheDocument();
    });
  });
});

describe('Action.Popover', () => {
  it('show the popover when hover the button', async () => {
    const { container } = render(<App4 />);
    const btn = container.querySelector('.ant-btn') as HTMLElement;

    fireEvent.click(btn);

    await waitFor(() => {
      // popover
      expect(document.querySelector('.ant-popover')).toBeInTheDocument();
      // content
      expect(screen.getByText('Hello')).toBeInTheDocument();
    });

    fireEvent.mouseLeave(btn);
  });
});
