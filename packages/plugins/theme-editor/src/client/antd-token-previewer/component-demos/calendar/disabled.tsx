import { Calendar } from 'antd';
import React from 'react';
import type { ComponentDemo } from '../../interface';

const Demo = () => <Calendar disabledDate={() => true} />;

const componentDemo: ComponentDemo = {
  demo: <Demo />,
  tokens: ['colorBgContainerDisabled', 'colorTextDisabled'],
  key: 'disabled',
};

export default componentDemo;
