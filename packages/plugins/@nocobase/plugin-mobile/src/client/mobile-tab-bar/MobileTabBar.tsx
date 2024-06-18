/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { FC, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useStyles } from './style';
import { useMobileTabContext } from '../context/MobileTab';

import { MobileTabBarItem } from './MobileTabBar.Item';
import { MobileTabBarSchema } from './MobileTabBar.Schema';
import { MobileTabBarLink } from './MobileTabBar.Link';
import { MobileTabBarItemDecorator } from './MobileTabBar.ItemDecorator';
import { SchemaComponent } from '@nocobase/client';

export const MobileTabBar: FC & {
  Item: typeof MobileTabBarItem;
  Schema: typeof MobileTabBarSchema;
  Link: typeof MobileTabBarLink;
  ItemDecorator: typeof MobileTabBarItemDecorator;
} = () => {
  const { styles } = useStyles();
  const { tabList } = useMobileTabContext();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (pathname === '/') {
      navigate(tabList[0].url);
    }
  }, [pathname, tabList]);

  // 如果是 tabList 中的 pathname 则显示 tabBar，如果是内页则不显示
  const isTabBarPathname = tabList.find((item) => pathname === item.url);
  if (!isTabBarPathname) return null;

  return (
    <div className={styles.mobileTabBar}>
      {tabList.map((item) => {
        return <SchemaComponent key={item.id} name={item.id} schema={item.options} />;
      })}
    </div>
  );
};

MobileTabBar.Item = MobileTabBarItem;
MobileTabBar.Link = MobileTabBarLink;
MobileTabBar.Schema = MobileTabBarSchema;
MobileTabBar.ItemDecorator = MobileTabBarItemDecorator;
