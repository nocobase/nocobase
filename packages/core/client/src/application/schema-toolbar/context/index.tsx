/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { createContext, useContext } from 'react';

export const SchemaToolbarContext = createContext<any>({});
SchemaToolbarContext.displayName = 'SchemaToolbarContext';

export const SchemaToolbarProvider = (props: any) => {
  const { children, ...others } = props;
  return <SchemaToolbarContext.Provider value={others}>{children}</SchemaToolbarContext.Provider>;
};

export function useSchemaToolbar<T = any>() {
  return useContext(SchemaToolbarContext) as T;
}
