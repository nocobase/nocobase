import { uid } from '@formily/shared';
import {
  Input,
  SchemaComponent,
  SchemaComponentProvider,
  SchemaInitializer,
  SchemaInitializerItemOptions,
  SchemaInitializerProvider,
  TableV2,
} from '@nocobase/client';
import React from 'react';

const CollectionFieldInitializer = (props) => {
  const { type, schema, item, insert } = props;
  return (
    <SchemaInitializer.Item
      onClick={() => {
        insert(item.schema);
      }}
    >
      {item.title}
    </SchemaInitializer.Item>
  );
};

const useTableColumnInitializerFields = () => {
  const fields: SchemaInitializerItemOptions[] = [
    {
      type: 'item',
      title: 'Name',
      schema: {
        name: 'name',
        type: 'string',
        title: 'Name',
        'x-collection-field': 'posts.name',
        'x-component': 'Input',
        'x-read-pretty': true,
      },
      component: CollectionFieldInitializer,
    },
    {
      type: 'item',
      title: 'Title',
      schema: {
        name: 'title',
        type: 'string',
        title: 'Title',
        'x-collection-field': 'posts.title',
        'x-component': 'Input',
        'x-read-pretty': true,
      },
      component: CollectionFieldInitializer,
    },
  ];
  return fields;
};

const columnWrap = (s) => {
  return {
    name: [uid()],
    type: 'void',
    title: s.title,
    'x-component': 'TableV2.Column',
    properties: {
      [s.name]: {
        ...s,
      },
    },
  };
};

// 因为有个动态获取字段的 hook，所以这里将 SchemaInitializerProvider 自定义的处理了一下
const CustomSchemaInitializerProvider: React.FC = (props) => {
  const initializers = {
    AddColumn: {
      insertPosition: 'beforeEnd',
      title: 'Configure columns',
      wrap: columnWrap,
      items: [
        {
          type: 'itemGroup',
          title: 'Display fields',
          children: useTableColumnInitializerFields(),
        },
      ],
    },
  };
  return <SchemaInitializerProvider initializers={initializers}>{props.children}</SchemaInitializerProvider>;
};

const schema = {
  type: 'object',
  properties: {
    table: {
      type: 'array',
      default: [
        { id: 1, name: 'Name1', title: 'Title1' },
        { id: 2, name: 'Name2', title: 'Title2' },
        { id: 3, name: 'Name3', title: 'Title3' },
        { id: 4, name: 'Name3', title: 'Title3' },
        { id: 5, name: 'Name3', title: 'Title3' },
        { id: 6, name: 'Name3', title: 'Title3' },
        { id: 7, name: 'Name3', title: 'Title3' },
        { id: 8, name: 'Name3', title: 'Title3' },
        { id: 9, name: 'Name3', title: 'Title3' },
        { id: 10, name: 'Name3', title: 'Title3' },
        { id: 11, name: 'Name3', title: 'Title3' },
      ],
      'x-component': 'TableV2',
      'x-initializer': 'AddColumn',
      'x-component-props': {
        rowKey: 'id',
        sticky: { offsetHeader: 50 },
        scroll: { x: 1000 },
      },
      properties: {
        column1: {
          type: 'void',
          title: 'Name',
          'x-component': 'TableV2.Column',
          'x-component-props': { fixed: 'left', width: 100 },
          properties: {
            name: {
              type: 'string',
              'x-component': 'Input',
              'x-collection-field': 'posts.name',
              'x-read-pretty': true,
            },
          },
        },
        column2: {
          type: 'void',
          title: 'Title',
          'x-component': 'TableV2.Column',
          'x-component-props': {},
          properties: {
            name: {
              type: 'string',
              'x-component': 'Input',
              'x-collection-field': 'posts.name',
              'x-read-pretty': true,
            },
          },
        },
        column3: {
          type: 'void',
          title: 'Title',
          'x-component': 'TableV2.Column',
          'x-component-props': {},
          properties: {
            name: {
              type: 'string',
              'x-component': 'Input',
              'x-collection-field': 'posts.name',
              'x-read-pretty': true,
            },
          },
        },
        column4: {
          type: 'void',
          title: 'Title',
          'x-component': 'TableV2.Column',
          'x-component-props': {},
          properties: {
            name: {
              type: 'string',
              'x-component': 'Input',
              'x-collection-field': 'posts.name',
              'x-read-pretty': true,
            },
          },
        },
        column5: {
          type: 'void',
          title: 'Title',
          'x-component': 'TableV2.Column',
          'x-component-props': {},
          properties: {
            name: {
              type: 'string',
              'x-component': 'Input',
              'x-collection-field': 'posts.name',
              'x-read-pretty': true,
            },
          },
        },
        column6: {
          type: 'void',
          title: 'Title',
          'x-component': 'TableV2.Column',
          'x-component-props': {},
          properties: {
            name: {
              type: 'string',
              'x-component': 'Input',
              'x-collection-field': 'posts.name',
              'x-read-pretty': true,
            },
          },
        },
        column7: {
          type: 'void',
          title: 'Title',
          'x-component': 'TableV2.Column',
          'x-component-props': {},
          properties: {
            name: {
              type: 'string',
              'x-component': 'Input',
              'x-collection-field': 'posts.name',
              'x-read-pretty': true,
            },
          },
        },
        column8: {
          type: 'void',
          title: 'Title',
          'x-component': 'TableV2.Column',
          'x-component-props': {},
          properties: {
            name: {
              type: 'string',
              'x-component': 'Input',
              'x-collection-field': 'posts.name',
              'x-read-pretty': true,
            },
          },
        },
        column9: {
          type: 'void',
          title: 'Title',
          'x-component': 'TableV2.Column',
          'x-component-props': {},
          properties: {
            name: {
              type: 'string',
              'x-component': 'Input',
              'x-collection-field': 'posts.name',
              'x-read-pretty': true,
            },
          },
        },
        column10: {
          type: 'void',
          title: 'Title',
          'x-component': 'TableV2.Column',
          'x-component-props': {},
          properties: {
            name: {
              type: 'string',
              'x-component': 'Input',
              'x-collection-field': 'posts.name',
              'x-read-pretty': true,
            },
          },
        },
      },
    },
  },
};

export default function App() {
  return (
    <SchemaComponentProvider designable components={{ Input, TableV2 }}>
      <CustomSchemaInitializerProvider>
        <SchemaComponent schema={schema} />
      </CustomSchemaInitializerProvider>
    </SchemaComponentProvider>
  );
}
