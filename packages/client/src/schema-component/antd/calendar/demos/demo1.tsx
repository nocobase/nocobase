/**
 * title: Calendar
 */

import { observable } from '@formily/reactive';
import {
  AntdSchemaComponentProvider,
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
  },
};

export default () => {
  return (
    <SchemaComponentProvider>
      <SchemaInitializerProvider>
        <AntdSchemaComponentProvider>
          <SchemaComponent schema={schema} />
        </AntdSchemaComponentProvider>
      </SchemaInitializerProvider>
    </SchemaComponentProvider>
  );
};
