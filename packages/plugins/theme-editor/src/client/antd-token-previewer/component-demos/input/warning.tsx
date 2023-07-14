import { Input } from 'antd';
import React from 'react';
import type { ComponentDemo } from '../../interface';

function onChange() {}

const Demo = () => <Input status={'warning'} defaultValue={3} onChange={onChange} />;

const componentDemo: ComponentDemo = {
  demo: <Demo />,
  tokens: ['colorWarning', 'colorWarningBorder', 'colorWarningHover', 'colorWarningOutline'],
  key: 'warning',
};

export default componentDemo;
