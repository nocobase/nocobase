import { Button, Popover } from 'antd';
import React from 'react';
import type { ComponentDemo } from '../../interface';

const content = (
  <div>
    <p>Content</p> <p>Content</p>
  </div>
);
const Demo = () => (
  <div>
    <Popover._InternalPanelDoNotUseOrYouWillBeFired content={content} title="Title" />
    <Button type="primary">Hover me</Button>
  </div>
);

const componentDemo: ComponentDemo = {
  demo: <Demo />,
  tokens: ['colorBgElevated'],
  key: 'default',
};

export default componentDemo;
