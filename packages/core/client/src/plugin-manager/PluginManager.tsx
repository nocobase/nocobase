import { AppstoreOutlined, EllipsisOutlined } from '@ant-design/icons';
import { ConfigProvider, Menu, MenuItemProps, Spin, Tooltip } from 'antd';
import cls from 'classnames';
import { get } from 'lodash';
import React, { createContext, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useAPIClient, useRequest } from '../api-client';
import { PluginManagerContext } from './context';

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

const splitItems = (items: ToolbarItemProps[]) => {
  const pinned = [];
  const unpinned = [];
  for (const item of items) {
    if (item.pin) {
      pinned.push(item);
    } else {
      unpinned.push(item);
    }
  }
  return [pinned, unpinned];
};

PluginManager.Toolbar = (props: ToolbarProps) => {
  const { components } = useContext(PluginManagerContext);
  const { items = [] } = props;
  const [pinned, unpinned] = splitItems(items);
  const { t } = useTranslation();
  return (
    <div style={{ display: 'inline-block' }}>
      <Menu style={{ width: '100%' }} selectable={false} mode={'horizontal'} theme={'dark'}>
        {pinned.map((item, index) => {
          const Action = get(components, item.component);
          return (
            Action && (
              <ToolbarItemContext.Provider key={index} value={item}>
                <Action />
              </ToolbarItemContext.Provider>
            )
          );
        })}
        {unpinned.length > 0 && (
          <Menu.SubMenu popupClassName={'pm-sub-menu'} key={'more'} title={<EllipsisOutlined />}>
            {unpinned.map((item, index) => {
              const Action = get(components, item.component);
              return (
                Action && (
                  <ToolbarItemContext.Provider key={index} value={item}>
                    <Action />
                  </ToolbarItemContext.Provider>
                )
              );
            })}
            {unpinned.length > 0 && <Menu.Divider key={'divider'}></Menu.Divider>}
            <Menu.Item key={'plugins'} disabled icon={<AppstoreOutlined />}>
              {t('View all plugins')}
            </Menu.Item>
          </Menu.SubMenu>
        )}
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

export const RemotePluginManagerToolbar = () => {
  const api = useAPIClient();
  const { data, loading } = useRequest({
    resource: 'plugins',
    action: 'getPinned',
  });
  if (loading) {
    return <Spin />;
  }
  return <PluginManager.Toolbar items={data?.data} />;
};
