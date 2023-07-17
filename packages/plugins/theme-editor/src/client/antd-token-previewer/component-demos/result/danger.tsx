import { Result } from 'antd';
import React from 'react';
import type { ComponentDemo } from '../../interface';

const Demo: React.FC = () => <Result status={'error'} title="Demo示意" subTitle="status 为 error" />;

const componentDemo: ComponentDemo = {
  demo: <Demo />,
  tokens: ['colorError'],
  key: 'danger',
};

export default componentDemo;
