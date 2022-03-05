/**
 * title: Kanban
 */

import {
  AntdSchemaComponentProvider,
  CollectionManagerProvider,
  CollectionProvider,
  SchemaComponent,
  SchemaComponentProvider,
  SchemaInitializerProvider,
} from '@nocobase/client';
import React from 'react';

const dataSource = [
  {
    id: 1,
    title: 'Card title 1',
    description: 'Card content',
    status: 'doing',
  },
  {
    id: 2,
    title: 'Card title 2',
    description: 'Card content',
    status: 'doing',
  },
  {
    id: 3,
    title: 'Card title 3',
    description: 'Card content',
    status: 'undo',
  },
  {
    id: 4,
    title: 'Card title 3',
    description: 'Card content',
    status: 'doing',
  },
  {
    id: 5,
    title: 'Card title 3',
    description: 'Card content',
    status: 'done',
  },
];

const groupField = {
  name: 'status',
  enum: [
    { label: '未开始', value: 'undo' },
    { label: '进行中', value: 'doing' },
    { label: '已完成', value: 'done' },
  ],
};

const schema: any = {
  type: 'array',
  name: 'kanban',
  'x-component': 'Kanban',
  'x-component-props': {
    dataSource,
    groupField,
  },
  properties: {
    card: {
      type: 'void',
      name: 'card',
      'x-component': 'Kanban.Card',
      'x-designer': 'Kanban.Card.Designer',
    },
  },
};

const collection = {
  name: 'KanbanCollection',
  title: '看板',
  fields: [
    {
      type: 'string',
      name: 'name',
      interface: 'input',
      title: 'name',
      uiSchema: {
        type: 'string',
        'x-component': 'Input',
      },
    },
    {
      type: 'string',
      name: 'endTime',
      interface: 'datetime',
      title: 'End Time',
      uiSchema: {
        type: 'string',
        'x-component': 'DatePicker',
        'x-component-props': {
          dateFormat: 'YYYY-MM-DD',
        },
      },
    },
    {
      type: 'string',
      name: 'content',
      interface: 'textarea',
      title: 'Content',
      uiSchema: {
        type: 'string',
        'x-component': 'Input.Textarea',
      },
    },
  ],
};

export default () => {
  return (
    <CollectionManagerProvider>
      <CollectionProvider collection={collection}>
        <SchemaComponentProvider designable={true}>
          <SchemaInitializerProvider>
            <AntdSchemaComponentProvider>
              <SchemaComponent schema={schema} />
            </AntdSchemaComponentProvider>
          </SchemaInitializerProvider>
        </SchemaComponentProvider>
      </CollectionProvider>
    </CollectionManagerProvider>
  );
};
