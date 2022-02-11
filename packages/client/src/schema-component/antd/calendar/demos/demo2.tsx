/**
 * title: Calendar
 */
import { uid } from '@formily/shared';
import { APIClientProvider, Calendar, SchemaComponent, SchemaComponentProvider } from '@nocobase/client';
import React from 'react';
import { apiClient } from './apiClient';
import defaultValues from './defaultValues';
import { AddActionButton } from './Initializer';

const schema = {
  type: 'array',
  name: 'calendar1',
  'x-component': 'Calendar',
  'x-component-props': {
    fieldNames: {
      title: '',
      startTime: '',
      endTime: '',
    },
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
      'x-action-initializer': 'AddActionButton',
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
      properties: {
        [uid()]: {
          type: 'void',
          'x-component': 'Grid',
          'x-component-props': {
            // addNewComponent: 'AddNew.FormItem',
          },
        },
      },
    },
  },
};

export default () => {
  return (
    <APIClientProvider apiClient={apiClient}>
      <SchemaComponentProvider components={{ AddActionButton, Calendar }}>
        <SchemaComponent schema={schema} />
      </SchemaComponentProvider>
    </APIClientProvider>
  );
};
