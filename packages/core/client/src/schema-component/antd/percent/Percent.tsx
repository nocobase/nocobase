import { connect, mapReadPretty } from '@formily/react';
import { InputNumber } from 'antd';
import * as math from 'mathjs';
import React from 'react';
import { ReadPretty } from '../input-number/ReadPretty';

export const Percent = connect(
  (props) => {
    const { value, onChange } = props;

    return (
      <InputNumber
        {...props}
        addonAfter="%"
        defaultValue={value ? math.round(value * 100, 9) : null}
        formatter={(v: any) => (v ? math.round(v * 100, 9) : null)}
        onChange={(v: any) => {
          if (onChange) {
            const val = v ? math.round(v / 100, 9) : 0;
            onChange(val);
          }
        }}
      />
    );
  },
  mapReadPretty((props) => {
    return <ReadPretty {...props} value={props.value ? math.round(props.value * 100, 9) : null} />;
  }),
);
