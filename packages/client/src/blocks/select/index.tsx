import React from 'react';
import { connect, mapReadPretty, mapProps, useField } from '@formily/react';
import { Select as AntdSelect, Tag } from 'antd';
import { PreviewText } from '@formily/antd';
import { LoadingOutlined } from '@ant-design/icons';
import { SelectProps } from 'antd/lib/select';
import { isArr, isValid } from '@formily/shared';
import { Field } from '@formily/core/esm/models/Field';
import { useAction } from '../../state';
import { Display } from '../display';
import { useRequest } from 'ahooks';
import uniq from 'lodash/uniq';

type ComposedSelect = React.FC<SelectProps<any>> & {
  Object?: React.FC;
};

export const Select: ComposedSelect = connect(
  (props) => {
    const { options = [], ...others } = props;
    return <AntdSelect {...others}>
      {options.map((option: any, key: any) => {
        if (option.children) {
          return (
            <AntdSelect.OptGroup key={key} label={option.label}>
              {option.children.map((child: any, childKey: any) => (
                <AntdSelect.Option key={`${key}-${childKey}`} {...child}>{child.label}</AntdSelect.Option>
              ))}
            </AntdSelect.OptGroup>
          )
        } else {
          return <AntdSelect.Option key={key} {...option}>{option.label}</AntdSelect.Option>
        }
      })}
    </AntdSelect>
  },
  mapProps(
    {
      dataSource: 'options',
      loading: true,
    },
    (props, field) => {
      return {
        ...props,
        suffixIcon:
          field?.['loading'] || field?.['validating'] ? (
            <LoadingOutlined />
          ) : (
            props.suffixIcon
          ),
      };
    },
  ),
  mapReadPretty((props) => {
    const field = useField<any>();
    const dataSource = field.dataSource || [];
    console.log('field.value', field.value, dataSource)
    const value = Array.isArray(field.value) ? field.value : [field.value];
    const values = uniq(value);
    const findOptions = (options: any[]) => {
      let current = [];
      for (const option of options) {
        if (values.includes(option.value)) {
          current.push(option);
        }
        if (option.children) {
          current = current.concat(findOptions(option.children));
        }
      }
      return current;
    }
    const options = findOptions(dataSource);
    return (
      <div>
        {options
          .map((option, key) => (
            <Tag key={key} color={option.color}>{option.label}</Tag>
          ))}
      </div>
    );
  }),
);

function getFieldName(field: any) {
  if (typeof field === 'string') {
    return field;
  }
  if (typeof field === 'object') {
    return field.name;
  }
}

Select.Object = connect(
  (props) => {
    const field = useField();
    const {
      value,
      onChange,
      dataRequest,
      labelField: lf,
      valueField: vf,
      ...others
    } = props;
    const options = field?.['dataSource'] || props.options || [];
    console.log({options});
    const labelField = getFieldName(lf);
    const valueField = getFieldName(vf);
    const { data = options, loading } = useRequest(() => dataRequest ? dataRequest : Promise.resolve(options), {
      refreshDeps: [options]
    });
    const getValues = () => {
      if (!isValid(value)) {
        return [];
      }
      return isArr(value) ? value : [value];
    }
    const getOptionValue = () => {
      const values = getValues().map((item) => {
        return {
          value: item[valueField],
          label: item[labelField],
        };
      });
      if (props.mode === 'multiple' || props.mode === 'tags') {
        return values;
      }
      return values.length ? values[0] : null;
    };
    const getOptions = () => {
      return data.map(item => {
        return {
          value: item[valueField],
          label: item[labelField],
        };
      })
    }
    return (
      <AntdSelect
        {...others}
        loading={loading}
        onChange={(option: any) => {
          if (!isValid(option)) {
            onChange(null);
          }
          if (isArr(option)) {
            const optionValues = option.map(item => item.value);
            const selectValue = data.filter(
              (item) => optionValues.includes(item[valueField]),
            );
            onChange(selectValue);
          } else {
            const selectValue = data.find(
              (item) => item[valueField] === option.value,
            );
            onChange(selectValue);
          }
        }}
        labelInValue
        value={getOptionValue()}
        options={getOptions()}
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
        suffixIcon:
          field?.['loading'] || field?.['validating'] ? (
            <LoadingOutlined />
          ) : (
            props.suffixIcon
          ),
      };
    },
  ),
  mapReadPretty(Display.ObjectSelect),
);

export default Select;
