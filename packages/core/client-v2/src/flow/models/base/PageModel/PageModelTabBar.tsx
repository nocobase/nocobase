/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Tabs } from 'antd';
import type { TabsProps } from 'antd';
import React from 'react';

export const NO_ACTIVE_PAGE_TAB_KEY = '__no_active_page_tab__';

type RenderTabBar = NonNullable<React.ComponentProps<typeof Tabs>['renderTabBar']>;
type PageTabItem = NonNullable<TabsProps['items']>[number];

type FilteredPageTabBarProps = {
  hiddenTabKeys: Set<string>;
  hiddenActiveTabLabel?: React.ReactNode;
  items: PageTabItem[];
  tabBarProps: Parameters<RenderTabBar>[0];
};

export function FilteredPageTabBar({
  hiddenTabKeys,
  hiddenActiveTabLabel,
  items,
  tabBarProps,
}: FilteredPageTabBarProps) {
  // Keep the outer Tabs instance responsible for every pane, while a navigation-only Tabs instance
  // receives only visible items. This avoids relying on the rc-tabs Context instance bundled by antd.
  const visibleItems = items
    .filter((item) => !hiddenTabKeys.has(String(item.key)))
    .map(
      ({
        children: _children,
        className: _className,
        destroyInactiveTabPane: _destroyInactiveTabPane,
        forceRender: _forceRender,
        style: _style,
        ...item
      }) => ({
        ...item,
        children: null,
      }),
    );
  const activeKey = visibleItems.some((item) => item.key === tabBarProps.activeKey)
    ? tabBarProps.activeKey
    : NO_ACTIVE_PAGE_TAB_KEY;
  const firstFocusableTabKey = visibleItems.find((item) => !item.disabled)?.key;
  const hiddenActiveTabKey = hiddenTabKeys.has(String(tabBarProps.activeKey))
    ? String(tabBarProps.activeKey)
    : undefined;
  const hiddenActiveTabLabelId =
    hiddenActiveTabKey && tabBarProps.id ? `${tabBarProps.id}-tab-${hiddenActiveTabKey}` : undefined;
  const renderTabNode = (node: React.ReactElement) => {
    const tabKey = String(node.key);
    if (activeKey !== NO_ACTIVE_PAGE_TAB_KEY || tabKey !== String(firstFocusableTabKey)) {
      return node;
    }
    let tabButtonFound = false;
    const children = React.Children.map(
      (node.props as { children?: React.ReactNode }).children,
      (child: React.ReactNode) => {
        if (tabButtonFound || !React.isValidElement(child)) {
          return child;
        }
        const childProps = child.props as {
          role?: string;
          tabIndex?: number | null;
        };
        if (childProps.role !== 'tab') {
          return child;
        }
        tabButtonFound = true;
        return React.cloneElement(child as React.ReactElement<typeof childProps>, {
          tabIndex: 0,
        });
      },
    );
    return React.cloneElement(node, undefined, children);
  };

  return (
    <>
      {hiddenActiveTabLabelId ? (
        <span id={hiddenActiveTabLabelId} hidden>
          {hiddenActiveTabLabel || hiddenActiveTabKey}
        </span>
      ) : null}
      <Tabs
        activeKey={NO_ACTIVE_PAGE_TAB_KEY}
        animated={{ inkBar: tabBarProps.animated.inkBar, tabPane: false }}
        destroyInactiveTabPane
        id={tabBarProps.id}
        items={visibleItems}
        more={tabBarProps.more}
        onTabClick={(key, event) => tabBarProps.onTabClick(key, event)}
        onTabScroll={tabBarProps.onTabScroll}
        renderTabBar={(navigationTabBarProps, NavigationDefaultTabBar) => (
          <NavigationDefaultTabBar {...navigationTabBarProps} activeKey={activeKey}>
            {renderTabNode}
          </NavigationDefaultTabBar>
        )}
        tabBarExtraContent={tabBarProps.extra}
        tabBarGutter={tabBarProps.tabBarGutter}
        tabBarStyle={tabBarProps.style}
        tabPosition={tabBarProps.tabPosition}
      />
    </>
  );
}
