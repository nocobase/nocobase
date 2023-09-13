import {
  Icon,
  PinnedPluginListProvider,
  SchemaComponentOptions,
  SettingsCenterProvider,
  useRequest,
} from '@nocobase/client';
import { Button, Dropdown } from 'antd';
import React from 'react';
import { Link } from 'react-router-dom';
import { AppManager } from './AppManager';
import { AppNameInput } from './AppNameInput';
import { usePluginUtils } from './utils';

const MultiAppManager = () => {
  const { data, run } = useRequest<{
    data: any[];
  }>(
    {
      resource: 'applications',
      action: 'listPinned',
    },
    {
      manual: true,
    },
  );
  const { t } = usePluginUtils();
  const items = [
    ...(data?.data || []).map((app) => {
      let link = `/apps/${app.name}/admin/`;
      if (app.options?.standaloneDeployment && app.cname) {
        link = `//${app.cname}`;
      }
      return {
        key: app.name,
        label: (
          <a href={link} target="_blank" rel="noopener noreferrer">
            {app.displayName || app.name}
          </a>
        ),
      };
    }),
    {
      key: '.manager',
      label: <Link to="/admin/settings/multi-app-manager/applications">{t('Manage applications')}</Link>,
    },
  ];
  return (
    <Dropdown
      onOpenChange={(visible) => {
        run();
      }}
      menu={{ items }}
    >
      <Button title={'Apps'} icon={<Icon type={'AppstoreOutlined'} />} />
    </Dropdown>
  );
};

export const MultiAppManagerProvider = (props) => {
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
