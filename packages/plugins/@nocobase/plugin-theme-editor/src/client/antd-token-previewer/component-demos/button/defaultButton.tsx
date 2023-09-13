import { Button } from 'antd';
import React from 'react';

import type { ComponentDemo } from '../../interface';

const Demo = () => <Button>default</Button>;

const componentDemo: ComponentDemo = {
  demo: <Demo />,
  tokens: ['colorBgContainer'],
  key: 'defaultButton',
};

export default componentDemo;
