import { LoadingOutlined } from '@ant-design/icons';
import { connect, mapProps, mapReadPretty } from '@formily/react';
import { isValid, toArr } from '@formily/shared';
import type { SelectProps } from 'antd';
import { Select as AntdSelect } from 'antd';
import React from 'react';
import { ReadPretty } from './ReadPretty';
import { defaultFieldNames, getCurrentOptions } from './shared';

type Props = SelectProps<any, any> & { objectValue?: boolean; onChange?: (v: any) => void; multiple: boolean };

const isEmptyObject = (val: any) => !isValid(val) || (typeof val === 'object' && Object.keys(val).length === 0);

const ObjectSelect = (props: Props) => {
  const { value, options, onChange, fieldNames, mode, ...others } = props;
  const toValue = (v: any) => {
    if (isEmptyObject(v)) {
      return;
    }
    const values = toArr(v)
      .filter((item) => item)
      .map((val) => {
        return typeof val === 'object' ? val[fieldNames.value] : val;
      });
    const current = getCurrentOptions(values, options, fieldNames)?.map((val) => {
      return {
        label: val[fieldNames.label],
        value: val[fieldNames.value],
      };
    });
    if (['tags', 'multiple'].includes(mode) || props.multiple) {
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
      showSearch
      filterOption={(input, option) => (option?.[fieldNames.label || 'label'] ?? '').includes(input)}
      filterSort={(optionA, optionB) =>
        (optionA?.[fieldNames.label || 'label'] ?? '')
          .toLowerCase()
          .localeCompare((optionB?.[fieldNames.label || 'label'] ?? '').toLowerCase())
      }
      onChange={(changed) => {
        const current = getCurrentOptions(
          toArr(changed).map((v) => v.value),
          options,
          fieldNames,
        );
        if (['tags', 'multiple'].includes(mode) || props.multiple) {
          onChange(current);
        } else {
          onChange(current.shift() || null);
        }
      }}
      mode={mode}
      {...others}
    />
  );
};

const filterOption = (input, option) => (option?.label ?? '').toLowerCase().includes((input || '').toLowerCase());

const InternalSelect = connect(
  (props: Props) => {
    const { objectValue, value, ...others } = props;
    const mode = props.mode || props.multiple ? 'multiple' : undefined;
    const toValue = (v) => {
      if (['multiple', 'tags'].includes(mode)) {
        return v || [];
      }
      return v;
    };
    console.log('props', props);
    if (objectValue) {
      return <ObjectSelect {...others} value={toValue(value)} mode={mode} />;
    }
    return (
      <AntdSelect
        showSearch
        filterOption={filterOption}
        allowClear
        value={toValue(value)}
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

export const Select = InternalSelect as unknown as typeof InternalSelect & {
  ReadPretty: typeof ReadPretty;
};

Select.ReadPretty = ReadPretty;

export default Select;
