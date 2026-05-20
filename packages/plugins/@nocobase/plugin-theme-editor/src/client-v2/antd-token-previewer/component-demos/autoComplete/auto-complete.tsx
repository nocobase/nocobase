/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AutoComplete } from 'antd';
import React, { useState } from 'react';
import type { ComponentDemo } from '../../interface';

const mockVal = (str: string, repeat = 1) => ({
  value: str.repeat(repeat),
});
const Complete: React.FC = () => {
  const [value, setValue] = useState('');
  const [options, setOptions] = useState<{ value: string }[]>([]);
  const onSearch = (searchText: string) => {
    setOptions(!searchText ? [] : [mockVal(searchText), mockVal(searchText, 2), mockVal(searchText, 3)]);
  };
  const onSelect = (data: string) => {
    // eslint-disable-next-line no-console
    console.log('onSelect', data);
  };
  const onChange = (data: string) => {
    setValue(data);
  };
  return (
    <>
      {' '}
      <AutoComplete
        options={options}
        style={{ width: 200 }}
        onSelect={onSelect}
        onSearch={onSearch}
        placeholder="input here"
      />{' '}
      <br /> <br />{' '}
      <AutoComplete
        value={value}
        options={options}
        style={{ width: 200 }}
        onSelect={onSelect}
        onSearch={onSearch}
        onChange={onChange}
        placeholder="control mode"
      />{' '}
    </>
  );
};
const Demo = () => <Complete />;

const componentDemo: ComponentDemo = {
  demo: <Demo />,
  tokens: [],
  key: 'autoComplete',
};

export default componentDemo;
