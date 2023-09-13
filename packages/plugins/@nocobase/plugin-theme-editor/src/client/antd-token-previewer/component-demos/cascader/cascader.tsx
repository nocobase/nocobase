import { Cascader } from 'antd';
import React from 'react';

import type { ComponentDemo } from '../../interface';
import options from './data';
const { _InternalPanelDoNotUseOrYouWillBeFired: InternalCascader } = Cascader;

const Demo = (props: any) => <InternalCascader options={options} {...props} open placeholder="Please select" />;

const componentDemo: ComponentDemo = {
  demo: <Demo />,
  tokens: ['colorBgContainer', 'colorPrimary'],
  key: 'default',
};

export default componentDemo;
