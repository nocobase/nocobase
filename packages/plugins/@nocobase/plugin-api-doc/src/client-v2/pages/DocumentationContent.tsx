/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useRequest } from 'ahooks';
import { Flex, Select, Spin, Typography, theme } from 'antd';
import type { CSSProperties } from 'react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import SwaggerUIBundle from 'swagger-ui-dist/swagger-ui-bundle';
import 'swagger-ui-dist/swagger-ui.css';
import { DESTINATION_URL_KEY } from '../constants';
import { buildSwaggerCss } from './swaggerTheme';
import { createSwaggerParameterValuePlugin } from '../swaggerParameterValuePlugin';

type SwaggerUrl = {
  name: string;
  url: string;
};

type SwaggerUrlsResponse = {
  data?: SwaggerUrl[];
};

type ApiClientLike = {
  request<T = unknown>(options: Record<string, unknown>): Promise<{ data?: T }>;
  getHeaders(): Record<string, string>;
  auth: {
    getToken(): string | undefined;
  };
};

type SwaggerRequest = {
  headers?: Record<string, string>;
  [key: string]: unknown;
};

export type DocumentationContentProps = {
  apiClient: ApiClientLike;
  appName?: string;
  t: (key: string) => string;
};

const getUrl = () => localStorage.getItem(DESTINATION_URL_KEY);

const DocumentationContent = ({ apiClient, appName, t }: DocumentationContentProps) => {
  const { token } = theme.useToken();
  const swaggerUIRef = useRef<HTMLDivElement>(null);
  const { data: urls } = useRequest(async () => {
    const response = await apiClient.request<SwaggerUrlsResponse>({ url: 'swagger:getUrls' });
    return response.data;
  });
  const requestInterceptor = useCallback(
    (req: SwaggerRequest) => {
      const headers = req.headers || {};
      req.headers = headers;
      if (!headers.Authorization) {
        Object.assign(headers, apiClient.getHeaders());
        if (appName) {
          headers['X-App'] = appName;
        }
        headers.Authorization = `Bearer ${apiClient.auth.getToken()}`;
      }
      return req;
    },
    [apiClient, appName],
  );

  const [destination, onDestinationChange] = useState<string | null>(getUrl());
  const swaggerCss = useMemo(() => buildSwaggerCss(token), [token]);
  const spinStyle = useMemo<CSSProperties>(
    () => ({
      minHeight: token.controlHeightLG,
      width: '100%',
    }),
    [token.controlHeightLG],
  );

  useEffect(() => {
    if (destination) {
      localStorage.setItem(DESTINATION_URL_KEY, destination);
    }
  }, [destination]);

  useEffect(() => {
    if (!urls?.data?.length) return;

    if (!destination || !urls.data.find((item) => item.url === getUrl())) {
      onDestinationChange(urls.data[0].url);
    }
  }, [destination, urls]);

  useEffect(() => {
    if (!swaggerUIRef.current || !destination) return;

    const mountNode = document.createElement('div');
    swaggerUIRef.current.appendChild(mountNode);
    const parameterValuePlugin = createSwaggerParameterValuePlugin(mountNode);

    SwaggerUIBundle({
      requestInterceptor,
      url: destination,
      domNode: mountNode,
      plugins: [parameterValuePlugin.plugin],
    });

    return () => {
      parameterValuePlugin.dispose();
      mountNode.remove();
    };
  }, [destination, requestInterceptor]);

  if (!destination) {
    return (
      <Flex align="center" justify="center" style={spinStyle}>
        <Spin />
      </Flex>
    );
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', width: '100%' }}>
      <style>{swaggerCss}</style>
      {/* The definition picker aligns left with the rest of the page's form controls instead of floating centered. */}
      <Flex align="center" gap={token.marginXS} style={{ marginBottom: token.marginLG }}>
        <Typography.Text style={{ whiteSpace: 'nowrap' }}>{t('Select a definition')}</Typography.Text>
        <Select
          showSearch
          value={destination}
          options={urls?.data}
          style={{ maxWidth: 420, width: '100%' }}
          fieldNames={{
            label: 'name',
            value: 'url',
          }}
          onChange={onDestinationChange}
        />
      </Flex>
      <div className="nb-swagger" ref={swaggerUIRef}></div>
    </div>
  );
};

export default DocumentationContent;
