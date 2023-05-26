import { ApiOutlined, SettingOutlined } from '@ant-design/icons';
import { Button, Dropdown, Menu, Tooltip } from 'antd';
import React, { useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { useACLRoleContext } from '../acl/ACLProvider';
import { ActionContext, useCompile } from '../schema-component';
import { getPluginsTabs, SettingsCenterContext } from './index';

export const PluginManagerLink = () => {
  const { t } = useTranslation();
  const history = useHistory();
  return (
    <Tooltip title={t('Plugin manager')}>
      <Button
        icon={<ApiOutlined />}
        title={t('Plugin manager')}
        onClick={() => {
          history.push('/admin/pm/list');
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
  const history = useHistory();
  const itemData = useContext(SettingsCenterContext);
  const pluginsTabs = getPluginsTabs(itemData, snippets);
  const bookmarkTabs = getBookmarkTabs(pluginsTabs);
  return (
    <ActionContext.Provider value={{ visible, setVisible }}>
      <Dropdown
        placement="bottom"
        menu={{
          items: [
            ...bookmarkTabs.map((tab) => ({
              key: `/admin/settings/${tab.path}`,
              label: compile(tab.title),
            })),
            { type: 'divider' },
            {
              key: '/admin/settings',
              label: t('All plugin settings'),
            },
          ],
          onClick({ key }) {
            history.push(key);
          },
        }}
      >
        <Button
          icon={<SettingOutlined />}
          // title={t('All plugin settings')}
        />
      </Dropdown>
    </ActionContext.Provider>
  );
};
