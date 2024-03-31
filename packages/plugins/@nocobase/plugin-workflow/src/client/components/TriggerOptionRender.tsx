import React from 'react';
import { Space, Tag, Typography } from 'antd';

import { useCompile } from '@nocobase/client';

export function TriggerOptionRender({ data }) {
  const { label, color, options } = data;
  const compile = useCompile();
  return (
    <Space direction="vertical">
      <Tag color={color}>{compile(label)}</Tag>
      <Typography.Text type="secondary">{compile(options.description)}</Typography.Text>
    </Space>
  );
}
