import { LoadingOutlined } from '@ant-design/icons';
import { ArrayField } from '@formily/core';
import { connect, mapProps, mapReadPretty, useField } from '@formily/react';
import { toArr } from '@formily/shared';
import { Cascader as AntdCascader } from 'antd';
import { isBoolean, omit } from 'lodash';
import React from 'react';
import { useRequest } from '../../../api-client';
import { defaultFieldNames } from './defaultFieldNames';
import { ReadPretty } from './ReadPretty';

const useDefDataSource = (options) => {
  const field = useField<ArrayField>();
  return useRequest(() => Promise.resolve({ data: field.dataSource || [] }), options);
};

const useDefLoadData = (props: any) => {
  return props?.loadData;
};

export const Cascader = connect(
  (props: any) => {
    const field = useField<ArrayField>();
    const {
      value,
      onChange,
      labelInValue,
      fieldNames = defaultFieldNames,
      useDataSource = useDefDataSource,
      useLoadData = useDefLoadData,
      changeOnSelectLast,
      changeOnSelect,
      maxLevel,
      ...others
    } = props;
    const loadData = useLoadData(props);
    const { loading } = useDataSource({
      onSuccess(data) {
        field.dataSource = data?.data || [];
      },
    });
    // 兼容值为 object[] 的情况
    const toValue = () => {
      return toArr(value).map((item) => {
        if (typeof item === 'object') {
          return item[fieldNames.value];
        }
        return item;
      });
    };
    const displayRender = (labels: string[], selectedOptions: any[]) => {
      const values = toArr(value);
      if (values.length !== labels.length) {
        labels = toValue();
        selectedOptions = values;
      }
      if (selectedOptions.length === 0) {
        selectedOptions = values;
      }
      return labels.map((label, i) => {
        let option = selectedOptions[i];
        if (!option || typeof option === 'string' || typeof option === 'number') {
          option = { [fieldNames.label]: label, [fieldNames.value]: label };
        }
        if (i === labels.length - 1) {
          return <span key={option[fieldNames.value]}>{option[fieldNames.label]}</span>;
        }
        return <span key={option[fieldNames.value]}>{option[fieldNames.label]} / </span>;
      });
    };
    return (
      <AntdCascader
        loading={loading}
        {...others}
        options={field.dataSource}
        loadData={loadData}
        changeOnSelect={isBoolean(changeOnSelectLast) ? !changeOnSelectLast : changeOnSelect}
        value={toValue()}
        fieldNames={fieldNames}
        displayRender={displayRender}
        onChange={(value, selectedOptions) => {
          if (labelInValue) {
            onChange(selectedOptions.map((option) => omit(option, [fieldNames.children])));
          } else {
            onChange(value);
          }
        }}
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
        suffixIcon: field?.['loading'] || field?.['validating'] ? <LoadingOutlined /> : props.suffixIcon,
      };
    },
  ),
  mapReadPretty(ReadPretty),
);

export default Cascader;
