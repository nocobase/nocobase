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
  Descriptions as AntdDescriptions,
  Tooltip,
} from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { components, fields2columns } from '@/components/views/SortableTable';
import ReactDragListView from 'react-drag-listview';
import arrayMove from 'array-move';
import get from 'lodash/get';
import Drawer from '@/components/pages/AdminLoader/Drawer';
import Field, { markdown } from '@/components/views/Field';
import { Form } from './Form';

export function Wysiwyg(props) {
  const { data: record = {}, schema = {}, onDataChange } = props;

  const { html = '' } = schema;

  return <div dangerouslySetInnerHTML={{ __html: markdown(html) }}></div>;
}
