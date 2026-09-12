import React, { useState } from 'react';
import { FileSizeInput } from '@nocobase/client-v2';
import { Space, Typography } from 'antd';

export default function FileSizeInputDemo() {
  const [value, setValue] = useState<number | undefined>(20 * 1024 * 1024);

  return (
    <Space direction="vertical">
      <FileSizeInput
        value={value}
        onChange={setValue}
        min={1}
        max={1024 * 1024 * 1024}
      />
      <Typography.Text type="secondary">
        Saved value: {value ?? 'undefined'} bytes
      </Typography.Text>
    </Space>
  );
}
