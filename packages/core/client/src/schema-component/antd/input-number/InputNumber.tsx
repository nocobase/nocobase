import React from 'react';
import { connect, mapReadPretty } from '@formily/react';
import { InputNumber as AntdNumber } from 'antd';
import { ReadPretty } from './ReadPretty';

export const InputNumber = connect((props) => {
  const { onChange, ...others } = props;
  const handleChange = (v) => {
    onChange(parseFloat(v));
  }
  return (<AntdNumber onChange={handleChange} {...others} />);
}, mapReadPretty(ReadPretty));

export default InputNumber;
