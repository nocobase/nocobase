import { isValid } from '@formily/shared';
import { toFixedByStep } from '@nocobase/utils/client';
import type { InputProps } from 'antd/lib/input';
import type { InputNumberProps } from 'antd/lib/input-number';
import React from 'react';

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
