import React from 'react';
import { connect, mapReadPretty } from '@formily/react';
import { InputNumber as AntdNumber, Input, Button } from 'antd';
import { Display } from '../display';
import getMiniDecimal, { toFixed } from 'rc-input-number/lib/utils/MiniDecimal';
import { getNumberPrecision } from 'rc-input-number/lib/utils/numberUtil';
import { isValid } from '@formily/shared';
import cls from 'classnames';
import './style.less';

export const InputNumber: any = connect(
  (props) => {
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
        {addonBefore && (
          <div className="ant-input-group-addon">{addonBefore}</div>
        )}
        {content}
        {addonAfter && (
          <div className="ant-input-group-addon">{addonAfter}</div>
        )}
      </div>
    );
  },
  mapReadPretty((props: any) => {
    const { step, value, addonBefore, addonAfter } = props;
    if (!isValid(props.value)) {
      return <div>N/A</div>;
    }
    const precision = Math.max(
      getNumberPrecision(String(value)),
      getNumberPrecision(step),
    );
    return (
      <div>
        {addonBefore}
        {toFixed(String(value), '.', precision)}
        {addonAfter}
      </div>
    );
  }),
);

InputNumber.Percent = connect(
  AntdNumber,
  mapReadPretty((props: any) => {
    const { step, value } = props;
    if (!isValid(props.value)) {
      return <div>N/A</div>;
    }
    return toFixed(
      String(value),
      '.',
      Math.max(getNumberPrecision(String(value)), getNumberPrecision(step)),
    );
  }),
);

export default InputNumber;
