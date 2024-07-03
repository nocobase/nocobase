/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Spin } from 'antd';
import { useLocation } from 'react-router-dom';
import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { APIClient, ISchema, useAPIClient, useRequest } from '@nocobase/client';

import type { IResource } from '@nocobase/sdk';

import { useMobileTitle } from './MobileTitle';

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

export const useMobileRoutes = () => {
  return useContext(MobileRoutesContext);
};

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
  const context = useMobileTitle();
  useEffect(() => {
    if (!context) return;
    if (activeTabBar) {
      const title = activeTabBar.options.title || activeTabBar.options?.['x-component-props']?.title;
      context.setTitle(title);
      document.title = title;
    }
  }, [activeTabBar, context]);
}

export const MobileRoutesProvider = ({ children }) => {
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

  if (loading) {
    return (
      <div data-testid="mobile-loading" style={{ textAlign: 'center', margin: '20px 0' }}>
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
