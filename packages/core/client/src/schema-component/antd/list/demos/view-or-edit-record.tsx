

import { useForm } from '@formily/react';
import {
  BlockSchemaComponentPlugin,
  UseDataBlockProps,
  useActionContext,
  useCollectionRecord,
  useDataBlockRequest,
  useDataBlockResource,
  SchemaComponent, Plugin,
} from '@nocobase/client';
import React from 'react';
import { mockApp } from '@nocobase/client/demo-utils';

import { App as AntdApp } from 'antd';

const useCloseActionProps = () => {
  const { setVisible } = useActionContext();
  return {
    type: 'default',
    onClick() {
      setVisible(false);
    },
  };
};

const useSubmitActionProps = () => {
  const { setVisible } = useActionContext();
  const { message } = AntdApp.useApp();
  const form = useForm();

  const resource = useDataBlockResource();
  const { run } = useDataBlockRequest();
  return {
    type: 'primary',
    async onClick() {
      await form.submit();
      const values = form.values;

      const { data } = await resource.update(values);
      if (data.data.result === 'ok') {
        message.success('Submit success');
        setVisible(false);
        form.reset();

        // 刷新列表
        run();
      }
    },
  };
};

const useFormBlockProviderProps: UseDataBlockProps<'CollectionGet'> = () => {
  const record = useCollectionRecord<{ id: number }>();
  return {
    collection: 'users',
    action: 'get',
    filterByTk: record.data.id,
  };
};

const schema = {
  type: 'void',
  name: 'root',
  'x-decorator': 'List.Decorator',
  'x-use-decorator-props': 'useListBlockDecoratorProps',
  'x-decorator-props': {
    collection: 'users',
    dataSource: 'main',
    action: 'list',
    params: {
      pageSize: 10,
    },
  },
  'x-component': 'CardItem',
  properties: {
    list: {
      type: 'array',
      'x-component': 'List',
      properties: {
        item: {
          type: 'object',
          'x-component': 'List.Item',
          'x-read-pretty': true,
          'x-use-component-props': 'useListItemProps',
          properties: {
            username: {
              type: 'string',
              'x-component': 'CollectionField',
              'x-decorator': 'FormItem',
              'x-index': 1,
            },
            nickname: {
              type: 'string',
              'x-component': 'CollectionField',
              'x-decorator': 'FormItem',
              'x-index': 2,
            },
            actions: {
              type: 'void',
              'x-align': 'left',
              'x-component': 'ActionBar',
              'x-use-component-props': 'useListActionBarProps',
              'x-component-props': {
                layout: 'one-column',
              },
              properties: {
                view: {
                  type: 'void',
                  title: 'View',
                  'x-action': 'view',
                  'x-component': 'Action.Link',
                  'x-component-props': {
                    openMode: 'drawer',
                  },
                  properties: {
                    drawer: {
                      type: 'void',
                      title: 'View record',
                      'x-component': 'Action.Drawer',
                      'x-component-props': {
                        className: 'nb-action-popup',
                      },
                      properties: {
                        formContext: {
                          type: 'void',
                          'x-decorator': 'FormBlockProvider',
                          'x-use-decorator-props': 'useFormBlockProviderProps',
                          'x-component': 'CardItem',
                          properties: {
                            form: {
                              type: 'void',
                              'x-component': 'FormV2',
                              'x-pattern': 'readPretty',
                              'x-use-component-props': 'useFormBlockProps',
                              properties: {
                                username: {
                                  type: 'string',
                                  'x-decorator': 'FormItem',
                                  'x-component': 'Input',
                                  title: 'Username',
                                  required: true,
                                },
                                nickname: {
                                  type: 'string',
                                  'x-decorator': 'FormItem',
                                  'x-component': 'Input',
                                  title: 'Nickname',
                                },
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
                  title: 'Edit',
                  'x-action': 'update',
                  'x-component': 'Action.Link',
                  'x-component-props': {
                    openMode: 'drawer',
                    icon: 'EditOutlined',
                  },
                  properties: {
                    drawer: {
                      type: 'void',
                      title: 'Edit record',
                      'x-component': 'Action.Drawer',
                      'x-component-props': {
                        className: 'nb-action-popup',
                      },
                      properties: {
                        formContext: {
                          type: 'void',
                          'x-decorator': 'FormBlockProvider',
                          'x-use-decorator-props': 'useFormBlockProviderProps',
                          'x-component': 'CardItem',
                          properties: {
                            form: {
                              type: 'void',
                              'x-component': 'FormV2',
                              'x-use-component-props': 'useFormBlockProps',
                              properties: {
                                username: {
                                  type: 'string',
                                  'x-decorator': 'FormItem',
                                  'x-component': 'Input',
                                  title: 'Username',
                                  required: true,
                                },
                                nickname: {
                                  type: 'string',
                                  'x-decorator': 'FormItem',
                                  'x-component': 'Input',
                                  title: 'Nickname',
                                },
                              },
                            },
                          },
                        },
                        footer: {
                          type: 'void',
                          'x-component': 'Action.Drawer.Footer',
                          properties: {
                            close: {
                              title: 'Close',
                              'x-component': 'Action',
                              'x-component-props': {
                                type: 'default',
                              },
                              'x-use-component-props': 'useCloseActionProps',
                            },
                            submit: {
                              title: 'Submit',
                              'x-component': 'Action',
                              'x-use-component-props': 'useSubmitActionProps',
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
}

const Demo = () => {
  return <SchemaComponent schema={schema} scope={{
    useSubmitActionProps,
    useCloseActionProps,
    useFormBlockProviderProps,
  }} />;
};

class DemoPlugin extends Plugin {
  async load() {
    this.app.router.add('root', { path: '/', Component: Demo })
  }
}

const app = mockApp({
  plugins: [DemoPlugin, BlockSchemaComponentPlugin],
  designable: true,
});

export default app.getRootComponent();
