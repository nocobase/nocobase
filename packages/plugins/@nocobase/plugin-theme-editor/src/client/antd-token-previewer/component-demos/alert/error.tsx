import { Alert, Space } from 'antd';
import React from 'react';
import type { ComponentDemo } from '../../interface';

const Demo = () => (
  <Space direction={'vertical'}>
    <Alert message="Error" type="error" showIcon />

    <Alert message="Error" description="This is an error message about copywriting." type="error" showIcon />
  </Space>
);

const componentDemo: ComponentDemo = {
  demo: <Demo />,
  tokens: ['colorErrorBg', 'colorErrorBorder', 'colorError'],
  key: 'error',
};

export default componentDemo;
