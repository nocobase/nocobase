/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { FC, useCallback, useEffect } from 'react';
import { TabBar as AntdTabBar, TabBarProps as AntdTabBarProps } from 'antd-mobile';
import { TabBarItem, TabBarItemProps } from './TabBar.Item';
import { useNavigate, useLocation } from 'react-router-dom';

interface TabBarListItemProps extends TabBarItemProps {
  key: string;
  path?: string;
  onClick?: () => void;
}

export interface TabBarProps {
  defaultActiveKey?: string;
  list: TabBarListItemProps[];
}

export const TabBar: FC<TabBarProps> & { Item: typeof TabBarItem } = ({ defaultActiveKey, list }) => {
  const nav = useNavigate();
  const location = useLocation();
  const { pathname } = location;

  useEffect(() => {
    if (defaultActiveKey) {
      handleChange(defaultActiveKey);
    } else {
      const item = list.find((item) => item.path === pathname);
      if (item) {
        handleChange(item.key);
      }
    }
  }, [pathname, defaultActiveKey]);

  const [activeKey, setActiveKey] = React.useState(() => {
    if (defaultActiveKey) {
      return defaultActiveKey;
    }
    const item = list.find((item) => item.path === pathname);
    if (item) {
      return item.key;
    }
    return list[0]?.key;
  });

  const handleChange: AntdTabBarProps['onChange'] = useCallback(
    (value) => {
      const item = list.find((item) => item.key === value);
      if (!item) return;

      if (item.path) {
        if (item.path.startsWith('http') || item.path.startsWith('//')) {
          window.open(item.path);
        } else {
          nav(value);
          setActiveKey(value);
        }
      }

      item.onClick?.();
    },
    [history],
  );

  return (
    <AntdTabBar safeArea activeKey={activeKey} onChange={handleChange}>
      {list.map((item) => (
        <TabBarItem key={item.key} title={item.title} icon={item.icon} />
      ))}
    </AntdTabBar>
  );
};

TabBar.Item = TabBarItem;
TabBar.displayName = 'NocoBaseTabBar';
