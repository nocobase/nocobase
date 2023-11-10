import { ApiOutlined, SettingOutlined } from '@ant-design/icons';
import { Button, Dropdown, MenuProps, Tooltip } from 'antd';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ADMIN_SETTINGS_PATH, useApp } from '../application';
import { ActionContextProvider, useCompile } from '../schema-component';
import { useToken } from '../style';

export const PluginManagerLink = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { token } = useToken();
  return (
    <Tooltip title={t('Plugin manager')}>
      <Button
        data-testid={'plugin-manager-button'}
        icon={<ApiOutlined style={{ color: token.colorTextHeaderMenu }} />}
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
  const compile = useCompile();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const app = useApp();
  const settings = app.settingsCenter.getList();
  const bookmarkMenus = settings.filter((item) => item.isBookmark);
  const menu = useMemo<MenuProps>(() => {
    return {
      items: [
        ...bookmarkMenus.map((menu) => ({
          key: menu.path,
          role: 'button',
          label: compile(menu.label),
        })),
        { type: 'divider' },
        {
          key: ADMIN_SETTINGS_PATH,
          role: 'button',
          label: t('All plugin settings'),
        },
      ],
      onClick({ key }) {
        navigate(key);
      },
    };
  }, [bookmarkMenus, compile, navigate, t]);

  return (
    <ActionContextProvider value={{ visible, setVisible }}>
      <Dropdown placement="bottom" menu={menu}>
        <Button
          data-testid="settings-center-button"
          icon={<SettingOutlined style={{ color: token.colorTextHeaderMenu }} />}
          // title={t('All plugin settings')}
        />
      </Dropdown>
    </ActionContextProvider>
  );
};
