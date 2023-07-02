import React from 'react';
import { ComponentDemo } from '../../../types';
import Select from './_internal';
import options from './data';

const handleChange = (value: any) => {
  console.log(`selected ${value}`);
};

const Demo = () => (
  <Select
    allowClear
    style={{
      width: '100%',
    }}
    options={options}
    placeholder="Please select"
    value={['a10', 'c12']}
    onChange={handleChange}
  />
);

const componentDemo: ComponentDemo = {
  demo: <Demo />,
  tokens: ['colorIcon', 'colorIconHover'],
  key: 'icon',
};

export default componentDemo;
