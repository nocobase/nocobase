/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { theme as antdTheme } from 'antd';
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
        maxWidth: 320,
        margin: '0 auto',
        paddingTop: '20vh',
        paddingBottom: '20vh',
      }}
    >
      <div style={{ position: 'fixed', top: token.paddingLG, right: token.paddingLG, color: token.colorText }}>
        <SwitchLanguage />
      </div>
      <h1 style={{ textAlign: 'center' }}>{t(data?.data?.title)}</h1>
      <AuthenticatorsContextProvider>
        <Outlet />
      </AuthenticatorsContextProvider>
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          paddingBottom: token.paddingLG,
          textAlign: 'center',
          backgroundColor: token.colorBgContainer,
        }}
      >
        <PoweredByLite />
      </div>
    </div>
  );
}
