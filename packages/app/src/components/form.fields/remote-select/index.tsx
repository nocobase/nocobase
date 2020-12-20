import React from 'react'
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

function RemoteSelectComponent(props) {
  const { value, onChange, resourceName, associatedKey, labelField, valueField } = props;
  const { data = [], loading } = useRequest(() => api.resource(resourceName).list({
    associatedKey,
  }), {
    refreshDeps: [resourceName, associatedKey]
  });
  return (
    <>
      <Select allowClear loading={loading} value={value} onChange={onChange}>
        {data.map(item => (<Select.Option value={item[valueField]}>{item[valueField]} - {item[labelField]}</Select.Option>))}
      </Select>
    </>
  );
}

export const RemoteSelect = connect({
  getProps: mapStyledProps,
  getComponent: mapTextComponent,
})(RemoteSelectComponent)

export default RemoteSelect
