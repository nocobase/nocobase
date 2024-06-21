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
  const defaultActiveKey = useMemo(
    () => (tabId ? pathname : activeTabBarItemTab.children[0]?.url),
    [tabId, pathname, activeTabBarItemTab],
  );
  const handleChange: TabsProps['onChange'] = (url) => {
    navigate(url);
  };

  if (!enableNavigationBar) return null;

  return (
    <Affix offsetTop={0} style={{ borderBottom: '1px solid var(--adm-color-border)' }}>
      <NavBar backArrow={false}>{enableNavigationBarTitle ? title : null}</NavBar>
      {enableNavigationBarTabs && (
        <Tabs defaultActiveKey={defaultActiveKey} onChange={handleChange}>
          {activeTabBarItem.children?.map((item) => (
            <Tabs.Tab title={item.options.title} key={String(item.url)}></Tabs.Tab>
          ))}
        </Tabs>
      )}
    </Affix>
  );
};
