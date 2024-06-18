/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { createContext, useContext } from 'react';
import { TabItem, useTabList } from '../request';
import { SpinLoading } from 'antd-mobile';

export interface MobileTabContextValue {
  tabList?: TabItem[];
  refresh: () => void;
}

export const MobileTabContext = createContext<MobileTabContextValue>(null);
MobileTabContext.displayName = 'MobileTabContext';

export const useMobileTabContext = () => {
  return useContext(MobileTabContext);
};

export const MobileTabContextProvider = ({ children }) => {
  const { data, runAsync, loading } = useTabList();
  const refresh = () => {
    runAsync();
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', margin: '20px 0' }}>
        <SpinLoading />
      </div>
    );
  }
  return <MobileTabContext.Provider value={{ tabList: data?.data, refresh }}>{children}</MobileTabContext.Provider>;
};
