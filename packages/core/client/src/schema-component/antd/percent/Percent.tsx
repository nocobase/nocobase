import { connect, mapReadPretty,mapProps } from '@formily/react';
import { InputNumber } from 'antd';
import React from 'react';
import { ReadPretty } from '../input-number/ReadPretty';
import * as math from 'mathjs';

export const Percent = connect(
  (props) => {
    const { value, step, onChange } = props;

    return (
      <InputNumber 
        {...props}
        addonAfter="%" 
        step={Number(step) || 1}
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
