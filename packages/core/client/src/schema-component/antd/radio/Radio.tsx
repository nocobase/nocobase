import { connect, mapProps, mapReadPretty, useField, useFieldSchema } from '@formily/react';
import { isValid } from '@formily/shared';
import { Radio as AntdRadio, Tag } from 'antd';
import type { RadioGroupProps, RadioProps } from 'antd/es/radio';
import React from 'react';
import Select from '../select/Select';

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

const InputRadioGroup: React.FC<RadioGroupProps> = (props: any) => {
  const fieldSchema = useFieldSchema();
  const isDisplayInTable = fieldSchema.parent?.['x-component'] === 'TableV2.Column';

  return isDisplayInTable ? <Select {...props} multiple={false} /> : <AntdRadio.Group {...props} />;
};

Radio.Group = connect(
  InputRadioGroup,
  mapProps({
    dataSource: 'options',
  }),
  mapReadPretty((props) => {
    if (!isValid(props.value)) {
      return <div></div>;
    }
    const { value } = props;
    const field = useField<any>();
    const dataSource = field.dataSource || [];
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
