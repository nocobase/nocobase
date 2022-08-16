/**
 * title: Tree
 */
import { ISchema, useForm } from '@formily/react';
import {
  AntdSchemaComponentProvider,
  APIClient,
  APIClientProvider,
  CardItem,
  CollectionManagerProvider,
  SchemaComponent,
  SchemaComponentProvider,
  Tree,
  TreeBlockProvider,
  useActionContext,
  useTreeBlockProps
} from '@nocobase/client';
import MockAdapter from 'axios-mock-adapter';
import React from 'react';

const collection = {
  name: 'userGroups',
  fields: [],
};

const schema: ISchema = {
  type: 'object',
  properties: {
    treeBlock: {
      type: 'void',
      'x-decorator': 'TreeBlockProvider',
      'x-decorator-props': {
        collection: 'userGroups',
        resource: 'userGroups',
        action: 'list',
        params: {},
        fieldNames: {
          key: 'id',
          title: 'title',
          children: 'children',
        },
      },
      'x-component': 'CardItem',
      properties: {
        tree: {
          type: 'array',
          'x-component': 'Tree',
          'x-component-props': {
            // hideNodeActionBar: true,
            useProps: '{{useTreeBlockProps}}',
          },
          properties: {
            actionBar: {
              type: 'void',
              'x-component': 'Tree.NodeActionBar',
              properties: {
                addNew: {
                  type: 'void',
                  title: '添加',
                  'x-component': 'Action.Link',
                  properties: {
                    drawer1: {
                      'x-component': 'Action.Drawer',
                      type: 'void',
                      title: 'Drawer Title',
                      properties: {
                        hello1: {
                          'x-content': 'Hello1',
                          title: 'T1',
                        },
                        footer1: {
                          'x-component': 'Action.Drawer.Footer',
                          type: 'void',
                          properties: {
                            close1: {
                              title: 'Close',
                              'x-component': 'Action',
                              'x-component-props': {
                                useAction: '{{ useCloseAction }}',
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
                edit: {
                  type: 'void',
                  title: '编辑',
                  'x-component': 'Action.Link',
                  properties: {
                    drawer2: {
                      'x-component': 'Action.Drawer',
                      type: 'void',
                      title: 'Drawer Title',
                      properties: {
                        hello1: {
                          'x-content': 'Hello2',
                          title: 'T1',
                        },
                        footer1: {
                          'x-component': 'Action.Drawer.Footer',
                          type: 'void',
                          properties: {
                            close1: {
                              title: 'Close',
                              'x-component': 'Action',
                              'x-component-props': {
                                useAction: '{{ useCloseAction }}',
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

const api = new APIClient({
  baseURL: 'http://localhost:13000/api',
});

const mock = new MockAdapter(api.axios);

mock.onGet('/userGroups:list').reply(200, {
  data: [
    {
      id: 1,
      title: 'node 1',
      children: [
        {
          id: 4,
          title: 'node 4',
        },
      ],
    },
    {
      id: 2,
      title: 'node 2',
    },
    {
      id: 3,
      title: 'node 3',
    },
  ],
});

const useCloseAction = () => {
  const { setVisible } = useActionContext();
  const form = useForm();
  return {
    async run() {
      setVisible(false);
      form.submit((values) => {
        console.log(values);
      });
    },
  };
};

export default () => {
  return (
    <APIClientProvider apiClient={api}>
      <CollectionManagerProvider collections={[collection]}>
        <SchemaComponentProvider
          scope={{ useCloseAction, useTreeBlockProps }}
          components={{ CardItem, Tree, TreeBlockProvider }}
        >
          <AntdSchemaComponentProvider>
            <SchemaComponent schema={schema} />
          </AntdSchemaComponentProvider>
        </SchemaComponentProvider>
      </CollectionManagerProvider>
    </APIClientProvider>
  );
};
