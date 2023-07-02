import React from 'react';
import { ComponentDemo } from '../../../types';
import Select from './_internal';
import options from './data';

const handleChange = (value: any) => {
  console.log(`selected ${value}`);
};

const Demo = () => (
  <Select
    mode="multiple"
    allowClear
    style={{
      width: '100%',
    }}
    status={'warning'}
    options={options}
    placeholder="Please select"
    defaultValue={['a10', 'c12']}
    onChange={handleChange}
  />
);

const componentDemo: ComponentDemo = {
  demo: <Demo />,
  tokens: ['colorWarningHover', 'colorWarningOutline'],
  key: 'warning',
};

export default componentDemo;
