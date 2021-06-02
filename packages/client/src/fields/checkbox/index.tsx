import React from 'react';
import { connect, mapProps, mapReadPretty, useField } from '@formily/react';
import { Checkbox as AntdCheckbox, Tag } from 'antd';
import { CheckboxProps, CheckboxGroupProps } from 'antd/lib/checkbox';
import { Descriptions } from '../descriptions';
import uniq from 'lodash/uniq';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';

type ComposedCheckbox = React.FC<CheckboxProps> & {
  Group?: React.FC<CheckboxGroupProps>;
  __ANT_CHECKBOX?: boolean;
};

export const Checkbox: ComposedCheckbox = connect(
  AntdCheckbox,
  mapProps(
    {
      value: 'checked',
      onInput: 'onChange',
    },
    (props, field) => {
      // console.log({ props, field });
      return {
        ...props,
      };
    },
  ),
  mapReadPretty((props) => {
    return props.value ? (
      <CheckOutlined style={{ color: '#52c41a' }} />
    ) : (
      <CloseOutlined style={{ color: '#f5222d' }} />
    );
  }),
);

Checkbox.__ANT_CHECKBOX = true;

Checkbox.Group = connect(
  AntdCheckbox.Group,
  mapProps({
    dataSource: 'options',
  }),
  mapReadPretty((props) => {
    const { options = [] } = props;
    const field = useField<any>();
    const dataSource = field.dataSource || [];
    const value = uniq(field.value ? field.value : []);
    return (
      <div>
        {dataSource
          .filter((option) => value.includes(option.value))
          .map((option, key) => (
            <Tag key={key} color={option.color}>{option.label}</Tag>
          ))}
      </div>
    );
  }),
);

export default Checkbox;
