import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { connect, mapProps, mapReadPretty, useField, useFieldSchema } from '@formily/react';
import { isValid } from '@formily/shared';
import { Checkbox as AntdCheckbox, Tag } from 'antd';
import type { CheckboxGroupProps, CheckboxProps } from 'antd/es/checkbox';
import uniq from 'lodash/uniq';
import React from 'react';
import { EllipsisWithTooltip } from '../input/EllipsisWithTooltip';
import Select from '../select/Select';

type ComposedCheckbox = any & {
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
  mapProps({
    value: 'checked',
    onInput: 'onChange',
  }),
  mapReadPretty((props) => {
    if (props.value) {
      return <CheckOutlined style={{ color: '#52c41a' }} />;
    }
    return props.showUnchecked ? <CloseOutlined style={{ color: '#ff4d4f' }} /> : null;
  }),
);

Checkbox.__ANT_CHECKBOX = true;

const InputCheckboxGroup: React.FC<CheckboxGroupProps> = (props: any) => {
  const fieldSchema = useFieldSchema();
  const isDisplayInTable = fieldSchema.parent?.['x-component'] === 'TableV2.Column';

  return isDisplayInTable ? <Select {...props} multiple={true} mode="multiple" /> : <AntdCheckbox.Group {...props} />;
};

Checkbox.Group = connect(
  InputCheckboxGroup,
  mapProps({
    dataSource: 'options',
  }),
  mapReadPretty((props) => {
    if (!isValid(props.value)) {
      return null;
    }
    const field = useField<any>();
    const dataSource = field.dataSource || [];
    const value = uniq(field.value ? field.value : []);
    return (
      <EllipsisWithTooltip ellipsis={props.ellipsis}>
        {dataSource
          .filter((option) => value.includes(option.value))
          .map((option, key) => (
            <Tag key={key} color={option.color} icon={option.icon}>
              {option.label}
            </Tag>
          ))}
      </EllipsisWithTooltip>
    );
  }),
);

export default Checkbox;
