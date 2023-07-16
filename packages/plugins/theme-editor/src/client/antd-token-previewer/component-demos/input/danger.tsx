import { Input } from 'antd';
import React from 'react';
import type { ComponentDemo } from '../../interface';

function onChange() {}

const Demo = () => <Input status={'error'} defaultValue={'hello'} onChange={onChange} />;

const componentDemo: ComponentDemo = {
  demo: <Demo />,
  tokens: ['colorError', 'colorErrorOutline', 'colorErrorBorder', 'colorErrorHover'],
  key: 'danger',
};

export default componentDemo;
