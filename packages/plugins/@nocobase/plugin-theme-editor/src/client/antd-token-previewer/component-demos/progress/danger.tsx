import { Flexbox } from '@arvinxu/layout-kit';
import { Progress } from 'antd';
import React from 'react';
import type { ComponentDemo } from '../../interface';

const Demo: React.FC = () => (
  <Flexbox gap={12}>
    <Flexbox horizontal gap={24}>
      <Progress percent={70} status="exception" type={'dashboard'} />
      <Progress percent={80} status="exception" type={'circle'} />
    </Flexbox>
    <Progress percent={50} status="exception" />
  </Flexbox>
);

const componentDemo: ComponentDemo = {
  demo: <Demo />,
  tokens: ['colorError'],
  key: 'danger',
};

export default componentDemo;
