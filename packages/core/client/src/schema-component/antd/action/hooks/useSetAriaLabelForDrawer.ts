/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useEffect } from 'react';
import { useGetAriaLabelOfDrawer } from './useGetAriaLabelOfDrawer';

export function useSetAriaLabelForDrawer(visible: boolean) {
  const { getAriaLabel } = useGetAriaLabelOfDrawer();

  // 因 Drawer 设置 aria-label 无效，所以使用下面这种方式设置，方便 e2e 录制工具选中
  useEffect(() => {
    if (visible) {
      // 因为 Action 是点击后渲染内容，所以需要延迟一下
      setTimeout(() => {
        const wrappers = [...document.querySelectorAll('.ant-drawer-body')];
        const masks = [...document.querySelectorAll('.ant-drawer-mask')];
        // 如果存在多个 mask，最后一个 mask 为当前打开的 mask；wrapper 也是同理
        const currentMask = masks[masks.length - 1];
        const currentWrapper = wrappers[wrappers.length - 1];
        if (currentMask) {
          currentMask.setAttribute('role', 'button');
          currentMask.setAttribute('aria-label', getAriaLabel('mask'));
        }
        if (currentWrapper) {
          currentWrapper.setAttribute('role', 'button');
          // 都设置一下，让 e2e 录制工具自己选择
          currentWrapper.setAttribute('data-testid', getAriaLabel());
          currentWrapper.setAttribute('aria-label', getAriaLabel());
        }
      }, 0);
    }
  }, [getAriaLabel, visible]);
}
