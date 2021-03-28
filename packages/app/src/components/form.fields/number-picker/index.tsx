import React from 'react';
import { connect } from '@formily/react-schema-renderer';
import { InputNumber } from 'antd';
import { acceptEnum, mapStyledProps, mapTextComponent } from '../shared';

export const NumberPicker = connect({
  getProps: mapStyledProps,
  getComponent: mapTextComponent,
})(acceptEnum(InputNumber));

export const Percent = connect({
  getProps: mapStyledProps,
  getComponent: mapTextComponent,
})(
  acceptEnum(props => (
    <InputNumber
      formatter={value => (value ? `${value}%` : '')}
      parser={value => value.replace('%', '')}
      {...props}
    />
  )),
);

export default NumberPicker;
