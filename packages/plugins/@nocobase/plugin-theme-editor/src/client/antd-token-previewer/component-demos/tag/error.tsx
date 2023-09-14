import { Tag } from 'antd';
import React from 'react';
import type { ComponentDemo } from '../../interface';

const Demo = () => <Tag color="error">Error</Tag>;

const componentDemo: ComponentDemo = {
  demo: <Demo />,
  tokens: ['colorError', 'colorErrorBg', 'colorErrorBorder'],
  key: 'error',
};

export default componentDemo;
