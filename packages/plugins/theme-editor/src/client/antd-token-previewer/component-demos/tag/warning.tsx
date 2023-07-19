import { Tag } from 'antd';
import React from 'react';
import type { ComponentDemo } from '../../interface';

const Demo = () => <Tag color="warning">Warning</Tag>;

const componentDemo: ComponentDemo = {
  demo: <Demo />,
  tokens: ['colorWarning', 'colorWarningBg', 'colorWarningBorder'],
  key: 'warning',
};

export default componentDemo;
