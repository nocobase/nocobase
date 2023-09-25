import { ApiOutlined, SettingOutlined } from '@ant-design/icons';
import { Button, Dropdown, MenuProps, Tooltip } from 'antd';
import _ from 'lodash';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ActionContextProvider } from '../schema-component';
import { useSettingsCenterListWithAuth } from './PluginSetting';

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

export const SettingsCenterDropdown = () => {
  const [visible, setVisible] = useState(false);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const menuList = useSettingsCenterListWithAuth();
  const bookmarkMenus = menuList.filter((item) => item.isAllow && item.isBookmark);
  const menu = useMemo<MenuProps>(() => {
    return {
      items: [
        ...bookmarkMenus.map((menu) => ({
          key: menu.path,
          label: menu.label,
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
  }, [bookmarkMenus, navigate, t]);

  return (
    <ActionContextProvider value={{ visible, setVisible }}>
      <Dropdown placement="bottom" menu={menu}>
        <Button
          icon={<SettingOutlined />}
          // title={t('All plugin settings')}
        />
      </Dropdown>
    </ActionContextProvider>
  );
};
