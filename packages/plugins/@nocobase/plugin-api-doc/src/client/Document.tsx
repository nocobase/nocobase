import { css, useAPIClient, useRequest } from '@nocobase/client';
import { Select, Space, Spin, Typography } from 'antd';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { SwaggerUIBundle } from 'swagger-ui-dist';
import 'swagger-ui-dist/swagger-ui.css';
import useUrlState from '@ahooksjs/use-url-state';

import { useTranslation } from '../locale';

const Documentation = () => {
  const apiClient = useAPIClient();
  const { t } = useTranslation();
  const swaggerUIRef = useRef();

  const { data: urls, loading } = useRequest<{ data: { name: string; query: string }[] }>({ url: 'swagger:getUrls' });
  const requestInterceptor = useCallback(
    (req) => {
      if (!req.headers['Authorization']) {
        req.headers['Authorization'] = `Bearer ${apiClient.auth.getToken()}`;
      }
      return req;
    },
    [apiClient.auth],
  );

  const [urlObj, setUrlObj] = useUrlState({ q: undefined });
  const destination = useMemo(() => urlObj.q, [urlObj.q]);
  const onDestinationChange = useCallback(
    (q: string) => {
      setUrlObj({ q });
    },
    [setUrlObj],
  );

  useEffect(() => {
    if (!urls?.data?.length) return;

    if (!destination) {
      onDestinationChange(urls.data[0].query);
    }
  }, [destination, onDestinationChange, urls]);

  useEffect(() => {
    if (loading) return;
    SwaggerUIBundle({
      requestInterceptor,
      url: destination ? `/api/swagger:get?ns=${destination}` : `/api/swagger:get`,
      domNode: swaggerUIRef.current,
    });
  }, [destination, loading, requestInterceptor]);

  if (loading) {
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
              value: 'query',
            }}
            onChange={onDestinationChange}
          />
        </div>
      </div>
      <div ref={swaggerUIRef}></div>
      {/* <SwaggerUI url={destination} requestInterceptor={requestInterceptor} persistAuthorization deepLinking /> */}
    </Space>
  );
};

export default Documentation;
