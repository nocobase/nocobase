import React from 'react';
import { Form, Space, Typography } from 'antd';
import { RemoteSelect } from '@nocobase/client-v2';

const providers = [
  { name: 'local', title: 'Local provider' },
  { name: 'smtp', title: 'SMTP provider' },
  { name: 'webhook', title: 'Webhook provider' },
];

export default function RemoteSelectDemo() {
  return (
    <Form layout="vertical" style={{ maxWidth: 360 }}>
      <Form.Item name="provider" label="Provider">
        <RemoteSelect<{ name: string; title: string }>
          request={async () => {
            await new Promise((resolve) => setTimeout(resolve, 300));
            return providers;
          }}
          mapOptions={(item) => ({ label: item.title, value: item.name })}
          placeholder="Select provider"
        />
      </Form.Item>
      <Space direction="vertical" size={4}>
        <Typography.Text type="secondary">
          The options are loaded by the request function.
        </Typography.Text>
      </Space>
    </Form>
  );
}
