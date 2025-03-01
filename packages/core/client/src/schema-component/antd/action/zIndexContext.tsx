/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';

export const zIndexContext = React.createContext(100);

export const useZIndexContext = () => {
  return React.useContext(zIndexContext);
};

export const getZIndex = (type: 'page' | 'drawer' | 'modal', basicZIndex: number, level: number) => {
  let result = basicZIndex;

  // 子页面的 z-index 不能超过 200，不然会遮挡折叠展开菜单的按钮
  // 注意：嵌入页面时需要跳过，因为嵌入页面中的弹窗不是通过 URL 打开的，会导致子页面被弹窗盖住
  if (type === 'page' && !window.location.pathname.includes('/embed/')) {
    result = basicZIndex + level;
    return result > 200 ? result - 200 : result;
  }

  // 弹窗的 z-index 需要高一点，不然会被折叠展开按钮遮挡
  result = basicZIndex + level;
  return result < 200 ? result + 200 : result;
};
