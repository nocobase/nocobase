import { connect, mapReadPretty, useField } from '@formily/react';
import { InputNumber as AntdNumber } from 'antd';
import React from 'react';
import { ReadPretty } from './ReadPretty';

export const InputNumber = connect((props) => {
  const { onChange, ...others } = props;
  const field = useField<any>();
  const handleChange = (v) => {
    onChange(parseFloat(v));
  };
  const disabled = props.disabled || field.pattern === 'readOnly';
  return <AntdNumber onChange={handleChange} {...others} disabled={disabled} />;
}, mapReadPretty(ReadPretty));

export default InputNumber;
