/**
 * title: Calendar
 */
import {
  Application,
  Plugin,
  AntdSchemaComponentProvider,
  SchemaComponent,
  SchemaComponentProvider,
} from '@nocobase/client';
import React from 'react';
import defaultValues from './defaultValues';

const schema = {
  type: 'array',
  name: 'calendar1',
  'x-component': 'CalendarV2',
  'x-component-props': {},
  default: defaultValues,
  properties: {
    toolBar: {
      type: 'void',
      'x-component': 'CalendarV2.ActionBar',
      properties: {
        today: {
          type: 'void',
          title: '今天',
          'x-component': 'CalendarV2.Today',
          'x-action': 'calendar:today',
          'x-align': 'left',
        },
        nav: {
          type: 'void',
          title: '翻页',
          'x-component': 'CalendarV2.Nav',
          'x-action': 'calendar:nav',
          'x-align': 'left',
        },
        title: {
          type: 'void',
          title: '标题',
          'x-component': 'CalendarV2.Title',
          'x-action': 'calendar:title',
          'x-align': 'left',
        },
        viewSelect: {
          type: 'void',
          title: '视图切换',
          'x-component': 'CalendarV2.ViewSelect',
          'x-action': 'calendar:viewSelect',
          'x-align': 'right',
        },
      },
    },
  },
};

const Root = () => {
  return (
    <SchemaComponentProvider>
      <AntdSchemaComponentProvider>
        <SchemaComponent schema={schema} />
      </AntdSchemaComponentProvider>
    </SchemaComponentProvider>
  );
};

class MyPlugin extends Plugin {
  async load() {
    // 注册路由
    this.app.router.add('root', {
      path: '/',
      Component: Root,
    });
  }
}

const app = new Application({
  router: {
    type: 'memory',
    initialEntries: ['/'],
  },
  plugins: [MyPlugin],
});

export default app.getRootComponent();
