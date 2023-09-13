import { Flexbox } from '@arvinxu/layout-kit';
import { Progress } from 'antd';
import React from 'react';
import type { ComponentDemo } from '../../interface';

const Demo: React.FC = () => (
  <Flexbox gap={12}>
    <Flexbox horizontal gap={24}>
      <Progress percent={70} status="success" type={'dashboard'} />
      <Progress percent={80} status="success" type={'circle'} />
    </Flexbox>
    <Progress percent={50} status="success" />
  </Flexbox>
);

const componentDemo: ComponentDemo = {
  demo: <Demo />,
  tokens: ['colorSuccess'],
  key: 'success',
};

export default componentDemo;
