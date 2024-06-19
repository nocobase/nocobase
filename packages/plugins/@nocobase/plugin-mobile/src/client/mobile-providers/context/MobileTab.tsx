/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { SpinLoading } from 'antd-mobile';
import { useLocation, useNavigate } from 'react-router-dom';

import { PluginMobileClient } from '../../index';
import { TabItem, useTabList } from '../../request';
import { usePlugin } from '@nocobase/client';

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
  const { data, runAsync: refresh, loading } = useTabList();

  const { pathname } = useLocation();
  const navigate = useNavigate();
  const mobilePlugin = usePlugin(PluginMobileClient);
  const tabList = useMemo(() => data?.data || [], [data]);

  // 如果是根路径且没有自定义首页，则跳转到第一个 tab
  useEffect(() => {
    if (!tabList.length || pathname !== '/') return;
    const routesObject = mobilePlugin.mobileRouter.getRoutes();
    const hasCustomHomePage = Object.values(routesObject).find((route) => {
      return route.path === '/' && (route.Component !== 'MobileLayout' || route.element);
    });
    if (!hasCustomHomePage) {
      navigate(tabList[0].url);
    }
  }, [pathname, tabList]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', margin: '20px 0' }}>
        <SpinLoading />
      </div>
    );
  }
  return <MobileTabContext.Provider value={{ tabList, refresh }}>{children}</MobileTabContext.Provider>;
};
