import React, { useEffect } from 'react'
import { connect } from '@formily/react-schema-renderer'
import moment from 'moment'
import { Select } from 'antd'
import {
  mapStyledProps,
  mapTextComponent,
  compose,
  isStr,
  isArr
} from '../shared'
import { useRequest } from 'umi';
import api from '@/api-client';
import { Spin } from '@nocobase/client'

function RemoteSelectComponent(props) {
  const { value, onChange, disabled, resourceName, associatedKey, filter, labelField, valueField = 'id', objectValue } = props;
  const { data = [], loading = true } = useRequest(() => {
    return api.resource(resourceName).list({
      associatedKey,
      filter,
    });
  }, {
    refreshDeps: [resourceName, associatedKey]
  });
  return (
    <>
      <Select 
        disabled={disabled} 
        notFoundContent={loading ? <Spin/> : undefined} 
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
        {!loading && data.map(item => (<Select.Option item={item} value={item[valueField]}>{item[labelField]}</Select.Option>))}
      </Select>
    </>
  );
}

export const RemoteSelect = connect({
  getProps: mapStyledProps,
  getComponent: mapTextComponent,
})(RemoteSelectComponent)

export default RemoteSelect
