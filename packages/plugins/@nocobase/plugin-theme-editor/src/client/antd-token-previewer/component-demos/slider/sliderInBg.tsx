import { Slider, theme } from 'antd';
import React from 'react';
import type { ComponentDemo } from '../../interface';

const Demo = () => {
  const { token } = theme.useToken();
  return (
    <div style={{ padding: 12, background: token.colorFillSecondary }}>
      <Slider defaultValue={30} />
      <Slider range defaultValue={[20, 50]} />
    </div>
  );
};

const componentDemo: ComponentDemo = {
  demo: <Demo />,
  tokens: [
    'colorFillSecondary',
    'colorFillContentHover',
    'colorBgContainer',
    'colorPrimary',
    'colorPrimaryHover',
    'colorPrimaryBorderHover',
    'colorPrimaryBorder',
  ],
  key: 'sliderInBg',
};

export default componentDemo;
