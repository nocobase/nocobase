/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Spin } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { APIClient, ISchema, useAPIClient, usePlugin, useRequest } from '@nocobase/client';

import type { IResource } from '@nocobase/sdk';

import { useMobileTitle } from './MobileTitle';
import { PluginMobileClient } from '../../index';

export interface TabBarItem {
  id: number;
  url?: string;
  sort?: number;
  options: ISchema;
  parentId?: number;
  children?: TabItem[];
}

export interface TabItem {
  id: number;
  url?: string;
  sort?: number;
  options: { title: string; tabSchemaUid: string };
  parentId?: number;
}

export interface MobileRoutesContextValue {
  routeList?: TabBarItem[];
  refresh: () => Promise<any>;
  resource: IResource;
  schemaResource: IResource;
  activeTabBarItem?: TabBarItem;
  activeTabItem?: TabItem;
  api: APIClient;
}

export const MobileRoutesContext = createContext<MobileRoutesContextValue>(null);
MobileRoutesContext.displayName = 'MobileRoutesContext';

export const useMobileRoutesContext = () => {
  return useContext(MobileRoutesContext);
};

function useHomeNavigate(routeList: TabBarItem[]) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const mobilePlugin = usePlugin(PluginMobileClient);

  // 如果是根路径且没有自定义首页，则跳转到第一个 tab
  useEffect(() => {
    if (!routeList.length || pathname !== '/') return;
    const routesObject = mobilePlugin.mobileRouter.getRoutes();
    const hasCustomHomePage = Object.values(routesObject).find((route) => {
      return route.path === '/' && (route.Component !== 'MobileLayout' || route.element);
    });
    if (!hasCustomHomePage) {
      navigate(routeList[0].url);
    }
  }, [pathname, routeList]);
}

function useActiveTabBar(routeList: TabBarItem[]) {
  const { pathname } = useLocation();
  const urlMap = routeList.reduce((map, item) => {
    if (!item.url) {
      map[item.url] = item;
    }
    if (item.children) {
      item.children.forEach((child) => {
        if (child.url) {
          map[child.url] = child;
        }
      });
    }
    return map;
  }, {});
  const activeTabBarItem = routeList.find((item) => pathname.startsWith(item.url));

  return {
    activeTabBarItem, // 第一层
    activeTabItem: urlMap[pathname] || activeTabBarItem, // 任意层
  };
}

function useTitle(activeTabBar: TabBarItem) {
  const { setTitle } = useMobileTitle();
  useEffect(() => {
    if (activeTabBar) {
      const title = activeTabBar.options.title || activeTabBar.options?.['x-component-props']?.title;
      setTitle(title);
      document.title = title;
    }
  }, [activeTabBar]);
}

export const MobileRoutesContextProvider = ({ children }) => {
  const api = useAPIClient();
  const resource = useMemo(() => api.resource('mobileRoutes'), [api]);
  const schemaResource = useMemo(() => api.resource('uiSchemas'), [api]);
  const {
    data,
    runAsync: refresh,
    loading,
  } = useRequest<{ data: TabBarItem[] }>(() => resource.list({ tree: true, sort: 'sort' }).then((res) => res.data));
  const routeList = useMemo(() => data?.data || [], [data]);
  const { activeTabBarItem, activeTabItem } = useActiveTabBar(routeList);

  useTitle(activeTabBarItem);

  useHomeNavigate(routeList);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', margin: '20px 0' }}>
        <Spin />
      </div>
    );
  }
  return (
    <MobileRoutesContext.Provider
      value={{ api, activeTabBarItem, activeTabItem, routeList, refresh, resource, schemaResource }}
    >
      {children}
    </MobileRoutesContext.Provider>
  );
};
