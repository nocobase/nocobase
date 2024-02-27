import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { connect, mapProps, mapReadPretty, useField } from '@formily/react';
import { isValid } from '@formily/shared';
import { Checkbox as AntdCheckbox, Tag } from 'antd';
import type { CheckboxGroupProps, CheckboxProps } from 'antd/es/checkbox';
import uniq from 'lodash/uniq';
import React from 'react';
import { useCollectionField } from '../../../data-source/collection-field/CollectionFieldProvider';
import { EllipsisWithTooltip } from '../input/EllipsisWithTooltip';

type ComposedCheckbox = React.ForwardRefExoticComponent<
  Pick<Partial<any>, string | number | symbol> & React.RefAttributes<unknown>
> & {
  Group?: React.FC<CheckboxGroupProps>;
  __ANT_CHECKBOX?: boolean;
  ReadPretty?: React.FC<CheckboxProps>;
};

const ReadPretty = (props) => {
  if (props.value) {
    return <CheckOutlined style={{ color: '#52c41a' }} />;
  }
  return props.showUnchecked ? <CloseOutlined style={{ color: '#ff4d4f' }} /> : null;
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
  mapReadPretty(ReadPretty),
);

Checkbox.ReadPretty = ReadPretty;

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
    const field = useField<any>();
    const collectionField = useCollectionField();
    const dataSource = field.dataSource || collectionField?.uiSchema.enum || [];
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
