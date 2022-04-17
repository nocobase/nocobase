/**
 * title: Tabs
 */
import { ISchema } from '@formily/react';
import { Action, SchemaComponent, SchemaComponentProvider, Tabs } from '@nocobase/client';
import React from 'react';
import { AntdSchemaComponentProvider } from '../../AntdSchemaComponentProvider';

const schema: ISchema = {
  type: 'object',
  properties: {
    tabs1: {
      type: 'void',
      'x-component': 'Tabs',
      'x-component-props': {},
      properties: {
        tab1: {
          type: 'void',
          title: 'Tab1',
          'x-component': 'Tabs.TabPane',
          'x-component-props': {
            tab: 'Tab1',
          },
          properties: {
            aaa: {
              'x-content': 'Hello1',
            },
          },
        },
        tab2: {
          type: 'void',
          title: 'Tab2',
          'x-component': 'Tabs.TabPane',
          'x-component-props': {
            tab: 'Tab2',
          },
          properties: {
            aaa: {
              'x-content': 'Hello2',
            },
          },
        },
      },
    },
  },
};

export default () => {
  return (
    <SchemaComponentProvider designable components={{ Tabs, Action }}>
      <AntdSchemaComponentProvider>
        <SchemaComponent schema={schema} />
      </AntdSchemaComponentProvider>
    </SchemaComponentProvider>
  );
};
