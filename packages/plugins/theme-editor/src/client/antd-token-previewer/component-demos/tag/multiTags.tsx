import { Tag } from 'antd';
import React from 'react';
import type { ComponentDemo } from '../../interface';

const { CheckableTag } = Tag;

const Checkable = () => (
  <div>
    <CheckableTag checked>Error</CheckableTag>
    <CheckableTag checked={false}>Error</CheckableTag>
  </div>
);

const componentDemo: ComponentDemo = {
  demo: <Checkable />,
  tokens: ['colorPrimary', 'colorPrimaryHover', 'colorPrimaryActive'],
  key: 'multiTags',
};

export default componentDemo;
