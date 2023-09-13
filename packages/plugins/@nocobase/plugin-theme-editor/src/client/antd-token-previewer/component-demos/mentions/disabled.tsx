import { Mentions } from 'antd';
import React from 'react';
import type { ComponentDemo } from '../../interface';

const { Option } = Mentions;

const Demo = () => (
  <Mentions style={{ width: '100%' }} status={'error'} disabled defaultValue="@afc163">
    <Option value="afc163">afc163</Option>
    <Option value="zombieJ">zombieJ</Option>
    <Option value="yesmeck">yesmeck</Option>
  </Mentions>
);

const componentDemo: ComponentDemo = {
  demo: <Demo />,
  tokens: ['colorBgContainerDisabled', 'colorTextDisabled'],
  key: 'disabled',
};

export default componentDemo;
