import { useApp, useRequest, useAPIClient } from '@nocobase/client';
import { Tabs } from 'antd';
import React, { useContext, useEffect, useMemo } from 'react';
import { RolesManagerContext } from '../RolesManagerProvider';
import { useACLTranslation } from '../locale';
import { AvailableActionsProvider } from './AvailableActions';
import { GeneralPermissions } from './GeneralPermissions';
import { MenuItemsProvider } from './MenuItemsProvider';
import { MenuPermissions } from './MenuPermissions';

const TabLayout: React.FC = (props) => {
  return <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>{props.children}</div>;
};

export const Permissions: React.FC<{ active: boolean }> = ({ active }) => {
  const { t } = useACLTranslation();
  const [activeKey, setActiveKey] = React.useState('general');
  const { role, setRole } = useContext(RolesManagerContext);
  const pm = role?.snippets?.includes('pm.*');
  const app = useApp();
  const DataSourcePermissionManager = app.getComponent('DataSourcePermissionManager');

  const items = useMemo(
    () => [
      {
        key: 'general',
        label: t('System'),
        children: (
          <TabLayout>
            <GeneralPermissions active={activeKey === 'general' && active} />
          </TabLayout>
        ),
      },
      {
        key: 'menu',
        label: t('Menu'),
        children: (
          <TabLayout>
            <MenuItemsProvider>
              <MenuPermissions active={activeKey === 'menu' && active} />
            </MenuItemsProvider>
          </TabLayout>
        ),
      },
      ...(DataSourcePermissionManager
        ? [
            {
              key: 'dataSource',
              label: t('Data sources'),
              children: (
                <TabLayout>
                  <MenuItemsProvider>
                    <DataSourcePermissionManager role={role} active={activeKey === 'dataSource' && active} />
                  </MenuItemsProvider>
                </TabLayout>
              ),
            },
          ]
        : []),
    ],
    [pm, activeKey, active, t],
  );
  const api = useAPIClient();
  const { data } = useRequest(
    () =>
      api
        .resource('roles')
        .get({
          filterByTk: role?.name,
        })
        .then((res) => {
          const record = res?.data?.data;
          record.snippets?.forEach((key: string) => {
            record[key] = true;
          });
          return record;
        }),
    {
      ready: active && !!role,
      refreshDeps: [role?.name],
    },
  );
  useEffect(() => {
    setActiveKey('general');
  }, [role?.name]);

  useEffect(() => {
    setRole(data);
  }, [data]);
  return (
    <AvailableActionsProvider>
      <Tabs type="card" activeKey={activeKey} onChange={(key) => setActiveKey(key)} items={items} />
    </AvailableActionsProvider>
  );
};
