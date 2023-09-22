import { Typography } from 'antd';
import React from 'react';
import type { ComponentDemo } from '../../interface';

const { Title } = Typography;

const Demo = () => (
  <div>
    <Title type={'warning'} level={4}>
      Warning Text
    </Title>
  </div>
);

const componentDemo: ComponentDemo = {
  demo: <Demo />,
  tokens: ['colorWarning'],
  key: 'warning',
};

export default componentDemo;
