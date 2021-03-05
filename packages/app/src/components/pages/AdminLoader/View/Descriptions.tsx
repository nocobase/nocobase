import React, { useState, useEffect } from 'react';
import './style.less';
import { Helmet } from 'umi';
import { Spin } from '@nocobase/client';
import { useRequest, useLocation } from 'umi';
import api from '@/api-client';
import { Actions } from '../Actions';
import { Table as AntdTable, Card, Pagination, Button, Tabs, Descriptions as AntdDescriptions, Tooltip } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { components, fields2columns } from '@/components/views/SortableTable';
import ReactDragListView from 'react-drag-listview';
import arrayMove from 'array-move';
import get from 'lodash/get';
import Drawer from '@/components/pages/AdminLoader/Drawer';
import Field from '@/components/views/Field';
import { Form } from './Form';

export function Descriptions(props) {
  const { data: record = {}, schema = {}, onDataChange, associatedKey } = props;
  const { rowKey = 'id', resourceName, fields = [], actions = [], appends = [], associationField = {} } = schema;

  const resourceKey = props.resourceKey || record[associationField.targetKey||rowKey];

  const { data = {}, loading, refresh } = useRequest(() => {
    return api.resource(resourceName).get({
      resourceKey,
      associatedKey,
      'fields[appends]': appends,
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
        associatedKey={associatedKey}
        data={data}
        actions={actions}
        style={{ marginBottom: 14 }}
      />
      <AntdDescriptions 
        // layout={'vertical'}
        size={'middle'}
        bordered 
        column={1}>
        {fields.map(field => {
          return (
            <AntdDescriptions.Item label={field.title||field.name}>
              <Field data={field} viewType={'descriptions'} schema={field} value={get(data, field.name)}/>
            </AntdDescriptions.Item>
          )
        })}
      </AntdDescriptions>
    </div>
  );
}
