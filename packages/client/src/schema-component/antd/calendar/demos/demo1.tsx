/**
 * title: Calendar
 */
import { uid } from '@formily/shared';
import { Calendar, SchemaComponent, SchemaComponentProvider } from '@nocobase/client';
import React from 'react';
import defaultValues from './defaultValues';
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
  },
  default: defaultValues,
  properties: {
    toolBar: {
      type: 'void',
      'x-component': 'Calendar.ToolBar',
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
    <SchemaComponentProvider components={{ Calendar }}>
      <SchemaComponent schema={schema} />
    </SchemaComponentProvider>
  );
};
