import { connect, mapReadPretty } from '@formily/react';
import { InputNumber } from 'antd';
import React from 'react';
import { ReadPretty } from '../input-number/ReadPretty';

export const Percent = connect(
  (props) => {
    const { value, onChange, step } = props;

    return (
      <InputNumber 
        addonAfter="%" 
        value={value * 100}
        step={step}
        onChange={(v) => {
          if (onChange) {
            onChange(v / 100);
          }
        }}
      />
    );
  },
  mapReadPretty((props) => {
    return (<ReadPretty {...props} value={props.value ? props.value * 100 : null} />);
  }),
);
