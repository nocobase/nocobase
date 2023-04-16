import { connect, mapReadPretty, useField } from '@formily/react';
import { InputNumber as AntdNumber } from 'antd';
import React from 'react';
import { ReadPretty } from './ReadPretty';

export const InputNumber = connect((props) => {
  const { onChange, step, ...others } = props;
  const field = useField<any>();
  const handleChange = (v) => {
    onChange(parseFloat(v));
  };
  return <AntdNumber step={Number(step) || 1} onChange={handleChange} {...others}  />;
}, mapReadPretty(ReadPretty));

export default InputNumber;
