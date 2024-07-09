/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { FC, useCallback, useEffect } from 'react';
import { Tabs, TabsProps } from 'antd-mobile';
import { useParams, useLocation, useNavigate, Navigate } from 'react-router-dom';

import { useMobileRoutes } from '../../../mobile-providers';
import { MobilePageTabInitializer, MobilePageTabSettings } from './tab';
import { DndContext, DndContextProps, SortableItem } from '@nocobase/client';
import { useStyles } from './styles';

export const MobilePageNavigationBarTabs: FC = () => {
  const { activeTabBarItem, resource, refresh } = useMobileRoutes();
  const navigate = useNavigate();
  const { styles } = useStyles();
  const { tabSchemaUid } = useParams<{ tabSchemaUid: string }>();
  const [activeKey, setActiveKey] = React.useState<string>(() => {
    return tabSchemaUid || activeTabBarItem?.children[0]?.schemaUid;
  });
  const handleChange: TabsProps['onChange'] = (schemaUid) => {
    setActiveKey(schemaUid);
    navigate(`/${activeTabBarItem.type}/${activeTabBarItem.schemaUid}/tabs/${schemaUid}`);
  };

  const handleDragEnd: DndContextProps['onDragEnd'] = useCallback(
    async (event) => {
      const { active, over } = event;
      const activeId = active?.id;
      const overId = over?.id;

      if (!activeId || !overId || activeId === overId) {
        return;
      }
      await resource.move({ sourceId: activeId, targetId: overId, sortField: 'sort' });
      await refresh();
    },
    [resource, refresh],
  );
  if (!activeTabBarItem) return <Navigate replace to='/' />

  return (
    <div className={styles.mobileNavigationBarTabsWrapper} data-testid='mobile-mobile-page-navigation-bar-tabs'>
      <DndContext onDragEnd={handleDragEnd}>
        <Tabs activeKey={activeKey} onChange={handleChange} className={styles.mobileNavigationBarTabs}>
          {activeTabBarItem.children?.map((item) => (
            <Tabs.Tab
              data-testid={`mobile-mobile-page-navigation-bar-tabs-${item.title}`}
              title={
                <SortableItem id={item.id as any}>
                  <MobilePageTabSettings tab={item} />
                  {item.title}
                </SortableItem>
              }
              key={String(item.schemaUid)}
            ></Tabs.Tab>
          ))}
        </Tabs>
      </DndContext>
      <div>
        <MobilePageTabInitializer />
      </div>
    </div>
  );
};
