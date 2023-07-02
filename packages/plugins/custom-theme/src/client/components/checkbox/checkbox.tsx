import { Checkbox, Space } from 'antd';
import React from 'react';
import { ComponentDemo } from '../../../types';

const Demo = (props: any) => (
  <Space>
    <Checkbox {...props}>Checkbox</Checkbox>
    <Checkbox {...props} checked>
      选中态
    </Checkbox>
  </Space>
);

const componentDemo: ComponentDemo = {
  demo: <Demo />,
  tokens: ['colorPrimary', 'colorText', 'colorBgContainer'],
  key: 'default',
};

export default componentDemo;
