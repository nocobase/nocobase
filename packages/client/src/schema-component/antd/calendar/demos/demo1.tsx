/**
 * title: Calendar
 */

import { useField, useFieldSchema, useForm } from '@formily/react';
import { observable } from '@formily/reactive';
import { uid } from '@formily/shared';
import {
  AntdSchemaComponentProvider,
  CollectionProvider,
  SchemaComponent,
  SchemaComponentProvider,
  useActionContext,
  useAsyncData,
  useDesignable,
} from '@nocobase/client';
import React from 'react';
import defaultValues from './defaultValues';

const dataSource = observable(defaultValues);
const schema = {
  type: 'void',
  name: 'calendar1',
  'x-component': 'Calendar',
  'x-component-props': {
    dataSource: dataSource,
  },
  properties: {
    toolBar: {
      type: 'void',
      'x-component': 'Calendar.ActionBar',
      'x-action-initializer': 'Calendar.ActionInitializer',
      properties: {
        today: {
          type: 'void',
          title: '今天',
          'x-component': 'Calendar.Today',
          'x-action': 'calendar:today',
          'x-align': 'left',
        },
        nav: {
          type: 'void',
          title: '翻页',
          'x-component': 'Calendar.Nav',
          'x-action': 'calendar:nav',
          'x-align': 'left',
        },
        title: {
          type: 'void',
          title: '标题',
          'x-component': 'Calendar.Title',
          'x-action': 'calendar:title',
          'x-align': 'left',
        },
        viewSelect: {
          type: 'void',
          title: '视图切换',
          'x-component': 'Calendar.ViewSelect',
          'x-action': 'calendar:viewSelect',
          'x-align': 'right',
        },
        // filter: {
        //   type: 'void',
        //   title: '过滤',
        //   'x-align': 'right',
        //   'x-component': 'Calendar.Filter',
        //   'x-action': 'calendar:filter',
        // },
      },
    },
    event: {
      type: 'void',
      'x-component': 'Calendar.Event',
      'x-decorator': 'Form',
      properties: {
        [uid()]: {
          type: 'void',
          'x-component': 'Grid',
          'x-item-initializer': 'Grid.AddFormItem',
        },
      },
    },
  },
};

const useOkAction = () => {
  const { setVisible } = useActionContext();
  const { refresh: schemaRefresh } = useDesignable();
  const { refresh: dataRefresh, data } = useAsyncData();
  const form = useForm();
  const fieldSchema = useFieldSchema();
  const field = useField();
  return {
    async run() {
      setVisible(false);
      console.log(form.values, fieldSchema, field, data);
      // data?.data?.push({ ...form.values, start: new Date(form.values.start), end: new Date(form.values.end) });
      debugger;
      dataSource.push({ ...form.values, start: new Date(form.values.start), end: new Date(form.values.end) });
      schema['x-component-props']['dataSource'] = dataSource;
      dataRefresh();
    },
  };
};

const useCloseAction = () => {
  const { setVisible } = useActionContext();
  return {
    async run() {
      setVisible(false);
    },
  };
};

const collection = {
  name: 'tests',
  fields: [
    {
      type: 'string',
      name: 'id',
      interface: 'input',
      uiSchema: {
        type: 'string',
        'x-component': 'Input',
      },
    },
    {
      type: 'string',
      name: 'title',
      interface: 'input',
      uiSchema: {
        type: 'string',
        'x-component': 'Input',
      },
    },
    {
      type: 'string',
      name: 'start',
      interface: 'datetime',
      uiSchema: {
        type: 'string',
        'x-component': 'DatePicker',
        'x-component-props': {
          dateFormat: 'YYYY-MM-DD',
        },
      },
    },
    {
      type: 'string',
      name: 'end',
      interface: 'datetime',
      uiSchema: {
        type: 'string',
        'x-component': 'DatePicker',
        'x-component-props': {
          dateFormat: 'YYYY-MM-DD',
        },
      },
    },
  ],
};
export default () => {
  return (
    <CollectionProvider collection={collection}>
      <SchemaComponentProvider scope={{ useOkAction, useCloseAction }}>
        <AntdSchemaComponentProvider>
          <SchemaComponent schema={schema} />
        </AntdSchemaComponentProvider>
      </SchemaComponentProvider>
    </CollectionProvider>
  );
};
