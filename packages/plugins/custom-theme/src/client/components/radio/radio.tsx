import { Radio } from 'antd';
import React from 'react';
import { ComponentDemo } from '../../../types';

const Demo = () => <Radio checked>Radio</Radio>;

const componentDemo: ComponentDemo = {
  demo: <Demo />,
  tokens: ['colorPrimary', 'controlOutline', 'colorBgContainer'],
  key: 'default',
};

export default componentDemo;
