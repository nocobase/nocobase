import React, { useState } from 'react';
import { JsonTextArea } from '@nocobase/client-v2';
import { Space, Typography } from 'antd';

export default function JsonTextAreaDemo() {
  const [value, setValue] = useState<unknown>({ enabled: true, retry: 3 });

  return (
    <Space direction="vertical" style={{ width: 420 }}>
      <JsonTextArea value={value} onChange={setValue} rows={6} json5 />
      <Typography.Text type="secondary">
        Parsed value: {JSON.stringify(value)}
      </Typography.Text>
    </Space>
  );
}
