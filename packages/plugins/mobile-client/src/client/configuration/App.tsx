import { Card, Form, Input } from 'antd';
import React from 'react';
import { useTranslation } from '../locale';

export const AppConfiguration = () => {
  const { t } = useTranslation();
  return (
    <Card
      style={{
        minHeight: '600px',
      }}
    >
      <Form layout="vertical">
        <Form.Item
          tooltip={`${t('The full address is')} ${window.origin}/mobile`}
          label={t('Mobile client access address')}
        >
          <Input value="/mobile" disabled />
        </Form.Item>
      </Form>
    </Card>
  );
};
