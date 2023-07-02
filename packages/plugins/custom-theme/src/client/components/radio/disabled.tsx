import { Radio } from 'antd';
import React from 'react';
import { ComponentDemo } from '../../../types';

const Demo = () => <Radio disabled>Radio</Radio>;

const componentDemo: ComponentDemo = {
  demo: <Demo />,
  tokens: ['colorBgContainerDisabled'],
  key: 'disabled',
};

export default componentDemo;
