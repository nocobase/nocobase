import { Breadcrumb } from 'antd';
import React from 'react';
import type { ComponentDemo } from '../../interface';

const Demo = () => (
  <Breadcrumb>
    <Breadcrumb.Item>Home</Breadcrumb.Item>
    <Breadcrumb.Item>
      <a href="">Application Center</a>
    </Breadcrumb.Item>
    <Breadcrumb.Item>
      <a href="">Application List</a>
    </Breadcrumb.Item>
    <Breadcrumb.Item>An Application</Breadcrumb.Item>
  </Breadcrumb>
);

const componentDemo: ComponentDemo = {
  demo: <Demo />,
  tokens: ['colorText', 'colorPrimary', 'colorPrimaryActive', 'colorPrimaryHover'],
  key: 'breadcrumb',
};

export default componentDemo;
