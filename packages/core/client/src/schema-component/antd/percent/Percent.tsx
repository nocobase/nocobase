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
        min={0}
        onChange={(v: any) => {
          if (onChange) {
            onChange(v);
          }
        }}
      />
    );
  },
  mapReadPretty((props) => {
    return <ReadPretty {...props} value={props.value ? math.round(props.value * 100, 9) : null} />;
  }),
);
