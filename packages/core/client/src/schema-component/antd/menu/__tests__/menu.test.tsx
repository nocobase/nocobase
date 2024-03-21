import { render, screen, userEvent, waitFor, within } from '@nocobase/test/client';
import React from 'react';
import App1 from '../demos/demo1';
import App2 from '../demos/demo2';
import App3 from '../demos/demo3';

describe('Menu', () => {
  it('mode: "horizontal"', async () => {
    render(<App1 />);

    await waitFor(async () => {
      // 默认选中 menu item 1
      expect(
        within(document.querySelector('.ant-menu-item-selected') as HTMLElement).getByText(/menu item 1/i),
      ).toBeInTheDocument();
      expect(screen.getByText(/menu item 2/i)).toBeInTheDocument();
      expect(screen.getByText(/submenu 1/i)).toBeInTheDocument();

      // 选中 menu item 2
      await userEvent.click(screen.getByText(/menu item 2/i));
      expect(
        within(document.querySelector('.ant-menu-item-selected') as HTMLElement).getByText(/menu item 2/i),
      ).toBeInTheDocument();
    });
  });

  it('mode: "inline"', async () => {
    render(<App2 />);

    await waitFor(async () => {
      // 默认选中 menu item 1
      expect(
        within(document.querySelector('.ant-menu-item-selected') as HTMLElement).getByText(/menu item 1/i),
      ).toBeInTheDocument();
      expect(screen.getByText(/menu item 2/i)).toBeInTheDocument();
      expect(screen.getByText(/submenu 1/i)).toBeInTheDocument();

      // 选中 menu item 2
      await userEvent.click(screen.getByText(/menu item 2/i));
      expect(
        within(document.querySelector('.ant-menu-item-selected') as HTMLElement).getByText(/menu item 2/i),
      ).toBeInTheDocument();
    });
  });

  it('mode: "mix"', async () => {
    render(<App3 />);

    await waitFor(async () => {
      // 默认选中 menu item 1
      expect(
        within(document.querySelector('.ant-menu-item-selected') as HTMLElement).getByText(/menu item 1/i),
      ).toBeInTheDocument();
      expect(screen.getByText(/menu item 2/i)).toBeInTheDocument();
      expect(screen.getByText(/submenu 1/i)).toBeInTheDocument();

      // 选中 menu item 2
      await userEvent.click(screen.getByText(/menu item 2/i));
      expect(
        within(document.querySelector('.ant-menu-item-selected') as HTMLElement).getByText(/menu item 2/i),
      ).toBeInTheDocument();
    });
  });
});
