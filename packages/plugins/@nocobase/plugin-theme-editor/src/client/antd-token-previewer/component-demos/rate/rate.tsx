import { Rate } from 'antd';
import React from 'react';

import type { ComponentDemo } from '../../interface';

const Demo = () => <Rate />;

const componentDemo: ComponentDemo = {
  demo: <Demo />,
  tokens: ['colorFillContent'],
  key: 'default',
};

export default componentDemo;
