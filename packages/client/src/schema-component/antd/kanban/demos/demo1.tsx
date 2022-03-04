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

const dataSource = {
  columns: [
    {
      id: 1,
      title: 'Backlog',
      cards: [
        {
          id: 1,
          title: 'Card title 1',
          description: 'Card content',
        },
        {
          id: 2,
          title: 'Card title 2',
          description: 'Card content',
        },
        {
          id: 3,
          title: 'Card title 3',
          description: 'Card content',
        },
      ],
    },
    {
      id: 2,
      title: 'Doing',
      cards: [
        {
          id: 9,
          title: 'Card title 9',
          description: 'Card content',
        },
      ],
    },
    {
      id: 3,
      title: 'Q&A',
      cards: [
        {
          id: 10,
          title: 'Card title 10',
          description: 'Card content',
        },
        {
          id: 11,
          title: 'Card title 11',
          description: 'Card content',
        },
      ],
    },
    {
      id: 4,
      title: 'Production',
      cards: [
        {
          id: 12,
          title: 'Card title 12',
          description: 'Card content',
        },
        {
          id: 13,
          title: 'Card title 13',
          description: 'Card content',
        },
      ],
    },
  ],
};

const schema: any = {
  type: 'array',
  name: 'kanban',
  'x-component': 'Kanban',
  'x-component-props': {
    dataSource,
  },
  items: {
    type: 'object',
    properties: {
      card: {
        type: 'void',
        name: 'card',
        'x-component': 'Kanban.Card',
        properties: {},
      },
    },
  },
};

const collection = {
  name: 'KanbanCollection',
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
        <SchemaComponentProvider>
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
