import { InputNumber } from 'antd';
import React from 'react';
import type { ComponentDemo } from '../../interface';

function onChange() {}

const Demo = () => <InputNumber status={'warning'} min={1} max={10} defaultValue={3} onChange={onChange} />;

const componentDemo: ComponentDemo = {
  demo: <Demo />,
  tokens: ['colorWarning', 'colorWarningBorder', 'colorWarningOutline', 'colorWarningHover'],
  key: 'warning',
};

export default componentDemo;
