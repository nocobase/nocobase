import React, { useContext, useEffect, useMemo } from 'react';
import { Tabs } from 'antd';
import { useApp } from '@nocobase/client';
import { useACLTranslation } from '../locale';
import { GeneralPermissions } from './GeneralPermissions';
import { AvailableActionsProvider } from './AvailableActions';
import { ActionPermissions } from './ActionPermissions';
import { MenuPermissions } from './MenuPermissions';
import { MenuItemsProvider } from './MenuItemsProvider';
import { PluginPermissions } from './PluginPermissions';
import { RolesManagerContext } from '../RolesManagerProvider';

const TabLayout: React.FC = (props) => {
  return <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>{props.children}</div>;
};

export const Permissions: React.FC<{ active: boolean }> = ({ active }) => {
  const { t } = useACLTranslation();
  const [activeKey, setActiveKey] = React.useState('general');
  const { role } = useContext(RolesManagerContext);
  const pm = role?.snippets?.includes('pm.*');
  const app = useApp();
  const DataSourcePermissionManager = app.getComponent('DataSourcePermissionManager');

  const items = useMemo(
    () => [
      {
        key: 'general',
        label: t('General permissions'),
        children: (
          <TabLayout>
            <GeneralPermissions active={activeKey === 'general' && active} />
          </TabLayout>
        ),
      },
      {
        key: 'menu',
        label: t('Menu permissions'),
        children: (
          <TabLayout>
            <MenuItemsProvider>
              <MenuPermissions active={activeKey === 'menu' && active} />
            </MenuItemsProvider>
          </TabLayout>
        ),
      },
      ...(pm
        ? [
            {
              key: 'plugin',
              label: t('Plugin settings permissions'),
              children: (
                <TabLayout>
                  <PluginPermissions active={activeKey === 'plugin' && active} />
                </TabLayout>
              ),
            },
          ]
        : []),
      DataSourcePermissionManager
        ? {
            key: 'dataSource',
            label: t('Data source permissions'),
            children: (
              <TabLayout>
                <MenuItemsProvider>
                  <DataSourcePermissionManager role={role} active={activeKey === 'dataSource' && active} />
                </MenuItemsProvider>
              </TabLayout>
            ),
          }
        : {},
    ],
    [pm, activeKey, active, t],
  );

  useEffect(() => {
    setActiveKey('general');
  }, [role?.name]);
  console.log(items);
  return (
    <AvailableActionsProvider>
      <Tabs type="card" activeKey={activeKey} onChange={(key) => setActiveKey(key)} items={items} />
    </AvailableActionsProvider>
  );
};
