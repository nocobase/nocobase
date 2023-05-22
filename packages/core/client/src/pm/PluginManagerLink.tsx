import { ApiOutlined, SettingOutlined } from '@ant-design/icons';
import { Button, Dropdown, Menu, Tooltip } from 'antd';
import React, { useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useACLRoleContext } from '../acl/ACLProvider';
import { ActionContext, useCompile } from '../schema-component';
import { getPluginsTabs, SettingsCenterContext } from './index';

export const PluginManagerLink = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <Tooltip title={t('Plugin manager')}>
      <Button
        icon={<ApiOutlined />}
        title={t('Plugin manager')}
        onClick={() => {
          navigate('/admin/pm/list');
        }}
      />
    </Tooltip>
  );
};

const getBookmarkTabs = (data) => {
  const bookmarkTabs = [];
  data.forEach((plugin) => {
    const tabs = plugin.tabs;
    tabs.forEach((tab) => {
      tab.isBookmark && tab.isAllow && bookmarkTabs.push({ ...tab, path: `${plugin.key}/${tab.key}` });
    });
  });
  return bookmarkTabs;
};
export const SettingsCenterDropdown = () => {
  const { snippets = [] } = useACLRoleContext();
  const [visible, setVisible] = useState(false);
  const { t } = useTranslation();
  const compile = useCompile();
  const navigate = useNavigate();
  const itemData = useContext(SettingsCenterContext);
  const pluginsTabs = getPluginsTabs(itemData, snippets);
  const bookmarkTabs = getBookmarkTabs(pluginsTabs);
  return (
    <ActionContext.Provider value={{ visible, setVisible }}>
      <Dropdown
        placement="bottom"
        overlay={
          <Menu>
            {bookmarkTabs.map((tab) => {
              return (
                <Menu.Item
                  onClick={() => {
                    navigate('/admin/settings/' + tab.path);
                  }}
                  key={tab.path}
                >
                  {compile(tab.title)}
                </Menu.Item>
              );
            })}
            <Menu.Divider></Menu.Divider>
            <Menu.Item
              onClick={() => {
                navigate('/admin/settings');
              }}
              key="/admin/settings"
            >
              {t('All plugin settings')}
            </Menu.Item>
          </Menu>
        }
      >
        <Button
          icon={<SettingOutlined />}
          // title={t('All plugin settings')}
        />
      </Dropdown>
    </ActionContext.Provider>
  );
};
