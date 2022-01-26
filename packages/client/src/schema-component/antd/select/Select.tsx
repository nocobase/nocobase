import { LoadingOutlined } from '@ant-design/icons';
import { connect, mapProps, mapReadPretty } from '@formily/react';
import { isValid, toArr } from '@formily/shared';
import type { SelectProps } from 'antd';
import { Select as AntdSelect } from 'antd';
import React from 'react';
import { ReadPretty } from './ReadPretty';
import { defaultFieldNames, getCurrentOptions } from './shared';

type Props = SelectProps<any, any> & { objectValue?: boolean; onChange?: (v: any) => void };

const ObjectSelect = (props: Props) => {
  const { value, options, onChange, fieldNames, mode, ...others } = props;
  const toValue = (v: any) => {
    if (!isValid(v)) {
      return;
    }
    const values = toArr(v).map((val) => {
      return typeof val === 'object' ? val[fieldNames.value] : val;
    });
    const current = getCurrentOptions(values, options, fieldNames).map((val) => {
      return {
        label: val[fieldNames.label],
        value: val[fieldNames.value],
      };
    });
    if (['tags', 'multiple'].includes(mode)) {
      return current;
    }
    return current.shift();
  };
  return (
    <AntdSelect
      value={toValue(value)}
      allowClear
      labelInValue
      options={options}
      fieldNames={fieldNames}
      onChange={(changed) => {
        const current = getCurrentOptions(
          toArr(changed).map((v) => v.value),
          options,
          fieldNames,
        );
        if (['tags', 'multiple'].includes(mode)) {
          onChange(current);
        } else {
          onChange(current.shift());
        }
      }}
      mode={mode}
      {...others}
    />
  );
};

export const Select = connect(
  (props: Props) => {
    const { objectValue, ...others } = props;
    if (objectValue) {
      return <ObjectSelect {...others} />;
    }
    return <AntdSelect {...others} />;
  },
  mapProps(
    {
      dataSource: 'options',
      loading: true,
    },
    (props, field) => {
      return {
        ...props,
        fieldNames: { ...defaultFieldNames, ...props.fieldNames },
        suffixIcon: field?.['loading'] || field?.['validating'] ? <LoadingOutlined /> : props.suffixIcon,
      };
    },
  ),
  mapReadPretty(ReadPretty),
);

export default Select;
