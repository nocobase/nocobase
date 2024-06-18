/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { FC, useCallback, useEffect, useMemo } from 'react';
import {
  TabBar as AntdTabBar,
  TabBarProps as AntdTabBarProps,
  TabBarItemProps as AntdTabBarItemProps,
} from 'antd-mobile';
import { useNavigate, useLocation } from 'react-router-dom';
import { Icon } from '@nocobase/client';

function getIcon(item: TabBarItemProps, activeKey: string) {
  const { icon, selectedIcon } = item;
  const res = activeKey === item.key && selectedIcon ? selectedIcon : icon;
  if (typeof res === 'string') return <Icon type={res} />;
  return icon;
}

interface TabBarItemProps extends Omit<AntdTabBarItemProps, 'badge' | 'icon'> {
  key: string;
  path?: string;
  onClick?: () => void;
  icon?: React.ReactNode | string;
  selectedIcon?: React.ReactNode | string;
  useBadge?: () => string | number | boolean;
  selected?: boolean;
}

export interface TabBarProps {
  defaultActiveKey?: string;
  list: TabBarItemProps[];
}
export const TabBar: FC<TabBarProps> = ({ defaultActiveKey, list }) => {
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
  }, [pathname, defaultActiveKey, list]);

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

  const tabs = useMemo(() => list.map((item) => ({ ...item, icon: getIcon(item, activeKey) })), [activeKey, list]);
  return (
    <AntdTabBar safeArea activeKey={activeKey} onChange={handleChange}>
      {tabs.map((item) => (
        <AntdTabBar.Item
          key={item.key}
          title={item.title}
          icon={item.icon}
          className={item.className}
          style={item.style}
        />
      ))}
    </AntdTabBar>
  );
};
