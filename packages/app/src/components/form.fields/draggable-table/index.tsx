import React, { useState } from 'react';
import { connect } from '@formily/react-schema-renderer';
import moment from 'moment';
import { Select, Table } from 'antd';
import get from 'lodash/get';
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
import { fields2columns, components } from '@/components/views/SortableTable';

function DraggableTableComponent(props) {
  const {
    mode = 'showInDetail',
    value,
    onChange,
    disabled,
    rowKey = 'id',
    fields = [],
    resourceName,
    associatedKey,
    filter,
    labelField,
    valueField = 'id',
    objectValue,
    placeholder,
  } = props;
  const { data = [], loading = true, mutate } = useRequest(
    () => {
      return api.resource(resourceName).list({
        associatedKey,
        filter,
        perPage: -1,
      });
    },
    {
      refreshDeps: [resourceName, associatedKey],
    },
  );
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const onTableChange = (selectedRowKeys: React.ReactText[]) => {
    onChange(selectedRowKeys);
  };
  const tableProps: any = {};
  tableProps.rowSelection = {
    selectedRowKeys: Array.isArray(value)
      ? value
      : data.map(item => item[rowKey]),
    onChange: onTableChange,
  };
  const dataSource = data.filter(item => {
    return get(item, ['component', mode]);
  });
  // const sortIds = get(value, 'sort')||[];
  // let values = [];
  // sortIds.forEach(id => {
  //   const item = dataSource.find(item => item[rowKey] === id);
  //   if (item) {
  //     values.push(item);
  //   }
  // });
  // if (values.length === 0) {
  //   values = dataSource;
  // }
  return (
    <>
      <Table
        scroll={{ y: 300 }}
        size={'small'}
        dataSource={dataSource}
        rowKey={rowKey}
        loading={loading}
        columns={fields2columns(fields || [])}
        pagination={false}
        {...tableProps}
        // components={components({
        //   data: {
        //     list: data,
        //   },
        //   mutate: (values) => {
        //     onChange({
        //       sort: values.list.map(item => item[rowKey]),
        //       selectedRowKeys: get(value, 'selectedRowKeys')||data.map(item => item[rowKey]),
        //     });
        //     mutate(values.list);
        //     // setDataSource(values.list);
        //     console.log('mutate', values);
        //   },
        //   rowKey,
        //   onMoved: async ({resourceKey, target}) => {
        //   }
        // })}
      />
    </>
  );
}

export const DraggableTable = connect({
  getProps: mapStyledProps,
  getComponent: mapTextComponent,
})(DraggableTableComponent);

export default DraggableTable;
