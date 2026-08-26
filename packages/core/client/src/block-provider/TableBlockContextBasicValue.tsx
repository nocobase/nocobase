/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { createContext, useContext } from 'react';

export const TableBlockContextBasicValue = createContext<{
  field: any;
  rowKey: string;
  dragSortBy?: string;
  childrenColumnName?: string;
  showIndex?: boolean;
  dragSort?: boolean;
}>(null);

TableBlockContextBasicValue.displayName = 'TableBlockContextBasicValue';

export const useTableBlockContextBasicValue = () => {
  return useContext(TableBlockContextBasicValue);
};
