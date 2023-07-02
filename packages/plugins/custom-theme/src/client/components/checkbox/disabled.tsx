import { Checkbox } from 'antd';
import React from 'react';
import { ComponentDemo } from '../../../types';

const Demo = () => <Checkbox disabled>Checkbox</Checkbox>;

const componentDemo: ComponentDemo = {
  demo: <Demo />,
  tokens: ['colorTextDisabled', 'colorBgContainerDisabled'],
  key: 'disabled',
};

export default componentDemo;
