import React, { useState } from 'react';
import { PasswordInput } from '@nocobase/client-v2';
import { Space, Typography } from 'antd';

export default function PasswordInputDemo() {
  const [value, setValue] = useState('');

  return (
    <Space direction="vertical" style={{ width: 320 }}>
      <PasswordInput
        value={value}
        checkStrength
        placeholder="Input password"
        onChange={(event) => setValue(event.target.value)}
      />
      <Typography.Text type="secondary">
        The strength bar is only a visual hint.
      </Typography.Text>
    </Space>
  );
}
