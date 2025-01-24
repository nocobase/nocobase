/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { lazy } from '@nocobase/client';
import { TabsProps } from 'antd/es/tabs/index';
import React from 'react';
import { TFunction } from 'react-i18next';
// import { GeneralPermissions } from './permissions/GeneralPermissions';
// import { MenuItemsProvider } from './permissions/MenuItemsProvider';
// import { MenuPermissions } from './permissions/MenuPermissions';
const { GeneralPermissions } = lazy(() => import('./permissions/GeneralPermissions'), 'GeneralPermissions');
// const { MenuItemsProvider } = lazy(() => import('./permissions/MenuItemsProvider'), 'MenuItemsProvider');
const { MenuPermissions } = lazy(() => import('./permissions/MenuPermissions'), 'MenuPermissions');

import { Role } from './RolesManagerProvider';
import { DesktopAllRoutesProvider } from './permissions/MenuPermissions';

interface PermissionsTabsProps {
  /**
   * the key of the currently active tab panel
   */
  activeKey: string;
  /**
   * the currently selected role
   */
  activeRole: null | Role;
  /**
   * the current user's role
   */
  currentUserRole: null | Role;
  /**
   * translation function
   */
  t: TFunction;
  /**
   * used to constrain the size of the container in the Tab
   */
  TabLayout: React.FC;
}

type Tab = TabsProps['items'][0] & {
  /**
   * Used for sorting tabs - lower numbers appear first
   * Default values: System (10), Desktop routes (20)
   * @default 100
   */
  sort?: number;
};

type TabCallback = (props: PermissionsTabsProps) => Tab;

/**
 * the extension API for ACL settings page
 */
export class ACLSettingsUI {
  private permissionsTabs: (Tab | TabCallback)[] = [
    ({ t, TabLayout }) => ({
      key: 'general',
      label: t('System'),
      sort: 10,
      children: (
        <TabLayout>
          <GeneralPermissions />
        </TabLayout>
      ),
    }),
    ({ activeKey, t, TabLayout }) => ({
      key: 'menu',
      label: t('Desktop routes'),
      sort: 20,
      children: (
        <TabLayout>
          <DesktopAllRoutesProvider active={activeKey === 'menu'}>
            <MenuPermissions active={activeKey === 'menu'} />
          </DesktopAllRoutesProvider>
        </TabLayout>
      ),
    }),
  ];

  addPermissionsTab(tab: Tab | TabCallback): void {
    this.permissionsTabs.push(tab);
  }

  getPermissionsTabs(props: PermissionsTabsProps): Tab[] {
    return this.permissionsTabs
      .map((tab) => {
        if (typeof tab === 'function') {
          return tab(props);
        }
        return tab;
      })
      .sort((a, b) => (a.sort ?? 100) - (b.sort ?? 100));
  }
}
