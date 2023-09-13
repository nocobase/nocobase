import { Card, Form, Input } from 'antd';
import React, { useMemo } from 'react';
import { useTranslation } from '../locale';
import { useLocation } from 'react-router-dom';

export const AppConfiguration = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const targetUrl = useMemo(() => {
    let baseUrl = '/mobile';
    if (location.pathname.startsWith('/apps')) {
      baseUrl = location.pathname.split('/').slice(0, 3).join('/');
    }
    return baseUrl;
  }, [location.pathname]);
  return (
    <Card
      style={{
        minHeight: '600px',
      }}
    >
      <Form layout="vertical">
        <Form.Item
          tooltip={`${t('The full address is')} ${window.origin}${targetUrl}`}
          label={t('Mobile client access address')}
        >
          <Input value={targetUrl} disabled />
        </Form.Item>
      </Form>
    </Card>
  );
};
