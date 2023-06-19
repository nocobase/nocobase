import { connect, mapReadPretty } from '@formily/react';
import { InputNumber as AntdNumber, InputNumberProps } from 'antd';
import React from 'react';
import { ReadPretty } from './ReadPretty';

type ComposedInputNumber = React.FC<InputNumberProps> & {
  ReadPretty?: React.FC<InputNumberProps>;
};

export const InputNumber: ComposedInputNumber = connect((props) => {
  const { onChange, ...others } = props;
  const handleChange = (v) => {
    onChange(parseFloat(v));
  };
  return <AntdNumber onChange={handleChange} {...others} />;
}, mapReadPretty(ReadPretty));

InputNumber.ReadPretty = ReadPretty;

export default InputNumber;
