import { Tooltip } from 'antd';
import React from 'react';
import type { ComponentDemo } from '../../interface';

const Demo = () => (
  <div>
    <Tooltip._InternalPanelDoNotUseOrYouWillBeFired title="prompt text" />
    <span>Tooltip will show on mouse enter.</span>
  </div>
);
const componentDemo: ComponentDemo = {
  demo: <Demo />,
  tokens: ['colorBgSpotlight', 'colorTextLightSolid'],
  key: 'default',
};

export default componentDemo;
