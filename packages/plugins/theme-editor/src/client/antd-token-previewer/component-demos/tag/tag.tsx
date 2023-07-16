import { Divider, Space, Tag, theme } from 'antd';
import React from 'react';

import type { ComponentDemo } from '../../interface';

const Demo = () => {
  const { token } = theme.useToken();
  return (
    <Space direction={'vertical'}>
      <div style={{ padding: 12 }}>
        <Tag color="magenta">magenta</Tag>
        <Tag color="red">red</Tag>
        <Tag color="volcano">volcano</Tag>
        <Tag color="orange">orange</Tag>
        <Tag color="gold">gold</Tag>
        <Tag color="lime">lime</Tag>
        <Tag color="green">green</Tag>
        <Tag color="cyan">cyan</Tag>
        <Tag color="blue">blue</Tag>
        <Tag color="geekblue">geekblue</Tag>
        <Tag color="purple">purple</Tag>
      </div>
      <Divider />
      <div style={{ background: token.colorFillSecondary, padding: 12 }}>
        <Tag color="magenta">magenta</Tag>
        <Tag color="red">red</Tag>
        <Tag color="volcano">volcano</Tag>
        <Tag color="orange">orange</Tag>
        <Tag color="gold">gold</Tag>
        <Tag color="lime">lime</Tag>
        <Tag color="green">green</Tag>
        <Tag color="cyan">cyan</Tag>
        <Tag color="blue">blue</Tag>
        <Tag color="geekblue">geekblue</Tag>
        <Tag color="purple">purple</Tag>
      </div>
    </Space>
  );
};

const componentDemo: ComponentDemo = {
  demo: <Demo />,
  tokens: [
    'blue-1',
    'blue-3',
    'blue-6',
    'blue-7',
    'cyan-1',
    'cyan-3',
    'cyan-6',
    'cyan-7',
    'geekblue-1',
    'geekblue-3',
    'geekblue-6',
    'geekblue-7',
    'gold-1',
    'gold-3',
    'gold-6',
    'gold-7',
    'green-1',
    'green-3',
    'green-6',
    'green-7',
    'lime-1',
    'lime-3',
    'lime-6',
    'lime-7',
    'magenta-1',
    'magenta-3',
    'magenta-6',
    'magenta-7',
    'orange-1',
    'orange-3',
    'orange-6',
    'orange-7',
    'pink-1',
    'pink-3',
    'pink-6',
    'pink-7',
    'purple-1',
    'purple-3',
    'purple-6',
    'purple-7',
    'volcano-1',
    'volcano-3',
    'volcano-6',
    'volcano-7',
    'yellow-1',
    'yellow-3',
    'yellow-6',
    'yellow-7',
    'red-1',
    'red-3',
    'red-6',
    'red-7',
  ],
  key: 'default',
};

export default componentDemo;
