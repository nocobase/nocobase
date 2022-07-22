import { isValid } from '@formily/shared';
import type { InputProps } from 'antd/lib/input';
import type { InputNumberProps } from 'antd/lib/input-number';
import { toFixed } from 'rc-input-number/lib/utils/MiniDecimal';
import { getNumberPrecision } from 'rc-input-number/lib/utils/numberUtil';
import React from 'react';

export function toFixedByStep(value: any, step: string | number) {
  if (typeof value  === 'undefined' || value === null || value === '') {
    return '';
  }
  const precision = getNumberPrecision(step);
  // return parseFloat(String(value)).toFixed(precision);
  return toFixed(String(value), '.', precision);
}

export const ReadPretty: React.FC<InputProps & InputNumberProps> = (props: any) => {
  const { step, value, addonBefore, addonAfter } = props;
  if (!isValid(props.value)) {
    return <div></div>;
  }
  return (
    <div className={'nb-read-pretty-input-number'}>
      {addonBefore}
      {toFixedByStep(value, step)}
      {addonAfter}
    </div>
  );
};
