/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { FC } from 'react';
import { Tabs, TabsProps } from 'antd-mobile';
import { useParams, useLocation, useNavigate } from 'react-router-dom';

import { useMobileTabContext } from '../mobile-providers';
import { MobilePageTabInitializer, MobilePageTabSettings } from './tab';

export const MobileNavigationBarTabs: FC = () => {
  const { activeTabBarItem } = useMobileTabContext();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { tabSchemaUid } = useParams<{ tabSchemaUid: string }>();
  const [activeKey, setActiveKey] = React.useState<string>(() => {
    return tabSchemaUid ? pathname : activeTabBarItem.children[0]?.url;
  });
  const handleChange: TabsProps['onChange'] = (url) => {
    setActiveKey(url);
    navigate(url);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1em' }}>
      <Tabs activeKey={activeKey} onChange={handleChange} style={{ flex: 1 }}>
        {activeTabBarItem.children?.map((item) => (
          <Tabs.Tab
            title={
              <div>
                <MobilePageTabSettings tab={item} />
                {item.options.title}
              </div>
            }
            key={String(item.url)}
          ></Tabs.Tab>
        ))}
      </Tabs>
      <MobilePageTabInitializer />
    </div>
  );
};
