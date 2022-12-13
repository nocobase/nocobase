import { AppstoreAddOutlined, SettingOutlined } from '@ant-design/icons';
import { ISchema } from '@formily/react';
import { uid } from '@formily/shared';
import { Dropdown, Menu } from 'antd';
import React, { useState,useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { PluginManager } from '../plugin-manager';
import { ActionContext } from '../schema-component';
import { useACLRoleContext } from '../acl/ACLProvider';
import {SettingsCenterContext} from './index';

const schema: ISchema = {
  type: 'object',
  properties: {
    [uid()]: {
      'x-component': 'Action.Drawer',
      type: 'void',
      title: '{{t("Collections & Fields")}}',
      properties: {
        configuration: {
          'x-component': 'ConfigurationTable',
        },
      },
    },
  },
};

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
  const { pluginTabBlacklist = [] } = useACLRoleContext();
  const [visible, setVisible] = useState(false);
  const { t } = useTranslation();
  const history = useHistory();
  const pluginsTabs=useContext(SettingsCenterContext);
  console.log(pluginsTabs)
  const items = [
    {
      title: t('Collections & Fields'),
      path: 'collection-manager/collections',
      key: 'collections',
    },
    {
      title: t('Roles & Permissions'),
      path: 'acl/roles',
      key: 'roles',
    },
    {
      title: t('File storages'),
      path: 'file-manager/storages',
      key: 'storages',
    },
    {
      title: t('System settings'),
      path: 'system-settings/system-settings',
      key: 'system-settings',
    },
    {
      title: t('workflow:Workflow'),
      path: 'workflow/workflows',
      key: 'workflows',
    },
  ];
  return (
    <ActionContext.Provider value={{ visible, setVisible }}>
      <Dropdown
        overlay={
          <Menu>
            <Menu.ItemGroup title={t('Bookmark')}>
              {items.map((item) => {
                return (
                  !pluginTabBlacklist.includes(item.key) && (
                    <Menu.Item
                      onClick={() => {
                        history.push('/admin/settings/' + item.path);
                      }}
                      key={item.path}
                    >
                      {item.title}
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
