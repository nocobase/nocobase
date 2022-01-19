import React, { createContext } from 'react';
import { Menu, Space } from 'antd';
import { SettingOutlined, MoreOutlined, DesktopOutlined } from '@ant-design/icons';
import { CurrentUser, DesignableSwitch, CollectionManagerAction, ACLAction, SystemSettings } from '../';
import { get } from 'lodash';
import { PluginManagerProvider } from '.';

export const PluginManager = () => null;

PluginManager.Provider = PluginManagerProvider;

PluginManager.Toolbar = (props: any) => {
  const components = { CurrentUser, DesignableSwitch, CollectionManagerAction, ACLAction, SystemSettings };
  const items = [
    {
      action: 'DesignableSwitch',
      pin: true,
    },
    {
      action: 'CollectionManagerAction',
      pin: true,
    },
    {
      action: 'ACLAction',
      pin: true,
    },
    {
      action: 'SystemSettings.Action',
    },
  ];
  const CurrentUserDropdown = get(components, 'CurrentUser.Dropdown');
  return (
    <Menu selectable={false} mode={'horizontal'} theme={'dark'}>
      {items
        .filter((item) => item.pin)
        .map((item) => {
          const Action = get(components, item.action);
          return Action && <Action />;
        })}
      <Menu.SubMenu key={'more'} title={<MoreOutlined />}>
        {items
          .filter((item) => !item.pin)
          .map((item) => {
            const Action = get(components, item.action);
            return Action && <Action />;
          })}
        <Menu.Divider></Menu.Divider>
        <Menu.Item icon={<SettingOutlined />}>管理插件</Menu.Item>
      </Menu.SubMenu>
      <CurrentUserDropdown />
    </Menu>
  );
};
