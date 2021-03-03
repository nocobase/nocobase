import React, { useState, useEffect } from 'react';
import './style.less';
import { Helmet } from 'umi';
import { Spin } from '@nocobase/client';
import { useRequest, useLocation } from 'umi';
import api from '@/api-client';
import { Actions } from '../Actions';
import { Table as AntdTable, Card, Pagination, Button, Tabs, Descriptions, Tooltip } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { components, fields2columns } from '@/components/views/SortableTable';
import ReactDragListView from 'react-drag-listview';
import arrayMove from 'array-move';
import get from 'lodash/get';
import Drawer from '@/components/pages/AdminLoader/Drawer';
import Field from '@/components/views/Field';
import { Form } from './Form';

export function Details(props) {
  const { data: record = {}, associatedKey, resourceKey, schema = {}, onDataChange } = props;
  const { rowKey = 'id', resourceName, fields = [], actions = [] } = schema;
  const { data = {}, loading, refresh } = useRequest(() => {
    return api.resource(resourceName).get({
      resourceKey: resourceKey || record[rowKey],
      // associatedKey,
    });
  });
  if (loading) {
    return <Spin/>;
  }
  return (
    <div>
      <Actions 
        onTrigger={{
          async update(values) {
            refresh();
            onDataChange(values);
          },
        }}
        data={data}
        actions={actions}
        style={{ marginBottom: 14 }}
      />
      <Descriptions 
        // layout={'vertical'}
        size={'middle'}
        bordered 
        column={1}>
        {fields.map(field => {
          return (
            <Descriptions.Item label={field.title||field.name}>
              <Field data={field} viewType={'descriptions'} schema={field} value={get(data, field.name)}/>
            </Descriptions.Item>
          )
        })}
      </Descriptions>
    </div>
  );
}
