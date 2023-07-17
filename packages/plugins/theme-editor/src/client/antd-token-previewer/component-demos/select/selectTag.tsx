import Select from './_internal';

import React from 'react';
import type { ComponentDemo } from '../../interface';

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
    options={options}
    listHeight={200}
    placeholder="Please select"
    defaultValue={['a10', 'c12', 'e14']}
    onChange={handleChange}
  />
);

const componentDemo: ComponentDemo = {
  demo: <Demo />,
  tokens: ['colorPrimary', 'colorFillSecondary'],
  key: 'selectTag',
};

export default componentDemo;
