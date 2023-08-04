import { Segmented } from 'antd';
import React from 'react';
import type { ComponentDemo } from '../../interface';

const Demo = () => <Segmented options={['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly']} />;

const componentDemo: ComponentDemo = {
  demo: <Demo />,
  key: 'default',
  tokens: [],
};

export default componentDemo;
