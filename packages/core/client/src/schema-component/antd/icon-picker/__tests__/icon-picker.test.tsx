import { render, screen, userEvent } from '@nocobase/test/client';
import React from 'react';
import App from '../demos/icon-picker';

describe('IconPicker', () => {
  it('should display all icons when click the button', async () => {
    const { container } = render(<App />);

    const button = container.querySelector('button') as HTMLButtonElement;
    await userEvent.click(button);

    expect(screen.getByText('Icon')).toMatchInlineSnapshot(`
      <div
        class="ant-popover-title"
      >
        Icon
      </div>
    `);
    expect(screen.queryAllByRole('img').length).toBe(421);
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
});
