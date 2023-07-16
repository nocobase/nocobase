import { Typography } from 'antd';
import React from 'react';
import type { ComponentDemo } from '../../interface';

const { Title, Text } = Typography;

const Demo = () => (
  <div>
    <Title type={'success'} level={4}>
      Success Title
    </Title>
    <Text type={'success'}>success Text</Text>
  </div>
);

const componentDemo: ComponentDemo = {
  demo: <Demo />,
  tokens: ['colorSuccess'],
  key: 'success',
};

export default componentDemo;
