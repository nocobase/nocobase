import { LoadingOutlined } from '@ant-design/icons';
import { connect, mapProps, mapReadPretty } from '@formily/react';
import { isValid, toArr } from '@formily/shared';
import type { SelectProps } from 'antd';
import { Select as AntdSelect } from 'antd';
import { isEmpty, isObject } from 'lodash';
import React from 'react';
import { ReadPretty } from './ReadPretty';
import { FieldNames, defaultFieldNames, getCurrentOptions } from './utils';

interface CustomSelectProps extends SelectProps<any, any> {
  objectValue?: boolean;
  onChange?: (v: any) => void;
  multiple: boolean;
  fieldNames?: FieldNames;
}

const isEmptyObject = (val: any): boolean => !isValid(val) || isEmpty(val);

const ObjectSelect: React.FC<CustomSelectProps> = (props) => {
  const { value, options = [], onChange, fieldNames = defaultFieldNames, mode, ...others } = props;

  const toValue = (v: any) => {
    if (isEmptyObject(v)) {
      return;
    }
    const values = toArr(v)
      .filter((item) => item)
      .map((val) => {
        return isObject(val) ? val[fieldNames?.value || 'value'] : val;
      });
    const currentOptions = getCurrentOptions(values, options, fieldNames)?.map((val) => {
      return {
        label: val[fieldNames?.label || 'label'],
        value: val[fieldNames?.value || 'value'],
      };
    });
    if (['tags', 'multiple'].includes(mode as string) || props.multiple) {
      return currentOptions;
    }
    return currentOptions.shift();
  };

  return (
    <AntdSelect
      value={toValue(value)}
      allowClear
      labelInValue
      options={options}
      fieldNames={fieldNames}
      showSearch
      filterOption={(input, option) => (option?.[fieldNames?.label || 'label'] ?? '').includes(input)}
      filterSort={(optionA, optionB) =>
        (optionA?.[fieldNames?.label || 'label'] ?? '')
          .toLowerCase()
          .localeCompare((optionB?.[fieldNames?.label || 'label'] ?? '').toLowerCase())
      }
      onChange={(changed) => {
        const current = getCurrentOptions(
          toArr(changed).map((v) => v.value),
          options,
          fieldNames,
        );
        if (['tags', 'multiple'].includes(mode as string) || props.multiple) {
          onChange?.(current);
        } else {
          onChange?.(current.shift() || null);
        }
      }}
      mode={mode}
      {...others}
    />
  );
};

const filterOption = (input: string, option: any) =>
  (option?.label ?? '').toLowerCase().includes((input || '').toLowerCase());

const InternalSelect = connect(
  (props: CustomSelectProps) => {
    const { objectValue, value, ...others } = props;
    let mode: any = props.multiple ? 'multiple' : props.mode;
    if (mode && !['multiple', 'tags'].includes(mode)) {
      mode = undefined;
    }
    if (objectValue) {
      return <ObjectSelect {...others} value={value} mode={mode} />;
    }
    return (
      <AntdSelect
        showSearch
        filterOption={filterOption}
        allowClear
        value={value}
        {...others}
        onChange={(changed) => {
          props.onChange?.(changed === undefined ? null : changed);
        }}
        mode={mode}
      />
    );
  },
  mapProps(
    {
      dataSource: 'options',
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

export const Select = InternalSelect as unknown as typeof InternalSelect & {
  ReadPretty: typeof ReadPretty;
};

Select.ReadPretty = ReadPretty;

export default Select;
