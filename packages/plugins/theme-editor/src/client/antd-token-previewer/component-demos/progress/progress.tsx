import { Progress } from 'antd';
import React from 'react';
import type { ComponentDemo } from '../../interface';

const Demo: React.FC = () => (
  <>
    <Progress percent={30} />
    <Progress percent={50} status="active" />
    <Progress percent={70} status="exception" />
    <Progress percent={100} />
    <Progress percent={50} showInfo={false} />
    <Progress steps={8} />
  </>
);

const componentDemo: ComponentDemo = {
  demo: <Demo />,
  tokens: ['colorFillSecondary', 'colorText', 'colorBgContainer'],
  key: 'default',
};

export default componentDemo;
