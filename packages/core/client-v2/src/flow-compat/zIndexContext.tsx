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

  if (type === 'page' && !window.location.pathname.includes('/embed/')) {
    result = basicZIndex + level;
    return result > 200 ? result - 200 : result;
  }

  result = basicZIndex + level;
  return result < 200 ? result + 200 : result;
};
