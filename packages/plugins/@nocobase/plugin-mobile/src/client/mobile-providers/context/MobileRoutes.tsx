/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { APIClient, LOADING_DELAY, useAPIClient, useRequest } from '@nocobase/client';
import { Spin } from 'antd';
import React, { createContext, FC, useContext, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';

import type { IResource } from '@nocobase/sdk';

import { useRouteTranslation } from '../../locale';
import { useMobileTitle } from './MobileTitle';

export interface MobileRouteItem {
  id: number;
  schemaUid?: string;
  type: 'page' | 'link' | 'tabs';
  options?: any;
  title?: string;
  icon?: string;
  parentId?: number;
  children?: MobileRouteItem[];
  hideInMenu?: boolean;
  enableTabs?: boolean;
  hidden?: boolean;
}

export const MobileRoutesContext = createContext<MobileRoutesContextValue>(null);

export interface MobileRoutesContextValue {
  routeList?: MobileRouteItem[];
  refresh: () => Promise<any>;
  resource: IResource;
  schemaResource: IResource;
  activeTabBarItem?: MobileRouteItem;
  activeTabItem?: MobileRouteItem;
  api: APIClient;
}
MobileRoutesContext.displayName = 'MobileRoutesContext';

export const useMobileRoutes = () => {
  return useContext(MobileRoutesContext);
};

function useActiveTabBar(routeList: MobileRouteItem[]) {
  const { pathname } = useLocation();
  const urlMap = routeList.reduce<Record<string, MobileRouteItem>>((map, item) => {
    const url = item.schemaUid ? `/${item.type}/${item.schemaUid}` : item.options?.url;
    if (url) {
      map[url] = item;
    }
    if (item.children) {
      item.children.forEach((child) => {
        const childUrl = child.schemaUid ? `${url}/${child.type}/${child.schemaUid}` : child.options?.url;
        if (childUrl) {
          map[childUrl] = child;
        }
      });
    }
    return map;
  }, {});
  const activeTabBarItem = Object.values(urlMap).find((item) => {
    if (item.schemaUid) {
      return pathname.includes(`/${item.schemaUid}`);
    }
    if (item.options.url) {
      return pathname.includes(item.options.url);
    }
    return false;
  });

  return {
    activeTabBarItem, // 第一层
    activeTabItem: urlMap[pathname] || activeTabBarItem, // 任意层
  };
}

function useTitle(activeTabBar: MobileRouteItem) {
  const context = useMobileTitle();
  const { t } = useRouteTranslation();
  useEffect(() => {
    if (!context) return;
    if (activeTabBar) {
      context.setTitle(activeTabBar.title);
      document.title = t(activeTabBar.title);
    }
  }, [activeTabBar, context]);
}

export const MobileRoutesProvider: FC<{
  /**
   * list: return all route data, and only administrators can access;
   * listAccessible: return the route data that the current user can access;
   *
   * @default 'listAccessible'
   */
  action?: 'list' | 'listAccessible';
  refreshRef?: any;
  manual?: boolean;
}> = ({ children, refreshRef, manual, action = 'listAccessible' }) => {
  const api = useAPIClient();
  const resource = useMemo(() => api.resource('mobileRoutes'), [api]);
  const schemaResource = useMemo(() => api.resource('uiSchemas'), [api]);
  const {
    data,
    runAsync: refresh,
    loading,
  } = useRequest<{ data: MobileRouteItem[] }>(
    () =>
      resource[action](
        action === 'listAccessible'
          ? { tree: true, sort: 'sort', paginate: false }
          : { tree: true, sort: 'sort', paginate: false, filter: { hidden: { $ne: true } } },
      ).then((res) => res.data),
    {
      manual,
    },
  );

  if (refreshRef) {
    refreshRef.current = refresh;
  }

  const routeList = useMemo(() => data?.data || [], [data]);
  const { activeTabBarItem, activeTabItem } = useActiveTabBar(routeList);

  useTitle(activeTabBarItem);

  const value = useMemo(
    () => ({ api, activeTabBarItem, activeTabItem, routeList, refresh, resource, schemaResource }),
    [activeTabBarItem, activeTabItem, api, refresh, resource, routeList, schemaResource],
  );

  if (loading) {
    return (
      <div data-testid="mobile-loading" style={{ textAlign: 'center', margin: '20px 0' }}>
        <Spin delay={LOADING_DELAY} />
      </div>
    );
  }

  return <MobileRoutesContext.Provider value={value}>{children}</MobileRoutesContext.Provider>;
};
