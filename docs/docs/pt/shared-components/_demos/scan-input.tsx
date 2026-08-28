import React, { useState } from 'react';
import { ScanInput } from '@nocobase/client-v2';
import { Space, Typography } from 'antd';

export default function ScanInputDemo() {
  const [value, setValue] = useState('');

  return (
    <Space direction="vertical" style={{ width: 360 }}>
      <ScanInput
        value={value}
        placeholder="Scan or input code"
        onChange={(next) => {
          if (typeof next === 'string') {
            setValue(next);
          } else {
            setValue(next.target.value);
          }
        }}
      />
      <Typography.Text type="secondary">
        Current value: {value || '-'}
      </Typography.Text>
    </Space>
  );
}
