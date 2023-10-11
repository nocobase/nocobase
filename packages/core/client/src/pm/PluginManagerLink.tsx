import { ApiOutlined, SettingOutlined } from '@ant-design/icons';
import { Button, Dropdown, MenuProps, Tooltip } from 'antd';
import _ from 'lodash';
import React, { useContext, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useACLRoleContext } from '../acl/ACLProvider';
import { ActionContextProvider, useCompile } from '../schema-component';
import { SettingsCenterContext, getPluginsTabs } from './index';

export const PluginManagerLink = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <Tooltip title={t('Plugin manager')}>
      <Button
        data-testid={'pm-button'}
        icon={<ApiOutlined />}
        title={t('Plugin manager')}
        onClick={() => {
          navigate('/admin/pm/list');
        }}
      />
    </Tooltip>
  );
};

const getBookmarkTabs = _.memoize((data) => {
  const bookmarkTabs = [];
  data.forEach((plugin) => {
    const tabs = plugin.tabs;
    tabs.forEach((tab) => {
      tab.isBookmark && tab.isAllow && bookmarkTabs.push({ ...tab, path: `${plugin.key}/${tab.key}` });
    });
  });
  return bookmarkTabs;
});
export const SettingsCenterDropdown = () => {
  const { snippets = [] } = useACLRoleContext();
  const [visible, setVisible] = useState(false);
  const { t } = useTranslation();
  const compile = useCompile();
  const navigate = useNavigate();
  const itemData = useContext(SettingsCenterContext);
  const pluginsTabs = getPluginsTabs(itemData, snippets);
  const bookmarkTabs = getBookmarkTabs(pluginsTabs);
  const menu = useMemo<MenuProps>(() => {
    return {
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
        navigate(key);
      },
    };
  }, [bookmarkTabs]);

  return (
    <ActionContextProvider value={{ visible, setVisible }}>
      <Dropdown placement="bottom" menu={menu}>
        <Button
          data-testid="settings-center-button"
          icon={<SettingOutlined />}
          // title={t('All plugin settings')}
        />
      </Dropdown>
    </ActionContextProvider>
  );
};
