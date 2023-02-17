import { connect, mapProps, mapReadPretty, useField } from '@formily/react';
import { isValid } from '@formily/shared';
import { Radio as AntdRadio, Tag } from 'antd';
import type { RadioGroupProps, RadioProps } from 'antd/lib/radio';
import React from 'react';

type ComposedRadio = React.FC<RadioProps> & {
  Group?: React.FC<RadioGroupProps>;
  __ANT_RADIO?: boolean;
};

export const Radio: ComposedRadio = connect(
  AntdRadio,
  mapProps(
    {
      value: 'checked',
      onInput: 'onChange',
    },
    (props, field) => {
      return {
        ...props,
        disabled: props.disabled || field.pattern === 'readOnly',
      };
    },
  ),
);
Radio.__ANT_RADIO = true;

Radio.Group = connect(
  AntdRadio.Group,
  mapProps(
    {
      dataSource: 'options',
    },
    (props, field) => {
      return {
        ...props,
        disabled: props.disabled || field.pattern === 'readOnly',
      };
    },
  ),
  mapReadPretty((props) => {
    if (!isValid(props.value)) {
      return <div></div>;
    }
    const { options = [], value } = props;
    const field = useField<any>();
    const dataSource = field.dataSource || [];
    console.log(field);
    return (
      <div>
        {dataSource
          .filter((option) => option.value === value)
          .map((option, key) => (
            <Tag key={key} color={option.color} icon={option.icon}>
              {option.label}
            </Tag>
          ))}
      </div>
    );
  }),
);

export default Radio;
