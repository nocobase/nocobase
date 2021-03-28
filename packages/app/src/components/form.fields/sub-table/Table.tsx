import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { Table as AntdTable, Button, Space, Popconfirm } from 'antd';
import { Actions } from '@/components/actions';
import ViewFactory from '@/components/views';
import { useRequest } from 'umi';
import api from '@/api-client';
import { components, fields2columns } from '@/components/views/SortableTable';
import Form from './Form';
import { Spin } from '@nocobase/client';
import maxBy from 'lodash/maxBy';
import View from '@/components/pages/AdminLoader/View';

export interface SimpleTableProps {
  schema?: any;
  activeTab?: any;
  resourceName: string;
  associatedName?: string;
  associatedKey?: string;
  [key: string]: any;
}

export function generateIndex(): string {
  return `${Math.random()
    .toString(36)
    .replace('0.', '')
    .slice(-4)
    .padStart(4, '0')}`;
}

export default function Table(props: SimpleTableProps) {
  const { schema = {}, associatedKey, value, onChange, __index } = props;
  const { collection_name, name } = schema;
  const viewName = `${collection_name}.${name}.${schema.viewName || 'table'}`;
  console.log({ props, associatedKey, schema, __index, viewName });
  return (
    <>
      <View
        // __parent={__parent}
        data={value}
        onChange={onChange}
        associatedKey={__index||associatedKey}
        viewName={viewName}
        type={'subTable'}
      />
    </>
  );
}
