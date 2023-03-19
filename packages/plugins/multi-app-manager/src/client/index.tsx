import {
  Icon,
  PinnedPluginListProvider,
  SchemaComponentOptions,
  SettingsCenterProvider,
  useRequest
} from '@nocobase/client';
import { Button, Dropdown, Menu } from 'antd';
import React from 'react';
import { useHistory } from 'react-router-dom';
import { AppManager } from './AppManager';
import { AppNameInput } from './AppNameInput';
import { usePluginUtils } from './utils';

const MultiAppManager = () => {
  const history = useHistory();
  const { data, loading, run } = useRequest(
    {
      resource: 'applications',
      action: 'listPinned',
    },
    {
      manual: true,
    },
  );
  const { t } = usePluginUtils();
  const menu = (
    <Menu>
      {(data?.data || []).map((app) => {
        return (
          <Menu.Item
            key={app.name}
            onClick={() => {
              window.open(`/apps/${app.name}/admin/`, '_blank');
            }}
          >
            {app.displayName || app.name}
          </Menu.Item>
        );
      })}
      {(data?.data || []).length > 0 && <Menu.Divider />}
      <Menu.Item
        onClick={() => {
          history.push('/admin/settings/multi-app-manager/applications');
        }}
      >
        {t('Manage applications')}
      </Menu.Item>
    </Menu>
  );
  return (
    <Dropdown
      onVisibleChange={(visible) => {
        run();
      }}
      overlay={menu}
    >
      <Button title={'Apps'} icon={<Icon type={'AppstoreOutlined'} />} />
    </Dropdown>
  );
};

export { tableActionColumnSchema } from './settings/schemas/applications';

export default (props) => {
  const { t } = usePluginUtils();
  return (
    <PinnedPluginListProvider
      items={{
        am: { order: 201, component: 'MultiAppManager', pin: true },
      }}
    >
      <SchemaComponentOptions components={{ MultiAppManager, AppNameInput }}>
        <SettingsCenterProvider
          settings={{
            'multi-app-manager': {
              title: t('Multi-app manager'),
              icon: 'AppstoreOutlined',
              tabs: {
                applications: {
                  title: t('Applications'),
                  component: () => <AppManager />,
                },
                // settings: {
                //   title: 'Settings',
                //   component: () => <Settings />,
                // },
              },
            },
          }}
        >
          {props.children}
        </SettingsCenterProvider>
      </SchemaComponentOptions>
    </PinnedPluginListProvider>
  );
};
