import React, { createContext, useContext } from 'react';
import { Menu, Space, Tooltip, MenuItemProps } from 'antd';
import { SettingOutlined, MoreOutlined, DesktopOutlined } from '@ant-design/icons';
import { get } from 'lodash';
import { PluginManagerContext } from './context';
import cls from 'classnames';
import { ConfigProvider } from 'antd';

export const usePrefixCls = (
  tag?: string,
  props?: {
    prefixCls?: string;
  },
) => {
  const { getPrefixCls } = useContext(ConfigProvider.ConfigContext);
  return getPrefixCls(tag, props?.prefixCls);
};

type PluginManagerType = {
  Toolbar?: React.FC<ToolbarProps> & {
    Item?: React.FC<MenuItemProps & { selected?: boolean }>;
  };
};

export const PluginManager: PluginManagerType = () => null;

const ToolbarItemContext = createContext<ToolbarItemProps>(null);

interface ToolbarProps {
  items?: ToolbarItemProps[];
}

interface ToolbarItemProps {
  component: string;
  pin?: boolean;
}

PluginManager.Toolbar = (props: ToolbarProps) => {
  const { components } = useContext(PluginManagerContext);
  const { items = [] } = props;
  return (
    <div style={{ display: 'inline-block' }}>
      <Menu style={{ width: '100%' }} selectable={false} mode={'horizontal'} theme={'dark'}>
        {items
          .filter((item) => item.pin)
          .map((item, index) => {
            const Action = get(components, item.component);
            return (
              Action && (
                <ToolbarItemContext.Provider key={index} value={item}>
                  <Action />
                </ToolbarItemContext.Provider>
              )
            );
          })}
        <Menu.SubMenu key={'more'} title={<MoreOutlined />}>
          {items
            .filter((item) => !item.pin)
            .map((item, index) => {
              const Action = get(components, item.component);
              return (
                Action && (
                  <ToolbarItemContext.Provider key={index} value={item}>
                    <Action />
                  </ToolbarItemContext.Provider>
                )
              );
            })}
          <Menu.Divider key={'divider'}></Menu.Divider>
          <Menu.Item  key={'plugins'} disabled icon={<SettingOutlined />}>
            管理插件
          </Menu.Item>
        </Menu.SubMenu>
      </Menu>
    </div>
  );
};

PluginManager.Toolbar.Item = (props) => {
  const item = useContext(ToolbarItemContext);
  const { selected, icon, title, ...others } = props;
  const prefix = usePrefixCls();
  const className = cls({ [`${prefix}-menu-item-selected`]: selected });
  if (item.pin) {
    return (
      <Tooltip title={title}>
        <Menu.Item {...others} className={className} eventKey={item.component}>
          {icon}
        </Menu.Item>
      </Tooltip>
    );
  }
  return (
    <Menu.Item {...others} className={className} eventKey={item.component} icon={icon}>
      {title}
    </Menu.Item>
  );
};
