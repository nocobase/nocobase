import { Mentions } from 'antd';
import React from 'react';
import type { ComponentDemo } from '../../interface';

const { Option } = Mentions;
function onChange() {}
function onSelect() {}

const Demo = () => (
  <Mentions style={{ width: '100%' }} onChange={onChange} onSelect={onSelect} status={'error'} defaultValue="@afc163">
    <Option value="afc163">afc163</Option>
    <Option value="zombieJ">zombieJ</Option>
    <Option value="yesmeck">yesmeck</Option>
  </Mentions>
);

const componentDemo: ComponentDemo = {
  demo: <Demo />,
  tokens: ['colorError', 'colorErrorOutline', 'colorErrorBorder', 'colorErrorHover'],
  key: 'danger',
};

export default componentDemo;
