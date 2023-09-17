import { Mentions } from 'antd';
import React from 'react';
import type { ComponentDemo } from '../../interface';

const { Option } = Mentions;
function onChange() {}
function onSelect() {}

const Demo = () => (
  <Mentions style={{ width: '100%' }} onChange={onChange} onSelect={onSelect} status={'warning'} defaultValue="@afc163">
    <Option value="afc163">afc163</Option>
    <Option value="zombieJ">zombieJ</Option>
    <Option value="yesmeck">yesmeck</Option>
  </Mentions>
);

const componentDemo: ComponentDemo = {
  demo: <Demo />,
  tokens: ['colorWarning', 'colorWarningBorder', 'colorWarningHover', 'colorWarningOutline'],
  key: 'warning',
};

export default componentDemo;
