/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css } from '@emotion/css';
import React from 'react';
import { Outlet } from 'react-router-dom';
import { useSystemSettings, PoweredBy, useRequest, useAPIClient } from '@nocobase/client';
import { AuthenticatorsContext } from '../authenticator';
import { Spin } from 'antd';

export function AuthLayout(props: any) {
  const { data } = useSystemSettings();
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
    return <Spin />;
  }

  if (error) {
    throw error;
  }

  return (
    <div
      style={{
        maxWidth: 320,
        margin: '0 auto',
        paddingTop: '20vh',
      }}
    >
      <h1>{data?.data?.title}</h1>
      <AuthenticatorsContext.Provider value={authenticators as any}>
        <Outlet />
      </AuthenticatorsContext.Provider>
      <div
        className={css`
          position: absolute;
          bottom: 24px;
          width: 100%;
          left: 0;
          text-align: center;
        `}
      >
        <PoweredBy />
      </div>
    </div>
  );
}
