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

const TestInitializerItem = itemWrap((props) => {
  const { insert } = props;
  return (
    <SchemaInitializer.Item
      icon={<FormOutlined />}
      onClick={() => {
        insert({
          type: 'void',
          name: uid(),
          'x-decorator': 'CardItem',
          'x-component': 'Grid',
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
                    block1: {
                      type: 'void',
                      title: '1',
                      'x-decorator': 'BlockItem',
                      'x-component': 'Block',
                    },
                    block2: {
                      type: 'void',
                      title: '2',
                      'x-decorator': 'BlockItem',
                      'x-component': 'Block',
                    },
                  },
                },
                col12: {
                  type: 'void',
                  'x-component': 'Grid.Col',
                  properties: {
                    block3: {
                      type: 'void',
                      title: '3',
                      'x-decorator': 'BlockItem',
                      'x-component': 'Block',
                    },
                  },
                },
              },
            },
            row2: {
              type: 'void',
              'x-component': 'Grid.Row',
              'x-uid': uid(),
              properties: {
                col21: {
                  type: 'void',
                  'x-component': 'Grid.Col',
                  properties: {
                    block4: {
                      type: 'void',
                      title: '4',
                      'x-decorator': 'BlockItem',
                      'x-component': 'Block',
                    },
                  },
                },
                col22: {
                  type: 'void',
                  'x-component': 'Grid.Col',
                  properties: {
                    block5: {
                      type: 'void',
                      title: '5',
                      'x-decorator': 'BlockItem',
                      'x-component': 'Block',
                    },
                  },
                },
              },
            },
          },
        });
      }}
    >
      Test
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
            {
              type: 'item',
              title: 'Test',
              component: TestInitializerItem,
            },
          ],
        },
      ]}
    >
      Add block
    </SchemaInitializer.Button>
  );
});
