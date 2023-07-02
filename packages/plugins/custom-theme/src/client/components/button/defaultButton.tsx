import { Button } from 'antd';
import React from 'react';
import { ComponentDemo } from '../../../types';

const Demo = () => <Button>default</Button>;

const componentDemo: ComponentDemo = {
  demo: <Demo />,
  tokens: ['colorBgContainer'],
  key: 'defaultButton',
};

export default componentDemo;
