import React from 'react';
import { ComponentDemo } from '../../../types';
import Select from './_internal';
import options from './data';

const Demo = () => (
  <Select
    mode="multiple"
    allowClear
    style={{
      width: '100%',
    }}
    disabled
    options={options}
    placeholder="Please select"
    defaultValue={['a10', 'c12']}
  />
);

const componentDemo: ComponentDemo = {
  demo: <Demo />,
  tokens: ['colorBgContainerDisabled', 'colorTextDisabled'],
  key: 'disabled',
};

export default componentDemo;
