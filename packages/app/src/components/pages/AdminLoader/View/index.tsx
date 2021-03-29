import React, { useState, useEffect } from 'react';
import './style.less';
import { Helmet } from 'umi';
import { Spin } from '@nocobase/client';
import { useRequest, useLocation } from 'umi';
import api from '@/api-client';
import { Actions } from '../Actions';
import {
  Table as AntdTable,
  Card,
  Pagination,
  Button,
  Tabs,
  Tooltip,
} from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { components, fields2columns } from '@/components/views/SortableTable';
import ReactDragListView from 'react-drag-listview';
import arrayMove from 'array-move';
import get from 'lodash/get';
import Drawer from '@/components/pages/AdminLoader/Drawer';
import Field from '@/components/views/Field';
import { Form } from './Form';
import { Table } from './Table';
import { Association } from './Association';
import { Descriptions } from './Descriptions';
import { FilterForm } from './FilterForm';
import { SubTable } from './SubTable';
import { Wysiwyg } from './Wysiwyg';
import { Calendar } from './Calendar';
import { Kanban } from './Kanban';

const VIEWS = new Map();

export function registerView(type, view) {
  VIEWS.set(type, view);
}

export function getView(type) {
  return VIEWS.get(type);
}

export const icon = <LoadingOutlined style={{ fontSize: 36 }} spin />;

export function View(props: any) {
  const { wrapper, schema, viewName, children, ...restProps } = props;

  const { data = {}, loading } = useRequest(
    () => {
      return schema
        ? Promise.resolve({ data: schema })
        : api.resource('views_v2').getInfo({
            resourceKey: viewName,
          });
    },
    {
      refreshDeps: [viewName, schema],
    },
  );

  if (loading) {
    return <Spin />;
  }

  const type = props.type || data.type;

  const Component = getView(type);

  if (wrapper === 'card') {
    return (
      <Card className={`view-type-${type}`} bordered={false}>
        <Component {...restProps} schema={data} />
      </Card>
    )
  }

  return <Component {...restProps} schema={data} />;
}

registerView('table', Table);
registerView('subTable', SubTable);
registerView('form', Form);
registerView('filterForm', FilterForm);
registerView('descriptions', Descriptions);
registerView('association', Association);
registerView('wysiwyg', Wysiwyg);
registerView('markdown', Wysiwyg);
registerView('calendar', Calendar);
registerView('kanban', Kanban);

export default View;
