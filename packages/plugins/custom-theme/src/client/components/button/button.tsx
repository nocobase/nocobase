import { Button, Space } from 'antd';
import React from 'react';
import { ComponentDemo } from '../../../types';

const Demo = () => (
  <Space>
    <Button type="primary">Primary Button</Button>
    <Button>Default Button</Button>
    <Button type="dashed">Dashed Button</Button> <br />
    <Button type="text">Text Button</Button>
    <Button ghost>Ghost Button</Button>
    <Button type="link">Link Button</Button>
  </Space>
);

const componentDemo: ComponentDemo = {
  demo: <Demo />,
  tokens: [
    'colorText',
    'colorPrimary',
    'colorPrimaryActive',
    'colorPrimaryHover',
    'controlOutline',
    'controlTmpOutline',
  ],
  key: 'button',
};

export default componentDemo;
