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
          title: 'Data blocks',
          children: [
            {
              key: 'table',
              title: 'Table',
              component: TableBlockInitializerItem,
            },
            {
              key: 'form',
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

const TableBlockInitializerItem = (props) => {
  const { insert } = props;
  return (
    <SchemaInitializer.Item
      icon={<TableOutlined />}
      onClick={(info) => {
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
              key: 'users',
              title: 'Users',
            },
            {
              key: 'posts',
              title: 'Posts',
            },
          ],
        },
      ]}
    >
      Table
    </SchemaInitializer.Item>
  );
};

const FormBlockInitializerItem = (props) => {
  const { insert } = props;
  return (
    <SchemaInitializer.Item
      icon={<FormOutlined />}
      onClick={(info) => {
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
              key: 'users',
              title: 'Users',
            },
            {
              key: 'posts',
              title: 'Posts',
            },
          ],
        },
      ]}
    >
      Form
    </SchemaInitializer.Item>
  );
};

export default function App() {
  return (
    <SchemaComponentProvider components={{ AddGridBlockItem, Grid, CardItem, Markdown, Form, VoidTable }}>
      <SchemaComponent schema={schema} />
    </SchemaComponentProvider>
  );
}
