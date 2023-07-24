import { css, useAPIClient, useRequest } from '@nocobase/client';
import { Select, Space, Spin, Typography } from 'antd';
import React, { lazy, useEffect, useState } from 'react';
import 'swagger-ui-react/swagger-ui.css';
import { useTranslation } from '../locale';

const DESTINATION_URL_KEY = 'API_DOC:DESTINATION_URL_KEY';
const getUrl = () => localStorage.getItem(DESTINATION_URL_KEY);
const SwaggerUI = lazy(() => {
  return import('swagger-ui-react');
});

const Documentation = () => {
  const apiClient = useAPIClient();
  const { t } = useTranslation();

  const { data: urls } = useRequest<{ data: { name: string; url: string }[] }>({ url: 'swagger:getUrls' });
  const requestInterceptor: <T extends Record<string, any> = Record<string, any>>(req: T) => T | Promise<T> = (req) => {
    req.headers['Authorization'] = `Bearer ${apiClient.auth.getToken()}`;
    return req;
  };

  const [destination, onDestinationChange] = useState<string>(getUrl());

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

  if (!destination) {
    return <Spin />;
  }
  return (
    <Space
      direction="vertical"
      style={{
        width: '100%',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          width: '100%',
        }}
      >
        <div
          className={css`
            display: flex;
            align-items: center;
            gap: 8px;
            max-width: 1460px;
            width: 100%;
            padding: 16px 20px;
          `}
        >
          <Typography.Text
            style={{
              whiteSpace: 'nowrap',
            }}
            strong
          >
            {t('Select a definition')}
          </Typography.Text>
          <Select
            showSearch
            value={destination}
            options={urls?.data}
            style={{
              width: '100%',
            }}
            fieldNames={{
              label: 'name',
              value: 'url',
            }}
            onChange={onDestinationChange}
          />
        </div>
      </div>
      <SwaggerUI url={destination} requestInterceptor={requestInterceptor} persistAuthorization deepLinking />
    </Space>
  );
};

export default Documentation;
