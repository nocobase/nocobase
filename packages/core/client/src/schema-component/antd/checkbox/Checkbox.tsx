import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { connect, mapProps, mapReadPretty, useField } from '@formily/react';
import { isValid } from '@formily/shared';
import { Checkbox as AntdCheckbox, Tag } from 'antd';
import type { CheckboxGroupProps, CheckboxProps } from 'antd/lib/checkbox';
import uniq from 'lodash/uniq';
import React from 'react';

type ComposedCheckbox = React.FC<CheckboxProps> & {
  Group?: React.FC<CheckboxGroupProps>;
  __ANT_CHECKBOX?: boolean;
};

export const Checkbox: ComposedCheckbox = connect(
  (props: any) => {
    const changeHandler = (val) => {
      props?.onChange(val);
    };
    return <AntdCheckbox {...props} onChange={changeHandler} />;
  },
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
    if (!isValid(props.value)) {
      return null;
    }
    if (props.value) {
      return <CheckOutlined style={{ color: '#52c41a' }} />;
    }
    return props.showUnchecked ? <CloseOutlined style={{ color: '#ff4d4f' }} /> : null;
  }),
);

Checkbox.__ANT_CHECKBOX = true;

Checkbox.Group = connect(
  AntdCheckbox.Group,
  mapProps({
    dataSource: 'options',
  }),
  mapReadPretty((props) => {
    if (!isValid(props.value)) {
      return null;
    }
    const { options = [] } = props;
    const field = useField<any>();
    const dataSource = field.dataSource || [];
    const value = uniq(field.value ? field.value : []);
    return (
      <div>
        {dataSource
          .filter((option) => value.includes(option.value))
          .map((option, key) => (
            <Tag key={key} color={option.color} icon={option.icon}>
              {option.label}
            </Tag>
          ))}
      </div>
    );
  }),
);

export default Checkbox;
