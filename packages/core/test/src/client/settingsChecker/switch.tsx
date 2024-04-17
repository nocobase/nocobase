import { expect } from 'vitest';
import { waitFor, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

export interface CheckSwitchSettingOptions {
  title: string;
  beforeClick?: () => Promise<void> | void;
  afterFirstClick?: () => Promise<void> | void;
  afterSecondClick?: () => Promise<void> | void;
}

export async function checkSwitchSetting(options: CheckSwitchSettingOptions) {
  if (options.beforeClick) {
    await options.beforeClick();
  }

  // 先获取 switch 元素，记录 checked 状态
  const formItem = screen.getByTitle(options.title);
  const switchElement = formItem.querySelector('button[role=switch]');
  let oldChecked = switchElement.getAttribute('aria-checked');

  // 第一次点击
  if (options.afterFirstClick) {
    await userEvent.click(screen.getByText(options.title));

    // 点击后，检查 checked 状态是否改变
    await waitFor(() => {
      const switchElement = formItem.querySelector('button[role=switch]');
      const newChecked = switchElement.getAttribute('aria-checked');
      expect(newChecked).not.toBe(oldChecked);
      oldChecked = newChecked;
    });

    await options.afterFirstClick();
  }

  // 第二次点击
  if (options.afterSecondClick) {
    await userEvent.click(screen.getByText(options.title));
    await waitFor(() => {
      const switchElement = formItem.querySelector('button[role=switch]');
      const newChecked = switchElement.getAttribute('aria-checked');
      expect(newChecked).not.toBe(oldChecked);
    });

    await options.afterSecondClick();
  }
}
