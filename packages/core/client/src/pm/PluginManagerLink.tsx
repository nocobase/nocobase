import { AppstoreAddOutlined, SettingOutlined } from '@ant-design/icons';
import { ISchema } from '@formily/react';
import { uid } from '@formily/shared';
import { Dropdown, Menu } from 'antd';
import React, { useState, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { PluginManager } from '../plugin-manager';
import { useCompile } from '../schema-component';
import { ActionContext } from '../schema-component';
import { useACLRoleContext } from '../acl/ACLProvider';
import { getPluginsTabs, SettingsCenterContext } from './index';

export const PluginManagerLink = () => {
  const [visible, setVisible] = useState(false);
  const { t } = useTranslation();
  const history = useHistory();
  return (
    <ActionContext.Provider value={{ visible, setVisible }}>
      <PluginManager.Toolbar.Item
        icon={<AppstoreAddOutlined />}
        title={t('Plugin manager')}
        onClick={() => {
          history.push('/admin/pm/list');
        }}
      />
    </ActionContext.Provider>
  );
};

export const SettingsCenterDropdown = () => {
  const { snippets = [] } = useACLRoleContext();
  const [visible, setVisible] = useState(false);
  const { t } = useTranslation();
  const compile = useCompile();

  const history = useHistory();
  const itemData = useContext(SettingsCenterContext);
  const pluginsTabs = getPluginsTabs(itemData, snippets);
  return (
    <ActionContext.Provider value={{ visible, setVisible }}>
      <Dropdown
        placement="bottom"
        overlay={
          <Menu>
            <Menu.ItemGroup title={t('Bookmark')}>
              {pluginsTabs.map((plugin) => {
                const tabKey = plugin.tabs[0]?.key;
                const path = `${plugin.key}/${tabKey}`;
                return (
                  plugin.isBookmark && (
                    <Menu.Item
                      onClick={() => {
                        history.push('/admin/settings/' + path);
                      }}
                      key={path}
                    >
                      {compile(plugin.title)}
                    </Menu.Item>
                  )
                );
              })}
            </Menu.ItemGroup>
            <Menu.Divider></Menu.Divider>
            <Menu.Item
              onClick={() => {
                history.push('/admin/settings');
              }}
              key="/admin/settings"
            >
              {t('Settings center')}
            </Menu.Item>
          </Menu>
        }
      >
        <PluginManager.Toolbar.Item
          icon={<SettingOutlined />}
          // title={t('Settings center')}
        ></PluginManager.Toolbar.Item>
      </Dropdown>
    </ActionContext.Provider>
  );
};
