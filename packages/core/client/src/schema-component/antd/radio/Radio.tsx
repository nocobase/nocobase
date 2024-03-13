import { connect, mapProps, mapReadPretty, useField } from '@formily/react';
import { isValid } from '@formily/shared';
import { Radio as AntdRadio, Tag } from 'antd';
import type { RadioGroupProps, RadioProps } from 'antd/es/radio';
import React, { useState, useEffect } from 'react';
import { useCollectionField } from '../../../data-source/collection-field/CollectionFieldProvider';

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
  mapProps(
    {
      dataSource: 'options',
    },
    (props: any, field: any) => {
      useEffect(() => {
        const defaultOption = field.dataSource?.find((option) => option.value == props.value);
        if (defaultOption) {
          field.setValue(defaultOption.value);
        }
      }, [props.value, field.dataSource]);
      return {
        ...props,
      };
    },
  ),
  mapReadPretty((props) => {
    if (!isValid(props.value)) {
      return <div></div>;
    }
    const { value } = props;
    const field = useField<any>();
    const collectionField = useCollectionField();
    const dataSource = field.dataSource || collectionField?.uiSchema.enum || [];
    return (
      <div>
        {dataSource
          .filter((option) => option.value == value)
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
