/**
 * title: Calendar
 */

import { observable } from '@formily/reactive';
import { uid } from '@formily/shared';
import {
  AntdSchemaComponentProvider,
  CollectionField,
  CollectionProvider,
  SchemaComponent,
  SchemaComponentProvider,
  SchemaInitializerProvider,
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
          title: 'Drawer Title',
          properties: {
            grid: {
              type: 'void',
              'x-component': 'Grid',
              'x-initializer': 'GridFormItemInitializers',
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

const collection = {
  name: 'tests',
  fields: [
    {
      type: 'string',
      name: 'id',
      interface: 'input',
      uiSchema: {
        type: 'string',
        title: 'id',
        'x-component': 'Input',
      },
    },
    {
      type: 'string',
      name: 'title',
      interface: 'input',
      uiSchema: {
        type: 'string',
        title: '标题',
        'x-component': 'Input',
      },
    },
    {
      type: 'string',
      name: 'start',
      interface: 'datetime',
      uiSchema: {
        type: 'string',
        title: '开始时间',
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
        title: '结束时间',
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
      <SchemaComponentProvider designable={true} components={{ CollectionField }}>
        <SchemaInitializerProvider>
          <AntdSchemaComponentProvider>
            <SchemaComponent schema={schema} />
          </AntdSchemaComponentProvider>
        </SchemaInitializerProvider>
      </SchemaComponentProvider>
    </CollectionProvider>
  );
};
