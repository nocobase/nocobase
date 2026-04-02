/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { theme as antdTheme, Typography } from 'antd';
import React from 'react';
import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSystemSettings } from '@nocobase/client-v2';
import AuthenticatorsContextProvider from '../providers/AuthenticatorsContextProvider';
import SwitchLanguage from '../components/SwitchLanguage';
import PoweredByLite from '../components/PoweredByLite';

export default function AuthLayout() {
  const { token } = antdTheme.useToken();
  const { data } = useSystemSettings() || {};
  const { t } = useTranslation('lm-collections');

  return (
    <div
      style={{
        minHeight: '100vh',
        background: `linear-gradient(180deg, ${token.colorBgLayout} 0%, ${token.colorBgContainer} 100%)`,
        padding: token.paddingLG,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ position: 'fixed', top: token.paddingLG, right: token.paddingLG, color: token.colorText }}>
        <SwitchLanguage />
      </div>
      <div
        style={{
          width: '100%',
          maxWidth: 360,
          padding: token.paddingXL,
          background: token.colorBgContainer,
          borderRadius: token.borderRadiusLG,
          boxShadow: token.boxShadowSecondary,
        }}
      >
        <Typography.Title level={2} style={{ textAlign: 'center', marginBottom: token.marginLG }}>
          {t(data?.data?.title)}
        </Typography.Title>
        <AuthenticatorsContextProvider>
          <Outlet />
        </AuthenticatorsContextProvider>
        <div style={{ marginTop: token.marginXL, textAlign: 'center' }}>
          <PoweredByLite />
        </div>
      </div>
    </div>
  );
}
