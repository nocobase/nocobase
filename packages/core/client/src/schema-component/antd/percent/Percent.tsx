import { connect, mapReadPretty } from '@formily/react';
import { InputNumber } from 'antd';
import React from 'react';
import { ReadPretty } from '../input-number/ReadPretty';
import * as math from 'mathjs';

export const Percent = connect(
  (props) => {
    const { value, onChange } = props;

    return (
      <InputNumber 
        {...props}
        addonAfter="%" 
        value={value ? math.round(value * 100, 9) : null}
        onChange={(v: any) => {
          if (onChange) {
            onChange(v ? math.round(v / 100, 9) : null);
          }
        }}
      />
    );
  },
  mapReadPretty((props) => {
    return (<ReadPretty {...props} value={props.value ? math.round(props.value * 100, 9) : null} />);
  }),
);
