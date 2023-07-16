import { InputNumber } from 'antd';
import React from 'react';
import type { ComponentDemo } from '../../interface';

function onChange() {}
const Demo = () => <InputNumber min={1} max={10} defaultValue={3} onChange={onChange} />;

const componentDemo: ComponentDemo = {
  demo: <Demo />,
  tokens: ['colorPrimaryBorder', 'controlOutline', 'colorPrimaryHover', 'colorPrimary', 'colorBgContainer'],
  key: 'default',
};

export default componentDemo;
