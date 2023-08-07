import { Slider } from 'antd';
import React from 'react';
import type { ComponentDemo } from '../../interface';

const Demo = () => (
  <>
    <Slider defaultValue={30} />
    <Slider range defaultValue={[20, 50]} />
  </>
);

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
  key: 'default',
};

export default componentDemo;
