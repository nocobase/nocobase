/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useAPIClient, useApp } from '@nocobase/client';
import { Result, Spin } from 'antd';
import React, { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useT } from './locale';

declare global {
  interface Window {
    __nocobase_api_base_url__?: string;
  }
}

function trimSlashes(value: string) {
  return value.replace(/^\/+|\/+$/g, '');
}

function buildDeviceApiUrl(baseURL: string, appName: string, searchParams: URLSearchParams) {
  const url = new URL(baseURL || '/api/', window.location.href);
  const providerPath = appName === 'main' ? 'idpOAuth/device' : `__app/${encodeURIComponent(appName)}/idpOAuth/device`;
  url.pathname = `${url.pathname.replace(/\/+$/g, '')}/${trimSlashes(providerPath)}`;
  url.search = searchParams.toString();
  return url.toString();
}

export const DevicePage = () => {
  const api = useAPIClient();
  const app = useApp();
  const t = useT();
  const [searchParams] = useSearchParams();

  const deviceApiUrl = useMemo(() => {
    const baseURL = api.axios.defaults.baseURL || window.__nocobase_api_base_url__ || '/api/';
    return buildDeviceApiUrl(baseURL, app.name, searchParams);
  }, [api.axios.defaults.baseURL, app.name, searchParams]);

  useEffect(() => {
    window.location.replace(deviceApiUrl);
  }, [deviceApiUrl]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <Result
        icon={<Spin size="large" />}
        title={t('Opening device sign-in')}
        subTitle={t('Please wait while NocoBase opens the device sign-in page.')}
      />
    </div>
  );
};

export default DevicePage;
