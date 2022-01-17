import { connect, mapReadPretty } from '@formily/react';
import { InputNumber as AntdNumber } from 'antd';
import cls from 'classnames';
import React from 'react';
import { ReadPretty } from './ReadPretty';
import './style.less';

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
}, mapReadPretty(ReadPretty));

export default InputNumber;
