/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { FC, useMemo } from 'react';
import { NavBar, Tabs, TabsProps } from 'antd-mobile';
import { Affix } from 'antd';
import { useParams, useLocation, useNavigate } from 'react-router-dom';

import { useMobileTabContext, useMobileTitle } from '../mobile-providers';
import { useMobilePage } from '../mobile-page/context';
import { MobilePageTabInitializer } from './tab';

export const MobileNavigationBar: FC = () => {
  const { title } = useMobileTitle();
  const {
    enableNavigationBar = true,
    enableNavigationBarTabs = false,
    enableNavigationBarTitle = true,
  } = useMobilePage();
  const { activeTabBarItem, activeTabBarItemTab } = useMobileTabContext();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { tabId } = useParams<{ tabId: string }>();
  const [activeKey, setActiveKey] = React.useState<string>(() => {
    return tabId ? pathname : activeTabBarItemTab.children[0]?.url;
  });
  const handleChange: TabsProps['onChange'] = (url) => {
    if (!url) {
      return;
    }
    setActiveKey(url);
    navigate(url);
  };

  if (!enableNavigationBar) return null;

  return (
    <Affix offsetTop={0} style={{ borderBottom: '1px solid var(--adm-color-border)' }}>
      <NavBar backArrow={false}>{enableNavigationBarTitle ? title : null}</NavBar>
      {enableNavigationBarTabs && (
        <Tabs activeKey={activeKey} onChange={handleChange}>
          {activeTabBarItem.children?.map((item) => (
            <Tabs.Tab title={item.options.title} key={String(item.url)}></Tabs.Tab>
          ))}
          <Tabs.Tab title={<MobilePageTabInitializer />} key={''}></Tabs.Tab>
        </Tabs>
      )}
    </Affix>
  );
};
