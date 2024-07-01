/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { FC, useCallback } from 'react';
import { Tabs, TabsProps } from 'antd-mobile';
import { useParams, useLocation, useNavigate } from 'react-router-dom';

import { useMobileRoutesContext } from '../../../mobile-providers';
import { MobilePageTabInitializer, MobilePageTabSettings } from './tab';
import { DndContext, DndContextProps, SortableItem } from '@nocobase/client';

export const MobilePageNavigationBarTabs: FC = () => {
  const { activeTabBarItem, resource, refresh } = useMobileRoutesContext();
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

  const handleDragEnd: DndContextProps['onDragEnd'] = useCallback(async (event) => {
    const { active, over } = event;
    const activeId = active?.id;
    const overId = over?.id;

    if ((!activeId || !overId) || (activeId === overId)) {
      return;
    }
    await resource.move({ sourceId: activeId, targetId: overId, sortField: 'sort' })
    await refresh();
  }, [resource, refresh])

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1em' }}>
      <DndContext onDragEnd={handleDragEnd}>
        <Tabs activeKey={activeKey} onChange={handleChange} style={{ flex: 1 }}>
          {activeTabBarItem.children?.map((item) => (
            <Tabs.Tab
              title={
                <SortableItem id={item.id as any}>
                  <MobilePageTabSettings tab={item} />
                  {item.options.title}
                </SortableItem>
              }
              key={String(item.url)}
            ></Tabs.Tab>
          ))}
        </Tabs>
      </DndContext>
      <MobilePageTabInitializer />
    </div>
  );
};
