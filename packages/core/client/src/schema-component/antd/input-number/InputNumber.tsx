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
function toSafeNumber(value) {
  if (value > Number.MAX_SAFE_INTEGER || value < Number.MIN_SAFE_INTEGER) {
    return new BigNumber(value).toString();
  } else {
    return value;
  }
}
export const InputNumber: ComposedInputNumber = connect((props) => {
  const { onChange, ...others } = props;
  const handleChange = (v) => {
    if (Number.isNaN(v)) {
      onChange(null);
    } else {
      console.log(toSafeNumber(v));
      onChange(toSafeNumber(v));
    }
  };
  return <AntdNumber onChange={handleChange} {...others} />;
}, mapReadPretty(ReadPretty));

InputNumber.ReadPretty = ReadPretty;

export default InputNumber;
