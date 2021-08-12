import { ISchema } from '@formily/react';
import React from 'react';
import { SchemaRenderer } from '../../';
import { Kanban } from '..';

const schema: ISchema = {
  type: 'array',
  name: 'kanban1',
  'x-component': 'Kanban',
  default: [
    {
      id: '1',
      type: 'A',
      title: 'A1',
    },
    {
      id: '2',
      type: 'A',
      title: 'A2',
    },
    {
      id: '3',
      type: 'A',
      title: 'A3',
    },
    {
      id: '4',
      type: 'B',
      title: 'B4',
    },
    {
      id: '5',
      type: 'B',
      title: 'B5',
    },
    {
      id: '6',
      type: 'B',
      title: 'B6',
    },
    {
      id: '7',
      type: 'C',
      title: 'C7',
    },
    {
      id: '8',
      type: 'C',
      title: 'C8',
    },
    {
      id: '9',
      type: 'C',
      title: 'C9',
    },
  ],
  properties: {
    card1: {
      type: 'void',
      'x-component': 'Kanban.Card',
      properties: {
        item1: {
          type: 'void',
          'x-component': 'Kanban.Item',
          properties: {
            title: {
              type: 'string',
              // title: '标题',
              'x-read-pretty': true,
              'x-decorator': 'FormItem',
              'x-component': 'Input',
            },
          },
        },
      },
    },
    view1: {
      type: 'void',
      'x-component': 'Kanban.Card.View',
      properties: {
        item1: {
          type: 'void',
          'x-component': 'Kanban.Item',
          properties: {
            title: {
              type: 'string',
              title: '标题',
              'x-read-pretty': true,
              'x-decorator': 'FormItem',
              'x-component': 'Input',
            },
          },
        },
      },
    },
  },
};

export default () => {
  return <SchemaRenderer components={{ Kanban }} schema={schema} />;
};
