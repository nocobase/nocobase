import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { CalendarBlockProvider } from '../../../../block-provider';
import { SchemaComponent, SchemaComponentProvider } from '../../../../schema-component';
import { ISchema } from '@formily/react';
import { AntdSchemaComponentProvider, APIClient, SchemaInitializerProvider } from '@nocobase/client';
import { CalendarV2 } from '../index';
import defaultValues from '../demos/defaultValues';

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

const App= () => {
  return (
    <SchemaComponentProvider components={{CalendarV2,CalendarBlockProvider}}>
      <SchemaInitializerProvider>
        <AntdSchemaComponentProvider>
          <SchemaComponent schema={schema} />
        </AntdSchemaComponentProvider>
      </SchemaInitializerProvider>
    </SchemaComponentProvider>
  );
};

describe('calendar', () => {
  it('calendar', () => {
    const { container } = render(<App />);
    expect(container).toMatchSnapshot();
  });
});
