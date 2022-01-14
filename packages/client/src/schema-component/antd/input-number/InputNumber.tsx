import { connect, mapReadPretty } from '@formily/react';
import { isValid } from '@formily/shared';
import { InputNumber as AntdNumber } from 'antd';
import type { InputProps } from 'antd/lib/input';
import type { InputNumberProps } from 'antd/lib/input-number';
import cls from 'classnames';
import { toFixed } from 'rc-input-number/lib/utils/MiniDecimal';
import { getNumberPrecision } from 'rc-input-number/lib/utils/numberUtil';
import React from 'react';
import './style.less';

const InputNumberDisplay: React.FC<InputProps & InputNumberProps> = (props: any) => {
  const { step, value, addonBefore, addonAfter } = props;
  if (!isValid(props.value)) {
    return <div></div>;
  }
  const precision = Math.max(getNumberPrecision(String(value)), getNumberPrecision(step));
  return (
    <div>
      {addonBefore}
      {toFixed(String(value), '.', precision)}
      {addonAfter}
    </div>
  );
};

export const InputNumber: any = connect((props) => {
  const { addonBefore, addonAfter, ...others } = props;
  const content = <AntdNumber {...others} />;
  if (!addonBefore && !addonAfter) {
    return content;
  }
  return (
    <div
      className={cls('nb-input-number', {
        'has-addon-before': !!addonBefore,
        'has-addon-after': !!addonAfter,
      })}
    >
      {addonBefore && <div className="ant-input-group-addon">{addonBefore}</div>}
      {content}
      {addonAfter && <div className="ant-input-group-addon">{addonAfter}</div>}
    </div>
  );
}, mapReadPretty(InputNumberDisplay));

InputNumber.Percent = connect(
  AntdNumber,
  mapReadPretty((props: any) => {
    const { step, value } = props;
    if (!isValid(props.value)) {
      return <div></div>;
    }
    return toFixed(String(value), '.', Math.max(getNumberPrecision(String(value)), getNumberPrecision(step)));
  }),
);

export default InputNumber;
