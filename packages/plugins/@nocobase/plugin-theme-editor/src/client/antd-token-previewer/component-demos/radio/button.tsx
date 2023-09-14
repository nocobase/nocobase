import { Radio, Space } from 'antd';
import React from 'react';
import type { ComponentDemo } from '../../interface';

const Demo = () => (
  <Space>
    <Radio.Group defaultValue={'a'} buttonStyle="solid">
      <Radio.Button value={'a'} checked>
        Hangzhou
      </Radio.Button>
      <Radio.Button value={'b'}>Shanghai</Radio.Button>
    </Radio.Group>

    <div>
      <Radio.Button>Apple</Radio.Button>
      <Radio.Button checked>Orange</Radio.Button>
    </div>
  </Space>
);

const componentDemo: ComponentDemo = {
  demo: <Demo />,
  tokens: ['colorPrimaryActive', 'colorPrimaryHover'],
  key: 'button',
};

export default componentDemo;
