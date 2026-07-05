import React from 'react';
import { Icon } from '@nocobase/client-v2';
import { Space } from 'antd';

export default function IconDemo() {
  return (
    <Space size={16}>
      <Icon type="SettingOutlined" style={{ fontSize: 24 }} />
      <Icon type="DatabaseOutlined" style={{ fontSize: 24 }} />
      <Icon type="CloudServerOutlined" style={{ fontSize: 24 }} />
    </Space>
  );
}
