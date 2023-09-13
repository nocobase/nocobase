import { TimePicker } from 'antd';
import React from 'react';
import type { ComponentDemo } from '../../interface';

const Demo = () => <TimePicker._InternalPanelDoNotUseOrYouWillBeFired />;

const componentDemo: ComponentDemo = {
  demo: <Demo />,
  tokens: ['colorPrimary'],
  key: 'default',
};

export default componentDemo;
