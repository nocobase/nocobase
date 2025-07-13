/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css } from '@emotion/css';
import {
  PoweredBy,
  ReadPretty,
  SwitchLanguage,
  useAPIClient,
  useRequest,
  useSystemSettings,
  useToken,
} from '@nocobase/client';
import { Spin } from 'antd';
import React, { FC } from 'react';
import { Outlet } from 'react-router-dom';
import { AuthenticatorsContext } from '../authenticator';

export const AuthenticatorsContextProvider: FC<{ children: React.ReactNode }> = ({ children }) => {
  const api = useAPIClient();
  const {
    data: authenticators = [],
    error,
    loading,
  } = useRequest(() =>
    api
      .resource('authenticators')
      .publicList()
      .then((res) => {
        return res?.data?.data || [];
      }),
  );

  if (loading) {
    return (
      <div style={{ textAlign: 'center', marginTop: 20 }}>
        <Spin />
      </div>
    );
  }

  if (error) {
    throw error;
  }

  return <AuthenticatorsContext.Provider value={authenticators as any}>{children}</AuthenticatorsContext.Provider>;
};

export function AuthLayout() {
  const { data } = useSystemSettings() || {};
  const { token } = useToken();
  return (
    <div
      style={{
        maxWidth: 320,
        margin: '0 auto',
        paddingTop: '20vh',
        paddingBottom: '20vh',
      }}
    >
      <div style={{ position: 'fixed', top: '2em', right: '2em' }}>
        <SwitchLanguage />
      </div>
      <h1 style={{ textAlign: 'center' }}>
        <ReadPretty.TextArea value={data?.data?.title} />
      </h1>
      <AuthenticatorsContextProvider>
        <Outlet />
      </AuthenticatorsContextProvider>
      <div
        className={css`
          position: absolute;
          bottom: 0;
          width: 100%;
          left: 0;
          text-align: center;
          padding-bottom: 24px;
          background-color: ${token.colorBgContainer};
        `}
      >
        <PoweredBy />
      </div>
    </div>
  );
}
