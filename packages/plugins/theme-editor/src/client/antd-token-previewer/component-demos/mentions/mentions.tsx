import { Mentions } from 'antd';
import React from 'react';
import type { ComponentDemo } from '../../interface';

const { Option } = Mentions;
function onChange() {}
function onSelect() {}
const Demo = () => (
  <Mentions._InternalPanelDoNotUseOrYouWillBeFired
    style={{ width: '100%' }}
    onChange={onChange}
    onSelect={onSelect}
    defaultValue="@afc163"
  >
    <Option value="afc163">afc163</Option>
    <Option value="zombieJ">zombieJ</Option>
    <Option value="yesmeck">yesmeck</Option>
  </Mentions._InternalPanelDoNotUseOrYouWillBeFired>
);

const componentDemo: ComponentDemo = {
  demo: <Demo />,
  tokens: ['colorBgContainer', 'colorBorder', 'colorPrimary', 'colorPrimaryHover', 'controlOutline'],
  key: 'default',
};

export default componentDemo;
