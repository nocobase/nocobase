/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ApiOutlined, SettingOutlined } from '@ant-design/icons';
import { Button, Dropdown, Tooltip } from 'antd';
import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useApp, useNavigateNoUpdate } from '../application';
import { useMobileLayout } from '../route-switch/antd/admin-layout';
import { useCompile } from '../schema-component';
import { useToken } from '../style';

export const PluginManagerLink = () => {
  const { t } = useTranslation();
  const navigate = useNavigateNoUpdate();
  const { token } = useToken();
  const { isMobileLayout } = useMobileLayout();

  if (isMobileLayout) {
    return null;
  }

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
  const compile = useCompile();
  const { t } = useTranslation();
  const { token } = useToken();
  const app = useApp();
  const settingItems = useMemo(() => {
    const settings = app.pluginSettingsManager.getList();
    return settings
      .filter((v) => v.isTopLevel !== false)
      .map((setting) => {
        return {
          key: setting.name,
          icon: setting.icon,
          label: setting.link ? (
            <div onClick={() => window.open(setting.link)}>{compile(setting.title)}</div>
          ) : (
            <Link to={setting.path}>{compile(setting.title)}</Link>
          ),
        };
      });
  }, [app, t]);

  useEffect(() => {
    return () => {
      app.pluginSettingsManager.clearCache();
    };
  }, [app.pluginSettingsManager]);

  const { isMobileLayout } = useMobileLayout();

  if (isMobileLayout) {
    return null;
  }

  return (
    <Dropdown
      menu={{
        style: {
          maxHeight: '70vh',
          overflow: 'auto',
        },
        items: settingItems,
      }}
    >
      <Button
        data-testid="plugin-settings-button"
        icon={<SettingOutlined style={{ color: token.colorTextHeaderMenu }} />}
        // title={t('All plugin settings')}
      />
    </Dropdown>
  );
};
