import { ISchema } from '@formily/react';
import { uid } from '@formily/shared';
import {
  Form,
  FormItem,
  Grid,
  Input,
  Markdown,
  SchemaComponent,
  SchemaComponentProvider,
  SchemaInitializerProvider,
} from '@nocobase/client';
import React from 'react';

const schema: ISchema = {
  type: 'void',
  name: 'grid1',
  'x-decorator': 'Form',
  'x-component': 'Grid',
  'x-item-initializer': 'AddFormItem',
  'x-uid': uid(),
  properties: {
    row1: {
      type: 'void',
      'x-component': 'Grid.Row',
      'x-uid': uid(),
      properties: {
        col11: {
          type: 'void',
          'x-component': 'Grid.Col',
          properties: {
            name: {
              type: 'string',
              title: 'Name',
              'x-decorator': 'FormItem',
              'x-component': 'Input',
              'x-collection-field': 'posts.name',
            },
            title: {
              type: 'string',
              title: 'Title',
              'x-decorator': 'FormItem',
              'x-component': 'Input',
              'x-collection-field': 'posts.title',
            },
          },
        },
        col12: {
          type: 'void',
          'x-component': 'Grid.Col',
          properties: {
            intro: {
              type: 'string',
              title: 'Intro',
              'x-decorator': 'FormItem',
              'x-component': 'Input',
            },
          },
        },
      },
    },
  },
};

export default function App() {
  return (
    <SchemaComponentProvider components={{ Markdown, Form, Grid, Input, FormItem }}>
      <SchemaInitializerProvider>
        <SchemaComponent schema={schema} />
      </SchemaInitializerProvider>
    </SchemaComponentProvider>
  );
}
