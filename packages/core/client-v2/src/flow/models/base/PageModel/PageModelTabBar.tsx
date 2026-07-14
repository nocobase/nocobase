/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Tabs } from 'antd';
import EsTabContext from 'rc-tabs/es/TabContext';
import LibTabContext from 'rc-tabs/lib/TabContext';
import React from 'react';

export const NO_ACTIVE_PAGE_TAB_KEY = '__no_active_page_tab__';

type RenderTabBar = NonNullable<React.ComponentProps<typeof Tabs>['renderTabBar']>;

type FilteredPageTabBarProps = {
  hiddenTabKeys: Set<string>;
  tabBarProps: Parameters<RenderTabBar>[0];
  DefaultTabBar: Parameters<RenderTabBar>[1];
};

export function FilteredPageTabBar({ hiddenTabKeys, tabBarProps, DefaultTabBar }: FilteredPageTabBarProps) {
  // `renderTabBar` node wrappers do not change rc-tabs' overflow, keyboard, or indicator data.
  // Filter only the navigation context so the full items list can continue owning every pane.
  const esTabContext = React.useContext(EsTabContext);
  const libTabContext = React.useContext(LibTabContext);
  const tabContext = esTabContext || libTabContext;
  if (!tabContext) {
    return <DefaultTabBar {...tabBarProps} />;
  }

  const visibleTabs = tabContext.tabs.filter((tab) => !hiddenTabKeys.has(String(tab.key)));
  const activeKey = visibleTabs.some((tab) => tab.key === tabBarProps.activeKey)
    ? tabBarProps.activeKey
    : NO_ACTIVE_PAGE_TAB_KEY;
  const TabContextProvider = esTabContext ? EsTabContext.Provider : LibTabContext.Provider;

  return (
    <TabContextProvider value={{ ...tabContext, tabs: visibleTabs }}>
      <DefaultTabBar {...tabBarProps} activeKey={activeKey} />
    </TabContextProvider>
  );
}
