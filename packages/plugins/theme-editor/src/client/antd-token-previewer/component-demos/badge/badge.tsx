import { ClockCircleFilled } from '@ant-design/icons';
import { Avatar, Badge, Space, theme } from 'antd';
import React from 'react';
import type { ComponentDemo } from '../../interface';

const Demo = () => {
  const { token } = theme.useToken();
  return (
    <Space size="large">
      <Badge count={5}>
        <Avatar shape="square" size="large" />
      </Badge>
      <Badge count={0} showZero>
        <Avatar shape="square" size="large" />
      </Badge>
      <Badge count={<ClockCircleFilled style={{ color: token.colorError }} />}>
        <Avatar shape="square" size="large" />
      </Badge>
    </Space>
  );
};

const componentDemo: ComponentDemo = {
  demo: <Demo />,
  tokens: ['colorError', 'colorBorderBg', 'colorBgContainer'],
  key: 'badge',
};

export default componentDemo;
