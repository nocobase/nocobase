import { isValid } from '@formily/shared';
import type { InputProps } from 'antd/lib/input';
import type { InputNumberProps } from 'antd/lib/input-number';
import { toFixed } from 'rc-input-number/lib/utils/MiniDecimal';
import { getNumberPrecision } from 'rc-input-number/lib/utils/numberUtil';
import React from 'react';

export const ReadPretty: React.FC<InputProps & InputNumberProps> = (props: any) => {
  const { step, value, addonBefore, addonAfter } = props;
  if (!isValid(props.value)) {
    return <div></div>;
  }
  // const precision = Math.max(getNumberPrecision(String(value)), getNumberPrecision(step));
  const precision = getNumberPrecision(step);
  return (
    <div className={'nb-read-pretty-input-number'}>
      {addonBefore}
      {/* {toFixed(String(value), '.', precision)} */}
      {parseFloat(value).toFixed(precision)}
      {addonAfter}
    </div>
  );
};
