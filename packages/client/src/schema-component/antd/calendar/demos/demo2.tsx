/**
 * title: Calendar
 */
import { useForm } from '@formily/react';
import { uid } from '@formily/shared';
import { APIClientProvider, SchemaComponent, SchemaComponentProvider, useActionContext } from '@nocobase/client';
import React from 'react';
import { AntdSchemaComponentProvider } from '../../..';
import { apiClient } from './apiClient';
import defaultValues from './defaultValues';

const schema = {
  type: 'array',
  name: 'calendar1',
  'x-component': 'Calendar',
  'x-component-props': {
    request: {
      resource: 'tasks',
      action: 'list',
      params: {
        filter: {},
      },
    },
  },
  default: defaultValues,
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
          'x-component-props': {
            pagination: {
              current: 2,
              pageSize: 2,
            },
            request: {
              resource: 'posts',
              action: 'list',
              params: {
                filter: {},
              },
            },
          },
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
  const form = useForm();
  return {
    async run() {
      setVisible(false);
      form.submit((values) => {
        console.log(values);
      });
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
export default () => {
  return (
    <APIClientProvider apiClient={apiClient}>
      <SchemaComponentProvider scope={{ useOkAction, useCloseAction }}>
        <AntdSchemaComponentProvider>
          <SchemaComponent schema={schema} />
        </AntdSchemaComponentProvider>
      </SchemaComponentProvider>
    </APIClientProvider>
  );
};
