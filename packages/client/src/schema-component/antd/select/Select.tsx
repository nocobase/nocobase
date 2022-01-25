import { LoadingOutlined } from '@ant-design/icons';
import { connect, mapProps, mapReadPretty, useField } from '@formily/react';
import { isArr, isValid } from '@formily/shared';
import type { SelectProps } from 'antd';
import { Select as AntdSelect } from 'antd';
import React from 'react';
import { useCompile } from '../../hooks/useCompile';
import { ReadPretty } from './ReadPretty';

type ComposedSelect = React.FC<SelectProps<unknown>> & {
  Object?: React.FC<unknown>;
};

export const Select: ComposedSelect = connect(
  (props) => {
    const { options = [], ...others } = props;
    const compile = useCompile();
    return (
      <AntdSelect {...others}>
        {options.map((option: any, key: any) => {
          if (option.children) {
            return (
              <AntdSelect.OptGroup key={key} label={option.label}>
                {option.children.map((child: any, childKey: any) => (
                  <AntdSelect.Option key={`${key}-${childKey}`} {...child}>
                    {compile(child.label)}
                  </AntdSelect.Option>
                ))}
              </AntdSelect.OptGroup>
            );
          } else {
            return (
              <AntdSelect.Option key={key} {...option}>
                {compile(option.label)}
              </AntdSelect.Option>
            );
          }
        })}
      </AntdSelect>
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
        suffixIcon: field?.['loading'] || field?.['validating'] ? <LoadingOutlined /> : props.suffixIcon,
      };
    },
  ),
  mapReadPretty(ReadPretty.Select),
);

Select.Object = connect(
  (props) => {
    const field = useField();
    const {
      value,
      onChange,
      fieldNames = {
        label: 'label',
        value: 'value',
      },
      ...others
    } = props;
    const options = field?.['dataSource'] || props.options || [];
    let optionValue = undefined;
    if (isArr(value)) {
      optionValue = value.map((val) => {
        return {
          label: val[fieldNames.label],
          value: val[fieldNames.value],
        };
      });
    } else if (value) {
      optionValue = {
        label: value[fieldNames.label],
        value: value[fieldNames.value],
      };
    }
    return (
      <AntdSelect
        allowClear
        labelInValue
        {...others}
        value={optionValue}
        onChange={(selectValue: any) => {
          if (!isValid(selectValue)) {
            onChange(null);
            return;
          }
          if (isArr(selectValue)) {
            const selectValues = selectValue.map((s) => s.value);
            const values = {};
            if (isArr(value)) {
              value.forEach((option) => {
                const val = option[fieldNames.value];
                if (selectValues.includes(val)) {
                  values[val] = option;
                }
              });
            }
            options.forEach((option) => {
              const val = option[fieldNames.value];
              if (selectValues.includes(val)) {
                values[val] = option;
              }
            });
            console.log({ selectValue, values });
            onChange(Object.values(values));
          } else {
            // 这里不能用 undefined，需要用 null
            onChange(options.find((option) => option[fieldNames.value] === selectValue.value));
          }
        }}
        options={options.map((option) => {
          return {
            label: option[fieldNames.label],
            value: option[fieldNames.value],
          };
        })}
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
        options: field?.['dataSource'],
        suffixIcon: field?.['loading'] || field?.['validating'] ? <LoadingOutlined /> : props.suffixIcon,
      };
    },
  ),
  mapReadPretty(ReadPretty.Object),
);

export default Select;
