import { SettingOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { ConfigProvider, Menu, MenuItemProps, Tooltip } from 'antd';
import cls from 'classnames';
import { get } from 'lodash';
import React, { createContext, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { PluginManagerContext } from './context';
import { useACLRoleContext } from '../acl/ACLProvider';

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
    Item?: React.FC<MenuItemProps & { selected?: boolean; subtitle?: string }>;
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
  const history = useHistory();
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
          <Menu.SubMenu popupClassName={'pm-sub-menu'} key={'more'} title={<SettingOutlined />}>
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
            <Menu.Item
              key={'plugins'}
              onClick={() => {
                history.push('/admin/settings');
              }}
              icon={<SettingOutlined />}
            >
              {t('Settings center')}
            </Menu.Item>
          </Menu.SubMenu>
        )}
      </Menu>
    </div>
  );
};

PluginManager.Toolbar.Item = (props) => {
  const item = useContext(ToolbarItemContext);
  const { selected, icon, title, subtitle, ...others } = props;
  const prefix = usePrefixCls();
  const className = cls({ [`${prefix}-menu-item-selected`]: selected });
  if (item.pin) {
    const subtitleComponent = subtitle && (
      <div
        className={css`
          font-size: 12px;
          color: #999;
        `}
      >
        {subtitle}
      </div>
    );

    const titleComponent = (
      <div>
        <div>{title}</div>
        {subtitleComponent}
      </div>
    );

    return title ? (
      <Tooltip title={titleComponent}>
        <Menu.Item {...others} className={className} eventKey={item.component}>
          {icon}
        </Menu.Item>
      </Tooltip>
    ) : (
      <Menu.Item {...others} className={className} eventKey={item.component}>
        {icon}
      </Menu.Item>
    );
  }
  return (
    <Menu.Item {...others} className={className} eventKey={item.component} icon={icon}>
      {title}
    </Menu.Item>
  );
};

export const RemotePluginManagerToolbar = () => {
  const { allowAll, snippets } = useACLRoleContext();
  const getSnippetsAllow = (aclKey) => {
    return allowAll || snippets?.includes(aclKey);
  };
  const items = [
    { component: 'DesignableSwitch', pin: true, isAllow: getSnippetsAllow('ui-editor') },
    { component: 'PluginManagerLink', pin: true, isAllow: getSnippetsAllow('plugin-manager') },
    { component: 'SettingsCenterDropdown', pin: true, isAllow: getSnippetsAllow('settings-center.*') },
    // ...data?.data,
  ];
  return <PluginManager.Toolbar items={items.filter((v) => v.isAllow)} />;
};
