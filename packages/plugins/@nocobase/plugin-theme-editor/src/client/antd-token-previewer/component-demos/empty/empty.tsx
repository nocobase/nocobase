import { Empty } from 'antd';
import React from 'react';
import type { ComponentDemo } from '../../interface';

const Demo = () => <Empty />;

const componentDemo: ComponentDemo = {
  demo: <Demo />,
  tokens: ['colorTextDisabled'],
  key: 'default',
};

export default componentDemo;
