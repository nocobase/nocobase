import React, { useEffect } from 'react';
import { connect } from '@formily/react-schema-renderer';
import moment from 'moment';
import { Select } from 'antd';
import {
  mapStyledProps,
  mapTextComponent,
  compose,
  isStr,
  isArr,
} from '../shared';
import { useRequest } from 'umi';
import api from '@/api-client';
import { Spin } from '@nocobase/client';
import get from 'lodash/get';

function RemoteSelectComponent(props) {
  let {
    schema = {},
    value,
    onChange,
    disabled,
    resourceName,
    associatedKey,
    filter,
    labelField,
    valueField,
    objectValue,
    placeholder,
    multiple,
  } = props;
  console.log({ schema });
  if (!resourceName) {
    resourceName = get(schema, 'component.resourceName');
  }
  if (!filter) {
    filter = get(schema, 'component.filter');
  }
  if (!labelField) {
    labelField = get(schema, 'component.labelField');
  }
  if (!valueField) {
    valueField = get(schema, 'component.valueField');
  }
  if (!valueField) {
    valueField = 'id';
  }
  const { data = [], loading = true } = useRequest(
    () => {
      return api.resource(resourceName).list({
        associatedKey,
        filter,
      });
    },
    {
      refreshDeps: [resourceName, associatedKey],
    },
  );
  const selectProps: any = {};
  if (multiple) {
    selectProps.mode = 'multiple';
  }
  console.log({ data, props, associatedKey });
  return (
    <>
      <Select
        {...selectProps}
        placeholder={placeholder}
        disabled={disabled}
        notFoundContent={loading ? <Spin /> : undefined}
        allowClear
        loading={loading}
        value={value && typeof value === 'object' ? value[valueField] : value}
        onChange={(value, option) => {
          if (value === null || typeof value === 'undefined') {
            onChange(undefined);
            return;
          }
          // @ts-ignore
          const item = option.item;
          onChange(objectValue ? item : value);
        }}
      >
        {!loading &&
          data.map(item => (
            <Select.Option item={item} value={item[valueField]}>
              {item[labelField]}
            </Select.Option>
          ))}
      </Select>
    </>
  );
}

export const RemoteSelect = connect({
  getProps: mapStyledProps,
  getComponent: mapTextComponent,
})(RemoteSelectComponent);

export default RemoteSelect;
