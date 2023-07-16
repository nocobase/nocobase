import { Progress } from 'antd';
import React from 'react';
import type { ComponentDemo } from '../../interface';

const Demo: React.FC = () => (
  <>
    <Progress percent={30} />
    <Progress percent={50} status="active" />
    <Progress percent={70} type={'dashboard'} />
    <Progress percent={80} type={'circle'} />
    <Progress steps={8} percent={30} />
  </>
);

const componentDemo: ComponentDemo = {
  demo: <Demo />,
  tokens: ['colorInfo'],
  key: 'info',
};

export default componentDemo;
