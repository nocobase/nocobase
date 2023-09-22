import { Cascader } from 'antd';
import React from 'react';

import type { ComponentDemo } from '../../interface';
import options from './data';

const { _InternalPanelDoNotUseOrYouWillBeFired: InternalCascader } = Cascader;

const Demo = () => <InternalCascader options={options} open disabled placeholder="Please select" />;

const componentDemo: ComponentDemo = {
  demo: <Demo />,
  tokens: ['colorBgContainerDisabled'],
  key: 'disabled',
};

export default componentDemo;
