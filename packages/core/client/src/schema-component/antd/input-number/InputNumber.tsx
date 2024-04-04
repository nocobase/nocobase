import { connect, mapReadPretty } from '@formily/react';
import { InputNumber as AntdNumber, InputNumberProps } from 'antd';
import React from 'react';
import { ReadPretty } from './ReadPretty';
import BigNumber from 'bignumber.js';

type ComposedInputNumber = React.ForwardRefExoticComponent<
  Pick<Partial<any>, string | number | symbol> & React.RefAttributes<unknown>
> & {
  ReadPretty?: React.FC<InputNumberProps>;
};

export const InputNumber: ComposedInputNumber = connect((props) => {
  const { onChange, ...others } = props;
  const handleChange = (v) => {
    if (Number.isNaN(v) || !v) {
      onChange(null);
    } else {
      onChange(new BigNumber(v).toString());
    }
  };
  return <AntdNumber onChange={handleChange} {...others} />;
}, mapReadPretty(ReadPretty));

InputNumber.ReadPretty = ReadPretty;

export default InputNumber;
