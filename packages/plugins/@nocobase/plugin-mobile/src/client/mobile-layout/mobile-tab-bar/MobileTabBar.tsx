/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { FC } from 'react';
import { SafeArea } from 'antd-mobile';
import 'antd-mobile/es/components/tab-bar/tab-bar.css'

import { useStyles } from './styles';
import { useMobileRoutesContext } from '../../mobile-providers';

import { MobileTabBarItem } from './MobileTabBar.Item';
import { MobileTabBarPage, MobileTabBarLink } from './types';
import { SchemaComponent, useDesignable } from '@nocobase/client';
import { MobileTabBarInitializer } from './initializer';

export interface MobileTabBarProps {
  /**
   * @default true
   */
  enableTabBar?: boolean;
}

export const MobileTabBar: FC<MobileTabBarProps> & {
  Item: typeof MobileTabBarItem;
  Page: typeof MobileTabBarPage;
  Link: typeof MobileTabBarLink;
} = ({ enableTabBar = true }) => {
  const { styles } = useStyles();
  const { designable } = useDesignable();
  const { routeList, activeTabBarItem } = useMobileRoutesContext();

  if (!enableTabBar) {
    if (designable) {
      return <div className={styles.mobileTabBar} style={{ background: 'none', border: 'none' }}></div>;
    }

    return null;
  }

  // 如果是 routeList 中的 pathname 则显示 tabBar，如果是内页则不显示
  if (!activeTabBarItem && routeList.length > 0) return null;

  return (
    <div className={styles.mobileTabBar}>
      <div className={styles.mobileTabBarContent}>
        <div className={styles.mobileTabBarList}>
          {routeList.map((item) => {
            return <SchemaComponent key={item.id} schema={Object.assign({ name: item.id }, item.options)} />;
          })}
        </div>
        <MobileTabBarInitializer />
      </div>

      <SafeArea position="bottom" />
    </div>
  );
};

MobileTabBar.Item = MobileTabBarItem;
MobileTabBar.Link = MobileTabBarLink;
MobileTabBar.Page = MobileTabBarPage;
