import { Calendar } from 'antd';
import React from 'react';
import type { ComponentDemo } from '../../interface';

const Demo = () => <Calendar />;

const componentDemo: ComponentDemo = {
  demo: <Demo />,
  tokens: ['colorPrimary', 'colorPrimaryHover', 'colorBgContainer'],
  key: 'default',
};

export default componentDemo;
