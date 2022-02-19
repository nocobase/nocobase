/**
 * title: Calendar
 */

import { useField, useFieldSchema, useForm } from '@formily/react';
import { observable } from '@formily/reactive';
import { uid } from '@formily/shared';
import {
  AntdSchemaComponentProvider,
  CalendarContext,
  CollectionProvider,
  SchemaComponent,
  SchemaComponentProvider,
  useActionContext,
  useAsyncData,
  useRequest,
} from '@nocobase/client';
import React, { useContext, useEffect } from 'react';
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
      name: 'event',
      'x-component': 'Calendar.Event',
      properties: {
        modal: {
          'x-component': 'Action.Drawer',
          'x-decorator': 'Form',
          'x-decorator-props': {
            useValues: '{{ useValues }}',
          },
          type: 'void',
          title: 'Drawer Title',
          properties: {
            grid: {
              type: 'void',
              'x-component': 'Grid',
              'x-item-initializer': 'Grid.AddFormItem',
              'x-item-initializer-props': {
                readPretty: true,
              },
            },
            footer: {
              'x-component': 'Action.Drawer.Footer',
              type: 'void',
              properties: {
                [uid()]: {
                  title: 'submit',
                  'x-component': 'ActionBar',
                  'x-action-initializer': 'Calendar.FooterActionInitializer',
                },
              },
            },
          },
        },
      },
    },
  },
};

const useSaveAction = () => {
  const { setVisible } = useActionContext();
  const { refresh: dataRefresh, data } = useAsyncData();
  const form = useForm();
  const fieldSchema = useFieldSchema();
  const field = useField();
  return {
    async run() {
      setVisible(false);
      console.log(form.values, fieldSchema, field, data);
      dataSource.push({ ...form.values, start: new Date(form.values.start), end: new Date(form.values.end) });
      schema['x-component-props']['dataSource'] = dataSource;
      dataRefresh();
      form.reset();
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

const useRemoveAction = () => {
  const { refresh: dataRefresh, data } = useAsyncData();
  const { record } = useContext(CalendarContext);
  const { setVisible } = useActionContext();

  return {
    async run() {
      setVisible(false);
      for (let i = 0, iLen = dataSource.length; i < iLen; i++) {
        const element = dataSource[i];
        if (element.id === record.id) {
          dataSource.splice(i, 1);
          break;
        }
      }
      schema['x-component-props']['dataSource'] = dataSource;
      dataRefresh();
    },
  };
};

const useEditAction = () => {
  const { refresh: dataRefresh, data } = useAsyncData();
  const { record } = useContext(CalendarContext);
  const { setVisible } = useActionContext();
  return {
    async run() {
      console.log(record);
    },
  };
};

const useUpdateAction = () => {
  const form = useForm();
  const { setVisible } = useActionContext();
  const { refresh: dataRefresh, data } = useAsyncData();
  return {
    async run() {
      setVisible(false);
      console.log(form.values);
      const record = form.values;
      for (let i = 0, iLen = dataSource.length; i < iLen; i++) {
        const element = dataSource[i];
        if (element.id === record.id) {
          dataSource[i] = { ...record };
          break;
        }
      }
      schema['x-component-props']['dataSource'] = dataSource;
      form.reset();
    },
  };
};

const useValues = (options) => {
  const { visible } = useActionContext();
  const { record } = useContext(CalendarContext);
  const result = useRequest(
    () =>
      Promise.resolve({
        data: {
          ...record,
        },
      }),
    { ...options, manual: true },
  );
  useEffect(() => {
    if (visible) {
      result.run();
    }
  }, [visible]);
  return result;
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
      <SchemaComponentProvider
        scope={{ useSaveAction, useCloseAction, useEditAction, useUpdateAction, useValues, useRemoveAction }}
      >
        <AntdSchemaComponentProvider>
          <SchemaComponent schema={schema} />
        </AntdSchemaComponentProvider>
      </SchemaComponentProvider>
    </CollectionProvider>
  );
};
