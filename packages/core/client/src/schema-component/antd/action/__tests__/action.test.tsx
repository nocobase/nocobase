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
import App1 from '../demos/demo1';
import App2 from '../demos/demo2';
import App3 from '../demos/demo3';
import App4 from '../demos/demo4';

describe('Action', () => {
  it('show the drawer when click the button', async () => {
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

  it('openMode', async () => {
    const { getByText } = render(<App3 />);

    expect(document.querySelector('.ant-drawer')).not.toBeInTheDocument();
    expect(document.querySelector('.ant-modal')).not.toBeInTheDocument();
    expect(document.querySelector('.nb-action-page')).not.toBeInTheDocument();

    // drawer
    await waitFor(async () => {
      await userEvent.click(getByText('Drawer'));
      await userEvent.click(getByText('Open'));
      expect(document.querySelector('.ant-drawer')).toBeInTheDocument();
      expect(document.querySelector('.ant-modal')).not.toBeInTheDocument();
      expect(document.querySelector('.nb-action-page')).not.toBeInTheDocument();
    });

    // modal
    await waitFor(async () => {
      await userEvent.click(getByText('Close'));
      await userEvent.click(getByText('Modal'));
      await userEvent.click(getByText('Open'));
      expect(document.querySelector('.ant-drawer')).not.toBeInTheDocument();
      expect(document.querySelector('.ant-modal')).toBeInTheDocument();
      expect(document.querySelector('.nb-action-page')).not.toBeInTheDocument();
    });
    await waitFor(async () => {
      // page
      await userEvent.click(getByText('Page'));
      await userEvent.click(getByText('Open'));
      expect(document.querySelector('.ant-drawer')).not.toBeInTheDocument();
      expect(document.querySelector('.ant-modal')).not.toBeInTheDocument();
      expect(document.querySelector('.nb-action-page')).toBeInTheDocument();
    });
    await userEvent.click(getByText('Close'));

    // TODO: 点击关闭按钮时应该消失
    // expect(document.querySelector('.nb-action-page')).not.toBeInTheDocument();
  });
});

describe('Action.Drawer without Action', () => {
  it('show the drawer when click the button', async () => {
    const { getByText } = render(<App2 />);
    await waitFor(async () => {
      await userEvent.click(getByText('Open'));
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

    fireEvent.mouseEnter(btn);

    await waitFor(() => {
      // popover
      expect(document.querySelector('.ant-popover')).toBeInTheDocument();
      // content
      expect(screen.getByText('Hello')).toBeInTheDocument();
    });

    fireEvent.mouseLeave(btn);
    await waitFor(() => {
      expect(document.querySelector('.ant-popover')).not.toBeInTheDocument();
    });
  });
});
