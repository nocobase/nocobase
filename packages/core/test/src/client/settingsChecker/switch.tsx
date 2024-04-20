import { expect } from 'vitest';
import { waitFor, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { showSettingsMenu } from '../renderSettings';

export interface CheckSwitchSettingOptions {
  title: string;
  beforeClick?: () => Promise<void> | void;
  afterFirstClick?: () => Promise<void> | void;
  afterSecondClick?: () => Promise<void> | void;
  afterThirdClick?: () => Promise<void> | void;
}

export async function checkSwitchSetting(options: CheckSwitchSettingOptions) {
  if (options.beforeClick) {
    await options.beforeClick();
  }

  // 先获取 switch 元素，记录 checked 状态
  const formItem = screen.getByTitle(options.title);
  const switchElement = formItem.querySelector('button[role=switch]');
  let oldChecked = switchElement.getAttribute('aria-checked');
  const afterClick = async () => {
    const formItem = screen.queryByTitle(options.title);
    if (formItem) {
      const switchElement = formItem.querySelector('button[role=switch]');
      const newChecked = switchElement.getAttribute('aria-checked');
      expect(newChecked).not.toBe(oldChecked);
      oldChecked = newChecked;
    } else {
      // 重新打开设置菜单
      await showSettingsMenu();
    }
  };

  // 第一次点击
  if (options.afterFirstClick) {
    await userEvent.click(formItem.querySelector('button[role=switch]'));
    await waitFor(async () => {
      await afterClick();
    });

    await options.afterFirstClick();
  }

  // 第二次点击
  if (options.afterSecondClick) {
    await userEvent.click(screen.getByText(options.title));
    await waitFor(async () => {
      await afterClick();
    });
    await options.afterSecondClick();
  }

  // 第三次点击
  if (options.afterThirdClick) {
    await userEvent.click(screen.getByText(options.title));
    await waitFor(async () => {
      await afterClick();
    });

    await options.afterThirdClick();
  }
}
