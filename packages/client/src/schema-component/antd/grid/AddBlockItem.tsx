import { FormOutlined, TableOutlined } from '@ant-design/icons';
import { ISchema, observer } from '@formily/react';
import { uid } from '@formily/shared';
import React from 'react';
import { SchemaInitializer } from '../../../schema-initializer';

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
          'x-uid': uid(),
          'x-component': 'Form',
          'x-decorator': 'CardItem',
          properties: {
            [uid()]: {
              type: 'void',
              'x-component': 'Grid',
              'x-item-initializer': 'Grid.AddFormItem',
              'x-uid': uid(),
            },
          },
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

export const AddGridBlockItem = observer((props: any) => {
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
