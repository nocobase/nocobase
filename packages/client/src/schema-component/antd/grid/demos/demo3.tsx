import { FormOutlined, TableOutlined } from '@ant-design/icons';
import { ISchema, observer } from '@formily/react';
import { uid } from '@formily/shared';
import {
  CardItem,
  Form,
  Grid,
  Markdown,
  SchemaComponent,
  SchemaComponentProvider,
  SchemaInitializer,
  VoidTable
} from '@nocobase/client';
import React from 'react';

const schema: ISchema = {
  type: 'void',
  name: 'grid1',
  'x-component': 'Grid',
  'x-item-initializer': 'AddGridBlockItem',
  'x-uid': uid(),
  properties: {
    row1: {
      type: 'void',
      'x-component': 'Grid.Row',
      'x-uid': uid(),
    },
  },
};

const gridRowColWrap = (schema: ISchema) => {
  return {
    type: 'void',
    'x-component': 'Grid.Row',
    properties: {
      [uid()]: {
        type: 'void',
        'x-component': 'Grid.Col',
        properties: {
          [schema.name || uid()]: schema,
        },
      },
    },
  };
};

const AddGridBlockItem = observer((props: any) => {
  return (
    <SchemaInitializer.Button
      wrap={gridRowColWrap}
      insertPosition={'beforeEnd'}
      items={[
        {
          type: 'itemGroup',
          title: 'Data blocks',
          children: [
            {
              type: 'item',
              title: 'Table',
              component: TableBlockInitializerItem,
            },
            {
              type: 'item',
              title: 'Form',
              component: FormBlockInitializerItem,
            },
          ],
        },
      ]}
    >
      Add block
    </SchemaInitializer.Button>
  );
});

const itemWrap = SchemaInitializer.itemWrap;

const TableBlockInitializerItem = itemWrap((props) => {
  const { insert } = props;
  return (
    <SchemaInitializer.Item
      icon={<TableOutlined />}
      onClick={() => {
        insert({
          type: 'void',
          'x-component': 'VoidTable',
          'x-decorator': 'CardItem',
        });
      }}
      items={[
        {
          type: 'itemGroup',
          title: 'select a data source',
          children: [
            {
              type: 'item',
              name: 'users',
              title: 'Users',
            },
            {
              type: 'item',
              name: 'posts',
              title: 'Posts',
            },
          ],
        },
      ]}
    >
      Table
    </SchemaInitializer.Item>
  );
});

const FormBlockInitializerItem = itemWrap((props) => {
  const { insert } = props;
  return (
    <SchemaInitializer.Item
      icon={<FormOutlined />}
      onClick={() => {
        insert({
          type: 'void',
          'x-component': 'Form',
          'x-decorator': 'CardItem',
        });
      }}
      items={[
        {
          type: 'itemGroup',
          title: 'select a data source',
          children: [
            {
              type: 'item',
              name: 'users',
              title: 'Users',
            },
            {
              type: 'item',
              name: 'posts',
              title: 'Posts',
            },
          ],
        },
      ]}
    >
      Form
    </SchemaInitializer.Item>
  );
});

export default function App() {
  return (
    <SchemaComponentProvider components={{ AddGridBlockItem, Grid, CardItem, Markdown, Form, VoidTable }}>
      <SchemaComponent schema={schema} />
    </SchemaComponentProvider>
  );
}
