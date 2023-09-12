import { DatePicker } from 'antd';
import React from 'react';
import type { ComponentDemo } from '../../interface';

const Demo = () => <DatePicker._InternalPanelDoNotUseOrYouWillBeFired />;

const componentDemo: ComponentDemo = {
  demo: <Demo />,
  tokens: ['colorIcon', 'colorIconHover'],
  key: 'icon',
};

export default componentDemo;
