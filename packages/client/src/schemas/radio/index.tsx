import React from 'react';
import {
  connect,
  mapProps,
  mapReadPretty,
  SchemaOptionsContext,
  useField,
} from '@formily/react';
import { Radio as AntdRadio, Tag } from 'antd';
import { RadioProps, RadioGroupProps } from 'antd/lib/radio';
import { isValid } from '@formily/shared';

type ComposedRadio = React.FC<RadioProps> & {
  Group?: React.FC<RadioGroupProps>;
  __ANT_RADIO?: boolean;
};

export const Radio: ComposedRadio = connect(
  AntdRadio,
  mapProps({
    value: 'checked',
    onInput: 'onChange',
  }),
);

Radio.__ANT_RADIO = true;

Radio.Group = connect(
  AntdRadio.Group,
  mapProps({
    dataSource: 'options',
  }),
  mapReadPretty((props) => {
    if (!isValid(props.value)) {
      return <div></div>;
    }
    const { options = [], value } = props;
    const field = useField<any>();
    const dataSource = field.dataSource || [];
    console.log({ dataSource });
    return (
      <div>
        {dataSource
          .filter((option) => option.value === value)
          .map((option, key) => (
            <Tag key={key} color={option.color}>
              {option.label}
            </Tag>
          ))}
      </div>
    );
  }),
);

export default Radio;
