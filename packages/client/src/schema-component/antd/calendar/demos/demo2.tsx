/**
 * title: Calendar
 */

import { observer, RecursionField } from '@formily/react';
import { observable } from '@formily/reactive';
import { uid } from '@formily/shared';
import { AntdSchemaComponentProvider, SchemaComponent, SchemaComponentProvider, useRecord } from '@nocobase/client';
import React from 'react';
import defaultValues from './defaultValues';

const dataSource = observable(defaultValues);

const DetailCalendar = observer((props) => {
  const record = useRecord();
  debugger;
  const detailSchema = {
    type: 'void',
    properties: {
      id: {
        type: 'string',
        title: 'ID',
        'x-component': 'Input',
        'x-decorator': 'FormItem',
        'x-read-pretty': true,
        default: record.id,
      },
      title: {
        type: 'string',
        title: '标题',
        'x-component': 'Input',
        'x-decorator': 'FormItem',
        'x-read-pretty': true,
        default: record.title,
      },
      start: {
        type: 'string',
        title: '开始时间',
        'x-component': 'DatePicker',
        'x-decorator': 'FormItem',
        'x-read-pretty': true,
        default: record.start,
      },
      end: {
        type: 'string',
        title: '结束时间',
        'x-component': 'DatePicker',
        'x-decorator': 'FormItem',
        'x-read-pretty': true,
        default: record.end,
      },
    },
  };

  return <RecursionField schema={detailSchema as any} name="DetailCalendar" onlyRenderProperties />;
});
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
      name: 'event',
      'x-component': 'Calendar.Event',
      properties: {
        modal: {
          'x-component': 'Action.Drawer',
          'x-decorator': 'Form',
          type: 'void',
          title: 'Calendar Detail',
          properties: {
            grid: {
              type: 'void',
              'x-component': 'DetailCalendar',
            },
            footer: {
              'x-component': 'Action.Drawer.Footer',
              type: 'void',
              properties: {
                [uid()]: {
                  title: 'submit',
                  'x-component': 'ActionBar',
                },
              },
            },
          },
        },
      },
    },
  },
};

export default () => {
  return (
    <SchemaComponentProvider components={{ DetailCalendar }}>
      <AntdSchemaComponentProvider>
        <SchemaComponent schema={schema as any} />
      </AntdSchemaComponentProvider>
    </SchemaComponentProvider>
  );
};
