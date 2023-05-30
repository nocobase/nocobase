import { isValid } from '@formily/shared';
import { toFixedByStep } from '@nocobase/utils/client';
import type { InputProps } from 'antd/es/input';
import type { InputNumberProps } from 'antd/es/input-number';
import React from 'react';

export const ReadPretty: React.FC<InputProps & InputNumberProps> = (props: any) => {
  const { step, value, addonBefore, addonAfter } = props;
  if (!isValid(props.value)) {
    return null;
  }
  const result = toFixedByStep(value, step);
  if (isNaN(result)) {
    return null;
  }
  return (
    <div className={'nb-read-pretty-input-number'}>
      {addonBefore}
      {result}
      {addonAfter}
    </div>
  );
};
