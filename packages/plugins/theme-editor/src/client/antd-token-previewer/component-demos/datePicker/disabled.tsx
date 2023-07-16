import { DatePicker, Space } from 'antd';
import React from 'react';
import type { ComponentDemo } from '../../interface';

const Demo = () => (
  <Space direction="vertical">
    <DatePicker disabled />
    <DatePicker disabled picker="week" />
    <DatePicker disabled picker="month" />
    <DatePicker disabled picker="quarter" />
    <DatePicker disabled picker="year" />
  </Space>
);

const componentDemo: ComponentDemo = {
  demo: <Demo />,
  tokens: ['colorBgContainerDisabled', 'colorTextDisabled'],
  key: 'disabled',
};

export default componentDemo;
