/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { FC, useEffect } from 'react';
import { SafeArea } from 'antd-mobile';

import { useStyles } from './styles';
import { useMobileTabContext } from '../mobile-providers';

import { MobileTabBarItem } from './MobileTabBar.Item';
import { MobileTabBarSchema } from './MobileTabBar.Schema';
import { MobileTabBarLink } from './MobileTabBar.Link';
import { SchemaComponent } from '@nocobase/client';
import { useMobileTitle } from '../mobile-providers';
import { MobileTabBarInitializer } from './initializer';
import { MobileTabBarSettings } from './settings';

export const MobileTabBar: FC & {
  Item: typeof MobileTabBarItem;
  Schema: typeof MobileTabBarSchema;
  Link: typeof MobileTabBarLink;
} = () => {
  const { styles } = useStyles();
  const { tabList, activeTabBarItem } = useMobileTabContext();

  // 如果是 tabList 中的 pathname 则显示 tabBar，如果是内页则不显示
  if (!activeTabBarItem && tabList.length > 0) return null;

  return (
    <div className={styles.mobileTabBar}>
      <MobileTabBarSettings />
      <div className={styles.mobileTabBarList}>
        {tabList.map((item) => {
          return <SchemaComponent key={item.id} schema={Object.assign({ name: item.id }, item.options)} />;
        })}
        <MobileTabBarInitializer />
      </div>

      <SafeArea position="bottom" />
    </div>
  );
};

MobileTabBar.Item = MobileTabBarItem;
MobileTabBar.Link = MobileTabBarLink;
MobileTabBar.Schema = MobileTabBarSchema;
