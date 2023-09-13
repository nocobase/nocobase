import { Result } from 'antd';
import React from 'react';
import type { ComponentDemo } from '../../interface';

const Demo: React.FC = () => (
  <Result title="Demo示意" subTitle="背景色为 colorFillAlter">
    Order number: 2017182818828182881 Cloud server configuration takes 1-5 minutes, please wait.
  </Result>
);
const componentDemo: ComponentDemo = {
  demo: <Demo />,
  tokens: ['colorFillAlter'],
  key: 'resultWithDesc',
};

export default componentDemo;
