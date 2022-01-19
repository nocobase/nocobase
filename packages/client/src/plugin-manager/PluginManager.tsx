import React, { createContext, useContext } from 'react';
import { Menu, Space, Tooltip } from 'antd';
import { SettingOutlined, MoreOutlined, DesktopOutlined } from '@ant-design/icons';
import { CurrentUser, DesignableSwitch, CollectionManagerAction, ACLAction, SystemSettings } from '../';
import { get } from 'lodash';
import { PluginManagerContext, PluginManagerProvider } from '.';

// TODO
export const PluginManager: any = () => null;

PluginManager.Provider = PluginManagerProvider;

const ToolbarItemContext = createContext(null);

PluginManager.Toolbar = (props: any) => {
  const { components } = useContext(PluginManagerContext);
  const { items = [] } = props;
  return (
    <div style={{ display: 'inline-block' }}>
      <Menu style={{ width: '100%' }} selectable={false} mode={'horizontal'} theme={'dark'}>
        {items
          .filter((item) => item.pin)
          .map((item) => {
            const Action = get(components, item.component);
            return (
              Action && (
                <ToolbarItemContext.Provider value={item}>
                  <Action />
                </ToolbarItemContext.Provider>
              )
            );
          })}
        <Menu.SubMenu key={'more'} title={<MoreOutlined />}>
          {items
            .filter((item) => !item.pin)
            .map((item) => {
              const Action = get(components, item.component);
              return (
                Action && (
                  <ToolbarItemContext.Provider value={item}>
                    <Action />
                  </ToolbarItemContext.Provider>
                )
              );
            })}
          <Menu.Divider></Menu.Divider>
          <Menu.Item icon={<SettingOutlined />}>管理插件</Menu.Item>
        </Menu.SubMenu>
      </Menu>
    </div>
  );
};

PluginManager.Toolbar.Item = (props) => {
  const item = useContext(ToolbarItemContext);
  const { icon, title, ...others } = props;
  if (item.pin) {
    return (
      <Tooltip title={title}>
        <Menu.Item {...others} eventKey={item.component}>
          {icon}
        </Menu.Item>
      </Tooltip>
    );
  }
  return (
    <Menu.Item {...others} eventKey={item.component} icon={icon}>
      {title}
    </Menu.Item>
  );
};
